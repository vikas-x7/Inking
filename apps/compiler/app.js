var path = require('path');
var crypto = require('crypto');
var fs = require('fs');
var LatexOnline = require('./lib/LatexOnline');
var Janitor = require('./lib/Janitor');
var HealthMonitor = require('./lib/HealthMonitor');
var utils = require('./lib/utilities');
var config = require('./lib/config');
var parseCompilerError = require('./lib/ErrorParser');

var logger = utils.logger('app.js');

var VERSION = process.env.VERSION || "master";
VERSION = VERSION.substr(0, 9);

// Will be initialized later.
var latexOnline;
var healthMonitor;
var server = null;

// Fail closed in production: an internal service without a shared secret
// configured is refused to start rather than left open.
if (config.nodeEnv() === 'production' && !config.internalToken()) {
    logger.error('ERROR: COMPILER_INTERNAL_TOKEN must be set when NODE_ENV=production. Refusing to start.');
    process.exit(1);
}

// Initialize service dependencies.
LatexOnline.create(config.tmpFolder(), config.resultsFolder())
    .then(onInitialized)

function onInitialized(latex) {
    latexOnline = latex;
    if (!latexOnline) {
        logger.error('ERROR: failed to initialize latexOnline');
        return;
    }

    // Initialize janitor to clean up stale storage.
    var expiry = utils.hours(24);
    var cleanupTimeout = utils.minutes(5);
    var janitor = new Janitor(latexOnline, expiry, cleanupTimeout);

    // Initialize health monitor
    healthMonitor = new HealthMonitor(latexOnline);

    // Launch server.
    var port = config.port();
    server = app.listen(port, () => {
        logger.info("Express server started", {
            port: server.address().port,
            env: app.settings.env,
            sha: VERSION,
            executor: config.executor(),
            maxConcurrentCompilations: config.maxConcurrentCompilations(),
        });
    });
}

// Initialize server.
var express = require('express');
var compression = require('compression');

var app = express();
app.use(compression());
app.use(express.json({limit: '1mb'}));
app.use(express.static(__dirname + '/public'));

/**
 * @param {!Object} res
 * @param {string} userError
 * @param {number=} statusOverride
 */
function sendError(res, userError, statusOverride) {
    res.set('Content-Type', 'text/plain');
    var statusCode = statusOverride || (userError ? 400 : 500);
    var error = userError || 'Internal Server Error';
    res.status(statusCode).send(error)
}

/**
 * Reads a compilation log that is known to exist (bounded by the configured
 * maximum log size).
 *
 * @param {string} logPath
 * @return {string}
 */
function readLog(logPath) {
    try {
        return fs.readFileSync(logPath, 'utf8');
    } catch (e) {
        logger.error('ERROR: failed to read compilation log', {path: logPath, error: e && e.message});
        return '';
    }
}

/**
 * Turns a raw latexrun log into a structured error, degrading to a generic
 * error instead of throwing on unexpected log shapes.
 *
 * @param {string} logText
 * @param {?string} workdir project root used to relativize reported file paths
 * @return {!Object}
 */
function parseCompilationError(logText, workdir) {
    try {
        return parseCompilerError(logText, {workdir: workdir});
    } catch (e) {
        logger.error('ERROR: failed to parse compilation log', {error: e && e.message});
        return {
            type: 'compilation_error',
            message: 'LaTeX compilation failed.',
            file: null,
            line: null,
            column: null,
        };
    }
}

/**
 * Service-to-service authentication. Only the trusted main backend (which
 * possesses the shared secret) may call the compiler service.
 *
 * The secret is compared in constant time and never logged.
 */
function requireInternalToken(req, res, next) {
    var token = config.internalToken();
    if (!token) {
        // No token configured: development mode (production fails closed at
        // startup, so this path is never reached in production).
        next();
        return;
    }
    var header = String(req.get('authorization') || '');
    var presented = header.startsWith('Bearer ') ? header.slice(7) : String(req.get('x-compiler-token') || '');
    if (!presented || !safeEqual(token, presented)) {
        res.status(401).set('Content-Type', 'text/plain').send('Unauthorized');
        return;
    }
    next();
}

/**
 * @param {string} a
 * @param {string} b
 * @return {boolean}
 */
function safeEqual(a, b) {
    try {
        var ha = crypto.createHash('sha256').update(a, 'utf8').digest();
        var hb = crypto.createHash('sha256').update(b, 'utf8').digest();
        return crypto.timingSafeEqual(ha, hb);
    } catch (e) {
        return false;
    }
}

/**
 * Admission checks: the service must be accepting jobs and the results
 * filesystem must not be nearly full.
 *
 * @param {!Object} res
 * @return {boolean} true when the request may proceed
 */
async function assertAdmission(res) {
    if (!latexOnline || !latexOnline.isAccepting()) {
        sendError(res, 'Compiler service is shutting down, please retry later.', 503);
        return false;
    }
    if (await latexOnline.storageHasSpace() === false) {
        sendError(res, 'Compiler storage is full, please retry later.', 503);
        return false;
    }
    return true;
}

async function handleResult(res, preparation, force, downloadName) {
    var {request, downloader, userError} = preparation;
    if (!request) {
        sendError(res, userError);
        return;
    }
    if (!await assertAdmission(res))
        return;

    var compilation = latexOnline.compilationWithFingerprint(request.fingerprint);
    if (force && compilation)
        latexOnline.removeCompilation(compilation);
    compilation = latexOnline.getOrCreateCompilation(request, downloader);

    var busyError;
    try {
        await compilation.run();
    } catch (e) {
        if (e && e.isBusy)
            busyError = 'Compiler is busy, please retry later.';
        else
            busyError = 'Internal Server Error';
        logger.error('ERROR: compilation.run() failed', {id: compilation && compilation.id, error: e && e.message});
    }

    // In case of URL compilation and cached compilation object, the downlaoder
    // has to be cleaned up.
    downloader.dispose();

    if (busyError) {
        sendError(res, busyError, 503);
        return;
    }

    if (compilation.userError) {
        sendError(res, compilation.userError);
    } else if (compilation.success) {
        if (downloadName)
          res.set('content-disposition', `attachment; filename="${downloadName}"`);
        res.status(200).sendFile(compilation.outputPath(), {acceptRanges: false});
    } else if (compilation.logPath() && fs.existsSync(compilation.logPath())) {
        var logText = readLog(compilation.logPath());
        // Failed LaTeX source: return a structured, machine-readable error
        // together with the raw transcript so the frontend can both explain
        // the failure and offer the full log for diagnosis.
        res.status(400).json({
            success: false,
            error: parseCompilationError(logText, compilation._workdirPath),
            log: logText,
        });
    } else {
        logger.error('ERROR: compilation failed without producing a log', {id: compilation.id, command: compilation._compilationRequest.command});
        sendError(res, 'Compilation failed without producing a log.', 400);
    }
}

app.get('/version', (req, res) => {
    res.json({
        version: VERSION,
        link: `http://github.com/aslushnikov/latex-online/commit/${VERSION}`
    });
});

app.get('/health.json', async (req, res) => {
    if (!healthMonitor) {
        sendError(res, 'ERROR: health monitor is not initialized.');
        return;
    }
    var result = {
        uptime: healthMonitor.uptime(),
        health: healthMonitor.healthPoints(),
        capacity: latexOnline ? Object.assign(latexOnline.capacity(), {
            storageFreeBytes: await latexOnline.storageFreeBytes(),
        }) : null,
    };
    res.json(result);
});

app.get('/health', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'health.html'));
});

app.get('/compile', requireInternalToken, asyncRoute(async (req, res) => {
    req.socket.setTimeout(1000 * 60 * 5); // 5 minutes
    var forceCompilation = req.query && !!req.query.force;
    var command = req.query && req.query.command ? req.query.command : 'pdflatex';
    command = command.trim().toLowerCase();
    var preparation;
    if (req.query.text) {
        preparation = await latexOnline.prepareTextCompilation(req.query.text, command);
    } else if (req.query.url) {
        preparation = await latexOnline.prepareURLCompilation(req.query.url, command);
    } else if (req.query.git) {
        var workdir = req.query.workdir || '';
        preparation = await latexOnline.prepareGitCompilation(req.query.git, req.query.target, 'master', command, workdir);
    }
    if (preparation)
        await handleResult(res, preparation, forceCompilation, req.query.download);
    else
        sendError(res, 'ERROR: failed to parse request: ' + JSON.stringify(req.query));
}));

var multer  = require('multer')
fs.mkdirSync('/tmp/file-uploads/', {recursive: true});
var upload = multer({
    dest: '/tmp/file-uploads/',
    limits: {
        fileSize: config.maxUploadSize(),
    },
})

app.post('/compile', requireInternalToken, upload.any(), asyncRoute(async (req, res) => {
    // JSON single-file compilation.
    if (req.is('application/json')) {
        var latex = req.body && req.body.latex;
        if (!latex || typeof latex !== 'string')
            return sendError(res, 'ERROR: latex source is required.');

        var command = req.body.command || 'pdflatex';
        command = command.trim().toLowerCase();

        var preparation = await latexOnline.prepareTextCompilation(latex, command);
        if (preparation)
            await handleResult(res, preparation, false /* force */, null /* downloadName */);
        else
            sendError(res, 'ERROR: failed to parse request: ' + JSON.stringify(req.body));
        return;
    }

    // Multipart project archive compilation.
    if (!req.files || req.files.length !== 1) {
        if (req.files && req.files.length > 1) {
            for (var uploadedFile of req.files)
                utils.unlink(uploadedFile.path);
        }
        sendError(res, 'ERROR: files are not uploaded to server.');
        return;
    }
    var entry = req.body && req.body.entry ? req.body.entry : 'main.tex';
    var command = req.body && req.body.command ? req.body.command : 'pdflatex';
    command = command.trim().toLowerCase();
    var file = req.files[0];
    var preparation = await latexOnline.prepareTarballCompilation(file.path, entry, command);
    if (preparation)
        await handleResult(res, preparation, true /* force */, null /* downloadName */);
    else
        sendError(res, 'ERROR: failed to process file upload!');
    utils.unlink(file.path);
}));

app.post('/data', requireInternalToken, upload.any(), asyncRoute(async (req, res) => {
    if (!req.files || req.files.length !== 1) {
        sendError(res, 'ERROR: files are not uploaded to server.');
        return;
    }
    var command = req.query && req.query.command ? req.query.command : 'pdflatex';
    command = command.trim().toLowerCase();
    var file = req.files[0];
    var target = req.query.target || 'main.tex';
    var preparation = await latexOnline.prepareTarballCompilation(file.path, target, command);
    if (preparation)
        await handleResult(res, preparation, true /* force */, null /* downloadName */);
    else
        sendError(res, 'ERROR: failed to process file upload!');
    utils.unlink(file.path);
}));

/**
 * Runs an async route handler so that a rejected promise becomes a controlled
 * 500 response instead of an unhandled rejection that takes the process down.
 * @param {function(!Object, !Object): !Promise} handler
 */
function asyncRoute(handler) {
    return function(req, res) {
        Promise.resolve(handler(req, res)).catch(e => {
            logger.error('ERROR: unhandled error in route', {error: e && e.stack || String(e)});
            if (res.headersSent) {
                res.end();
            } else {
                sendError(res, 'Internal Server Error', 500);
            }
        });
    };
}

// Body-parsing failures (oversized uploads, oversized JSON) must produce a
// controlled response instead of the framework's HTML error page or a crash.
app.use(function(err, req, res, next) {
    if (err && err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).set('Content-Type', 'text/plain')
            .send('ERROR: uploaded file exceeds the maximum allowed size.');
        return;
    }
    if (err && err.type === 'entity.too.large') {
        res.status(413).set('Content-Type', 'text/plain').send('ERROR: request body is too large.');
        return;
    }
    next(err);
});

// Unhandled rejections and exceptions must never take the whole compiler
// service down silently.
process.on('unhandledRejection', reason => {
    logger.error('ERROR: unhandled rejection', {error: reason && (reason.stack || String(reason))});
});
process.on('uncaughtException', err => {
    logger.error('ERROR: uncaught exception', {error: err && err.stack || String(err)});
});

/**
 * Graceful shutdown:
 *  1. stop accepting new jobs,
 *  2. let in-flight compilations finish up to their configured timeout,
 *  3. force-terminate anything still running,
 *  4. exit cleanly.
 */
var shuttingDown = false;
var forced = false;

function shutdown(signal) {
    if (shuttingDown)
        return;
    shuttingDown = true;
    logger.info(`initiating graceful shutdown`, {signal});
    if (latexOnline)
        latexOnline.stopAdmission();

    var graceMs = config.compileTimeoutMs() + 10000;
    if (!server) {
        process.exit(0);
    }
    var forceTimer = setTimeout(() => {
        logger.warn('WARN: grace period expired, force-terminating remaining compilations');
        forced = true;
        if (latexOnline) {
            for (var compilation of latexOnline.inflightCompilations())
                compilation.terminate();
        }
        setTimeout(() => process.exit(1), 3000);
    }, graceMs);

    server.close(() => {});
    if (server.closeIdleConnections)
        server.closeIdleConnections();

    var pending = latexOnline ? latexOnline.compilations().map(c => Promise.resolve(c.run()).catch(() => {})) : [];
    Promise.all(pending).then(() => {
        clearTimeout(forceTimer);
        process.exit(forced ? 1 : 0);
    });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));