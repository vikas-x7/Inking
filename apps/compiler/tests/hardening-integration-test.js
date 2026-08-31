var assert = require('assert');
var childProcess = require('child_process');
var fs = require('fs');
var os = require('os');
var path = require('path');
var util = require('util');

var execFile = util.promisify(childProcess.execFile);
var repoRoot = path.join(__dirname, '..');

var VALID_TEX = '\\documentclass{article}\n\\begin{document}\nHello world.\n\\end{document}\n';

function spawnServer(envOverrides, timeoutMs) {
    // Retries help avoid rare TIME_WAIT collisions in the ephemeral port range.
    return spawnServerAttempt(envOverrides, timeoutMs, 5);
}

function spawnServerAttempt(envOverrides, timeoutMs, remaining) {
    timeoutMs = timeoutMs || 30000;
    var port = 30000 + Math.floor(Math.random() * 20000);
    var env = Object.assign({}, process.env, {
        PORT: String(port),
        NODE_ENV: 'development',
        COMPILER_INTERNAL_TOKEN: 'test-internal-secret',
        LATEX_MAX_CONCURRENT_COMPILATIONS: '4',
    }, envOverrides);
    var child = childProcess.spawn('node', [path.join(repoRoot, 'app.js')], {
        cwd: repoRoot,
        env: env,
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    var logs = {stdout: '', stderr: ''};
    child.stdout.on('data', d => { logs.stdout += d; });
    child.stderr.on('data', d => { logs.stderr += d; });

    var baseUrl = 'http://localhost:' + port;
    var deadline = Date.now() + timeoutMs;
    var waitForHealth = new Promise((resolve, reject) => {
        (function poll() {
            childProcess.exec('curl -s -o /dev/null -w "%{http_code}" -m 2 ' + baseUrl + '/health.json', (err, stdout) => {
                if (child.exitCode !== null)
                    return reject(new Error('server exited early: ' + logs.stderr));
                if (!err && stdout.trim() === '200')
                    return resolve();
                if (Date.now() > deadline)
                    return reject(new Error('server did not become ready in time: ' + logs.stderr));
                setTimeout(poll, 150);
            });
        })();
    });

    var stopped = null;
    var stop = () => {
        if (stopped)
            return stopped;
        stopped = new Promise(resolve => {
            var timer = setTimeout(() => {
                try { child.kill('SIGKILL'); } catch (e) { /* already gone */ }
            }, 15000);
            child.once('exit', (code) => {
                clearTimeout(timer);
                resolve({code: code, error: logs.stderr});
            });
            try { child.kill('SIGTERM'); } catch (e) { resolve({code: child.exitCode}); }
        });
        return stopped;
    };

    return waitForHealth.then(() => {
        return {baseUrl: baseUrl, child: child, logs: logs, waitForHealth: waitForHealth, stop: stop};
    }).catch(e => {
        if (remaining <= 1) {
            try { child.kill('SIGKILL'); } catch (_) { /* already gone */ }
            throw e;
        }
        try { child.kill('SIGKILL'); } catch (_) { /* already gone */ }
        return spawnServerAttempt(envOverrides, timeoutMs, remaining - 1);
    });
}

async function httpGet(url, args) {
    args = args || [];
    var out = path.join(os.tmpdir(), 'curl-out-' + Math.random().toString(16).slice(2));
    var {stdout} = await execFile('curl', ['-s', '-m', '60', '-o', out, '-w', '%{http_code}', ...args, url]);
    var status = Number(stdout.trim());
    var body = '';
    try {
        body = fs.readFileSync(out, 'utf8');
    } catch (e) {
        // empty response
    }
    try { fs.unlinkSync(out); } catch (e) { /* ignore */ }
    return {status: status, body: body};
}

async function httpPostJson(url, json, headers) {
    var args = ['-s', '-m', '60', '-X', 'POST', '-H', 'Content-Type: application/json', '-d', JSON.stringify(json)];
    for (var h of headers || [])
        args.push('-H', h);
    return httpGet(url, args);
}

function makeProjectTar() {
    var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'proj-'));
    fs.writeFileSync(path.join(dir, 'main.tex'), VALID_TEX);
    var tarPath = path.join(os.tmpdir(), 'proj-' + Math.random().toString(16).slice(2) + '.tar');
    childProcess.execSync('cd "' + dir + '" && tar -cf "' + tarPath + '" main.tex');
    return tarPath;
}

async function httpPostMultipart(url, tarPath, headers) {
    var args = ['-s', '-m', '90', '-X', 'POST', '-F', 'file=@' + tarPath, '-F', 'entry=main.tex'];
    for (var h of headers || [])
        args.push('-H', h);
    return httpGet(url, args);
}

describe('Hardened HTTP service (integration)', function() {
    this.timeout(180000);

    var server;

    afterEach(async function() {
        if (server)
            await server.stop();
        server = null;
    });

    describe('authentication gates', function() {
        it('requires the shared token on compilation endpoints', async function() {
            server = await spawnServer({});

            // Open endpoints stay open (monitoring).
            var health = await httpGet(server.baseUrl + '/health.json');
            assert.strictEqual(health.status, 200);
            assert.ok(/capacity/.test(health.body));

            // No token -> denied, controlled body, no stack trace.
            var denied = await httpPostJson(server.baseUrl + '/compile', {latex: VALID_TEX});
            assert.strictEqual(denied.status, 401);
            assert.strictEqual(denied.body, 'Unauthorized');

            // Wrong token -> denied.
            var wrong = await httpPostJson(server.baseUrl + '/compile', {latex: VALID_TEX}, ['Authorization: Bearer bogus-secret']);
            assert.strictEqual(wrong.status, 401);
            assert.strictEqual(wrong.body, 'Unauthorized');

            // GET /compile, POST /data are gated too.
            var getDenied = await httpGet(server.baseUrl + '/compile?text=' + encodeURIComponent(VALID_TEX) + '&command=pdflatex');
            assert.strictEqual(getDenied.status, 401);
            var dataDenied = await httpPostMultipart(server.baseUrl + '/data', makeProjectTar());
            assert.strictEqual(dataDenied.status, 401);
        });

        it('accepts the shared token and compiles successfully', async function() {
            server = await spawnServer({});

            var head = ['Authorization: Bearer test-internal-secret'];

            var json = await httpPostJson(server.baseUrl + '/compile', {latex: VALID_TEX}, head);
            assert.strictEqual(json.status, 200);
            assert.ok(Buffer.byteLength(json.body) > 0, 'a non-empty response is expected');

            var multipart = await httpPostMultipart(server.baseUrl + '/compile', makeProjectTar(), head);
            assert.strictEqual(multipart.status, 200);
            assert.strictEqual(multipart.body.slice(0, 4), '%PDF');

            var dataUpload = await httpPostMultipart(server.baseUrl + '/data', makeProjectTar(), head);
            assert.strictEqual(dataUpload.status, 200);
            assert.strictEqual(dataUpload.body.slice(0, 4), '%PDF');

            var get = await httpGet(server.baseUrl + '/compile?text=' + encodeURIComponent(VALID_TEX) + '&command=pdflatex&download=result.pdf', ['-H', 'Authorization: Bearer test-internal-secret']);
            assert.strictEqual(get.status, 200);
            assert.strictEqual(get.body.slice(0, 4), '%PDF');
        });

        it('serves busy jobs with a controlled 503 body', async function() {
            // Two distinct documents share the single slot; one must be busy.
            server = await spawnServer({LATEX_MAX_CONCURRENT_COMPILATIONS: '1'});
            var head = ['Authorization: Bearer test-internal-secret'];
            var texA = VALID_TEX.replace('Hello world', 'AAAAAAAA unique A');
            var texB = VALID_TEX.replace('Hello world', 'BBBBBBBB unique B');

            var results = await Promise.all([
                httpPostJson(server.baseUrl + '/compile', {latex: texA}, head),
                httpPostJson(server.baseUrl + '/compile', {latex: texB}, head),
            ]);

            var statuses = results.map(r => r.status).sort();
            assert.deepEqual(statuses, [200, 503], 'exactly one job must be served and one rejected');
            var busy = results.find(r => r.status === 503);
            assert.strictEqual(busy.body, 'Compiler is busy, please retry later.');

            // Once the first job completes, the next one is served again.
            var later = await httpPostJson(server.baseUrl + '/compile', {latex: texB}, head);
            assert.strictEqual(later.status, 200);
        });
    });

    describe('size limits over HTTP', function() {
        it('rejects an output above the limit with a controlled error', async function() {
            server = await spawnServer({LATEX_MAX_OUTPUT_SIZE: '1024'});

            var head = ['Authorization: Bearer test-internal-secret'];
            var response = await httpPostJson(server.baseUrl + '/compile', {latex: VALID_TEX}, head);

            assert.strictEqual(response.status, 400);
            assert.ok(/Compilation output exceeds the maximum allowed size/.test(response.body), response.body);
            assert.ok(!/at \w+\.|at Object\./.test(response.body), 'no stack trace must leak');
        });
    });

    describe('graceful shutdown', function() {
        it('exits cleanly on SIGTERM with no orphaned compiler processes', async function() {
            server = await spawnServer({});

            var head = ['Authorization: Bearer test-internal-secret'];
            var ok = await httpPostJson(server.baseUrl + '/compile', {latex: VALID_TEX}, head);
            assert.strictEqual(ok.status, 200);

            var before = childProcess.execSync("ps -eo pid,args | grep -E 'latexrun|pdflatex' | grep -v grep | awk '{print $1}'", {encoding: 'utf8'}).trim().split('\n').filter(x => x);

            var result = await server.stop();
            assert.strictEqual(result.code, 0, 'graceful shutdown must exit 0: ' + result.error);

            var after = childProcess.execSync("ps -eo pid,args | grep -E 'latexrun|pdflatex' | grep -v grep | awk '{print $1}'", {encoding: 'utf8'}).trim().split('\n').filter(x => x);
            var leaked = after.filter(pid => before.indexOf(pid) === -1);
            assert.deepEqual(leaked, [], 'no orphaned compiler processes may remain after shutdown');
        });
    });
});