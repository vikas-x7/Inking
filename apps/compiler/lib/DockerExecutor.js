var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');
var config = require('./config');

var logger = require('./utilities').logger('DockerExecutor');

var jobCounter = 0;

/**
 * One-shot, hardened, per-compilation container executor.
 *
 * Each compilation is run with `docker run --rm` under strict flags:
 *  - non-root user
 *  - CPU / memory / PID limits
 *  - read-only root filesystem
 *  - isolated writable workspace (mount) and tmpfs /tmp
 *  - no network
 *  - all capabilities dropped, no-new-privileges
 *  - automatic container removal on completion
 *
 * The job container never sees the Docker socket, the host filesystem, other
 * jobs' workspaces, or the persistent results volume directly: results are
 * written into the job's own results mount and validated/copied by the
 * orchestrator afterwards.
 */
class DockerExecutor {
    /**
     * @param {string} workdirPath absolute host path of the staged project
     * @param {string} targetRelativePath absolute host path of the .tex target
     * @param {string} command pdflatex | xelatex | lualatex
     * @param {string} outputPath absolute host path for output.pdf
     * @param {string} logPath absolute host path for log.txt
     * @return {{pid: number, kill: function(), done: !Promise<!{exitOk: boolean}>}}
     */
    start(workdirPath, targetRelativePath, command, outputPath, logPath) {
        var outputFolder = path.dirname(outputPath);
        var relTarget = path.relative(workdirPath, targetRelativePath);
        var outputBase = path.basename(outputPath);
        var logBase = path.basename(logPath);

        // The Docker daemon resolves bind-mount sources against the HOST
        // filesystem. When the service itself runs in a container, the
        // paths it uses internally can be mounts of different host paths
        // (e.g. /results <- /tmp/storage), so the job mounts must reference
        // the daemon-visible paths, otherwise Docker creates root-owned
        // placeholder dirs that the non-root job cannot write.
        var hostWorkdir = toHostPath(workdirPath, config.tmpFolder(), config.executorTmpHostPath());
        var hostOutputFolder = toHostPath(outputFolder, config.resultsFolder(), config.executorResultsHostPath());

        // Container user must be able to write into the job-scoped directories.
        // These are per-job scratch areas owned exclusively by this job.
        makeWorldWritable(workdirPath);
        makeWorldWritable(outputFolder);

        var name = 'latexon_' + (++jobCounter) + '_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
        var args = [
            'run',
            '--rm',
            '--name', name,
            '--network', 'none',
            '--cpus', config.executorCpus(),
            '--memory', config.executorMemory(),
            '--memory-swap', config.executorMemorySwap(),
            '--pids-limit', String(config.executorPidsLimit()),
            '--cap-drop=ALL',
            '--security-opt=no-new-privileges',
            '--read-only',
            '--tmpfs', '/tmp:size=' + config.executorTmpSize() + ',nodev,nosuid',
            '--user', config.executorUser(),
            '-v', hostWorkdir + ':/work',
            '-v', hostOutputFolder + ':/results',
            config.executorImage(),
            'bash', '/app/shells/compile.sh',
            '/work', relTarget, command, '/results/' + outputBase, '/results/' + logBase,
        ];

        logger.info('Running compile in isolated container', {name, workdir: workdirPath});

        var child = spawn('docker', args, {detached: true, stdio: 'ignore'});

        return {
            pid: child.pid || null,
            kill: function() {
                logger.info(`Stopping container ${name}`);
                spawn('docker', ['stop', '-t', '1', name], {detached: true, stdio: 'ignore'}).unref();
            },
            done: new Promise(resolve => {
                child.on('close', code => resolve({exitOk: code === 0}));
                child.on('error', err => {
                    logger.error(`ERROR: failed to launch docker executor: ${err.message}`);
                    resolve({exitOk: false});
                });
            }),
        };
    }
}

/**
 * @param {string} dirPath
 */
function makeWorldWritable(dirPath) {
    try {
        fs.chmodSync(dirPath, 0o777);
    } catch (e) {
        logger.error(`ERROR: failed to make ${dirPath} accessible to executor: ${e.message}`);
    }
}

/**
 * Translates a daemon-visible path by replacing the service-side base prefix
 * with its host counterpart. When both are equal (the common host deployment)
 * the path is returned unchanged.
 *
 * @param {string} targetPath
 * @param {string} serviceBase
 * @param {string} hostBase
 * @return {string}
 */
function toHostPath(targetPath, serviceBase, hostBase) {
    if (serviceBase === hostBase)
        return targetPath;
    var prefix = serviceBase.endsWith('/') ? serviceBase : serviceBase + '/';
    if (targetPath === serviceBase)
        return hostBase;
    if (targetPath.indexOf(prefix) === 0)
        return hostBase + targetPath.substring(serviceBase.length);
    return targetPath;
}

module.exports = DockerExecutor;