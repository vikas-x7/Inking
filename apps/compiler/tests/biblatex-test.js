var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');
var util = require('util');
var Compilation = require('../lib/Compilation');
var CompilationRequest = require('../lib/CompilationRequest');
var helpers = require('./http-helpers');

var execFile = util.promisify(require('child_process').execFile);

var AUTH = ['Authorization: Bearer test-internal-secret'];

var BIBLATEX_TEX = [
    '\\documentclass{article}',
    '\\usepackage[backend=biber]{biblatex}',
    '\\addbibresource{references.bib}',
    '',
    '\\begin{document}',
    'Hello from biblatex.',
    '',
    '\\cite{test}',
    '',
    '\\printbibliography',
    '\\end{document}',
    '',
].join('\n');

var REFERENCES_BIB = [
    '@article{test,',
    '  author  = {John Doe},',
    '  title   = {Test Article},',
    '  journal = {Test Journal},',
    '  year    = {2024}',
    '}',
].join('\n');

var VALID_TEX = '\\documentclass{article}\n\\begin{document}\nHello world.\n\\end{document}\n';

function makeWorkdir(files) {
    var workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'biblatex-'));
    for (var name of Object.keys(files)) {
        var target = path.join(workdir, name);
        fs.mkdirSync(path.dirname(target), {recursive: true});
        fs.writeFileSync(target, files[name]);
    }
    return workdir;
}

function makeCompilation(workdir, target, command) {
    var resultsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bibres-'));
    var request = new CompilationRequest('bib' + Math.random().toString(16).slice(2), target, command, '');
    var downloader = {
        downloadIfNeeded: async () => ({folderPath: workdir, userError: null}),
        dispose: () => {},
    };
    return new Compilation(request, downloader, resultsDir, {});
}

async function toolsAvailable() {
    try {
        await execFile('bash', ['-c', 'kpsewhich biblatex.sty && command -v biber']);
        return true;
    } catch (e) {
        return false;
    }
}

describe('biblatex + biber support', function() {
    this.timeout(180000);

    before(async function() {
        if (!(await toolsAvailable())) {
            // The production image installs texlive-bibtex-extra + biber; these
            // cases are exercised against the image (see the Docker run step).
            this.skip();
        }
    });

    it('compiles a biblatex document through the multi-pass biber flow and produces a real PDF', async function() {
        var workdir = makeWorkdir({'main.tex': BIBLATEX_TEX, 'references.bib': REFERENCES_BIB});
        var result = await makeCompilation(workdir, 'main.tex', 'pdflatex').run();

        assert.strictEqual(result.success, true, 'biblatex + biber document must compile: ' + (result.userError || ''));
        assert.ok(result.outputPath(), 'output path must be set');
        var pdf = fs.readFileSync(result.outputPath());
        assert.strictEqual(pdf.slice(0, 4).toString(), '%PDF', 'output must be a real PDF file');

        // latexrun logs every tool invocation (--verbose-cmd); a biblatex
        // compile must run biber between the pdflatex passes.
        var log = fs.readFileSync(result.logPath(), 'utf8');
        assert.ok(/biber\b/.test(log), 'the log must show the biber pass, got: ' + log.slice(0, 400));
        assert.ok(log.indexOf('error:') === -1, 'a successful biblatex compile must be error-free');
    });

    it('keeps compiling documents without a bibliography using the bibtex flow', async function() {
        var workdir = makeWorkdir({'main.tex': VALID_TEX});
        var result = await makeCompilation(workdir, 'main.tex', 'pdflatex').run();

        assert.strictEqual(result.success, true, 'plain LaTeX must still compile: ' + (result.userError || ''));
        var pdf = fs.readFileSync(result.outputPath());
        assert.strictEqual(pdf.slice(0, 4).toString(), '%PDF');
        var log = fs.readFileSync(result.logPath(), 'utf8');
        assert.ok(!/biber\b/.test(log), 'documents without biblatex must not invoke biber');
    });

    describe('structured errors over the HTTP API', function() {
        var server;
        before(async function() {
            server = await helpers.spawnServer();
        });
        after(async function() {
            if (server)
                await server.stop();
        });

        it('returns a 200 PDF for a valid biblatex project archive', async function() {
            var tarPath = helpers.makeProjectTar({'main.tex': BIBLATEX_TEX, 'references.bib': REFERENCES_BIB});
            try {
                var response = await helpers.httpPostMultipart(server.baseUrl + '/compile', tarPath, AUTH, {entry: 'main.tex'});
                assert.strictEqual(response.status, 200);
                assert.strictEqual(response.body.slice(0, 4), '%PDF');
            } finally {
                try { fs.unlinkSync(tarPath); } catch (e) { /* already gone */ }
            }
        });

        it('returns a clear error when references.bib is missing from the project', async function() {
            var tarPath = helpers.makeProjectTar({'main.tex': BIBLATEX_TEX});
            try {
                var response = await helpers.httpPostMultipart(server.baseUrl + '/compile', tarPath, AUTH, {entry: 'main.tex'});
                assert.strictEqual(response.status, 400);
                var json = JSON.parse(response.body);
                assert.strictEqual(json.success, false);
                assert.strictEqual(json.error.type, 'missing_bib_file');
                assert.strictEqual(json.error.message, 'Bibliography database "references.bib" not found.');
                assert.ok(typeof json.log === 'string' && json.log.length > 0, 'the raw log must be preserved');
            } finally {
                try { fs.unlinkSync(tarPath); } catch (e) { /* already gone */ }
            }
        });

        it('returns a clear error when the bibliography file is malformed', async function() {
            var malformed = '@article{test,\n  author  = {John Doe,\n  title   = {Test Article},\n';
            var tarPath = helpers.makeProjectTar({'main.tex': BIBLATEX_TEX, 'references.bib': malformed});
            try {
                var response = await helpers.httpPostMultipart(server.baseUrl + '/compile', tarPath, AUTH, {entry: 'main.tex'});
                assert.strictEqual(response.status, 400);
                var json = JSON.parse(response.body);
                assert.strictEqual(json.success, false);
                assert.strictEqual(json.error.type, 'bibliography_error');
                assert.ok(json.error.message && json.error.message.length > 0, 'the error must carry biber\'s message');
            } finally {
                try { fs.unlinkSync(tarPath); } catch (e) { /* already gone */ }
            }
        });
    });
});