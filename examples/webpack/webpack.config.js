const path = require("path");

module.exports = {
    entry: "./src/index.ts",
    mode: "development",
    module: {
        rules: [{
            test: /\.ts$/,
            use: "ts-loader",
        }],
    },
    resolve: {
        extensions: [".ts", ".js", ".json"],
        alias: {
            "supersprite": path.resolve(__dirname, "../../dist"),
        },
    },
    output: {
        filename: "index.js",
        path: path.resolve(__dirname, "dist"),
    }
}