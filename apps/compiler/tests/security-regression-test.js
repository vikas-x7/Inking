var assert = require('assert');
var childProcess = require('child_process');
var path = require('path');

var helpers = require('./http-helpers');
var spawnServer = helpers.spawnServer;
var httpPostJson = helpers.httpPostJson;
var httpPostMultipart = helpers.httpPostMultipart;
var makeProjectTar = helpers.makeProjectTar;

var VALID_TEX = '\\documentclass{article}\n\\begin{document}\nHello world.\n\\end{document}\n';
var TOKEN = ['Authorization: Bearer test-internal-secret'];

describe('Security regression', function() {
    this.timeout(180000);

    var server;
    afterEach(async function() {
        if (server)
            await server.stop();
        server = null;
    });

    it('refuses to start in production without a shared token (fail closed)', async function() {
        var port = 30000 + Math.floor(Math.random() * 20000);
        var child = childProcess.spawn('node', [path.join(helpers.repoRoot, 'app.js')], {
            cwd: helpers.repoRoot,
            env: Object.assign({}, process.env, {
                NODE_ENV: 'production',
                PORT: String(port),
                LATEX_EXECUTOR: 'none',
            }),
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        var captured = '';
        child.stdout.on('data', d => { captured += d; });
        child.stderr.on('data', d => { captured += d; });
        var code = await new Promise(resolve => child.on('exit', resolve));
        assert.strictEqual(code, 1, 'process must exit non-zero when the token is missing');
        assert.ok(/COMPILER_INTERNAL_TOKEN/.test(captured), 'output must explain the missing token: ' + captured);
    });

    it('rejects compilations with a 503 when storage is near-full', async function() {
        server = await spawnServer({LATEX_MIN_FREE_SPACE: '999999999999999'});
        var response = await httpPostJson(server.baseUrl + '/compile', {latex: VALID_TEX}, TOKEN);
        assert.strictEqual(response.status, 503);
        assert.strictEqual(response.body, 'Compiler storage is full, please retry later.');
        assert.ok(!/at \w+\.|at Object\./.test(response.body), 'no stack trace must leak');
    });

    it('rejects an oversized multipart upload at the HTTP layer before extraction', async function() {
        server = await spawnServer({LATEX_MAX_UPLOAD_SIZE: '2048'});
        var bigTex = 'x'.repeat(16 * 1024) + '\n';
        var tarPath = makeProjectTar({'main.tex': bigTex});
        var response = await httpPostMultipart(server.baseUrl + '/compile', tarPath, TOKEN);
        assert.strictEqual(response.status, 400);
        assert.strictEqual(response.body, 'ERROR: uploaded file exceeds the maximum allowed size.');
    });

    it('rejects an oversized JSON body with a controlled 413', async function() {
        server = await spawnServer({});
        var hugeLatex = 'x'.repeat(2 * 1024 * 1024);
        var response = await helpers.httpPostRawJson(server.baseUrl + '/compile',
            JSON.stringify({latex: hugeLatex}), TOKEN, 30);
        assert.strictEqual(response.status, 413);
        assert.strictEqual(response.body, 'ERROR: request body is too large.');
    });

    it('rejects an unsupported compiler command with a controlled 400', async function() {
        server = await spawnServer({});
        var response = await httpPostJson(server.baseUrl + '/compile', {latex: VALID_TEX, command: 'unknown-engine'}, TOKEN);
        assert.strictEqual(response.status, 400);
        assert.strictEqual(response.body, 'Unknown command: unknown-engine');
    });

    it('rejects a multipart upload without any file', async function() {
        server = await spawnServer({});
        var execFile = require('util').promisify(childProcess.execFile);
        var {stdout} = await execFile('curl', ['-s', '-m', '30', '-X', 'POST',
            '-F', 'entry=main.tex',
            '-H', 'Authorization: Bearer test-internal-secret',
            '-o', '-', '-w', '\n%{http_code}', server.baseUrl + '/compile']);
        var lines = stdout.trim().split('\n');
        var status = Number(lines[lines.length - 1]);
        var body = lines.slice(0, -1).join('\n');
        assert.strictEqual(status, 400);
        assert.strictEqual(body, 'ERROR: files are not uploaded to server.');
    });
});