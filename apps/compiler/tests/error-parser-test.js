var assert = require('assert');
var parseRawLog = require('../lib/ErrorParser');

var PROJECT = '/home/user/project';
var MAIN_TEX = PROJECT + '/main.tex';

/**
 * Canonical latexrun logs (shapes verified against the real compiler output).
 * Every fixture reproduces the exact block format latexrun emits.
 */

var NOISE = [
    `/home/user/latex-online/shells/../latexrun/latexrun:1215: SyntaxWarning: invalid escape sequence '\\w'`,
    `  if lookingatre('(Package |Class |LaTeX |pdfTeX |)?\\w+warning: ', re.I):`,
    `/home/user/latex-online/shells/../latexrun/latexrun:1354: SyntaxWarning: invalid escape sequence '\\.'`,
    `  m2 = self.__lookingatre('l\\.[0-9]+ ')`,
].join('\n');

function logWith(text) {
    var header = `pdflatex -interaction nonstopmode -recorder -output-directory latex.out ${MAIN_TEX}\n`;
    var footer = `There were errors; ${PROJECT}/latex.out/zz-latex-online-output.pdf not updated\n`;
    return header + '\n' + text + '\n' + footer;
}

describe('ErrorParser', function() {

    it('classifies an undefined control sequence with file and line', function() {
        var err = parseRawLog(logWith(`${MAIN_TEX}:118: error: Undefined control sequence\n      at Hello \\helloWorld\n`), {workdir: PROJECT});
        assert.strictEqual(err.type, 'undefined_control_sequence');
        assert.strictEqual(err.message, "Undefined command '\\helloWorld'.");
        assert.strictEqual(err.file, 'main.tex');
        assert.strictEqual(err.line, 118);
        assert.strictEqual(err.column, null);
    });

    it('extracts the undefined command pointed at by the caret when it is not the last token', function() {
        var err = parseRawLog(logWith([
            `${MAIN_TEX}:4: error: Undefined control sequence`,
            `      at This is \\textbf{real} and \\notacommand here`,
            `                                               ^`,
        ].join('\n')), {workdir: PROJECT});
        assert.strictEqual(err.type, 'undefined_control_sequence');
        assert.strictEqual(err.message, "Undefined command '\\notacommand'.");
        assert.strictEqual(err.line, 4);
    });

    it('picks the first of multiple undefined commands on one line using the caret', function() {
        var err = parseRawLog(logWith(`${MAIN_TEX}:4: error: Undefined control sequence\n      at \\badcmd{\\nope}\n                ^\n`), {workdir: PROJECT});
        assert.strictEqual(err.message, "Undefined command '\\badcmd'.");
    });

    it('falls back to a generic message when the undefined command cannot be extracted', function() {
        var err = parseRawLog(logWith(`${MAIN_TEX}:1: error: Undefined control sequence\n      at <recently read> \\n\n    from \\documentclass{article}\n`), {workdir: PROJECT});
        assert.strictEqual(err.type, 'undefined_control_sequence');
        assert.strictEqual(err.message, 'Undefined control sequence.');
        assert.strictEqual(err.file, 'main.tex');
        assert.strictEqual(err.line, 1);
        assert.strictEqual(err.column, null);
    });

    it('falls back to a generic message when the reported line has trailing text after the command', function() {
        var err = parseRawLog(logWith(`${MAIN_TEX}:2: error: Undefined control sequence\n      at a \\foo b \\bar text\n`), {workdir: PROJECT});
        assert.strictEqual(err.message, 'Undefined control sequence.');
    });

    it('falls back to a generic message when the block has no context lines', function() {
        var err = parseRawLog(logWith(`${MAIN_TEX}:3: error: Undefined control sequence\n`), {workdir: PROJECT});
        assert.strictEqual(err.message, 'Undefined control sequence.');
    });

    it('classifies a missing file and extracts the file name', function() {
        var err = parseRawLog(logWith(`${MAIN_TEX}:4: error: File \`chapter.tex' not found\n      at <read *>\n    from See \\input{chapter}.\n`), {workdir: PROJECT});
        assert.strictEqual(err.type, 'missing_file');
        assert.strictEqual(err.message, 'File "chapter.tex" not found.');
        assert.strictEqual(err.file, 'main.tex');
        assert.strictEqual(err.line, 4);
    });

    it('classifies a missing package and names the package', function() {
        var err = parseRawLog(logWith(`${MAIN_TEX}:3: error: File \`somepackage.sty' not found\n      at <read *>\n    from \\begin{document}\n`), {workdir: PROJECT});
        assert.strictEqual(err.type, 'missing_package');
        assert.strictEqual(err.message, 'Package "somepackage" not found.');
        assert.strictEqual(err.file, 'main.tex');
        assert.strictEqual(err.line, 3);
    });

    it('classifies a missing document class', function() {
        var err = parseRawLog(logWith(`${MAIN_TEX}:1: error: File \`somearticle.cls' not found\n      at <read *>\n`), {workdir: PROJECT});
        assert.strictEqual(err.type, 'missing_package');
        assert.strictEqual(err.message, 'Document class "somearticle" not found.');
        assert.strictEqual(err.file, 'main.tex');
        assert.strictEqual(err.line, 1);
    });

    it('classifies a missing $ (math mode) error', function() {
        var err = parseRawLog(logWith(`${MAIN_TEX}:5: error: Missing $ inserted\n      at <inserted text> $\n`), {workdir: PROJECT});
        assert.strictEqual(err.type, 'math_error');
        assert.strictEqual(err.message, 'A math-mode "$" delimiter is missing.');
        assert.strictEqual(err.file, 'main.tex');
        assert.strictEqual(err.line, 5);
    });

    it('classifies an extra brace error', function() {
        var err = parseRawLog(logWith(`${MAIN_TEX}:4: error: Too many }'s\n      at Hello}\n`), {workdir: PROJECT});
        assert.strictEqual(err.type, 'extra_brace');
        assert.strictEqual(err.message, 'An extra closing brace "}" was detected.');
        assert.strictEqual(err.file, 'main.tex');
        assert.strictEqual(err.line, 4);
    });

    it('classifies a missing brace (unclosed group) without a line number', function() {
        var err = parseRawLog(logWith([
            `${MAIN_TEX}: error: File ended while scanning use of \\textbf`,
            `      at <inserted text> \\par`,
            `    from <*> ${MAIN_TEX}`,
        ].join('\n')), {workdir: PROJECT});
        assert.strictEqual(err.type, 'missing_brace');
        assert.strictEqual(err.message, 'A closing brace is missing for the command "\\textbf".');
        assert.strictEqual(err.file, 'main.tex');
        assert.strictEqual(err.line, null);
    });

    it('prefers the specific environment mismatch over the preceding noisy block', function() {
        var err = parseRawLog(logWith([
            `${MAIN_TEX}:6: error: Something's wrong--perhaps a missing \\item`,
            `      at \\end{enumerate}`,
            `${MAIN_TEX}:6: error: \\begin{itemize} on input line 4 ended by \\end{enumerate}`,
            `      at \\end{enumerate}`,
        ].join('\n')), {workdir: PROJECT});
        assert.strictEqual(err.type, 'environment_mismatch');
        assert.strictEqual(err.message, 'Environment "itemize" was closed with "\\end{enumerate}".');
        assert.strictEqual(err.file, 'main.tex');
        assert.strictEqual(err.line, 6);
    });

    it('classifies an undefined environment even when a later mismatch is also present', function() {
        var err = parseRawLog(logWith([
            `${MAIN_TEX}:4: error: Environment foo undefined`,
            `      at \\begin{foo}`,
            `${MAIN_TEX}:6: error: \\begin{document} ended by \\end{foo}`,
            `      at \\end{foo}`,
        ].join('\n')), {workdir: PROJECT});
        assert.strictEqual(err.type, 'undefined_environment');
        assert.strictEqual(err.message, 'Environment "foo" is undefined.');
        assert.strictEqual(err.line, 4);
    });

    it('keeps a generic error message when no known type matches', function() {
        var err = parseRawLog(logWith(`${MAIN_TEX}: error: Emergency stop: job aborted, no legal \\end found\n      at <*> ${MAIN_TEX}\n`), {workdir: PROJECT});
        assert.strictEqual(err.type, 'compilation_error');
        assert.strictEqual(err.message, 'Emergency stop: job aborted, no legal \\end found.');
        assert.strictEqual(err.file, 'main.tex');
        assert.strictEqual(err.line, null);
    });

    it('reports a fallback error when the log has no latexrun error blocks', function() {
        var err = parseRawLog(logWith(''), {workdir: PROJECT});
        assert.strictEqual(err.type, 'compilation_error');
        assert.strictEqual(err.message, 'LaTeX compilation failed.');
        assert.strictEqual(err.file, null);
        assert.strictEqual(err.line, null);
    });

    it('reports a fallback error for an empty log', function() {
        var err = parseRawLog('', {workdir: PROJECT});
        assert.strictEqual(err.type, 'compilation_error');
        assert.strictEqual(err.message, 'LaTeX compilation failed.');
        assert.strictEqual(err.file, null);
    });

    it('is robust to Python SyntaxWarning noise lines at the top of the log', function() {
        var err = parseRawLog(NOISE + '\n' + logWith(`${MAIN_TEX}:6: error: Undefined control sequence\n      at \\helloWorld\n`), {workdir: PROJECT});
        assert.strictEqual(err.type, 'undefined_control_sequence');
        assert.strictEqual(err.file, 'main.tex');
        assert.strictEqual(err.line, 6);
    });

    it('does not relativize paths that fall outside the project root', function() {
        var err = parseRawLog(logWith(`${MAIN_TEX}:6: error: Undefined control sequence\n`), {workdir: '/other/project'});
        assert.strictEqual(err.file, MAIN_TEX);
    });

    it('keeps the absolute file path when no project root is provided', function() {
        var err = parseRawLog(logWith(`${MAIN_TEX}:6: error: Undefined control sequence\n`));
        assert.strictEqual(err.file, MAIN_TEX);
    });

    it('normalizes reported line-less "<no file>" locations to null', function() {
        var err = parseRawLog(logWith(`<no file>: error: Emergency stop: job aborted\n`), {workdir: PROJECT});
        assert.strictEqual(err.type, 'compilation_error');
        assert.strictEqual(err.file, null);
    });

    it('normalizes backslash path separators to forward slashes', function() {
        var winLog = logWith(`${PROJECT}\\sections\\intro.tex:9: error: Undefined control sequence\n      at \\foo\n`);
        var err = parseRawLog(winLog, {workdir: PROJECT});
        assert.strictEqual(err.file, 'sections/intro.tex');
    });

    it('classifies a missing bibliography database from biber stderr', function() {
        var err = parseRawLog([
            `pdflatex -interaction nonstopmode -recorder -output-directory latex.out ${MAIN_TEX}`,
            `[0] biber: INFO - This is Biber 2.19`,
            `[0] biber: INFO - Logfile is 'main.blg'`,
            `[0] biber: INFO - Reading 'main.bcf'`,
            `[0] biber: INFO - Found 1 citekeys in section 0`,
            `[0] bibtex.pm:1172> ERROR - I couldn't find database file 'references.bib' - skipping ...`,
            `[0] biber: INFO - ERRORS: 1`,
            `failed to execute bibtex task`,
            `There were errors; ${PROJECT}/latex.out/zz-latex-online-output.pdf not updated`,
        ].join('\n'), {workdir: PROJECT});
        assert.strictEqual(err.type, 'missing_bib_file');
        assert.strictEqual(err.message, 'Bibliography database "references.bib" not found.');
        assert.strictEqual(err.file, null);
        assert.strictEqual(err.line, null);
    });

    it('classifies a generic biber error on a malformed bibliography entry', function() {
        var err = parseRawLog([
            `pdflatex -interaction nonstopmode -recorder -output-directory latex.out ${MAIN_TEX}`,
            `[0] bibtex.pm:1201> ERROR - Found weird data in references.bib at "@article{foo" - skipping ...`,
            `[0] biber: INFO - ERRORS: 1`,
            `failed to execute bibtex task`,
            `There were errors; ${PROJECT}/latex.out/zz-latex-online-output.pdf not updated`,
        ].join('\n'), {workdir: PROJECT});
        assert.strictEqual(err.type, 'bibliography_error');
        assert.strictEqual(err.message, 'Found weird data in references.bib at "@article{foo".');
        assert.strictEqual(err.file, null);
    });

    it('falls back to a bibliography error when only latexrun reports the tool failure', function() {
        var err = parseRawLog([
            `pdflatex -interaction nonstopmode -recorder -output-directory latex.out ${MAIN_TEX}`,
            `failed to execute bibtex task`,
            `There were errors; ${PROJECT}/latex.out/zz-latex-online-output.pdf not updated`,
        ].join('\n'), {workdir: PROJECT});
        assert.strictEqual(err.type, 'bibliography_error');
        assert.strictEqual(err.message, 'The bibliography processor failed to complete.');
        assert.strictEqual(err.file, null);
    });

    it('prefers a missing bibliography database over a generic latexrun block', function() {
        var err = parseRawLog([
            `pdflatex -interaction nonstopmode -recorder -output-directory latex.out ${MAIN_TEX}`,
            `${MAIN_TEX}:2: error: Emergency stop: job aborted, file error in nonstop mode`,
            `      at <*> ${MAIN_TEX}`,
            `[0] bibtex.pm:1172> ERROR - I couldn't find database file 'references.bib' - skipping ...`,
            `failed to execute bibtex task`,
            `There were errors; ${PROJECT}/latex.out/zz-latex-online-output.pdf not updated`,
        ].join('\n'), {workdir: PROJECT});
        assert.strictEqual(err.type, 'missing_bib_file');
        assert.strictEqual(err.message, 'Bibliography database "references.bib" not found.');
    });

    it('still classifies a known latexrun error block when biber only warns', function() {
        var err = parseRawLog([
            `pdflatex -interaction nonstopmode -recorder -output-directory latex.out ${MAIN_TEX}`,
            `${MAIN_TEX}:6: error: Undefined control sequence`,
            `      at \\helloWorld`,
            `[0] bibtex.pm:1172> WARN - no database entry for "x" - skipping ...`,
        ].join('\n'), {workdir: PROJECT});
        assert.strictEqual(err.type, 'undefined_control_sequence');
        assert.strictEqual(err.message, "Undefined command '\\helloWorld'.");
    });

    it('returns a stable six-field error shape for every outcome', function() {
        for (var log of [
            logWith(`${MAIN_TEX}:6: error: Undefined control sequence\n`),
            logWith(''),
            logWith(`${MAIN_TEX}: error: Emergency stop: job aborted\n`),
        ]) {
            var err = parseRawLog(log, {workdir: PROJECT});
            assert.deepStrictEqual(Object.keys(err).sort(), ['column', 'file', 'line', 'message', 'type']);
        }
    });
});