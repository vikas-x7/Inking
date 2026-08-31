/**
 * A tiny global concurrency limiter (counting semaphore).
 *
 * It does not queue: callers either get a slot now or are told to retry.
 * This bounds the number of simultaneously running compilations to a fixed
 * configured maximum without introducing a heavyweight queue.
 */
class ConcurrencyLimiter {
    /**
     * @param {number} max
     */
    constructor(max) {
        this._max = max;
        this._running = 0;
        this._releases = new Set();
    }

    /**
     * @return {number}
     */
    max() {
        return this._max;
    }

    /**
     * @return {number}
     */
    running() {
        return this._running;
    }

    /**
     * @return {number}
     */
    available() {
        return Math.max(0, this._max - this._running);
    }

    /**
     * @return {boolean}
     */
    isFull() {
        return this._running >= this._max;
    }

    /**
     * Reserve one slot without waiting.
     *
     * @return {?function()} A release function, or null if at capacity.
     */
    tryAcquire() {
        if (this._running >= this._max)
            return null;
        this._running++;
        var release = () => {
            if (this._releases.delete(release))
                this._running--;
        };
        this._releases.add(release);
        return release;
    }
}

module.exports = ConcurrencyLimiter;