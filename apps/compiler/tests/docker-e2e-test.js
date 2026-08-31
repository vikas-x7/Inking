var assert = require('assert');
var childProcess = require('child_process');
var util = require('util');

var helpers = require('./http-helpers');

var execFile = util.promisify(childProcess.execFile);

var VALID_TEX = '\\documentclass{article}\n\\begin{document}\nHello world.\n\\end{document}\n';
var XELATEX_TEX = '\\documentclass{article}\n\\usepackage{fontspec}\n\\begin{document}\nHello XeLaTeX\n\\end{document}\n';
var TOKEN = ['Authorization: Bearer test-internal-secret'];

var IMAGE = 'latex-online:biblatex-fixed';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function dockerAndImageAvailable() {
    try {
        await execFile('docker', ['image', 'inspect', IMAGE]);
        return true;
    } catch (e) {
        return false;
    }
}

async function runningJobContainers() {
    var {stdout} = await execFile('docker', ['ps', '-q', '--filter', 'name=latexon_']);
    return stdout.trim().split('\n').filter(Boolean);
}

// A large document that keeps the container alive long enough to inspect while
// it is running (the container is only observable on THESE compilations).
function slowDocument(n) {
    var lines = ['\\documentclass{article}', '\\begin{document}'];
    for (var i = 0; i < n; ++i)
        lines.push('Paragraph ' + i + ': The quick brown fox jumps over the lazy dog, and the typesetter dutifully does its work.');
    lines.push('\\end{document}');
    return lines.join('\n\n');
}

describe('Docker production path (per-job isolated executor)', function() {
    this.timeout(420000);

    var server;
    before(async function() {
        if (!(await dockerAndImageAvailable()))
            this.skip();
    });

    afterEach(async function() {
        if (server) {
            await server.stop();
            server = null;
        }
    });

    it('compiles pdflatex through the isolated job container', async function() {
        server = await helpers.spawnServer({LATEX_EXECUTOR: 'docker', LATEX_EXECUTOR_IMAGE: IMAGE});
        var response = await helpers.httpPostJson(server.baseUrl + '/compile', {latex: VALID_TEX}, TOKEN);
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.slice(0, 4), '%PDF');
    });

    it('compiles lualatex through the isolated job container', async function() {
        server = await helpers.spawnServer({LATEX_EXECUTOR: 'docker', LATEX_EXECUTOR_IMAGE: IMAGE});
        var response = await helpers.httpPostJson(server.baseUrl + '/compile', {latex: VALID_TEX, command: 'lualatex'}, TOKEN);
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.slice(0, 4), '%PDF');
    });

    it('compiles a fontspec document with xelatex through the isolated job container', async function() {
        server = await helpers.spawnServer({LATEX_EXECUTOR: 'docker', LATEX_EXECUTOR_IMAGE: IMAGE});
        var response = await helpers.httpPostJson(server.baseUrl + '/compile', {latex: XELATEX_TEX, command: 'xelatex'}, TOKEN);
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.slice(0, 4), '%PDF');
    });

    it('compiles a multi-file project archive through the isolated job container', async function() {
        server = await helpers.spawnServer({LATEX_EXECUTOR: 'docker', LATEX_EXECUTOR_IMAGE: IMAGE});
        var tex = '\\documentclass{article}\n\\begin{document}\nIntro here.\n\\input{sections/intro.tex}\n\\end{document}\n';
        var tarPath = helpers.makeProjectTar({
            'main.tex': tex,
            'sections/intro.tex': '\\section{Introduction}\nProject body.\n',
        });
        var response = await helpers.httpPostMultipart(server.baseUrl + '/compile', tarPath, TOKEN, {entry: 'main.tex'});
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.slice(0, 4), '%PDF');
    });

    it('applies the full isolation policy on the ACTUAL running job container', async function() {
        server = await helpers.spawnServer({LATEX_EXECUTOR: 'docker', LATEX_EXECUTOR_IMAGE: IMAGE, LATEX_COMPILE_TIMEOUT_MS: '180000'});

        // A big xelatex document keeps the job container alive for several
        // seconds so it can be inspected while genuinely running.
        var tarPath = helpers.makeProjectTar({'main.tex': slowDocument(200000)});
        var compiling = helpers.httpPostMultipart(server.baseUrl + '/compile', tarPath, TOKEN,
            {entry: 'main.tex', command: 'xelatex'}, 180);

        var containerId = null;
        var deadline = Date.now() + 90000;
        while (Date.now() < deadline && !containerId) {
            var ids = await runningJobContainers();
            if (ids.length)
                containerId = ids[0];
            else
                await sleep(100);
        }
        assert.ok(containerId, 'a job container must be observable while a compile is genuinely running');
        assert.strictEqual((await runningJobContainers()).length, 1, 'only one job container should exist');

        var {stdout} = await execFile('docker', ['inspect', containerId]);
        var cfg = JSON.parse(stdout)[0];

        assert.notStrictEqual(cfg.Config.User, 'root', 'job must not run as root');
        assert.notStrictEqual(cfg.Config.User, '0', 'job must not run as root');
        assert.strictEqual(cfg.HostConfig.ReadonlyRootfs, true, 'root filesystem must be read-only');
        assert.ok(cfg.HostConfig.CapDrop.indexOf('ALL') !== -1, 'all capabilities must be dropped: ' + JSON.stringify(cfg.HostConfig.CapDrop));
        assert.strictEqual(cfg.HostConfig.NetworkMode, 'none', 'job must have no network');
        assert.ok(cfg.HostConfig.PidsLimit > 0, 'PID limit must be applied');
        assert.ok(cfg.HostConfig.Memory > 0, 'memory limit must be applied');
        assert.ok(cfg.HostConfig.MemorySwap > 0, 'memory-swap limit must be applied');
        assert.ok(cfg.HostConfig.MemorySwap === cfg.HostConfig.Memory, 'swap must match memory (no escaping swap)');
        assert.ok(cfg.HostConfig.Tmpfs && Object.keys(cfg.HostConfig.Tmpfs).indexOf('/tmp') !== -1,
            '/tmp must be an isolated tmpfs');
        assert.ok(/no-new-privileges/.test(JSON.stringify(cfg.HostConfig.SecurityOpt)), 'no-new-privileges must be set');

        var result = await compiling;
        assert.strictEqual(result.status, 200, 'the slow compilation must still succeed: ' + result.body.slice(0, 100));
        assert.strictEqual(result.body.slice(0, 4), '%PDF');
    });

    it('leaves no job containers behind (one-shot --rm cleanup and graceful shutdown)', async function() {
        server = await helpers.spawnServer({LATEX_EXECUTOR: 'docker', LATEX_EXECUTOR_IMAGE: IMAGE});
        var ok = await helpers.httpPostJson(server.baseUrl + '/compile', {latex: VALID_TEX}, TOKEN);
        assert.strictEqual(ok.status, 200);

        var exited = await server.stop();
        assert.strictEqual(exited.code, 0, 'server must exit 0 on SIGTERM: ' + exited.error);
        var remaining = await runningJobContainers();
        assert.deepEqual(remaining, [], 'no job containers may remain after shutdown');
    });
});