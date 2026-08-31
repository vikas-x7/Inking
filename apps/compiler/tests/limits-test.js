var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');
var Compilation = require('../lib/Compilation');
var CompilationRequest = require('../lib/CompilationRequest');

var VALID_TEX = '\\documentclass{article}\n\\begin{document}\nHello world.\n\\end{document}\n';

function makeWorkdir(files) {
    var workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'limitstest-'));
    for (var name of Object.keys(files)) {
        var target = path.join(workdir, name);
        fs.mkdirSync(path.dirname(target), {recursive: true});
        fs.writeFileSync(target, files[name]);
    }
    return workdir;
}

function makeCompilation(workdir, target, command, hash, resultsDir) {
    resultsDir = resultsDir || fs.mkdtempSync(path.join(os.tmpdir(), 'limitres-'));
    var request = new CompilationRequest(hash || ('limits' + Math.random().toString(16).slice(2)), target, command, '');
    var downloader = {
        downloadIfNeeded: async () => ({folderPath: workdir, userError: null}),
        dispose: () => {},
    };
    return new Compilation(request, downloader, resultsDir);
}

function withEnv(name, value, fn) {
    var old = process.env[name];
    if (value === undefined)
        delete process.env[name];
    else
        process.env[name] = String(value);
    return Promise.resolve(fn()).finally(() => {
        if (old === undefined)
            delete process.env[name];
        else
            process.env[name] = old;
    });
}

function isProcessAlive(pid) {
    try {
        process.kill(pid, 0);
        var stat = fs.readFileSync('/proc/' + pid + '/stat', 'utf8');
        var state = stat.split(')').pop().trim().split(/\s+/)[0];
        return state !== 'Z';
    } catch (e) {
        return false;
    }
}

async function waitForAllDead(pids, timeoutMs) {
    var deadline = Date.now() + timeoutMs;
    for (;;) {
        var alive = pids.filter(isProcessAlive);
        if (alive.length === 0)
            return true;
        if (Date.now() > deadline)
            return false;
        await new Promise(resolve => setTimeout(resolve, 50));
    }
}

function readPids(pidFile) {
    if (!fs.existsSync(pidFile))
        return [];
    return fs.readFileSync(pidFile, 'utf8').trim().split(/\s+/)
        .filter(x => x).map(Number);
}

function placeResults(compilation, outputBytes, logBytes) {
    compilation._outputFolder = path.join(compilation._resultsFolder, compilation.id);
    fs.mkdirSync(compilation._outputFolder, {recursive: true});
    fs.writeFileSync(compilation.outputPath(), Buffer.alloc(outputBytes));
    if (logBytes !== null)
        fs.writeFileSync(compilation.logPath(), Buffer.alloc(logBytes));
}

describe('Compilation output and log size limits', function() {
    this.timeout(60000);

    it('rejects an output larger than the limit and removes it from storage', async function() {
        var workdir = makeWorkdir({'main.tex': VALID_TEX});
        var resultsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'limitres-'));
        var compilation = makeCompilation(workdir, 'main.tex', 'pdflatex', 'outputtest', resultsDir);
        placeResults(compilation, 5000, 10);

        var result = await withEnv('LATEX_MAX_OUTPUT_SIZE', 2000, () =>
            compilation._validateOutputSizes());

        assert.ok(result, 'expected an error message for oversized output');
        assert.ok(/Compilation output exceeds the maximum allowed size \(2 KB\)/.test(result), result);
        assert.ok(!fs.existsSync(compilation.outputPath()), 'oversized output should be removed');
        assert.ok(fs.existsSync(compilation.logPath()), 'log must be kept so the user can debug');
    });

    it('allows output at or below the limit', async function() {
        var workdir = makeWorkdir({'main.tex': VALID_TEX});
        var resultsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'limitres-'));
        var compilation = makeCompilation(workdir, 'main.tex', 'pdflatex', 'outputok', resultsDir);
        placeResults(compilation, 2000, null);

        var result = await withEnv('LATEX_MAX_OUTPUT_SIZE', 2000, () =>
            compilation._validateOutputSizes());

        assert.strictEqual(result, null);
        assert.ok(fs.existsSync(compilation.outputPath()), 'in-limit output must be kept');
    });

    it('rejects an oversized log and cleans up both log and output', async function() {
        var workdir = makeWorkdir({'main.tex': VALID_TEX});
        var resultsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'limitres-'));
        var compilation = makeCompilation(workdir, 'main.tex', 'pdflatex', 'logtest', resultsDir);
        placeResults(compilation, 100, 5000);

        var result = await withEnv('LATEX_MAX_LOG_SIZE', 2000, () =>
            compilation._validateOutputSizes());

        assert.ok(/Compilation log exceeds the maximum allowed size \(2 KB\)/.test(result), result);
        assert.ok(!fs.existsSync(compilation.outputPath()), 'output should be removed with an oversized log');
        assert.ok(!fs.existsSync(compilation.logPath()), 'oversized log should be removed');
    });

    it('terminates a still-running compilation when the workspace grows past its limit', async function() {
        var pidFile = path.join('/tmp', 'latexonline_blow_pids_' + process.pid + '.txt');
        try {
            fs.unlinkSync(pidFile);
        } catch (e) {
            // ignore
        }
        var workdir = makeWorkdir({
            'main.tex': VALID_TEX,
            'blow.sh': '#!/bin/bash\necho $$ >> "' + pidFile + '"\ndd if=/dev/zero of=blob.bin bs=524288 count=10 2>/dev/null\nwhile true; do sleep 1; done\n',
        });
        fs.chmodSync(path.join(workdir, 'blow.sh'), 0o755);

        var compilation = await withEnv('LATEX_MAX_WORKSPACE_SIZE', 1048576, () =>
            makeCompilation(workdir, 'main.tex', './blow.sh', 'blowtest').run());

        assert.strictEqual(compilation.success, false);
        assert.ok(/workspace exceeds the maximum allowed size \(1 MB\)/.test(compilation.userError),
            'expected controlled workspace error, got: ' + compilation.userError);

        var pids = readPids(pidFile);
        assert.ok(pids.length >= 1, 'expected the compiler pid to be recorded');
        var allDead = await waitForAllDead(pids, 10000);
        assert.ok(allDead, 'orphaned compiler processes still alive: ' + pids.map(isProcessAlive).toString());
        assert.ok(!fs.existsSync(path.join(workdir, 'output.pdf')), 'no output should be produced');
    });

    it('does not reject a normal successful compilation', async function() {
        var workdir = makeWorkdir({'main.tex': VALID_TEX});
        var compilation = await makeCompilation(workdir, 'main.tex', 'pdflatex', 'normal').run();
        assert.strictEqual(compilation.success, true);
        assert.strictEqual(compilation.userError, null);
    });
});