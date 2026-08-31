var fs = require('fs');
var exec = require('child_process').execFile;
var crypto = require('crypto');
var logger;

var allLoggers = new Map();

var utils = {
    /**
     * @param {string} filePath
     * @return {!Promise<string>}
     */
    computeHash: function(filePath) {
        var fulfill;
        var promise = new Promise(x => fulfill = x);

        var fileHandle = fs.createReadStream(filePath);
        var hash = crypto.createHash('md5');
        hash.setEncoding('hex');

        fileHandle.on('error', function(err) {
            logger.error(`ERROR: failed to compute md5 for ${filePath} - ${err}`);
            fulfill(null);
        });

        fileHandle.on('end', function() {
            hash.end();
            fulfill(hash.read());
        });

        fileHandle.pipe(hash);
        return promise;
    },

    /**
     * @param {string} path
     * @return {!Promise<boolean>}
     */
    mkdir: function(path) {
        var fulfill;
        var promise = new Promise(x => fulfill = x);
        fs.mkdir(path, createErrorHandler(`ERROR: failed to create directory ${path}.`, fulfill));
        return promise;
    },

    /**
     * @param {string} path
     * @return {!Promise<boolean>}
     */
    unlink: function(path) {
        var fulfill;
        var promise = new Promise(x => fulfill = x);
        fs.unlink(path, createErrorHandler(`ERROR: failed to remove file at ${path}.`, fulfill));
        return promise;
    },

    /**
     * @param {string} path
     * @return {!Promise<boolean>}
     */
    rmdir: function(path) {
        var fulfill;
        var promise = new Promise(x => fulfill = x);
        fs.rmdir(path, createErrorHandler(`ERROR: failed to remove directory at ${path}.`, fulfill));
        return promise;
    },

    /**
     * @param {string} path
     * @return {!Promise<boolean>}
     */
    rmdirRecursive: function(path) {
        var fulfill;
        var promise = new Promise(x => fulfill = x);
        var child = exec('rm', ['-rf', path], createErrorHandler(`ERROR: failed to remove directory recursively at ${path}.`, fulfill));
        return promise;
    },

    /**
     * @param {string} path
     * @return {!Promise<?number>}
     */
    dirSize: function(path) {
        var fulfill;
        var promise = new Promise(x => fulfill = x);
        var child = exec('du', ['-sb', path], (err, stdout) => {
            if (err || !stdout) {
                logger.error(`ERROR: failed to get directory size ${path} - ${err}`);
                fulfill(null);
                return;
            }
            var bytes = parseInt(stdout.split('\t')[0]);
            if (isNaN(bytes)) {
                logger.error(`ERROR: failed to parse du -sb result - ${stdout}`);
                fulfill(null);
                return;
            }
            fulfill(bytes);
        });
        return promise;
    },

    /**
     * @param {string} path
     * @param {string} text
     * @return {!Promise<boolean>}
     */
    writeFile: function(path, text) {
        var fulfill;
        var promise = new Promise(x => fulfill = x);
        fs.writeFile(path, text, 'utf8', createErrorHandler(`ERROR: failed to write file ${path}.`, fulfill));
        return promise;
    },

    /**
     * @param {string} path
     * @return {!Promise<boolean>}
     */
    exists: function(path) {
        return new Promise(x => fs.exists(path, x));
    },

    /**
     * @param {string} path
     * @return {!Promise<boolean>}
     */
    recreateFolderIfNonEmpty: async function(path) {
        var exists = await utils.exists(path);
        if (exists) {
            logger.info(`NOTE: folder ${path} exists. Cleaning up...`);
            var success = await utils.clearFolderContents(path);
            if (!success) {
                logger.error(`Failed to cleanup folder ${path}`);
                return false;
            }
            return true;
        }
        return utils.mkdir(path);
    },

    /**
     * Removes every entry directly inside a folder but keeps the folder
     * itself (so it works when the folder is a mount point, e.g. the
     * results or downloads volume inside a container).
     *
     * @param {string} path
     * @return {!Promise<boolean>}
     */
    clearFolderContents: function(path) {
        var fulfill;
        var promise = new Promise(x => fulfill = x);
        fs.readdir(path, (err, items) => {
            if (err) {
                createErrorHandler(`ERROR: failed to list folder ${path} contents.`, fulfill)(err);
                return;
            }
            if (items.length === 0) {
                fulfill(true);
                return;
            }
            var remaining = items.length;
            var failed = false;
            for (var name of items) {
                fs.rm(path + '/' + name, {recursive: true, force: true}, (rmErr) => {
                    if (rmErr)
                        failed = true;
                    if (--remaining === 0)
                        fulfill(!failed);
                });
            }
        });
        return promise;
    },

    /**
     * @param {number} seconds
     * @return {number}
     */
    seconds: function(seconds) {
        return seconds * 1000;
    },

    /**
     * @param {number} mins
     * @return {number}
     */
    minutes: function(mins) {
        return mins * utils.seconds(60);
    },

    /**
     * @param {number} mins
     * @return {number}
     */
    hours: function(hours) {
        return hours * utils.minutes(60);
    },

    /**
     * @param {string} label
     */
    logger: function(label) {
        var winston = require('winston');
        if (!allLoggers.has(label)) {
            const logger = winston.createLogger({
              level: 'silly',
              format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
              ),
              colorize: true,
              label: label,
              transports: [
                new winston.transports.Console(),
              ],
            });
            allLoggers.set(label, logger);
        }
        return allLoggers.get(label);
    }
};

logger = utils.logger('utilities');

module.exports = utils;

/**
 * @param {string} errorText
 * @param {function(boolean)} resolveCallback
 * @return {function(string)}
 */
function createErrorHandler(errorText, resolveCallback) {
    return err => {
        if (err) {
            logger.error(`${errorText}. Got error: ${err}`);
            resolveCallback(false);
        } else {
            resolveCallback(true);
        }
    }
}
