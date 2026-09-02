var path = require('path');

/**
 * Parses the raw output of a latexrun compilation into a structured,
 * machine-readable LaTeX error so the editing frontend can show a specific,
 * actionable message instead of a raw transcript.
 *
 * latexrun emits messages to the log as:
 *
 *     /path/to/main.tex:12: error: Undefined control sequence
 *           at \someUndefinedMacro
 *
 * or, when the failing spot carries no line number:
 *
 *     /path/to/main.tex: error: Emergency stop: job aborted, no legal \end found
 *           at <inserted text> \par
 *
 * (see Message.emit() in latexrun/latexrun). The parser scans the log for
 * these blocks, classifies the first high-confidence, known error and
 * otherwise reports a generic compilation error. The raw log is always
 * preserved alongside the structured error for full diagnosis.
 *
 * Messages are rebuilt into human-readable sentences: the error "type" is the
 * category, while "message" states the actual detected cause, e.g.
 *
 *     at Hello \helloWorld    ->  Undefined command '\helloWorld'.
 *     at \badcmd{\nope}       ->  Undefined command '\badcmd'.   (per caret)
 *     File `chapter.tex' ...  ->  File "chapter.tex" not found.
 *
 * For undefined control sequences the offending command is located either by
 * the caret column that latexrun prints under the failing token or, when no
 * caret is present, by the trailing control sequence on the reported line.
 * Nothing is ever guessed: if the log does not identify the command, the
 * message falls back to the generic "Undefined control sequence.".
 */

var ERROR_WITH_LINE_RE = /^(\S.*?):(\d+): error: (.*)$/;
var ERROR_WITHOUT_LINE_RE = /^(\S.*?): error: (.*)$/;

var FILE_NOT_FOUND_RE = /^File [`'](.+?)['`] not found$/;

/*
 * Raw pdflatex transcripts (native in-process executor). With
 * `-file-line-error` the engine prints:
 *
 *     ./main.tex:6: Undefined control sequence.
 *     l.6 \helloWorld
 *     ./main.tex:6:  ==> Fatal error occurred, no output PDF file produced!
 *
 * or, for a command mid-line:
 *
 *     ./main.tex:3: Undefined control sequence.
 *     l.3 Text here \helloWorld
 *                           more text.
 *
 * These lines are scanned only when no latexrun block matched, and reuse the
 * same classifiers; the offending control sequence is recovered from the
 * trailing token shown on the `l.N` source line (pdflatex always stops right
 * after the failing token).
 */
var PDFLATEX_ERROR_RE = /^(\.\/(?:[^:]+)|[^:]+\.(?:tex|sty|cls)):(\d+):\s*(.*)$/;
var PDFLATEX_SOURCE_LINE_RE = /^l\.\d+\s+(.*)$/;
var NATIVE_SPAWN_FAIL_RE = /failed to start "([a-z]+)"/;
/*
 * Missing-file / missing-package errors print as `! LaTeX Error: ...` WITHOUT
 * a file:line: prefix; the location comes from the `file:line: Emergency stop.`
 * header that immediately follows (after the "Enter file name:" prompt).
 */
var LATEX_ERROR_RE = /^! LaTeX Error: (.+?)\s*$/;

/*
 * Bibliography-tool failures (biber/bibtex). When the bibliography tool
 * cannot complete, latexrun raises "failed to execute bibtex task" and echoes
 * the tool's own stderr into the log - neither of which is in latexrun's
 * normal "<file>: error: <message>" block format. These lines are scanned
 * separately (see #scanBibliographyErrors) so a missing or invalid .bib
 * produces a specific, actionable error instead of the generic fallback.
 */
var BIB_MISSING_DATABASE_RES = [
    // Modern biber: "ERROR - Cannot find 'references.bib'!"
    /cannot find ['"]([^'"]+)['"]/i,
    // Classical bibtex: "I couldn't find database file 'references.bib'"
    /couldn't find database file ['"]([^'"]+)['"]/i,
];
var BIB_SYNTAX_ERROR_RE = /BibTeX subsystem: .*?, line (\d+), syntax error: (.*)$/;
var BIB_TOOL_ERROR_RE = /^.*(?:^|\b)> ERROR - (.*)$/;
var BIB_TASK_FAILED_RE = /failed to execute bibtex task/;

/**
 * Known, high-confidence error classifiers. The first block in the log that
 * matches any of these wins; otherwise the block is treated as a generic
 * compilation error of lower confidence (see #parseRawLog for the tie-break).
 */
var KNOWN_BLOCK_TYPES = [
    {re: /^Undefined control sequence/, type: 'undefined_control_sequence'},
    {re: /^File ended while scanning use of/, type: 'missing_brace'},
    {re: /^Missing \{ inserted/, type: 'missing_brace'},
    {re: /^Missing \} inserted/, type: 'missing_brace'},
    {re: /^Missing \$ inserted/, type: 'math_error'},
    {re: /^Missing \$/, type: 'math_error'},
    {re: /^Too many \}'s/, type: 'extra_brace'},
    {re: /^Extra \}/, type: 'extra_brace'},
    {re: /^Extra \{/, type: 'extra_brace'},
    {re: /^Environment .+? undefined$/, type: 'undefined_environment'},
    {re: /^\\begin\{.*?\} (?:on input line \d+ )?ended by \\end\{/, type: 'environment_mismatch'},
    {re: /^File [`'].+?\.(?:sty|cls)['`] not found/, type: 'missing_package'},
    {re: FILE_NOT_FOUND_RE, type: 'missing_file'},
];

/**
 * @param {string} logText raw latexrun log contents
 * @param {?{workdir: string}} options optional project root used to make
 *    reported file paths relative to the user's project
 * @return {{type: string, message: string, file: ?string, line: ?number, column: ?number}}
 */
function parseRawLog(logText, options) {
    var workdir = options && options.workdir ? path.resolve(options.workdir) : null;
    var best = null;
    for (var block of scanBlocks(logText)) {
        var candidate = classifyBlock(block, workdir);
        if (!best || candidate.specificity > best.specificity)
            best = candidate;
    }
    // Bibliography-tool errors rank with the known block classifiers: a
    // specific biber error beats a generic latexrun block, while a known
    // latexrun error block wins the tie when both describe the same failure.
    for (var candidate of scanBibliographyErrors(logText)) {
        if (!best || candidate.specificity > best.specificity)
            best = candidate;
    }
    if (!best) {
        // No latexrun block: the log may be a raw pdflatex transcript from the
        // native in-process executor, which uses the same error classes.
        for (var pblock of scanPdflatexBlocks(logText)) {
            var nativeCandidate = classifyBlock(pblock, workdir);
            if (!best || nativeCandidate.specificity > best.specificity)
                best = nativeCandidate;
        }
    }
    if (!best)
        return nativeStartError(logText) || fallbackError();
    return best.error;
}

/**
 * @param {string} logText
 * @return {?Object} a structured error when the native executor reported that
 *    the LaTeX binary itself could not be started (missing package/server)
 */
function nativeStartError(logText) {
    var m = NATIVE_SPAWN_FAIL_RE.exec(String(logText || ''));
    if (!m)
        return null;
    return {
        type: 'compilation_error',
        message: `The LaTeX compiler "${m[1]}" could not be started on this compiler service.`,
        file: null,
        line: null,
        column: null,
    };
}

/**
 * Scans the raw log for bibliography-tool (biber/bibtex) failures, which
 * latexrun echoes verbatim rather than wrapping in its usual block format.
 *
 * @param {string} logText
 * @return {!Array<!{specificity: number, error: Object}>} candidates, best
 *    first in log order (earlier candidates win ties at the call site)
 */
function scanBibliographyErrors(logText) {
    var candidates = [];
    var lines = String(logText || '').split('\n');
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var missing = null;
        for (var r = 0; r < BIB_MISSING_DATABASE_RES.length; r++) {
            missing = BIB_MISSING_DATABASE_RES[r].exec(line);
            if (missing)
                break;
        }
        if (missing) {
            candidates.push({
                specificity: 2,
                error: {
                    type: 'missing_bib_file',
                    message: `Bibliography database "${missing[1]}" not found.`,
                    file: null,
                    line: null,
                    column: null,
                },
            });
            continue;
        }
        var toolError = BIB_TOOL_ERROR_RE.exec(line);
        if (toolError) {
            candidates.push({
                specificity: 2,
                error: {
                    type: 'bibliography_error',
                    message: sentenceEnd(cleanBiberLine(toolError[1])),
                    file: null,
                    line: null,
                    column: null,
                },
            });
            continue;
        }
        if (BIB_TASK_FAILED_RE.test(line)) {
            // Lower confidence: the stderr reached the log but the tool's own
            // reason was not captured. Reported only if nothing above matched.
            candidates.push({
                specificity: 1,
                error: {
                    type: 'bibliography_error',
                    message: 'The bibliography processor failed to complete.',
                    file: null,
                    line: null,
                    column: null,
                },
            });
        }
    }
    return candidates;
}

/**
 * @param {string} line trailing part of a biber "> ERROR - ..." message
 * @return {string} the message without biber's run-on ", skipping ..." tails
 */
function cleanBiberLine(line) {
    return String(line || '')
        .replace(/\s*[.,;:'`-]*\s*skipping\s*\.\.\.\s*$/, '')
        .trim();
}

/**
 * Splits a raw pdflatex transcript into error blocks. Each block starts with
 * a `file:line: message` header and collects the following context lines (the
 * indented rest-of-source line and the `l.N source` echo) until a blank line
 * or the next header closes it.
 *
 * @param {string} logText
 * @return {!Array<!{file: string, line: number, message: string, context: !Array<string>, style: string}>}
 */
function scanPdflatexBlocks(logText) {
    var blocks = [];
    var current = null;
    var pendingLatexError = null;
    var lines = String(logText || '').split('\n');
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var header = PDFLATEX_ERROR_RE.exec(line);
        if (header) {
            if (current)
                blocks.push(current);
            if (pendingLatexError) {
                // Attach the deferred "! LaTeX Error:" message to the location
                // reported by the following "Emergency stop." header.
                blocks.push({
                    file: header[1],
                    line: parseInt(header[2], 10),
                    message: pendingLatexError,
                    context: [],
                    style: 'pdflatex',
                });
                pendingLatexError = null;
            }
            current = {
                file: header[1],
                line: parseInt(header[2], 10),
                message: header[3].trim(),
                context: [],
                style: 'pdflatex',
            };
            continue;
        }
        var latexErrorLine = LATEX_ERROR_RE.exec(line);
        if (latexErrorLine) {
            // The trailing period is stripped so the message reuses the same
            // classifiers/message builders as the latexrun path.
            pendingLatexError = latexErrorLine[1].replace(/\s*\.\s*$/, '').trim();
            continue;
        }
        if (!current)
            continue;
        // Context: the indented rest-of-source line and the unindented
        // `l.N ...` echo that shows where the error stopped.
        if (/^\s+\S/.test(line) || PDFLATEX_SOURCE_LINE_RE.test(line)) {
            current.context.push(line);
            continue;
        }
        if (!line.trim()) {
            blocks.push(current);
            current = null;
            continue;
        }
        // Any other unindented line (banner, memory summary, ...) closes the block.
        blocks.push(current);
        current = null;
    }
    if (current)
        blocks.push(current);
    return blocks;
}

/**
 * Splits the log into latexrun error blocks: an error header line plus the
 * indented context lines that follow it.
 *
 * @param {string} logText
 * @return {!Array<!{file: string, line: ?number, message: string, context: !Array<string>}>}
 */
function scanBlocks(logText) {
    var blocks = [];
    var current = null;
    var lines = String(logText || '').split('\n');
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var withLine = ERROR_WITH_LINE_RE.exec(line);
        if (withLine) {
            if (current)
                blocks.push(current);
            current = {
                file: withLine[1],
                line: parseInt(withLine[2], 10),
                message: withLine[3].trim(),
                context: [],
            };
            continue;
        }
        var withoutLine = ERROR_WITHOUT_LINE_RE.exec(line);
        if (withoutLine) {
            if (current)
                blocks.push(current);
            current = {
                file: withoutLine[1],
                line: null,
                message: withoutLine[2].trim(),
                context: [],
            };
            continue;
        }
        if (current) {
            // Any indented, non-empty line belongs to the open block; anything
            // else (blank line, "Fatal error", summary) closes it.
            if (/^\s+\S/.test(line)) {
                current.context.push(line);
            } else {
                blocks.push(current);
                current = null;
            }
        }
    }
    if (current)
        blocks.push(current);
    return blocks;
}

/**
 * @param {{file: string, line: ?number, message: string}} block
 * @param {?string} workdir
 * @return {{specificity: number, error: Object}}
 */
function classifyBlock(block, workdir) {
    var message = block.message.trim();
    for (var i = 0; i < KNOWN_BLOCK_TYPES.length; i++) {
        var matcher = KNOWN_BLOCK_TYPES[i];
        if (!matcher.re.test(message))
            continue;
        return {
            specificity: 2,
            error: buildError(matcher.type, message, block, workdir),
        };
    }
    return {
        specificity: 1,
        error: buildError('compilation_error', message, block, workdir),
    };
}

/**
 * Returns a user-facing message for a classified block. Builders return a
 * complete sentence or null, in which case the raw latexrun message is used
 * (with a sentence-ending period appended). Error "type" is the category;
 * "message" is the actual human-readable cause.
 */
var MESSAGE_BUILDERS = {
    undefined_control_sequence: function (message, block) {
        var command = extractUndefinedCommand(block);
        return command ? `Undefined command '${command}'.` : 'Undefined control sequence.';
    },
    missing_file: function (message) {
        var name = quotedName(message);
        return name ? `File "${name}" not found.` : null;
    },
    missing_package: function (message) {
        var name = quotedName(message);
        if (!name)
            return null;
        var base = name.replace(/\.(?:sty|cls)$/, '');
        if (/\.cls$/.test(name))
            return `Document class "${base}" not found.`;
        return `Package "${base}" not found.`;
    },
    missing_brace: function (message) {
        if (/^File ended while scanning use of/.test(message)) {
            var m = /use of\s+(\\[a-zA-Z@]+)/.exec(message);
            if (m)
                return `A closing brace is missing for the command "${m[1]}".`;
            return null;
        }
        if (/^Missing \} inserted/.test(message))
            return 'A closing brace "}" is missing.';
        if (/^Missing \{ inserted/.test(message))
            return 'An opening brace "{" is missing.';
        return null;
    },
    math_error: function (message) {
        if (/^Missing \$/.test(message))
            return 'A math-mode "$" delimiter is missing.';
        return null;
    },
    extra_brace: function (message) {
        if (/^Too many \}'s/.test(message) || /^Extra \}/.test(message))
            return 'An extra closing brace "}" was detected.';
        if (/^Extra \{/.test(message))
            return 'An extra opening brace "{" was detected.';
        return null;
    },
    environment_mismatch: function (message) {
        var m = /^\\begin\{([^}]*)\}(?: on input line \d+)? ended by \\end\{([^}]*)\}$/.exec(message);
        if (m)
            return `Environment "${m[1]}" was closed with "\\end{${m[2]}}".`;
        return null;
    },
    undefined_environment: function (message) {
        var m = /^Environment (\S+) undefined$/.exec(message);
        if (m)
            return `Environment "${m[1]}" is undefined.`;
        return null;
    },
};

/**
 * Locates the undefined control sequence that a latexrun block points at.
 *
 * latexrun reports the failing source line as `at <line>` (shown verbatim) and
 * prints a caret underneath the offending token, e.g.
 *
 *     main.tex:4: error: Undefined control sequence
 *           at This is \textbf{real} and \notacommand here
 *                                                    ^
 *
 * The caret (when present) marks one column past the token, so the command
 * whose match ends exactly at that column is the offender. Without a caret the
 * block's line is trusted only when the trailing control sequence reaches the
 * end of the displayed line (as in `at Hello \helloWorld`). Lines that show a
 * TeX pseudo-context (`at <recently read> ...`, `at <inserted text> ...`) or
 * that end in unrelated text are left unextracted; the caller falls back to a
 * generic message rather than guessing.
 *
 * @param {{context: !Array<string>}} block
 * @return {?string} the control sequence (including the leading backslash)
 */
function extractUndefinedCommand(block) {
    var atLine = null;
    var caretIndex = null;
    for (var i = 0; i < block.context.length; i++) {
        var line = block.context[i];
        var atMatch = /^\s*at\s+(.*)$/.exec(line);
        if (!atMatch)
            continue;
        var shown = atMatch[1].trim();
        if (shown === '' || shown.charAt(0) === '<')
            return null;
        atLine = line;
        for (var j = i + 1; j < block.context.length; j++) {
            if (/^\s*at\s+/.test(block.context[j]))
                break;
            var caretMatch = /\^/.exec(block.context[j]);
            if (caretMatch) {
                caretIndex = caretMatch.index;
                break;
            }
        }
        break;
    }
    if (!atLine) {
        // Raw pdflatex blocks carry no `at` line. The engine stops right after
        // the failing token, so it is the trailing control sequence shown on
        // the `l.N source` echo (e.g. `l.3 Text here \helloWorld`). Never
        // guessed: reported only when the block actually came from pdflatex.
        if (block.style !== 'pdflatex')
            return null;
        for (var li = 0; li < block.context.length; li++) {
            var sourceLine = PDFLATEX_SOURCE_LINE_RE.exec(block.context[li]);
            if (!sourceLine)
                continue;
            var shown = sourceLine[1];
            var tokens = [];
            var re = /\\([a-zA-Z@]+)/g;
            var mm;
            while ((mm = re.exec(shown)) !== null)
                tokens.push(mm[0]);
            return tokens.length ? tokens[tokens.length - 1] : null;
        }
        return null;
    }

    var matches = [];
    var tokenRe = /\\([a-zA-Z@]+)/g;
    var m;
    while ((m = tokenRe.exec(atLine)) !== null)
        matches.push(m);
    if (matches.length === 0)
        return null;

    if (caretIndex !== null) {
        for (var k = 0; k < matches.length; k++) {
            if (matches[k].index + matches[k][0].length === caretIndex)
                return matches[k][0];
        }
        return null;
    }

    var last = matches[matches.length - 1];
    return last.index + last[0].length === atLine.length ? last[0] : null;
}

/**
 * @param {string} message
 * @return {string} the message with a sentence-ending period
 */
function sentenceEnd(message) {
    var text = String(message || '').trim();
    if (!text)
        return 'LaTeX compilation failed.';
    if (/[.!?]\s*$/.test(text))
        return text;
    return text + '.';
}

/**
 * @param {string} type
 * @param {string} message
 * @param {{file: string, line: ?number, message: string, context: !Array<string>}} block
 * @param {?string} workdir
 * @return {Object}
 */
function buildError(type, message, block, workdir) {
    var builder = MESSAGE_BUILDERS[type];
    var built = builder ? builder(message, block) : null;
    return {
        type: type,
        message: built || sentenceEnd(message),
        file: normalizeFile(block.file, workdir),
        line: block.line,
        column: null,
    };
}

/**
 * @return {Object}
 */
function fallbackError() {
    return {
        type: 'compilation_error',
        message: 'LaTeX compilation failed.',
        file: null,
        line: null,
        column: null,
    };
}

/**
 * @param {string} message e.g. "File `chapter.tex' not found"
 * @return {?string} the quoted file name
 */
function quotedName(message) {
    var match = (message || '').match(FILE_NOT_FOUND_RE);
    return match ? match[1] : null;
}

/**
 * @param {string} file
 * @param {?string} workdir
 * @return {?string}
 */
function normalizeFile(file, workdir) {
    if (!file || file === '<no file>')
        return null;
    var normalized = String(file).replace(/\\/g, '/');
    if (workdir) {
        var root = String(path.normalize(String(workdir).replace(/\\/g, '/')));
        if (normalized === root) {
            return '';
        }
        var prefix = root.endsWith('/') ? root : root + '/';
        if (normalized.indexOf(prefix) === 0)
            return normalized.slice(prefix.length);
    }
    return normalized;
}

module.exports = parseRawLog;