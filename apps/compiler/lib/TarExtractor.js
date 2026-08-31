var fs = require('fs');
var path = require('path');

var DEFAULT_LIMITS = {
    maxArchiveSize: 50 * 1024 * 1024,
    maxExtractedSize: 200 * 1024 * 1024,
    maxFiles: 2000,
    maxPathDepth: 32,
};

var MAX_CHUNK = 1024 * 1024;

//
// Tar format type flags (byte values).
//
var TYPE_REGULAR = 48;   // '0'
var TYPE_REGULAR_GNU = 55; // '7'
var TYPE_REGULAR_LEGACY = 0; // '\0'
var TYPE_DIR = 53;       // '5'
var TYPE_HARDLINK = 49;  // '1'
var TYPE_SYMLINK = 50;   // '2'
var TYPE_CHAR = 51;      // '3'
var TYPE_BLOCK = 52;     // '4'
var TYPE_FIFO = 54;      // '6'
var TYPE_GNU_LONGNAME = 76;  // 'L'
var TYPE_GNU_LONGLINK = 75;  // 'K'
var TYPE_PAX_EXTENDED = 120; // 'x'
var TYPE_PAX_GLOBAL = 103;   // 'g'

class TarExtractionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TarExtractionError';
    }
}

function envLimit(name, fallback) {
    var value = process.env[name];
    if (value === undefined || value === '')
        return fallback;
    var parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
}

function limitsFromEnv() {
    return {
        maxArchiveSize: envLimit('LATEX_TAR_MAX_ARCHIVE_SIZE', DEFAULT_LIMITS.maxArchiveSize),
        maxExtractedSize: envLimit('LATEX_TAR_MAX_EXTRACTED_SIZE', DEFAULT_LIMITS.maxExtractedSize),
        maxFiles: envLimit('LATEX_TAR_MAX_FILES', DEFAULT_LIMITS.maxFiles),
        maxPathDepth: envLimit('LATEX_TAR_MAX_PATH_DEPTH', DEFAULT_LIMITS.maxPathDepth),
    };
}

/**
 * Sequentially reads bytes from a ReadStream, keeping only a small
 * sliding buffer in memory. One read() call is expected to complete
 * before the next one starts (strict sequential use).
 *
 * Data is consumed through the stream's async iterator, which pauses
 * the source between next() calls, so flow-controlled gaps between
 * reads never lose bytes (a 'data'-listener implementation drops or
 * stalls data for multi-megabyte members while the consumer awaits
 * its write).
 */
class SequentialReader {
    constructor(readStream) {
        this._readStream = readStream;
        this._iterator = readStream[Symbol.asyncIterator]();
        this._buffer = Buffer.alloc(0);
        this._ended = false;
    }

    async _readChunk() {
        if (this._ended)
            return null;
        var result = await this._iterator.next();
        if (result.done) {
            this._ended = true;
            return null;
        }
        return result.value;
    }

    /**
     * Reads exactly n bytes, or returns null on end-of-file.
     */
    async read(n) {
        while (this._buffer.length < n) {
            var chunk = await this._readChunk();
            if (chunk === null)
                return null;
            this._buffer = this._buffer.length ? Buffer.concat([this._buffer, chunk]) : chunk;
        }
        var result = this._buffer.slice(0, n);
        this._buffer = this._buffer.slice(n);
        return result;
    }
}

function isZeroBlock(buffer) {
    for (var i = 0; i < buffer.length; ++i) {
        if (buffer[i] !== 0)
            return false;
    }
    return true;
}

function readCString(buffer, offset, length) {
    var raw = buffer.toString('utf8', offset, offset + length);
    var nul = raw.indexOf('\0');
    if (nul !== -1)
        raw = raw.substring(0, nul);
    return raw;
}

function parseNumeric(buffer, offset, length) {
    var first = buffer[offset];
    if (first & 0x80) {
        // GNU base-256 encoding.
        var value = 0;
        for (var i = offset; i < offset + length; ++i) {
            var byte = buffer[i];
            if (i === offset)
                byte &= 0x7f;
            value = value * 256 + byte;
        }
        return value;
    }
    var str = buffer.toString('utf8', offset, offset + length);
    str = str.split('\0')[0].trim();
    if (!str)
        return 0;
    var parsed = parseInt(str, 8);
    return isNaN(parsed) ? 0 : parsed;
}

function headerChecksumOk(block) {
    var storedString = block.toString('ascii', 148, 156);
    var stored = parseInt(storedString.split('\0')[0].trim(), 8);
    if (!stored)
        return true;
    var unsignedSum = 0;
    var signedSum = 0;
    for (var i = 0; i < block.length; ++i) {
        var b = block[i];
        if (i >= 148 && i < 156)
            b = 0x20;
        unsignedSum += b;
        signedSum += (b < 128) ? b : b - 256;
    }
    return unsignedSum === stored || signedSum === stored;
}

function headerName(block) {
    var name = readCString(block, 0, 100);
    var prefix = readCString(block, 345, 155);
    if (prefix)
        name = prefix + '/' + name;
    return name;
}

function normalizeMemberName(name) {
    while (name.indexOf('./') === 0)
        name = name.substring(2);
    name = name.replace(/\/+$/, '');
    return name;
}

/**
 * Validates a member path and returns its resolved absolute path.
 * Rejects: absolute paths, Windows-style drive/backslash paths,
 * any path escaping destDir, overly deep paths.
 */
function validateMemberPath(destDir, rawName, maxPathDepth) {
    if (!rawName)
        return {name: '', resolved: null};
    if (rawName.indexOf('\\') !== -1)
        throw new TarExtractionError('archive entry uses an unsupported path: ' + rawName);
    if (/^[A-Za-z]:[\\/]/.test(rawName))
        throw new TarExtractionError('archive entry has an absolute path: ' + rawName);
    if (rawName.charAt(0) === '/')
        throw new TarExtractionError('archive entry has an absolute path: ' + rawName);

    var name = normalizeMemberName(rawName);
    if (!name)
        return {name: '', resolved: null};

    var resolved = path.resolve(destDir, name);
    var relative = path.relative(destDir, resolved);
    if (path.isAbsolute(relative) || relative === '..' || relative.indexOf('..' + path.sep) === 0)
        throw new TarExtractionError('archive entry escapes the extraction directory: ' + rawName);

    var parts = relative.split(path.sep);
    if (parts.length > maxPathDepth)
        throw new TarExtractionError('archive entry is too deeply nested: ' + rawName);
    for (var part of parts) {
        if (!part || part === '.' || part === '..')
            throw new TarExtractionError('archive entry escapes the extraction directory: ' + rawName);
    }
    return {name: relative, resolved: resolved};
}

/**
 * Creates directories recursively, refusing to traverse through
 * symlinks or non-directories.
 */
function ensureDirectoryChain(destDir, relativeDir) {
    var parts = relativeDir.split(path.sep);
    var current = destDir;
    for (var part of parts) {
        if (!part)
            continue;
        current = path.join(current, part);
        try {
            var st = fs.lstatSync(current);
            if (st.isSymbolicLink())
                throw new TarExtractionError('archive entry traverses a symlink: ' + current);
            if (!st.isDirectory())
                throw new TarExtractionError('archive entry collides with a non-directory: ' + current);
        } catch (e) {
            if (e && e.code === 'ENOENT') {
                fs.mkdirSync(current, 0o755);
            } else {
                throw e;
            }
        }
    }
}

function writeToStream(writable, chunk) {
    return new Promise((resolve, reject) => {
        var done = false;
        function cleanup() {
            writable.removeListener('error', onError);
        }
        function onError(err) {
            if (done)
                return;
            done = true;
            cleanup();
            reject(err);
        }
        writable.once('error', onError);
        writable.write(chunk, (err) => {
            if (done)
                return;
            done = true;
            cleanup();
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}

function endStream(writable) {
    return new Promise((resolve, reject) => {
        writable.end((err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}

/**
 * Reads `size` bytes as a buffer (used for longname / pax headers),
 * skipping the archive padding block afterwards.
 */
async function readPaddedData(reader, size) {
    var chunks = [];
    var remaining = size;
    while (remaining > 0) {
        var chunk = await reader.read(Math.min(MAX_CHUNK, remaining));
        if (chunk === null)
            throw new TarExtractionError('archive is truncated');
        chunks.push(chunk);
        remaining -= chunk.length;
    }
    var data = chunks.length === 1 ? chunks[0] : Buffer.concat(chunks);
    var pad = (512 - (size % 512)) % 512;
    await reader.read(pad);
    return data;
}

/**
 * Streams a regular file to disk in bounded chunks and skips the
 * archive padding block.
 */
async function extractFile(reader, resolvedPath, size) {
    var writable = fs.createWriteStream(resolvedPath, {flags: 'w', mode: 0o644});
    try {
        var remaining = size;
        while (remaining > 0) {
            var chunk = await reader.read(Math.min(MAX_CHUNK, remaining));
            if (chunk === null)
                throw new TarExtractionError('archive is truncated mid-file');
            remaining -= chunk.length;
            await writeToStream(writable, chunk);
        }
        await endStream(writable);
    } catch (e) {
        writable.destroy();
        try {
            fs.unlinkSync(resolvedPath);
        } catch (ignored) {
        }
        throw e;
    }
    var pad = (512 - (size % 512)) % 512;
    await reader.read(pad);
}

/**
 * Safe extraction of a tar archive.
 *
 * @param {string} archivePath path to the uploaded archive
 * @param {string} destDir extraction destination (created if missing)
 * @param {Object=} options override limits: maxArchiveSize, maxExtractedSize,
 *                             maxFiles, maxPathDepth (defaults from env)
 * @return {!Promise<void>} rejects with TarExtractionError on any violation
 */
async function extractArchive(archivePath, destDir, options) {
    var limits = Object.assign({}, limitsFromEnv(), options || {});

    if (!fs.existsSync(destDir))
        fs.mkdirSync(destDir, 0o755);

    var stat;
    try {
        stat = fs.statSync(archivePath);
    } catch (e) {
        throw new TarExtractionError('failed to read the uploaded archive');
    }
    if (stat.size > limits.maxArchiveSize)
        throw new TarExtractionError('archive exceeds the maximum size limit');

    var reader = new SequentialReader(fs.createReadStream(archivePath));
    var bytesExtracted = 0;
    var fileCount = 0;
    var pendingName = null;
    var paxPath = null;
    try {
        while (true) {
            var header = await reader.read(512);
            if (header === null)
                break;
            if (isZeroBlock(header)) {
                var next = await reader.read(512);
                if (next === null || isZeroBlock(next))
                    break;
                header = next;
            }
            if (!headerChecksumOk(header))
                throw new TarExtractionError('corrupt archive header');

            var typeByte = header[156];
            var size = parseNumeric(header, 124, 12);
            var name = headerName(header);
            var linkname = readCString(header, 157, 100);

            if (typeByte === TYPE_GNU_LONGNAME) {
                var longNameData = await readPaddedData(reader, size);
                pendingName = longNameData.toString('utf8').split('\0')[0];
                continue;
            }
            if (typeByte === TYPE_GNU_LONGLINK) {
                await readPaddedData(reader, size);
                continue;
            }
            if (typeByte === TYPE_PAX_EXTENDED) {
                var paxData = await readPaddedData(reader, size).then(buf => buf.toString('utf8'));
                parsePaxRecords(paxData, (key, value) => {
                    if (key === 'path')
                        paxPath = value;
                });
                continue;
            }
            if (typeByte === TYPE_PAX_GLOBAL) {
                await readPaddedData(reader, size);
                continue;
            }
            if (typeByte === TYPE_SYMLINK)
                throw new TarExtractionError('archive contains a symbolic link entry: ' + name);
            if (typeByte === TYPE_HARDLINK)
                throw new TarExtractionError('archive contains a hard link entry: ' + name);

            var isDir = typeByte === TYPE_DIR;
            var isFile = typeByte === TYPE_REGULAR || typeByte === TYPE_REGULAR_GNU || typeByte === TYPE_REGULAR_LEGACY;
            if (!isDir && !isFile)
                throw new TarExtractionError('archive contains an unsupported entry type: ' + name);

            var entryName = paxPath || pendingName || name;
            paxPath = null;
            pendingName = null;

            var validated = validateMemberPath(destDir, entryName, limits.maxPathDepth);
            if (!validated.name) {
                // "." / empty root-dir member: a no-op for directories.
                if (isDir) {
                    if (size > 0)
                        await readPaddedData(reader, size);
                    continue;
                }
                throw new TarExtractionError('archive entry has an empty file name');
            }

            if (isDir) {
                ensureDirectoryChain(destDir, validated.name);
                continue;
            }

            fileCount++;
            if (fileCount > limits.maxFiles)
                throw new TarExtractionError('archive contains too many files');
            if (bytesExtracted + size > limits.maxExtractedSize)
                throw new TarExtractionError('archive expands beyond the maximum extracted size');
            if (size < 0)
                throw new TarExtractionError('invalid archive header');

            ensureDirectoryChain(destDir, path.dirname(validated.name));
            await extractFile(reader, validated.resolved, size);
            bytesExtracted += size;
        }
    } catch (e) {
        reader._readStream.destroy();
        try {
            fs.rmSync(destDir, {recursive: true, force: true});
        } catch (ignored) {
        }
        throw e;
    } finally {
        reader._readStream.destroy();
    }
}

/**
 * Parses POSIX pax extended-header records: "<len> <key>=<value>\n".
 */
function parsePaxRecords(data, onRecord) {
    var rest = data;
    while (rest.length) {
        var space = rest.indexOf(' ');
        if (space === -1)
            break;
        var lenStr = rest.substring(0, space);
        var len = parseInt(lenStr, 10);
        if (isNaN(len) || len <= 0 || len > rest.length)
            break;
        var record = rest.substring(space + 1, len);
        var eq = record.indexOf('=');
        if (eq !== -1)
            onRecord(record.substring(0, eq), record.substring(eq + 1));
        rest = rest.substring(len);
        while (rest.charAt(0) === '\n')
            rest = rest.substring(1);
    }
}

module.exports = {
    extractArchive: extractArchive,
    TarExtractionError: TarExtractionError,
    DEFAULT_LIMITS: DEFAULT_LIMITS,
};