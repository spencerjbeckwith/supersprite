import { SpriteSource } from "../sources/SpriteSource";

/** Base config options for all Gatherer subclasses */
export interface GathererConfig {
    /** If this Gatherer should print log messages to stdout. Defaults to false. */
    log?: boolean;
};

/**
 * Abstract base class used to gather a list of SpriteSources when compiling an atlas.
 * The type argument is merged into the config object and can be used to extend functionality.
 * 
 * Note that this class doesn't actually *load* the sprites - it should instead initialize and return an array of `SpriteSource` objects,
 * on which the `read()` method actually fetches their buffer data from the source. This class only determines *what* to load.
*/
export abstract class Gatherer<T = {}> {

    /** Config object assigned in Gatherer constructor */
    config: T & GathererConfig;

    constructor(config: T & GathererConfig) {
        this.config = config;
    }

    /** Determine all SpriteSources that will be composited into the atlas. Should be overridden in child classes and may be asynchronous. */
    abstract gather(): Promise<SpriteSource[]>;

    /** Prints a log message about this Gatherer, if logging is enabled. Useful to debug subclasses. */
    log(message: any) {
        if (this.config.log) {
            console.log(message);
        }
    }
}