var MB = 1024 * 1024;

/**
 * Central environment-driven configuration.
 *
 * Every value is read lazily on access so tests and operators can change
 * process.env at runtime. All limits are configurable and default to safe
 * production values.
 */
var config = {
    /**
     * @return {number}
     */
    port: () => positiveInt('PORT', 2700),

    /**
     * @return {number}
     */
    nodeEnv: () => process.env.NODE_ENV || 'development',

    /**
     * @return {number} milliseconds
     */
    compileTimeoutMs: () => positiveInt('LATEX_COMPILE_TIMEOUT_MS', 60 * 1000),

    /**
     * @return {number} bytes
     */
    maxOutputSize: () => positiveInt('LATEX_MAX_OUTPUT_SIZE', 100 * MB),

    /**
     * @return {number} bytes
     */
    maxLogSize: () => positiveInt('LATEX_MAX_LOG_SIZE', 100 * MB),

    /**
     * Maximum total size of a job's workspace (staged project plus compiler
     * intermediates) while it is running. Mirrors the per-job container
     * tmpfs budget so the in-process executor behaves like the isolated one.
     * @return {number} bytes
     */
    maxWorkspaceSize: () => positiveInt('LATEX_MAX_WORKSPACE_SIZE', 1024 * MB),

    /**
     * @return {number}
     */
    maxConcurrentCompilations: () => positiveInt('LATEX_MAX_CONCURRENT_COMPILATIONS', 4),

    /**
     * Minimum free bytes required on the results filesystem before new
     * compilations are admitted.
     * @return {number} bytes
     */
    minFreeSpace: () => positiveInt('LATEX_MIN_FREE_SPACE', 1024 * MB),

    /**
     * Maximum size of a single uploaded multipart body (project archive).
     * This caps the file that multer spills to the upload directory BEFORE
     * the tar extractor applies its own archive size limit, so a huge upload
     * cannot fill the staging filesystem.
     * @return {number} bytes
     */
    maxUploadSize: () => positiveInt('LATEX_MAX_UPLOAD_SIZE', 60 * MB),

    /**
     * Path of the download/staging folder.
     * @return {string}
     */
    tmpFolder: () => process.env.LATEX_TMP_FOLDER || '/tmp/downloads',

    /**
     * Path of the results/cache folder.
     * @return {string}
     */
    resultsFolder: () => process.env.LATEX_RESULTS_FOLDER || '/tmp/storage',

    /**
     * Host path of the staging/download folder as seen by the Docker daemon.
     * When the service itself runs inside a container, its LATEX_TMP_FOLDER
     * may be a volume mounted from a different path on the host; job
     * containers must mount the HOST path, not the in-container one.
     * Defaults to tmpFolder() (no translation).
     * @return {string}
     */
    executorTmpHostPath: () => process.env.LATEX_EXECUTOR_TMP_HOST_PATH || config.tmpFolder(),

    /**
     * Host path of the results folder as seen by the Docker daemon (see
     * executorTmpHostPath). Defaults to resultsFolder() (no translation).
     * @return {string}
     */
    executorResultsHostPath: () => process.env.LATEX_EXECUTOR_RESULTS_HOST_PATH || config.resultsFolder(),

    /**
     * Shared secret used for service-to-service authentication.
     * @return {?string}
     */
    internalToken: () => process.env.COMPILER_INTERNAL_TOKEN || null,

    /**
     * Maximum number of engine passes before a native compilation is declared
     * complete. Compilations stop earlier as soon as the aux file settles, so
     * this is an upper bound rather than the usual run count.
     * @return {number}
     */
    maxPasses: () => positiveInt('LATEX_MAX_PASSES', 3),

    /**
     * Executor strategy:
     *  - 'none' runs the latexrun pipeline in-process (development default);
     *  - 'native' runs the TeX engine binary directly (production default for
     *    Docker-deployed services, no containers inside the container);
     *  - 'docker' runs each compilation in a one-shot, hardened container.
     * Any unknown value falls back to the environment default.
     * @return {string}
     */
    executor: () => {
        var raw = String(process.env.LATEX_EXECUTOR || '').toLowerCase();
        if (raw === 'docker' || raw === 'native' || raw === 'none')
            return raw;
        return config.nodeEnv() === 'production' ? 'native' : 'none';
    },

    /**
     * @return {string}
     */
    executorImage: () => process.env.LATEX_EXECUTOR_IMAGE || 'latex-online:biblatex-fixed',

    /**
     * @return {string}
     */
    executorCpus: () => process.env.LATEX_EXECUTOR_CPUS || '1',

    /**
     * @return {string}
     */
    executorMemory: () => process.env.LATEX_EXECUTOR_MEMORY || '2g',

    /**
     * @return {string}
     */
    executorMemorySwap: () => process.env.LATEX_EXECUTOR_MEMORY_SWAP || '2g',

    /**
     * @return {number}
     */
    executorPidsLimit: () => positiveInt('LATEX_EXECUTOR_PIDS_LIMIT', 256),

    /**
     * @return {string}
     */
    executorWorkspaceSize: () => process.env.LATEX_EXECUTOR_WORKSPACE_SIZE || '1g',

    /**
     * @return {string}
     */
    executorTmpSize: () => process.env.LATEX_EXECUTOR_TMP_SIZE || '256m',

    /**
     * UID the job container runs as (must not be root). Defaults to the uid
     * the orchestrator runs under so that job artifacts written into host
     * mounts are always owned by the user that cleans them up.
     * @return {string|number}
     */
    executorUser: () => process.env.LATEX_EXECUTOR_USER || String(process.getuid ? process.getuid() : 1000),
};

/**
 * @param {string} name
 * @param {number} fallback
 * @return {number}
 */
function positiveInt(name, fallback) {
    var value = parseInt(process.env[name], 10);
    return isFinite(value) && value > 0 ? value : fallback;
}

module.exports = config;