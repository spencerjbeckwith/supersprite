import { SpriteData } from "../../types";

/** Describes a source from which a sprite is loaded. Subclass to load sprites in different ways. */
export abstract class SpriteSource {
    /** Async method to read data from the source this object describes, returning an object including a Buffer. Must be overridden in child classes. */
    abstract read(): Promise<SpriteData>;
}