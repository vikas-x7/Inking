var EventEmitter = require('events');
var fs = require('fs');
var CompilationRequest = require('./CompilationRequest');
var DownloadManager = require('./DownloadManager');
var Compilation = require('./Compilation');
var ConcurrencyLimiter = require('./ConcurrencyLimiter');
var config = require('./config');
var utils = require('./utilities');
var path = require('path');

class LatexOnline extends EventEmitter {
    /**
     * @param {string} tmpFolder
     * @param {string} resultsFolder
     */
    static async create(tmpFolder, resultsFolder) {
        var [downloadManager, resultsFolderSuccess] = await Promise.all([
            DownloadManager.create(tmpFolder),
            utils.recreateFolderIfNonEmpty(resultsFolder),
        ]);
        if (!downloadManager || !resultsFolderSuccess)
            return null;
        return new LatexOnline(downloadManager, resultsFolder);
    }

    /**
     * @param {!DownloadManager} downloadManager
     * @param {string} resultsFolder
     */
    constructor(downloadManager, resultsFolder) {
        super();
        this._downloadManager = downloadManager;
        this._resultsFolder = resultsFolder;
        /** @type {!Map<string, !Compilation>} */
        this._fingerprintToCompilation = new Map();
        this._concurrencyLimiter = new ConcurrencyLimiter(config.maxConcurrentCompilations());
        this._accepting = true;
    }

    /**
     * @return {string}
     */
    resultsFolderPath() {
        return this._resultsFolder;
    }

    /**
     * @return {string}
     */
    tmpFolderPath() {
        return this._downloadManager.folderPath();
    }

    /**
     * @param {!CompilationRequest} request
     * @param {!Downloader} downloader
     * @param {boolean} forceCreate
     * @return {!Compilation}
     */
    getOrCreateCompilation(request, downloader) {
        var compilation = this._fingerprintToCompilation.get(request.fingerprint);
        if (compilation) {
            compilation.accessTime = Date.now();
        } else {
            compilation = new Compilation(request, downloader, this._resultsFolder, {limiter: this._concurrencyLimiter});
            this._fingerprintToCompilation.set(request.fingerprint, compilation);
        }
        return compilation;
    }

    /**
     * @param {string} fingerprint
     * @return {?Compilation}
     */
    compilationWithFingerprint(fingerprint) {
        return this._fingerprintToCompilation.get(fingerprint) || null;
    }

    /**
     * @return {!Array<!Compilation>}
     */
    compilations() {
        return Array.from(this._fingerprintToCompilation.values());
    }

    /**
     * @return {!Array<!Compilation>} compilations that are still running.
     */
    inflightCompilations() {
        return this.compilations().filter(compilation => !compilation.finished);
    }

    /**
     * Stops admitting new compilations (used during graceful shutdown).
     */
    stopAdmission() {
        this._accepting = false;
    }

    /**
     * @return {boolean}
     */
    isAccepting() {
        return this._accepting;
    }

    /**
     * @return {!Object} live concurrency capacity.
     */
    capacity() {
        return {
            runningCompilations: this._concurrencyLimiter.running(),
            maxConcurrentCompilations: this._concurrencyLimiter.max(),
            availableSlots: this._concurrencyLimiter.available(),
            inflightCompilations: this.inflightCompilations().length,
        };
    }

    /**
     * Free bytes available on the results filesystem (or null if unknown).
     *
     * @return {!Promise<?number>}
     */
    async storageFreeBytes() {
        try {
            var stats = await fs.promises.statfs(this._resultsFolder);
            return stats.bavail * stats.bsize;
        } catch (e) {
            return null;
        }
    }

    /**
     * @return {!Promise<boolean>} true when new compilations can be admitted
     * from a storage perspective.
     */
    async storageHasSpace() {
        var free = await this.storageFreeBytes();
        if (free === null)
            return true;
        return free > config.minFreeSpace();
    }

    /**
     * @param {?Compilation} compilation
     */
    removeCompilation(compilation) {
        if (compilation && compilation.finished) {
            compilation.dispose();
            this._fingerprintToCompilation.delete(compilation.fingerprint);
        }
    }

    /**
     * @param {string} url
     * @param {string} branch
     * @param {string} target
     * @param {string} command
     * @param {string} workdir
     * @return {!Promise<!LatexOnline.Result>}
     */
    async prepareGitCompilation(url, target, branch, command, workdir) {
        var {request, userError} = await CompilationRequest.createGitRequest(url, target, branch, command, workdir);
        if (!request)
            return new LatexOnline.Result(null, null, userError);
        var downloader = this._downloadManager.createGitDownloader(url);
        return new LatexOnline.Result(request, downloader, null);
    }

    /**
     * @param {string} url
     * @param {string} command
     * @return {!Promise<!LatexOnline.Result>}
     */
    async prepareURLCompilation(url, command) {
        var fileName = 'main.tex';
        var downloader = this._downloadManager.createURLDownloader(url, fileName);
        var {folderPath, userError} = await downloader.downloadIfNeeded();
        if (!folderPath)
            return new LatexOnline.Result(null, null, userError);
        var {request, userError} = await CompilationRequest.createFileRequest(path.join(folderPath, fileName), fileName, command);
        if (!request) {
            downloader.dispose();
            return new LatexOnline.Result(null, null, userError);
        }
        return new LatexOnline.Result(request, downloader, null);
    }

    /**
     * @param {string} text
     * @param {string} command
     * @return {!Promise<!LatexOnline.Result>}
     */
    async prepareTextCompilation(text, command) {
        var {request, userError} = await CompilationRequest.createForText(text, command);
        if (!request)
            return new LatexOnline.Result(null, null, userError);
        var downloader = this._downloadManager.createTextDownloader(text, request.target);
        return new LatexOnline.Result(request, downloader, null);
    }

    /**
     * @param {string} tarballPath
     * @param {string} target
     * @param {string} command
     * @return {!Promise<!LatexOnline.Result>}
     */
    async prepareTarballCompilation(tarballPath, target, command) {
        var {request, userError} = await CompilationRequest.createFileRequest(tarballPath, target, command);
        if (!request)
            return new LatexOnline.Result(null, null, userError);
        var downloader = this._downloadManager.createTarballExtractor(tarballPath);
        return new LatexOnline.Result(request, downloader, null);
    }
}

LatexOnline.Result = class {
    /**
     * @param {?CompilationRequest} request
     * @param {?Downloader} downloader
     * @param {?string} userError
     */
    constructor(request, downloader, userError) {
        this.request = request;
        this.downloader = downloader;
        this.userError = userError;
    }
}

module.exports = LatexOnline;
