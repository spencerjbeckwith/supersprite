# supersprite webpack example

This example contains a configuration that compiles a TypeScript project using supersprite to run in the browser using webpack. As opposed to the rollup example, this does not show off any of supersprite's features.

To get this example running locally:

```
cd examples/webpack
npm install
npm run build
npm run serve
```

Then open [http://localhost:3000](index.html) in your web browser.

If no textures are showing up, make sure you are opening the page after having `npm run serve`d it, because the atlas cannot be loaded over the `file://` protocol and browsers will complain about it.

## Scripts

- `npm run build` will build the example app.
- `npm run refresh` will rebuild supersprite, reinstall it into this subdirectory, and rebuild the example app. This is very useful if developing supersprite locally and you want to test a live browser example.
- `npm run serve` will start a local server to load the example from. This is necessary because the atlas image cannot be served over the `file://` protocol securely.