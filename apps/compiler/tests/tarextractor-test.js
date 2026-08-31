var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');
var TarExtractor = require('../lib/TarExtractor');

function octStr(value, length) {
    var s = value.toString(8);
    while (s.length < length)
        s = '0' + s;
    return s;
}

function writeStr(block, text, offset, length) {
    var bytes = Buffer.from(text, 'utf8');
    for (var i = 0; i < length; ++i) {
        block[offset + i] = i < bytes.length ? bytes[i] : 0;
    }
}

function makeHeader(name, options) {
    var opts = Object.assign({typeByte: 48, size: 0, mode: 0o644, linkname: ''}, options);
    var block = Buffer.alloc(512);
    writeStr(block, name, 0, 100);
    writeStr(block, octStr(opts.mode, 7) + ' ', 100, 8);
    writeStr(block, '0000000', 108, 8);
    writeStr(block, '0000000', 116, 8);
    writeStr(block, octStr(opts.size, 11) + ' ', 124, 12);
    writeStr(block, '00000000000', 136, 12);
    block[156] = opts.typeByte;
    writeStr(block, opts.linkname, 157, 100);
    writeStr(block, 'ustar\0' + '00', 257, 8);
    var blank = Buffer.from(block);
    for (var i = 148; i < 156; ++i)
        blank[i] = 0x20;
    var sum = 0;
    for (var j = 0; j < blank.length; ++j)
        sum += blank[j];
    writeStr(block, octStr(sum, 6) + '\0 ', 148, 8);
    return block;
}

function makeTar(entries) {
    var blocks = [];
    for (var entry of entries) {
        if (entry.type === 'dir') {
            blocks.push(makeHeader(entry.name, {typeByte: 53, mode: 0o755}));
        } else if (entry.type === 'symlink') {
            blocks.push(makeHeader(entry.name, {typeByte: 50, linkname: entry.linkname}));
        } else if (entry.type === 'hardlink') {
            blocks.push(makeHeader(entry.name, {typeByte: 49, linkname: entry.linkname}));
        } else {
            var data = Buffer.isBuffer(entry.content) ? entry.content : Buffer.from(entry.content || '', 'utf8');
            blocks.push(makeHeader(entry.name, {typeByte: 48, size: data.length, mode: 0o644}));
            blocks.push(data);
            var pad = (512 - (data.length % 512)) % 512;
            if (pad)
                blocks.push(Buffer.alloc(pad));
        }
    }
    blocks.push(Buffer.alloc(1024));
    return Buffer.concat(blocks);
}

async function extract(tarBuffer, options) {
    var workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tarext-'));
    var archivePath = path.join(workDir, 'archive.tar');
    var destDir = path.join(workDir, 'out');
    fs.writeFileSync(archivePath, tarBuffer);
    try {
        await TarExtractor.extractArchive(archivePath, destDir, options);
        return destDir;
    } catch (e) {
        try {
            fs.rmdirSync(workDir, {recursive: true});
        } catch (ignored) {
        }
        throw e;
    }
}

function listFiles(dir) {
    var result = [];
    function walk(current) {
        for (var entry of fs.readdirSync(current, {withFileTypes: true})) {
            var child = path.join(current, entry.name);
            if (entry.isDirectory()) {
                walk(child);
            } else {
                result.push(child);
            }
        }
    }
    walk(dir);
    return result.sort();
}

describe('TarExtractor', function() {
    this.timeout(30000);

    describe('valid archives', function() {
        it('extracts main.tex, nested sections, and an image without corruption', async function() {
            var png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01, 0x02, 0x03, 0xff, 0xfe]);
            var tar = makeTar([
                {name: 'main.tex', content: '\\documentclass{article}'},
                {name: 'sections/', type: 'dir'},
                {name: 'sections/intro.tex', content: '\\section{Intro}'},
                {name: 'images/', type: 'dir'},
                {name: 'images/test.png', content: png},
            ]);
            var dest = await extract(tar);
            assert.deepEqual(fs.readFileSync(path.join(dest, 'main.tex'), 'utf8'), '\\documentclass{article}');
            assert.deepEqual(fs.readFileSync(path.join(dest, 'sections', 'intro.tex'), 'utf8'), '\\section{Intro}');
            assert.deepEqual(fs.readFileSync(path.join(dest, 'images', 'test.png')), png);
            assert.ok(fs.statSync(path.join(dest, 'sections')).isDirectory());
        });

        it('streams a multi-megabyte member without stalling', async function() {
            var content = Buffer.alloc(6 * 1024 * 1024, 0x41);
            var tar = makeTar([{name: 'big.bin', content: content}]);
            var dest = await extract(tar);
            assert.deepEqual(fs.readFileSync(path.join(dest, 'big.bin')), content);
        });

        it('extracts deep nested paths within the depth limit', async function() {
            var tar = makeTar([
                {name: 'a/b/c/d/main.tex', content: '\\documentclass{article}'},
            ]);
            var dest = await extract(tar, {maxPathDepth: 32});
            assert.ok(fs.existsSync(path.join(dest, 'a', 'b', 'c', 'd', 'main.tex')));
        });

        it('extracts leading ./ prefixed members', async function() {
            var tar = makeTar([
                {name: './main.tex', content: '\\documentclass{article}'},
            ]);
            var dest = await extract(tar);
            assert.ok(fs.existsSync(path.join(dest, 'main.tex')));
        });
    });

    describe('path traversal', function() {
        it('rejects ../evil.txt', async function() {
            var tar = makeTar([{name: '../evil.txt', content: 'bad'}]);
            await assert.rejects(extract(tar), /escapes the extraction directory/);
        });

        it('rejects nested traversal foo/../../evil', async function() {
            var tar = makeTar([{name: 'foo/../../evil', content: 'bad'}]);
            await assert.rejects(extract(tar), /escapes the extraction directory/);
        });

        it('rejects deep traversal a/../../../evil.txt', async function() {
            var tar = makeTar([{name: 'a/../../../evil.txt', content: 'bad'}]);
            await assert.rejects(extract(tar), /escapes the extraction directory/);
        });
    });

    describe('absolute paths', function() {
        it('rejects /etc/evil', async function() {
            var tar = makeTar([{name: '/etc/evil', content: 'bad'}]);
            await assert.rejects(extract(tar), /absolute path/);
        });

        it('rejects windows drive path C:/evil', async function() {
            var tar = makeTar([{name: 'C:/evil', content: 'bad'}]);
            await assert.rejects(extract(tar), /absolute path|unsupported path/);
        });

        it('rejects windows UNC backslash path', async function() {
            var tar = makeTar([{name: '..\\\\..\\\\evil', content: 'bad'}]);
            await assert.rejects(extract(tar), /unsupported path/);
        });
    });

    describe('link entries', function() {
        it('rejects symbolic links', async function() {
            var tar = makeTar([{name: 'link', type: 'symlink', linkname: '/etc/passwd'}]);
            await assert.rejects(extract(tar), /symbolic link/);
        });

        it('rejects hard links', async function() {
            var tar = makeTar([{name: 'hard', type: 'hardlink', linkname: '/etc/passwd'}]);
            await assert.rejects(extract(tar), /hard link/);
        });
    });

    describe('special entries', function() {
        it('rejects device/FIFO-like entries', async function() {
            var block = makeHeader('fifo', {typeByte: 54});
            var tar = Buffer.concat([block, Buffer.alloc(1024)]);
            await assert.rejects(extract(tar), /unsupported entry type/);
        });
    });

    describe('resource limits', function() {
        it('rejects too many files', async function() {
            var entries = [];
            for (var i = 0; i < 10; ++i)
                entries.push({name: 'file' + i + '.tex', content: 'x'});
            var tar = makeTar(entries);
            await assert.rejects(extract(tar, {maxFiles: 4}), /too many files/);
        });

        it('rejects oversized extracted content', async function() {
            var tar = makeTar([{name: 'big.tex', content: 'A' + Buffer.alloc(2048).toString()}]);
            await assert.rejects(extract(tar, {maxExtractedSize: 100}), /expands beyond/);
        });

        it('rejects a file with a huge declared size (archive bomb)', async function() {
            var single = makeHeader('bomb.tex', {typeByte: 48, size: 300 * 1024 * 1024});
            var tar = Buffer.concat([single, Buffer.alloc(1024)]);
            await assert.rejects(extract(tar, {maxExtractedSize: 200 * 1024 * 1024}), /expands beyond/);
        });

        it('rejects oversized archives', async function() {
            var tar = makeTar([{name: 'main.tex', content: Buffer.alloc(10240)}]);
            await assert.rejects(extract(tar, {maxArchiveSize: 100}), /maximum size limit/);
        });

        it('rejects excessively deep paths', async function() {
            var deep = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].join('/') + '/main.tex';
            var tar = makeTar([{name: deep, content: 'x'}]);
            await assert.rejects(extract(tar, {maxPathDepth: 3}), /too deeply nested/);
        });
    });

    describe('partial extraction cleanup', function() {
        it('does not leave extracted files behind after rejection (extractor side)', async function() {
            var workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tarext-'));
            var archivePath = path.join(workDir, 'archive.tar');
            var destDir = path.join(workDir, 'out');
            fs.writeFileSync(archivePath, makeTar([
                {name: 'good.txt', content: 'hello'},
                {name: '../evil.txt', content: 'bad'},
            ]));
            try {
                await TarExtractor.extractArchive(archivePath, destDir);
            } catch (e) {
                // expected
            }
            assert.ok(!fs.existsSync(destDir), 'partially extracted directory should be cleaned up');
            fs.rmdirSync(workDir, {recursive: true});
        });
    });
});