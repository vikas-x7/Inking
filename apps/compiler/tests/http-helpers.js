var assert = require('assert');
var childProcess = require('child_process');
var fs = require('fs');
var os = require('os');
var path = require('path');
var util = require('util');

var execFile = util.promisify(childProcess.execFile);
var repoRoot = path.join(__dirname, '..');

/**
 * Spawns the compiler service on an ephemeral port with retries.
 *
 * @param {Object=} envOverrides
 * @param {number=} timeoutMs
 */
function spawnServer(envOverrides, timeoutMs) {
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

/**
 * Performs an HTTP request with curl and returns {status, body, headers}.
 */
async function httpGet(url, args, timeoutSec) {
    args = args || [];
    var out = path.join(os.tmpdir(), 'curl-out-' + Math.random().toString(16).slice(2));
    var {stdout} = await execFile('curl', ['-s', '-m', String(timeoutSec || 60), '-o', out, '-D', out + '.h', '-w', '%{http_code}', ...args, url]);
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

async function httpPostJson(url, json, headers, timeoutSec) {
    var args = ['-s', '-m', String(timeoutSec || 60), '-X', 'POST', '-H', 'Content-Type: application/json', '-d', JSON.stringify(json)];
    for (var h of headers || [])
        args.push('-H', h);
    return httpGet(url, args);
}

function makeProjectTar(files, opts) {
    var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'proj-'));
    var top = opts && opts.flattenToRoot === false ? path.join(dir, 'root') : dir;
    if (top !== dir)
        fs.mkdirSync(top, {recursive: true});
    if (!files) {
        files = {'main.tex': '\\documentclass{article}\n\\begin{document}\nHello world.\n\\end{document}\n'};
    }
    for (var name of Object.keys(files)) {
        var target = path.join(top, name);
        fs.mkdirSync(path.dirname(target), {recursive: true});
        fs.writeFileSync(target, files[name]);
    }
    var tarPath = path.join(os.tmpdir(), 'proj-' + Math.random().toString(16).slice(2) + '.tar');
    childProcess.execSync('cd "' + top + '" && tar -cf "' + tarPath + '" .');
    return tarPath;
}

async function httpPostMultipart(url, tarPath, headers, fields, timeoutSec) {
    fields = fields || {entry: 'main.tex'};
    var args = ['-s', '-m', String(timeoutSec || 90), '-X', 'POST', '-F', 'file=@' + tarPath];
    for (var f of Object.keys(fields))
        args.push('-F', f + '=' + fields[f]);
    for (var h of headers || [])
        args.push('-H', h);
    return httpGet(url, args, timeoutSec);
}

/**
 * POSTs a JSON body from a temporary file (avoids ARG_MAX limits for
 * large payloads on the curl command line).
 */
async function httpPostRawJson(url, jsonString, headers, timeoutSec) {
    var dataFile = path.join(os.tmpdir(), 'curl-body-' + Math.random().toString(16).slice(2) + '.json');
    fs.writeFileSync(dataFile, jsonString);
    var args = ['-s', '-m', String(timeoutSec || 60), '-X', 'POST', '--data-binary', '@' + dataFile, '-H', 'Content-Type: application/json'];
    for (var h of headers || [])
        args.push('-H', h);
    try {
        return await httpGet(url, args, timeoutSec);
    } finally {
        try { fs.unlinkSync(dataFile); } catch (e) { /* ignore */ }
    }
}

function isPdf(body) {
    return body.slice(0, 4) === '%PDF';
}

module.exports = {
    spawnServer: spawnServer,
    httpGet: httpGet,
    httpPostJson: httpPostJson,
    httpPostRawJson: httpPostRawJson,
    httpPostMultipart: httpPostMultipart,
    makeProjectTar: makeProjectTar,
    isPdf: isPdf,
    repoRoot: repoRoot,
};