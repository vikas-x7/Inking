var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');
var util = require('util');
var Compilation = require('../lib/Compilation');
var CompilationRequest = require('../lib/CompilationRequest');

var execFile = util.promisify(require('child_process').execFile);

var VALID_TEX = '\\documentclass{article}\n\\begin{document}\nHello world.\n\\end{document}\n';
var XELATEX_TEX = '\\documentclass{article}\n\\usepackage{fontspec}\n\\begin{document}\nHello XeLaTeX\n\\end{document}\n';
var FONTS_TEX = '\\documentclass{article}\n\\usepackage{fontspec}\n\\setmainfont{Latin Modern Roman}\n\\begin{document}\nHello XeLaTeX\n\\end{document}\n';

function makeWorkdir(files) {
    var workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'engine-'));
    for (var name of Object.keys(files)) {
        var target = path.join(workdir, name);
        fs.mkdirSync(path.dirname(target), {recursive: true});
        fs.writeFileSync(target, files[name]);
    }
    return workdir;
}

function makeCompilation(workdir, target, command) {
    var resultsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'engres-'));
    var request = new CompilationRequest('eng' + Math.random().toString(16).slice(2), target, command, '');
    var downloader = {
        downloadIfNeeded: async () => ({folderPath: workdir, userError: null}),
        dispose: () => {},
    };
    return new Compilation(request, downloader, resultsDir, {});
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

async function dockerImageAvailable() {
    try {
        await execFile('docker', ['image', 'inspect', 'latex-online:biblatex-fixed']);
        return true;
    } catch (e) {
        return false;
    }
}

function assertValidPdf(compilation) {
    assert.strictEqual(compilation.success, true, 'compilation should succeed: ' + (compilation.userError || ''));
    assert.ok(compilation.outputPath, 'output path must be set');
    var pdf = fs.readFileSync(compilation.outputPath());
    assert.strictEqual(pdf.slice(0, 4).toString(), '%PDF', 'output must be a real PDF file');
    assert.ok(pdf.length > 100, 'PDF must be non-trivial in size');
}

describe('LaTeX engine compilations', function() {
    this.timeout(180000);

    it('compiles a minimal document with pdflatex', async function() {
        var workdir = makeWorkdir({'main.tex': VALID_TEX});
        var result = await makeCompilation(workdir, 'main.tex', 'pdflatex').run();
        assertValidPdf(result);
    });

    it('compiles a minimal document with lualatex', async function() {
        var workdir = makeWorkdir({'main.tex': VALID_TEX});
        var result = await makeCompilation(workdir, 'main.tex', 'lualatex').run();
        assertValidPdf(result);
    });

    it('reports a user error for invalid LaTeX source', async function() {
        var bad = '\\documentclass{article}\n\\begin{document}\n\\UNDEFINEDCMDXX{broken}\n\\end{document}\n';
        var workdir = makeWorkdir({'main.tex': bad});
        var result = await makeCompilation(workdir, 'main.tex', 'pdflatex').run();
        assert.strictEqual(result.success, false, 'invalid document must fail');
        assert.ok(result.logBytes > 0, 'a TeX log must be produced for diagnosis');
        assert.ok(!fs.existsSync(result.outputPath()), 'no PDF may be produced');
    });

    it('compiles a multi-file project (\input of a section) with pdflatex', async function() {
        var tex = '\\documentclass{article}\n\\begin{document}\nIntro here.\n\\input{sections/intro.tex}\n\\end{document}\n';
        var workdir = makeWorkdir({
            'main.tex': tex,
            'sections/intro.tex': '\\section{Introduction}\nBody text.\n',
        });
        var result = await makeCompilation(workdir, 'main.tex', 'pdflatex').run();
        assertValidPdf(result);
    });

    describe('xelatex (DockerExecutor, production path)', function() {
        before(async function() {
            if (!(await dockerImageAvailable()))
                this.skip();
        });

        it('compiles a fontspec document with xelatex and produces a real PDF', async function() {
            var workdir = makeWorkdir({'main.tex': XELATEX_TEX});
            var result = await withEnv('LATEX_EXECUTOR', 'docker', () =>
                makeCompilation(workdir, 'main.tex', 'xelatex').run());
            assertValidPdf(result);
        });

        it('compiles a document with an explicit system font via xelatex', async function() {
            var workdir = makeWorkdir({'main.tex': FONTS_TEX});
            var result = await withEnv('LATEX_EXECUTOR', 'docker', () =>
                makeCompilation(workdir, 'main.tex', 'xelatex').run());
            assertValidPdf(result);
        });
    });
});