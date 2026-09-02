var assert = require('assert');
var childProcess = require('child_process');
var fs = require('fs');
var os = require('os');
var path = require('path');
var util = require('util');

var helpers = require('./http-helpers');
var config = require('../lib/config');
var Compilation = require('../lib/Compilation');
var NativeExecutor = require('../lib/NativeExecutor');
var parseRawLog = require('../lib/ErrorParser');

var execFile = util.promisify(childProcess.execFile);

var AUTH = ['Authorization: Bearer test-internal-secret'];

var VALID_TEX = '\\documentclass{article}\n\\begin{document}\nHello world.\n\\end{document}\n';
var INVALID_TEX = '\\documentclass{article}\n\\begin{document}\n\n\\helloWorld\n\n\\end{document}\n';
var REF_TEX = '\\documentclass{article}\n\\begin{document}\n\n\\section{One}\nSee section \\ref{sec:two}.\n\n\\section{Two}\\label{sec:two}\n\n\\end{document}\n';

async function pdflatexAvailable() {
    try {
        await execFile('pdflatex', ['--version']);
        return true;
    } catch (e) {
        return false;
    }
}

describe('native executor configuration', function() {
    var savedEnv = {};

    beforeEach(function() {
        savedEnv.LATEX_EXECUTOR = process.env.LATEX_EXECUTOR;
        savedEnv.NODE_ENV = process.env.NODE_ENV;
        savedEnv.LATEX_MAX_PASSES = process.env.LATEX_MAX_PASSES;
    });

    afterEach(function() {
        restore();
    });

    function restore() {
        for (var key of Object.keys(savedEnv)) {
            if (savedEnv[key] === undefined)
                delete process.env[key];
            else
                process.env[key] = savedEnv[key];
        }
    }

    it('selects the native executor when LATEX_EXECUTOR=native', function() {
        process.env.LATEX_EXECUTOR = 'native';
        assert.strictEqual(config.executor(), 'native');
    });

    it('defaults to native in production when unset', function() {
        delete process.env.LATEX_EXECUTOR;
        process.env.NODE_ENV = 'production';
        assert.strictEqual(config.executor(), 'native');
    });

    it('defaults to the latexrun pipeline in development when unset', function() {
        delete process.env.LATEX_EXECUTOR;
        process.env.NODE_ENV = 'development';
        assert.strictEqual(config.executor(), 'none');
    });

    it('ignores unknown executor values', function() {
        process.env.LATEX_EXECUTOR = 'powershell';
        assert.strictEqual(config.executor(), 'none');
    });

    it('reads LATEX_MAX_PASSES', function() {
        process.env.LATEX_MAX_PASSES = '5';
        assert.strictEqual(config.maxPasses(), 5);
        delete process.env.LATEX_MAX_PASSES;
        assert.strictEqual(config.maxPasses(), 3);
    });

    it('Compilation picks the NativeExecutor for the native strategy', function() {
        process.env.LATEX_EXECUTOR = 'native';
        var compilation = new Compilation({fingerprint: 'x', command: 'pdflatex'}, {}, os.tmpdir());
        assert(compilation._executor() instanceof NativeExecutor);
    });

    it('rejects unknown engines without spawning any process', async function() {
        var logPath = path.join(os.tmpdir(), 'native-executor-' + Math.random().toString(16).slice(2) + '.log');
        fs.writeFileSync(logPath, '');
        var executor = new NativeExecutor();
        var result = await executor.start('/tmp', '/tmp/main.tex', 'sh', '/tmp/output.pdf', logPath).done;
        assert.strictEqual(result.exitOk, false);
        assert(/unsupported compiler command/.test(fs.readFileSync(logPath, 'utf8')));
        fs.unlinkSync(logPath);
    });

    it('picks biber for biblatex documents and bibtex otherwise', function() {
        var executor = new NativeExecutor();
        var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'native-bib-'));
        fs.writeFileSync(path.join(dir, 'a.tex'), '\\documentclass{article}\n\\usepackage{biblatex}\n\\begin{document}\n\\end{document}\n');
        fs.writeFileSync(path.join(dir, 'b.tex'), '\\documentclass{article}\n\\usepackage[backend=bibtex]{biblatex}\n\\begin{document}\n\\end{document}\n');
        var auxDir = path.join(dir, 'out');
        fs.mkdirSync(auxDir);
        fs.writeFileSync(path.join(auxDir, 'output.aux'), '\\citation{knuth}\n\\bibdata{refs}\n');
        fs.writeFileSync(path.join(auxDir, 'output.bcf'), '<bcf>\\citation{knuth}</bcf>');

        assert.strictEqual(executor._bibliographyTool(dir, 'a.tex', auxDir), 'biber');
        assert.strictEqual(executor._bibliographyTool(dir, 'b.tex', auxDir), 'bibtex');
        // The API hands over an absolute target path; never re-join it.
        assert.strictEqual(executor._bibliographyTool(dir, path.join(dir, 'a.tex'), auxDir), 'biber');
        // No auxiliary bibliography request, no tool.
        fs.writeFileSync(path.join(auxDir, 'output.aux'), '\\relax\n');
        assert.strictEqual(executor._bibliographyTool(dir, 'a.tex', auxDir), null);
        // biblatex writes abx@aux@cite markers into the aux (not \citation).
        fs.writeFileSync(path.join(auxDir, 'output.aux'), '\\relax\n\\abx@aux@cite{0}{knuth}\n\\abx@aux@read@bblrerun\n');
        assert.strictEqual(executor._bibliographyTool(dir, 'a.tex', auxDir), 'biber');
        fs.rmSync(dir, {recursive: true, force: true});
    });
});

describe('native executor integration (pdflatex)', function() {
    this.timeout(180000);

    var server;
    before(async function() {
        if (!(await pdflatexAvailable()))
            this.skip();
    });

    beforeEach(async function() {
        server = await helpers.spawnServer({LATEX_EXECUTOR: 'native'});
    });

    afterEach(async function() {
        if (server) {
            await server.stop();
            server = null;
        }
    });

    it('compiles a document directly to a PDF', async function() {
        var res = await helpers.httpPostJson(server.baseUrl + '/compile', {latex: VALID_TEX, command: 'pdflatex'}, AUTH);
        assert.strictEqual(res.status, 200);
        assert(helpers.isPdf(res.body), 'response body should be a PDF, got: ' + res.body.slice(0, 20));
        assert(res.body.length > 1000, 'PDF should be non-trivial');
    });

    it('resolves cross-references across passes', async function() {
        var res = await helpers.httpPostJson(server.baseUrl + '/compile', {latex: REF_TEX, command: 'pdflatex'}, AUTH);
        assert.strictEqual(res.status, 200);
        assert(helpers.isPdf(res.body));
    });

    it('returns a structured, machine-readable error for invalid LaTeX', async function() {
        var res = await helpers.httpPostJson(server.baseUrl + '/compile', {latex: INVALID_TEX, command: 'pdflatex'}, AUTH);
        assert.strictEqual(res.status, 400);
        var parsed = JSON.parse(res.body);
        assert.strictEqual(parsed.success, false);
        assert.strictEqual(parsed.error.type, 'undefined_control_sequence');
        assert(/helloWorld/.test(parsed.error.message));
        assert(/main\.tex/.test(parsed.error.file));
        assert(typeof parsed.error.line === 'number');
        assert(parsed.log && /Undefined control sequence/.test(parsed.log));
    });

    it('rejects requests without a latex source', async function() {
        var res = await helpers.httpPostJson(server.baseUrl + '/compile', {}, AUTH);
        assert.strictEqual(res.status, 400);
        assert(/latex source is required/.test(res.body));
    });

    it('rejects unauthenticated requests', async function() {
        var res = await helpers.httpPostJson(server.baseUrl + '/compile', {latex: VALID_TEX, command: 'pdflatex'}, []);
        assert.strictEqual(res.status, 401);
    });

    it('releases concurrency slots after a run (workdir cleanup path)', async function() {
        await helpers.httpPostJson(server.baseUrl + '/compile', {latex: VALID_TEX, command: 'pdflatex'}, AUTH);
        var health = JSON.parse((await helpers.httpGet(server.baseUrl + '/health.json')).body);
        assert.strictEqual(health.capacity.inflightCompilations, 0);
    });
});