#!/usr/bin/env node
import { program } from "commander";
import { Compositor } from "./Compositor";
import { FileSystemGatherer } from "./gatherers/FileSystemGatherer";
import fs from "fs";

// Read package JSON for version
let pkg = {
    version: "Unknown",
};
try {
    pkg = JSON.parse(fs.readFileSync("package.json").toString());
} catch (err) {
    console.error("Unable to read version from package.json: ", err);
}

program
    .name("supersprite")
    .description("atlas compilation tool")
    .version(pkg.version)
    .requiredOption("-d, --directory <dir>", "directory from which to load images for the atlas")
    .option("-a, --atlas [path]", "output png file for the atlas", "atlas.png")
    .option("-m, --map [map]", "output json file for the atlas map", "map.json")
    .option("-s, --silent", "suppress output")
    .option("-th, --height", "target atlas height, if desired");

program.parse();
const options = program.opts();

const g = new FileSystemGatherer({
    directory: options.directory,
    log: !options.silent,
});
const c = new Compositor(g, !options.silent, options.height);
c.run(options.atlas, options.map);
