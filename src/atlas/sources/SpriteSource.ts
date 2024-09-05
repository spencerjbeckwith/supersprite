import { SpriteData } from "../../types";

// TODO document SpriteSource
export abstract class SpriteSource {
    abstract read(): Promise<SpriteData>;
}