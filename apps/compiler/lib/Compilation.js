var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;
var utils = require('./utilities');
var config = require('./config');
var DockerExecutor = require('./DockerExecutor');
var NativeExecutor = require('./NativeExecutor');
var logger = utils.logger('Compilation');

var compileScriptPath = path.join(__dirname, '..', 'shells', 'compile.sh');

var compilationId = 0;

var SIZE_MONITOR_INTERVAL_MS = 200;

function humanBytes(bytes) {
    if (bytes >= 1024 * 1024 * 1024)
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    if (bytes >= 1024 * 1024)
        return Math.round(bytes / (1024 * 1024)) + ' MB';
    if (bytes >= 1024)
        return Math.round(bytes / 1024) + ' KB';
    return bytes + ' bytes';
}

/**
 * A controlled failure returned when the concurrency limit is reached.
 * Carries no stack trace or internal details to the API client.
 */
function busyError() {
    var err = new Error('Compiler is busy, please retry later.');
    err.isBusy = true;
    return err;
}

class Compilation {
    /**
     * @param {!CompilationRequest} compilationRequest
     * @param {!Downloader} downloader
     * @param {string} resultsFolder
     * @param {?Object=} options
     */
    constructor(compilationRequest, downloader, resultsFolder, options) {
        this.id = 'compilation_' + (++compilationId);
        this._downloader = downloader;
        this._resultsFolder = resultsFolder;
        this._outputFolder = null;
        this._compilationRequest = compilationRequest;
        this._options = options || {};

        var timestamp = Date.now();
        this.fingerprint = compilationRequest.fingerprint;
        this.command = compilationRequest.command;
        this.finished = false;
        this.success = false;
        this.startTime = timestamp;
        this.accessTime = timestamp;
        this.endTime = timestamp;
        this.userError = null;
        this.outputBytes = 0;
        this.logBytes = 0;
        this.terminationReason = null;

        this._runningPromise = null;
        this._activeProcess = null;
        this._terminationRequest = null;
    }

    _logData(meta) {
        var data = {
            id: this.id,
            fingerprint: this.fingerprint,
            outputfolder: this._outputFolder,
        };
        if (meta)
            Object.assign(data, meta);
        return data;
    }

    /**
     * @return {?string}
     */
    logPath() {
        return this._outputFolder ? path.join(this._outputFolder, 'log.txt') : null;
    }

    /**
     * @return {?string}
     */
    outputPath() {
        return this._outputFolder ? path.join(this._outputFolder, 'output.pdf') : null;
    }

    /**
     * Runs the compilation. Acquires a global concurrency slot exactly once
     * (the first caller owns the run; fingerprint-deduped followers reuse it).
     *
     * @return {!Promise<!Compilation>}
     */
    async run() {
        // Deduplicated: the same compilation object is shared by identical
        // fingerprints, so only the first caller reserves a slot.
        var clientOfExistingRun = !!this._runningPromise;
        if (this._runningPromise)
            return this._runningPromise;

        var release = null;
        var limiter = this._options.limiter || null;
        if (limiter && !clientOfExistingRun) {
            release = limiter.tryAcquire();
            if (!release)
                throw busyError();
        }
        try {
            this._runningPromise = this._innerRunCompilation()
                .catch(e => {
                    logger.error(`ERROR: Compiler crashed during execution - ${e.message}`, this._logData());
                })
                .then(() => {
                    this._downloader.dispose();
                    return this;
                });
            return await this._runningPromise;
        } finally {
            if (release)
                release();
        }
    }

    /**
     * Force-terminates a running compilation (used by graceful shutdown).
     */
    terminate() {
        this._requestTermination('shutdown');
    }

    /**
     * @param {string} reason
     */
    _requestTermination(reason) {
        if (this._terminationRequest)
            return;
        this._terminationRequest = reason;
        if (this._activeProcess && this._activeProcess.kill) {
            try {
                this._activeProcess.kill();
            } catch (e) {
                // the process might have already stopped
            }
        }
    }

    /**
     * @return {!Promise}
     */
    async _innerRunCompilation() {
        // Try to create directory for compilation.
        this._outputFolder = path.join(this._resultsFolder, this.id);
        var success = await utils.mkdir(this._outputFolder);
        if (!success) {
            this._finishCompilation(false, 'Compiation Job failed due to internal reasons');
            return;
        }

        var {folderPath, userError} = await this._downloader.downloadIfNeeded();
        if (!folderPath) {
            this._finishCompilation(false, userError);
            return;
        }
        var workdir = path.resolve(folderPath, this._compilationRequest.workdir);
        if (!workdir.startsWith(folderPath)) {
            this._finishCompilation(false, 'Error: workdir path got resolved to outside directory. Make sure workdir is a relative path which points inside your repository!');
            return;
        }
        var target = path.resolve(folderPath, this._compilationRequest.target);
        if (!target.startsWith(folderPath)) {
            this._finishCompilation(false, 'Error: target path resolved to outside directory. Make sure your target is a relative path which points inside your repository!');
            return;
        }

        this._workdirPath = workdir;
        this._workspaceTick = 0;
        var result = await this._executeCompiler(workdir, target, this._compilationRequest.command, this.outputPath(), this.logPath());
        var sizeError = await this._validateOutputSizes();
        this._finishCompilation(result.exitOk && !result.reason && !sizeError, this._terminationMessage(result.reason) || sizeError);
    }

    /**
     * @param {?string} reason
     * @return {?string}
     */
    _terminationMessage(reason) {
        if (reason === 'timeout')
            return 'Compilation timed out';
        if (reason === 'logTooLarge')
            return `Compilation log exceeds the maximum allowed size (${humanBytes(config.maxLogSize())})`;
        if (reason === 'workspaceTooLarge')
            return `Compilation workspace exceeds the maximum allowed size (${humanBytes(config.maxWorkspaceSize())})`;
        if (reason === 'shutdown')
            return 'Compiler service is shutting down, please retry later.';
        if (reason === 'internal')
            return 'Compilation failed due to an internal error';
        return null;
    }

    /**
     * Post-compile size validation. Removes oversized artifacts (and waits for
     * the removal to complete) from the persistent results storage so a single
     * job cannot consume unbounded disk.
     *
     * @return {?string} userError when a limit is exceeded
     */
    async _validateOutputSizes() {
        var logPath = this.logPath();
        var outputPath = this.outputPath();
        var maxLogSize = config.maxLogSize();
        var maxOutputSize = config.maxOutputSize();

        if (logPath && existsSync(logPath)) {
            this.logBytes = statSize(logPath);
            if (this.logBytes > maxLogSize) {
                logger.info('Compilation log exceeded limit', this._logData({bytes: this.logBytes, maxBytes: maxLogSize}));
                await utils.unlink(logPath);
                if (outputPath)
                    await utils.unlink(outputPath);
                return `Compilation log exceeds the maximum allowed size (${humanBytes(maxLogSize)})`;
            }
        }

        if (outputPath && existsSync(outputPath)) {
            this.outputBytes = statSize(outputPath);
            if (this.outputBytes > maxOutputSize) {
                logger.info('Compilation output exceeded limit', this._logData({bytes: this.outputBytes, maxBytes: maxOutputSize}));
                await utils.unlink(outputPath);
                return `Compilation output exceeds the maximum allowed size (${humanBytes(maxOutputSize)})`;
            }
        }
        return null;
    }

    /**
     * While the compiler runs, watch for runaway resource usage and terminate
     * early instead of accumulating data without bound:
     *  - the synthesized log file,
     *  - the final PDF once it appears,
     *  - the total workspace (project + compiler intermediates), which is the
     *    real growth vector for this toolchain because latexrun buffers the
     *    compiler transcript in memory and writes intermediates to the cwd.
     */
    _checkGrowingSizes() {
        var threshold = config.maxLogSize();
        var logPath = this.logPath();
        if (logPath && existsSync(logPath) && statSize(logPath) > threshold) {
            logger.info('Terminating compilation: log exceeded limit', this._logData());
            this._requestTermination('logTooLarge');
        }
        var outputPath = this.outputPath();
        if (outputPath && existsSync(outputPath))
            this.outputBytes = statSize(outputPath);

        if (!this._workspaceTick || Date.now() - this._workspaceTick > 1000) {
            this._workspaceTick = Date.now();
            var workspaceBytes = dirSizeSync(this._workdirPath) + dirSizeSync(this._outputFolder);
            if (workspaceBytes > config.maxWorkspaceSize()) {
                logger.info('Terminating compilation: workspace exceeded limit', this._logData({bytes: workspaceBytes}));
                this._requestTermination('workspaceTooLarge');
            }
        }
    }

    /**
     * @param {string} workdirPath
     * @param {string} targetRelativePath
     * @param {string} command
     * @param {string} outputPath
     * @param {string} logPath
     * @return {!Promise<!{exitOk: boolean, reason: ?string}>}
     */
    async _executeCompiler(workdirPath, targetRelativePath, command, outputPath, logPath) {
        logger.info('Running compilation', this._logData({
            inputfolder: workdirPath,
            command: command,
            target: targetRelativePath
        }));

        var executor = this._executor();
        var handle = executor.start(workdirPath, targetRelativePath, command, outputPath, logPath);
        this._activeProcess = handle;
        if (this._terminationRequest && handle.kill)
            handle.kill();

        var fulfill;
        var promise = new Promise(x => fulfill = x);

        var timeout = config.compileTimeoutMs();
        var jobTimeout = setTimeout(() => {
            this._requestTermination('timeout');
        }, timeout);
        var sizeMonitor = setInterval(() => {
            this._checkGrowingSizes();
        }, SIZE_MONITOR_INTERVAL_MS);

        handle.done.then(result => {
            clearTimeout(jobTimeout);
            clearInterval(sizeMonitor);
            fulfill({exitOk: result.exitOk, reason: this._terminationRequest});
        }).catch(e => {
            clearTimeout(jobTimeout);
            clearInterval(sizeMonitor);
            if (!this._terminationRequest)
                this._terminationRequest = 'internal';
            logger.error(`ERROR: Compiler crashed during execution - ${e.message}`, this._logData());
            fulfill({exitOk: false, reason: this._terminationRequest});
        });

        return promise;
    }

    /**
     * @return {!Object} executor backend
     */
    _executor() {
        if (this._options.executor)
            return this._options.executor;
        var strategy = config.executor();
        if (strategy === 'docker')
            return new DockerExecutor();
        if (strategy === 'native')
            return new NativeExecutor();
        return {start: this._startLocal.bind(this)};
    }

    /**
     * Starts the in-process compiler tree: compile.sh -> latexrun -> TeX.
     * The process runs detached so a negative-PID kill terminates the whole
     * process group (verified by tests).
     *
     * @return {{pid: number, kill: function(), done: !Promise}}
     */
    _startLocal(workdirPath, targetRelativePath, command, outputPath, logPath) {
        var shellProcess = spawn('bash', [compileScriptPath, workdirPath, targetRelativePath, command, outputPath, logPath], {detached: true, stdio: 'ignore'});

        var handle = {
            pid: null,
            kill: function() {
                // Skip the kill if the process already exited so a recycled PID
                // is never targeted.
                if (shellProcess.pid && shellProcess.exitCode === null && shellProcess.signalCode === null) {
                    try {
                        process.kill(-shellProcess.pid, 'SIGKILL');
                    } catch (e) {
                        // the process might have already stopped
                    }
                }
            },
            done: new Promise(resolve => {
                shellProcess.on('close', (code) => {
                    resolve({exitOk: code === 0});
                });
            }),
        };
        return handle;
    }

    dispose() {
        if (!this.finished) {
            logger.error(`ERROR: cannot dispose running task.`, this._logData());
            return;
        }
        // We failed to create output folder.
        if (!this._outputFolder)
            return;
        // No need to wait for removal.
        utils.rmdirRecursive(this._outputFolder).then(success => {
            if (!success)
                logger.error(`ERROR: failed to cleanup compilation`, this._logData());
        });
        logger.info(`Compilation disposed.`, this._logData());
    }

    /**
     * @param {boolean} success
     * @param {string} userError
     */
    _finishCompilation(success, userError) {
        this.userError = userError;
        this.finished = true;
        this.success = success;
        var time = Date.now();
        this.endTime = time;
        this.accessTime = time;
        var duration = this.endTime - this.startTime;

        this.terminationReason = this._terminationRequest;
        logger.info('Compilation finished', this._logData({
            duration,
            success: this.success,
            userError: this.userError,
            command: this.command,
            outputBytes: this.outputBytes,
            logBytes: this.logBytes,
            terminationReason: this.terminationReason,
        }));
    }
}

/**
 * @param {string} filePath
 * @return {boolean}
 */
function existsSync(filePath) {
    try {
        fs.statSync(filePath);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * @param {string} filePath
 * @return {number}
 */
function statSize(filePath) {
    try {
        return fs.statSync(filePath).size;
    } catch (e) {
        return 0;
    }
}

/**
 * Total size of the directory tree (regular files only; symbolic links are
 * never followed so a malicious link cannot escape the workspace or loop).
 *
 * @param {string} dirPath
 * @return {number} bytes
 */
function dirSizeSync(dirPath) {
    var total = 0;
    if (!dirPath || !existsSync(dirPath))
        return 0;
    try {
        var stack = [dirPath];
        while (stack.length) {
            var current = stack.pop();
            var entries = fs.readdirSync(current, {withFileTypes: true});
            for (var entry of entries) {
                var fullPath = path.join(current, entry.name);
                if (entry.isSymbolicLink())
                    continue;
                if (entry.isDirectory())
                    stack.push(fullPath);
                else
                    total += statSize(fullPath);
            }
        }
    } catch (e) {
        // Best-effort measurement.
    }
    return total;
}

module.exports = Compilation;
module.exports.busyError = busyError;