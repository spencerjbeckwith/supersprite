/** Tracks time delta to increment a value */
export class Timer {

    /** The actual value of the timer, including fractional points */
    #current: number;

    /** Timestamp when the Timer was first initialized */
    first: number;

    /** Timestamp when the Timer was last incremented */
    last: number;

    constructor() {
        this.#current = 0;
        this.first = Date.now();
        this.last = this.first;
    }

    /**
     * Increments the value of the timer according to the elapsed time since the last increment.
     * 
     * This should be called every frame.
     */
    increment() {
        const now = Date.now();
        const delta = now - this.last;
        this.last = now;
        this.#current += (delta / 1000) * 60;
    }

    /** Returns the amplitude of a wave (-1 to 1, inclusive) with the given period (in seconds) */
    wave(period = 2) {
        return Math.sin((Math.PI * 2 * this.#current) / (60 * period));
    }

    /** Current value of the Timer in frames since initialization, incrementing at 60 points per second to match the expected framerate */
    get current() {
        return Math.round(this.#current);
    }
}