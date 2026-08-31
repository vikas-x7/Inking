var assert = require('assert');
var helpers = require('./http-helpers');

var httpPostJson = helpers.httpPostJson;

var AUTH = ['Authorization: Bearer test-internal-secret'];

// Sources are written so the reported line numbers are deterministic for the
// host TeX Live toolchain (verified against real compiler output).
var CASES = [
    {
        name: 'undefined control sequence',
        latex: '\\documentclass{article}\n\\begin{document}\n\nHello World.\n\n\\helloWorld\n\n\\end{document}\n',
        expected: {type: 'undefined_control_sequence', message: "Undefined command '\\helloWorld'.", line: 6},
    },
    {
        name: 'missing included file',
        latex: '\\documentclass{article}\n\\begin{document}\n\nSee \\input{chapter}.\n\n\\end{document}\n',
        expected: {type: 'missing_file', message: 'File "chapter.tex" not found.', line: 4},
    },
    {
        name: 'missing package',
        latex: '\\documentclass{article}\n\\usepackage{somepackage}\n\\begin{document}\nHi\n\\end{document}\n',
        expected: {type: 'missing_package', message: 'Package "somepackage" not found.', line: 3},
    },
    {
        name: 'missing math mode delimiter',
        latex: '\\documentclass{article}\n\\begin{document}\n\nPrice is $5 and it is great\n\n\\end{document}\n',
        expected: {type: 'math_error', message: 'A math-mode "$" delimiter is missing.', line: 5},
    },
    {
        name: 'extra closing brace',
        latex: '\\documentclass{article}\n\\begin{document}\n\nHello}\n\n\\end{document}\n',
        expected: {type: 'extra_brace', message: 'An extra closing brace "}" was detected.', line: 4},
    },
    {
        name: 'unclosed group (missing brace)',
        latex: '\\documentclass{article}\n\\begin{document}\n\n\\textbf{hello\n\n\\end{document}\n',
        expected: {type: 'missing_brace', message: 'A closing brace is missing for the command "\\textbf".', line: null},
    },
    {
        name: 'mismatched environments',
        latex: '\\documentclass{article}\n\\begin{document}\n\n\\begin{itemize}\nitem one\n\\end{enumerate}\n\n\\end{document}\n',
        expected: {
            type: 'environment_mismatch',
            message: 'Environment "itemize" was closed with "\\end{enumerate}".',
            line: 6,
        },
    },
    {
        name: 'undefined environment',
        latex: '\\documentclass{article}\n\\begin{document}\n\n\\begin{foo}\nhello\n\\end{foo}\n\n\\end{document}\n',
        expected: {type: 'undefined_environment', message: 'Environment "foo" is undefined.', line: 4},
    },
    {
        name: 'generic failure with a carried latexrun message',
        latex: '\\documentclass{article}\n\\begin{document}\nLiteral text here.\n',
        expected: {
            type: 'compilation_error',
            message: 'Emergency stop: job aborted, no legal \\end found.',
            line: null,
        },
    },
];

var VALID_TEX = '\\documentclass{article}\n\\begin{document}\nHello world.\n\\end{document}\n';

describe('Structured compilation errors', function() {
    this.timeout(180000);

    var server;
    before(async function() {
        server = await helpers.spawnServer();
    });
    after(async function() {
        if (server)
            await server.stop();
    });

    it('returns 200 and a real PDF for valid LaTeX', async function() {
        var response = await httpPostJson(server.baseUrl + '/compile', {latex: VALID_TEX}, AUTH);
        assert.strictEqual(response.status, 200, 'valid document must compile');
        assert.strictEqual(response.body.slice(0, 4), '%PDF', 'response must be a PDF');
    });

    for (var i = 0; i < CASES.length; i++) {
        (function(cas) {
            it('returns a structured ' + cas.expected.type + ' error for ' + cas.name, async function() {
                var response = await httpPostJson(server.baseUrl + '/compile', {latex: cas.latex}, AUTH);
                assert.strictEqual(response.status, 400, 'the broken document must fail with 400');
                assert.ok(response.body.charAt(0) === '{', 'failed compile must be JSON, got: ' + response.body.slice(0, 120));
                var json = JSON.parse(response.body);

                assert.strictEqual(json.success, false);
                assert.deepStrictEqual(Object.keys(json.error).sort(), ['column', 'file', 'line', 'message', 'type']);
                assert.strictEqual(json.error.type, cas.expected.type);
                assert.strictEqual(json.error.message, cas.expected.message);
                assert.strictEqual(json.error.file, 'main.tex', 'paths must be relative to the project root');
                assert.strictEqual(json.error.line, cas.expected.line);
                assert.strictEqual(json.error.column, null);

                assert.ok(typeof json.log === 'string' && json.log.length > 0, 'the raw log must be preserved');
                assert.ok(json.log.indexOf('error:') >= 0, 'log should contain the failing message');
                assert.ok(json.log.indexOf('not updated') >= 0, 'log should contain its summary tail');
            });
        })(CASES[i]);
    }
});

describe('Structured compilation errors with a small log limit', function() {
    this.timeout(180000);

    var server;
    before(async function() {
        server = await helpers.spawnServer({LATEX_MAX_LOG_SIZE: '2048'});
    });
    after(async function() {
        if (server)
            await server.stop();
    });

    it('still enforces the log-size limit instead of returning a JSON error', async function() {
        var manyErrors = '\\documentclass{article}\n\\begin{document}\n' +
            Array.from({length: 150}, (_, i) => '\\undefinedCmd' + i + ' text\n').join('') +
            '\\end{document}\n';
        var response = await httpPostJson(server.baseUrl + '/compile', {latex: manyErrors}, AUTH);
        assert.strictEqual(response.status, 400);
        assert.ok(response.body.charAt(0) !== '{', 'oversized log must stay a plain-text error, got: ' + response.body.slice(0, 120));
        assert.ok(/Compilation log exceeds the maximum allowed size \(2 KB\)/.test(response.body), response.body.slice(0, 200));
    });
});