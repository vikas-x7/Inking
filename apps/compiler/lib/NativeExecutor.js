var childProcess = require('child_process');
var fs = require('fs');
var path = require('path');

var config = require('./config');
var utils = require('./utilities');
var logger = utils.logger('NativeExecutor');

/**
 * Executes the TeX toolchain directly on the host/container process - no
 * docker-in-docker, no shell scripts, no latexrun. This is the strategy used
 * by the Render/Docker-deployed compiler service (LATEX_EXECUTOR=native).
 *
 * Each job runs the chosen engine binary (`pdflatex`, `xelatex` or
 * `lualatex`, only - the command is validated upstream too) as an ordinary
 * child process:
 *
 *   - arguments are passed as an array (never a shell string), so user input
 *     cannot smuggle shell metacharacters or extra options;
 *   - output is written with `-output-directory` into the job's private
 *     results folder (never into the user's project);
 *   - the document is compiled up to `LATEX_MAX_PASSES` times and stops as
 *     soon as the aux file stops changing, so cross-references and TOC
 *     settle without wasting CPU;
 *   - bibliographies are resolved like the shell fallback does: biber for
 *     biblatex docs (unless backend=bibtex), classic bibtex otherwise, and
 *     only ever run when the first pass actually asked for one;
 *   - the whole process group is killed on timeout/cancel (see the kill()
 *     handle used by Compilation).
 *
 * The combined transcript (stdout + stderr of every pass and bibliography
 * tool) is streamed into the job's log.txt so the error parser and the API
 * contract behave identically to the other executors.
 */

var ALLOWED_COMMANDS = Object.freeze({
    pdflatex: 'pdflatex',
    xelatex: 'xelatex',
    lualatex: 'lualatex',
});

var JOB_NAME_BASE = 'output';
var BIBLATEX_RE = /\\(?:usepackage|PassOptionsToPackage)(\[[^\]]*\])?\{biblatex\}/i;
var BIBTEX_BACKEND_RE = /\bbackend\s*=\s*bibtex\b/i;
var AUX_REQUESTS_BIBLIOGRAPHY_RE = /\\(?:bibdata|citation|abx@aux@cite|abx@aux@read@bblrerun)/;
var BIBER_ERRORS_RE = /ERRORS:\s*[1-9]/;
var BIBTEX_FAILED_RE = /(?:I couldn't|couldn't find|ERROR - )/i;

function existsSync(filePath) {
    try {
        fs.statSync(filePath);
        return true;
    } catch (e) {
        return false;
    }
}

function readFileSafe(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (e) {
        return null;
    }
}

function sha256File(filePath) {
    try {
        return require('crypto').createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
    } catch (e) {
        return null;
    }
}

function unlinkIfExists(filePath) {
    try {
        fs.unlinkSync(filePath);
    } catch (e) {
        // nothing to remove
    }
}

/**
 * Kills the process spawned by the most recent run of this job (the whole
 * process group, like the shell fallback, so engine helpers die too).
 */
function killProcessGroup(active) {
    var child = active && active.child;
    if (!child || !child.pid)
        return;
    try {
        process.kill(-child.pid, 'SIGKILL');
    } catch (e) {
        try {
            child.kill('SIGKILL');
        } catch (e2) {
            // the process might have already stopped
        }
    }
}

class NativeExecutor {
    /**
     * Starts a native compilation. Implements the same handle contract as the
     * other executors ({pid, kill, done}); `done` resolves with
     * {exitOk: boolean}.
     *
     * @param {string} workdirPath absolute project root (cwd for the engine)
     * @param {string} targetRelativePath absolute path of the source file
     * @param {string} command requested engine (pdflatex/xelatex/lualatex)
     * @param {string} outputPath final PDF to produce (results folder/output.pdf)
     * @param {string} logPath transcript file to write
     * @return {{pid: ?number, kill: function(), done: !Promise}}
     */
    start(workdirPath, targetRelativePath, command, outputPath, logPath) {
        var engine = ALLOWED_COMMANDS[String(command || '').toLowerCase()];
        if (!engine) {
            writeImmediateLog(logPath, `ERROR: unsupported compiler command "${command}" (allowed: pdflatex, xelatex, lualatex).\n`);
            return {pid: null, kill: () => {}, done: Promise.resolve({exitOk: false})};
        }

        var outputFolder = path.dirname(outputPath);
        var active = {child: null};
        var logStream = fs.createWriteStream(logPath, {flags: 'a'});
        var done = this._runPasses(workdirPath, targetRelativePath, engine, outputFolder, logStream, active)
            .then(exitOk => {
                logger.info('Native compilation finished', {
                    workdir: workdirPath,
                    target: targetRelativePath,
                    engine: engine,
                    exitOk: exitOk,
                });
                return {exitOk: exitOk};
            })
            .catch(e => {
                logger.error('ERROR: native compilation failed', {error: e && e.message || String(e)});
                try {
                    logStream.write('\nERROR: ' + (e && e.message || String(e)) + '\n');
                } catch (e2) {
                    // log stream already closed
                }
                return {exitOk: false};
            })
            .then(result => new Promise(resolve => {
                logStream.end(() => resolve(result));
            }));

        return {pid: null, kill: () => killProcessGroup(active), done: done};
    }

    /**
     * Runs the engine up to LATEX_MAX_PASSES times (bibliography pass in
     * between) and decides whether the job produced a PDF.
     */
    async _runPasses(workdirPath, targetRelativePath, engine, outputFolder, logStream, active) {
        var resultsPdf = path.join(outputFolder, JOB_NAME_BASE + '.pdf');
        var auxPath = path.join(outputFolder, JOB_NAME_BASE + '.aux');

        // Never serve a stale PDF from a previous pass of a failed job.
        unlinkIfExists(resultsPdf);

        var maxPasses = config.maxPasses();
        var auxHash = null;
        for (var pass = 1; pass <= maxPasses; pass++) {
            logStream.write(`\n=== Pass ${pass}/${maxPasses}: ${engine} ===\n`);
            // Options must precede the input file (pdfTeX ignores everything
            // after the filename), so jobname/output-directory always apply.
            var code = await this._run(engine, [
                '-interaction=nonstopmode',
                '-halt-on-error',
                '-file-line-error',
                '-jobname=' + JOB_NAME_BASE,
                '-output-directory', outputFolder,
                targetRelativePath,
            ], workdirPath, logStream, active);
            if (code !== 0)
                return false;
            if (!existsSync(resultsPdf)) {
                logStream.write('ERROR: the compiler ran, but no PDF was produced.\n');
                return false;
            }

            if (pass === 1) {
                var bibtool = this._bibliographyTool(workdirPath, targetRelativePath, outputFolder);
                if (bibtool) {
                    logStream.write(`\n=== Bibliography: ${bibtool} ===\n`);
                    var bibOk = await this._runBibliographyTool(bibtool, outputFolder, workdirPath, logStream, active);
                    if (!bibOk)
                        return false;
                }
            }

            var nextAuxHash = sha256File(auxPath);
            if (nextAuxHash !== null && nextAuxHash === auxHash)
                break;
            auxHash = nextAuxHash;
        }
        return true;
    }

    /**
     * Decides which bibliography tool (if any) applies. Mirrors shells/compile.sh:
     * biber for biblatex documents unless an explicit bibtex backend is set,
     * classic bibtex otherwise - and only when the first pass actually
     * requested bibliographic data.
     *
     * @return {?string} one of 'biber'|'bibtex'|null
     */
    _bibliographyTool(workdirPath, targetRelativePath, outputFolder) {
        var targetPath = path.isAbsolute(targetRelativePath) ? targetRelativePath : path.join(workdirPath, targetRelativePath);
        var source = readFileSafe(targetPath) || '';
        var usesBiblatex = BIBLATEX_RE.test(source);
        var tool = usesBiblatex ? (BIBTEX_BACKEND_RE.test(source) ? 'bibtex' : 'biber') : 'bibtex';

        if (tool === 'biber') {
            // biblatex signals citations in the aux as `\abx@aux@cite` and
            // requests a rerun via `\abx@aux@read@bblrerun`; the .bcf marks an
            // active biblatex document. Only run when the document actually
            // cited something (latexrun behaves the same way).
            if (!existsSync(path.join(outputFolder, JOB_NAME_BASE + '.bcf')))
                return null;
            var biberAux = readFileSafe(path.join(outputFolder, JOB_NAME_BASE + '.aux')) || '';
            return AUX_REQUESTS_BIBLIOGRAPHY_RE.test(biberAux) ? 'biber' : null;
        }

        var auxText = readFileSafe(path.join(outputFolder, JOB_NAME_BASE + '.aux')) || '';
        return AUX_REQUESTS_BIBLIOGRAPHY_RE.test(auxText) ? 'bibtex' : null;
    }

    async _runBibliographyTool(tool, outputFolder, workdirPath, logStream, active) {
        var cwd;
        var args;
        var env;
        if (tool === 'biber') {
            // biber resolves relative .bib paths from its own cwd, so run it in
            // the project root and point it at the job's .bcf (absolute path;
            // its .blg/.bbl are written next to the .bcf).
            cwd = workdirPath;
            args = [path.join(outputFolder, JOB_NAME_BASE + '.bcf')];
        } else {
            // Classic bibtex must run where the .aux lives (it cannot write its
            // outputs to an arbitrary absolute path), and finds the .bib files
            // via BIBINPUTS pointing back at the project root.
            cwd = outputFolder;
            args = [JOB_NAME_BASE];
            env = Object.assign({}, process.env, {BIBINPUTS: workdirPath + ':' + outputFolder + ':.'});
        }
        var code = await this._run(tool, args, cwd, logStream, active, env);
        var blgText = readFileSafe(path.join(outputFolder, JOB_NAME_BASE + '.blg'));
        if (blgText)
            logStream.write(`\n=== ${tool} report (${JOB_NAME_BASE}.blg) ===\n${blgText}\n`);
        if (code !== 0)
            return false;
        if (tool === 'biber' && BIBER_ERRORS_RE.test(blgText || '')) {
            logStream.write(`ERROR: biber reported errors (see ${JOB_NAME_BASE}.blg above).\n`);
            return false;
        }
        if (tool === 'bibtex' && BIBTEX_FAILED_RE.test(blgText || '')) {
            logStream.write(`ERROR: bibtex reported errors (see ${JOB_NAME_BASE}.blg above).\n`);
            return false;
        }
        if (blgText === null && !existsSync(path.join(outputFolder, JOB_NAME_BASE + '.bbl')))
            logStream.write(`ERROR: ${tool} ran but produced no bibliography output.\n`);
        return true;
    }

    /**
     * Spawns one child process with an argument array and streams the full
     * transcript (stdout+stderr) into the job log. Resolves with the exit
     * code, or 0 only on a clean, zero exit. A missing binary or a kill
     * resolves with a non-zero code.
     *
     * @param {string} binary
     * @param {!Array<string>} args
     * @param {string} cwd
     * @param {Object} logStream
     * @param {{child: ?Object}} active
     * @param {?Object=} env custom environment (defaults to process.env)
     * @return {!Promise<number>}
     */
    _run(binary, args, cwd, logStream, active, env) {
        return new Promise(resolve => {
            var child;
            try {
                child = childProcess.spawn(binary, args, {cwd: cwd, env: env, detached: true, stdio: ['ignore', 'pipe', 'pipe']});
            } catch (e) {
                logStream.write(`ERROR: failed to start "${binary}": ${e.message}\n`);
                resolve(1);
                return;
            }
            active.child = child;

            var settled = false;
            var settle = code => {
                if (settled)
                    return;
                settled = true;
                if (active.child === child)
                    active.child = null;
                resolve(code);
            };

            child.stdout.on('data', d => logStream.write(d.toString()));
            child.stderr.on('data', d => logStream.write(d.toString()));

            child.once('error', err => {
                logStream.write(`ERROR: failed to start "${binary}": ${err.message}\n`);
                settle(1);
            });
            child.once('close', (exitCode, signalCode) => {
                if (exitCode !== null) {
                    settle(exitCode);
                } else if (signalCode) {
                    logStream.write(`ERROR: "${binary}" was terminated (signal ${signalCode}).\n`);
                    settle(1);
                } else {
                    settle(1);
                }
            });
        });
    }
}

/**
 * Writes a log immediately (used for requests rejected before any process runs).
 */
function writeImmediateLog(logPath, text) {
    try {
        fs.writeFileSync(logPath, text);
    } catch (e) {
        logger.error('ERROR: failed to write native executor log', {error: e && e.message || String(e)});
    }
}

module.exports = NativeExecutor;