var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');
var Compilation = require('../lib/Compilation');
var CompilationRequest = require('../lib/CompilationRequest');
var ConcurrencyLimiter = require('../lib/ConcurrencyLimiter');

var VALID_TEX = '\\documentclass{article}\n\\begin{document}\nHello world.\n\\end{document}\n';

function makeWorkdir(files) {
    var workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'conctest-'));
    for (var name of Object.keys(files)) {
        var target = path.join(workdir, name);
        fs.mkdirSync(path.dirname(target), {recursive: true});
        fs.writeFileSync(target, files[name]);
    }
    return workdir;
}

function makeCompilation(workdir, target, command, hash, limiter) {
    var resultsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'concres-'));
    var request = new CompilationRequest(hash || ('conc' + Math.random().toString(16).slice(2)), target, command, '');
    var downloader = {
        downloadIfNeeded: async () => ({folderPath: workdir, userError: null}),
        dispose: () => {},
    };
    return new Compilation(request, downloader, resultsDir, {limiter: limiter || null});
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

describe('ConcurrencyLimiter', function() {
    it('rejects acquisitions beyond its maximum', function() {
        var limiter = new ConcurrencyLimiter(4);
        var releases = [];
        for (var i = 0; i < 4; i++)
            releases.push(limiter.tryAcquire());
        assert.ok(releases.every(x => typeof x === 'function'), 'first four acquisitions should succeed');
        assert.strictEqual(limiter.tryAcquire(), null, 'fifth acquisition should be rejected');
        assert.strictEqual(limiter.running(), 4);
        assert.strictEqual(limiter.available(), 0);
        assert.strictEqual(limiter.isFull(), true);
        assert.strictEqual(limiter.max(), 4);
    });

    it('releases a slot for reuse', function() {
        var limiter = new ConcurrencyLimiter(2);
        var releaseA = limiter.tryAcquire();
        var releaseB = limiter.tryAcquire();
        releaseA();
        assert.strictEqual(limiter.available(), 1);
        assert.strictEqual(limiter.tryAcquire() !== null, true);
        assert.strictEqual(limiter.running(), 2);
        releaseB();
        assert.strictEqual(limiter.running(), 1);
    });

    it('never drops below zero when released more than acquired', function() {
        var limiter = new ConcurrencyLimiter(1);
        var release = limiter.tryAcquire();
        release();
        release();
        assert.strictEqual(limiter.running(), 0);
        assert.strictEqual(limiter.available(), 1);
    });
});

describe('Compilation concurrency slots', function() {
    this.timeout(60000);

    it('rejects additional concurrent compilations when at capacity', async function() {
        var limiter = new ConcurrencyLimiter(1);
        var pidFile = path.join('/tmp', 'latexonline_conc_hang_' + process.pid + '.txt');
        try {
            fs.unlinkSync(pidFile);
        } catch (e) {
            // ignore
        }
        var hangWorkdir = makeWorkdir({
            'main.tex': VALID_TEX,
            'hang.sh': '#!/bin/bash\necho $$ >> "' + pidFile + '"\nwhile true; do sleep 1; done\n',
        });
        fs.chmodSync(path.join(hangWorkdir, 'hang.sh'), 0o755);

        var first = makeCompilation(hangWorkdir, 'main.tex', './hang.sh', 'conc1', limiter);
        var firstPromise = first.run().catch(e => first);
        assert.strictEqual(limiter.running(), 1, 'first compilation should hold the only slot');

        var second = makeCompilation(hangWorkdir, 'main.tex', './hang.sh', 'conc2', limiter);
        await assert.rejects(
            () => second.run(),
            e => e && e.isBusy === true,
            'second compilation should be rejected with a busy error');
        assert.strictEqual(second.userError, null, 'rejected compilation must not have run');

        first.terminate();
        await firstPromise;
        assert.strictEqual(limiter.running(), 0, 'slot must be released after termination');

        // A subsequent compilation proceeds normally on the freed slot.
        var okWorkdir = makeWorkdir({'main.tex': VALID_TEX});
        var third = makeCompilation(okWorkdir, 'main.tex', 'pdflatex', 'conc3', limiter);
        var thirdResult = await third.run();
        assert.strictEqual(thirdResult.success, true);
        assert.strictEqual(limiter.running(), 0);
    });

    it('keeps slots held by in-flight compilations separate', async function() {
        var limiter = new ConcurrencyLimiter(2);
        var pidFile = path.join('/tmp', 'latexonline_conc_two_' + process.pid + '.txt');
        try {
            fs.unlinkSync(pidFile);
        } catch (e) {
            // ignore
        }
        var hangWorkdir = makeWorkdir({
            'main.tex': VALID_TEX,
            'hang.sh': '#!/bin/bash\necho $$ >> "' + pidFile + '"\nwhile true; do sleep 1; done\n',
        });
        fs.chmodSync(path.join(hangWorkdir, 'hang.sh'), 0o755);

        var a = makeCompilation(hangWorkdir, 'main.tex', './hang.sh', 'conca', limiter);
        var b = makeCompilation(hangWorkdir, 'main.tex', './hang.sh', 'concb', limiter);
        var pa = a.run().catch(e => a);
        var pb = b.run().catch(e => b);
        assert.strictEqual(limiter.running(), 2, 'two in-flight compilations should hold both slots');
        assert.strictEqual(limiter.available(), 0);

        a.terminate();
        await pa;
        assert.strictEqual(limiter.running(), 1);
        assert.strictEqual(limiter.available(), 1);

        b.terminate();
        await pb;
        assert.strictEqual(limiter.running(), 0);
    });

    it('releases its slot when a compilation times out', async function() {
        var limiter = new ConcurrencyLimiter(1);
        var hangWorkdir = makeWorkdir({
            'main.tex': VALID_TEX,
            'hang.sh': '#!/bin/bash\nwhile true; do sleep 1; done\n',
        });
        fs.chmodSync(path.join(hangWorkdir, 'hang.sh'), 0o755);

        var compilation = await withEnv('LATEX_COMPILE_TIMEOUT_MS', 300, () =>
            makeCompilation(hangWorkdir, 'main.tex', './hang.sh', 'conctime', limiter).run());
        assert.strictEqual(compilation.userError, 'Compilation timed out');
        assert.strictEqual(limiter.running(), 0, 'slot must be released after a timeout');

        var okWorkdir = makeWorkdir({'main.tex': VALID_TEX});
        var next = await makeCompilation(okWorkdir, 'main.tex', 'pdflatex', 'conctime2', limiter).run();
        assert.strictEqual(next.success, true);
    });

    it('releases its slot when a compilation fails', async function() {
        var limiter = new ConcurrencyLimiter(1);
        var badTex = '\\documentclass{article}\n\\begin{document}\n\\UNDEFINEDCMDXX{broken}\n\\end{document}\n';
        var badWorkdir = makeWorkdir({'main.tex': badTex});
        var compilation = await makeCompilation(badWorkdir, 'main.tex', 'pdflatex', 'concerr', limiter).run();
        assert.strictEqual(compilation.success, false);
        assert.strictEqual(limiter.running(), 0, 'slot must be released after a normal failure');
    });
});