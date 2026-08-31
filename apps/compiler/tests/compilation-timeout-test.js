var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');
var Compilation = require('../lib/Compilation');
var CompilationRequest = require('../lib/CompilationRequest');

var VALID_TEX = '\\documentclass{article}\n\\begin{document}\nHello world.\n\\end{document}\n';

function makeWorkdir(files) {
    var workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'comptest-'));
    for (var name of Object.keys(files)) {
        var target = path.join(workdir, name);
        fs.mkdirSync(path.dirname(target), {recursive: true});
        fs.writeFileSync(target, files[name]);
    }
    return workdir;
}

function makeCompilation(workdir, target, command, hash) {
    var resultsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compres-'));
    var request = new CompilationRequest(hash || 'testhash', target, command, '');
    var downloader = {
        downloadIfNeeded: async () => ({folderPath: workdir, userError: null}),
        dispose: () => {},
    };
    return new Compilation(request, downloader, resultsDir);
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

function withTimeoutEnv(value, fn) {
    var old = process.env.LATEX_COMPILE_TIMEOUT_MS;
    if (value === undefined)
        delete process.env.LATEX_COMPILE_TIMEOUT_MS;
    else
        process.env.LATEX_COMPILE_TIMEOUT_MS = String(value);
    return Promise.resolve(fn()).finally(() => {
        if (old === undefined)
            delete process.env.LATEX_COMPILE_TIMEOUT_MS;
        else
            process.env.LATEX_COMPILE_TIMEOUT_MS = old;
    });
}

function readPids(pidFile) {
    if (!fs.existsSync(pidFile))
        return [];
    return fs.readFileSync(pidFile, 'utf8').trim().split(/\s+/)
        .filter(x => x).map(Number);
}

describe('Compilation timeout and process-tree termination', function() {
    this.timeout(60000);

    it('compiles a valid document successfully without timing out', async function() {
        var workdir = makeWorkdir({ 'main.tex': VALID_TEX });
        var compilation = await withTimeoutEnv(undefined, () => makeCompilation(workdir, 'main.tex', 'pdflatex').run());
        assert.strictEqual(compilation.success, true);
        assert.strictEqual(compilation.userError, null);
        var pdf = fs.readFileSync(compilation.outputPath());
        assert.deepEqual(pdf.slice(0, 4).toString(), '%PDF');
    });

    it('fails normally on an invalid document and is not marked as timed out', async function() {
        var badTex = '\\documentclass{article}\n\\begin{document}\n\\PCDQYNNzq{broken}\n\\end{document}\n';
        var workdir = makeWorkdir({ 'main.tex': badTex });
        var compilation = await withTimeoutEnv(undefined, () => makeCompilation(workdir, 'main.tex', 'pdflatex').run());
        assert.strictEqual(compilation.success, false);
        assert.notStrictEqual(compilation.userError, 'Compilation timed out');
        assert.ok(compilation.logPath());
        assert.ok(fs.existsSync(compilation.logPath()));

        var log = fs.readFileSync(compilation.logPath(), 'utf8');
        assert.ok(/PCDQYNNzq/.test(log), 'log should contain the latex error');
    });

    it('detects a timeout and returns a controlled timeout error', async function() {
        var workdir = makeWorkdir({
            'main.tex': VALID_TEX,
            'hang.sh': '#!/bin/bash\necho $$ >> "' + path.join('/tmp', 'latexonline_hang_pids.txt') + '"\n(sleep 300) &\necho $! >> "' + path.join('/tmp', 'latexonline_hang_pids.txt') + '"\nwhile true; do sleep 1; done\n',
        });
        fs.chmodSync(path.join(workdir, 'hang.sh'), 0o755);
        try {
            fs.unlinkSync(path.join('/tmp', 'latexonline_hang_pids.txt'));
        } catch (e) {
            // ignore
        }

        var compilation = await withTimeoutEnv(400, () => makeCompilation(workdir, 'main.tex', './hang.sh').run());

        assert.strictEqual(compilation.userError, 'Compilation timed out');
        assert.strictEqual(compilation.success, false);
    });

    it('terminates the complete process tree (latex command and its children) on timeout', async function() {
        var pidFile = path.join('/tmp', 'latexonline_hang_pids_' + process.pid + '.txt');
        var workdir = makeWorkdir({
            'main.tex': VALID_TEX,
            'hang.sh': '#!/bin/bash\necho $$ >> "' + pidFile + '"\n(sleep 300) &\necho $! >> "' + pidFile + '"\nwhile true; do sleep 1; done\n',
        });
        fs.chmodSync(path.join(workdir, 'hang.sh'), 0o755);
        try {
            fs.unlinkSync(pidFile);
        } catch (e) {
            // ignore
        }

        var compilation = await withTimeoutEnv(400, () => makeCompilation(workdir, 'main.tex', './hang.sh').run());
        assert.strictEqual(compilation.userError, 'Compilation timed out');

        var pids = readPids(pidFile);
        assert.ok(pids.length >= 2, 'expected hang.sh and its child to be recorded, got ' + pids.join(', '));

        var allDead = await waitForAllDead(pids, 10000);
        assert.ok(allDead, 'orphaned compiler processes still alive: ' + pids.map(isProcessAlive).toString());
        assert.ok(!fs.existsSync(path.join(workdir, 'output.pdf')), 'no output should be produced on timeout');
    });

    it('does not corrupt subsequent compilations after a timeout', async function() {
        var pidFile = path.join('/tmp', 'latexonline_hang_pids_seq.txt');

        // 1) First compilation succeeds.
        var workdir1 = makeWorkdir({ 'main.tex': VALID_TEX });
        var first = await withTimeoutEnv(undefined, () => makeCompilation(workdir1, 'main.tex', 'pdflatex').run());
        assert.strictEqual(first.success, true);

        // 2) Second compilation times out.
        var workdir2 = makeWorkdir({
            'main.tex': VALID_TEX,
            'hang.sh': '#!/bin/bash\necho $$ >> "' + pidFile + '"\nwhile true; do sleep 1; done\n',
        });
        fs.chmodSync(path.join(workdir2, 'hang.sh'), 0o755);
        var timedOut = await withTimeoutEnv(300, () => makeCompilation(workdir2, 'main.tex', './hang.sh').run());
        assert.strictEqual(timedOut.userError, 'Compilation timed out');

        // 3) Third compilation succeeds again after the timeout env is restored.
        var workdir3 = makeWorkdir({ 'main.tex': VALID_TEX });
        var third = await withTimeoutEnv(undefined, () => makeCompilation(workdir3, 'main.tex', 'pdflatex').run());
        assert.strictEqual(third.success, true);
        assert.notStrictEqual(third.userError, 'Compilation timed out');
    });
});