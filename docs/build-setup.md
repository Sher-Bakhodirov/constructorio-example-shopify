# Build setup (JS & CSS)

This theme has a small build step for JavaScript and CSS. You don't need it for the Constructor integration, so you can skip it and have your own setup.

The idea is simple: you write your code in `/src`, and **webpack** builds it into browser-ready files in `/assets`, which Shopify can serve.

## How it works

There is only one convention to remember:

> **Only files ending in `.build.js`, `.build.jsx` or `.build.css` are built.**

For example:

| Source                        | Output                  |
| ----------------------------- | ----------------------- |
| `src/search/search.build.js`  | `assets/search.min.js`  |
| `src/search/search.build.css` | `assets/search.min.css` |
| `src/search/search.build.jsx` | `assets/search.min.js` (React/JSX) |
| `src/search/helpers.js`       | —                       |

Files without `.build` are just helpers. They won't produce their own file in `/assets`; they are included when a `.build` file imports them.

## Getting started

You need [Node.js](https://nodejs.org/) installed.

From the project root:

```sh
npm install        # first time only
npm run dev        # rebuild while you work
npm run build      # create the final minified files
```

While developing, run `npm run dev` in one terminal and `shopify theme dev` in another.

Webpack watches `/src` and writes the output to `/assets`. The Shopify CLI then picks up those changes and uploads them to your development store.

## What happens during the build

### JavaScript (`*.build.js` / `*.build.jsx`)

Webpack:

1. Follows the `import`s and bundles everything into one file.
2. Uses **Babel** to transform modern JavaScript syntax for the browsers we support, and to turn React's JSX (`<Component />`) into plain JavaScript.
3. Uses **Terser** to minify the result.

### CSS (`*.build.css`)

The CSS build:

1. Inlines any `@import`ed CSS.
2. Uses **Autoprefixer** to add browser prefixes such as `-webkit-` when needed.
3. Minifies the result.

The supported browsers are configured through `browserslist` in `package.json`. At the moment, it uses `"defaults"`.

## Adding a new entry point

If you want to add a new JS or CSS entry point:

1. Create a `.build` file, for example:

   `src/autocomplete/autocomplete.build.js`

2. Run `npm run build`.

   If `npm run dev` is already running, restart it. New entry points are detected when webpack starts.

3. Webpack will create:

   `assets/autocomplete.min.js`

4. You can then include it from Liquid:

```liquid
<script src="{{ 'autocomplete.min.js' | asset_url }}" defer></script>

{{ 'autocomplete.min.css' | asset_url | stylesheet_tag }}
```

## Imports

You can import local files using relative paths or `@/`, which points to `/src`.

```js
import { log } from '@/utils/log';

// Same as:
// import { log } from '../utils/log';
```

You can also use npm packages:

```sh
npm install some-package
```

```js
import x from 'some-package';
```

## A few things to keep in mind

* **The folder structure doesn't affect the output filename.**
  `src/a/b/foo.build.js` becomes `assets/foo.min.js`. This means two build files can't have the same filename, even if they're in different folders.

* **JS and CSS can have the same name.**
  `foo.build.js` and `foo.build.css` become `foo.min.js` and `foo.min.css`.

* **Commit the generated `.min` files.**
  Shopify only gets the files in `/assets`, so the built files need to be committed and deployed.

* **Don't edit `.min` files manually.**
  Your changes will be overwritten the next time you run the build. Make changes in `/src` instead.

* **Existing theme assets are not affected.**
  The build only handles files from `/src`. It doesn't modify or delete the existing JS/CSS files in `/assets`.

* **CSS `url(...)` values are kept as-is.**
  This allows Shopify asset URLs to work normally.

* **Development and production builds are different.**
  `npm run dev` produces unminified files with source maps, which makes browser errors point back to your original `/src` files. Run `npm run build` before committing so the committed files are the final minified versions.

## Files involved

| File                   | Purpose                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `package.json`         | Defines the dependencies and `npm run dev` / `npm run build` scripts.                                                      |
| `webpack.config.js`    | Finds `*.build.*` files and configures the build output.                                                                   |
| `babel.config.js`      | Babel configuration for JavaScript.                                                                                        |
| `postcss.config.js`    | PostCSS and Autoprefixer configuration.                                                                                    |
| `.shopifyignore`       | Prevents `/src`, `/docs`, `node_modules`, and build configuration files from being uploaded to Shopify.                    |
| `src/autocomplete-ui/` | Example implementation of the Constructor Autocomplete UI. See [autocomplete-ui-library.md](./autocomplete-ui-library.md). |
| `src/autocomplete-react/` | The same UI library used as React components. See [autocomplete-react.md](./autocomplete-react.md). |
| `src/autocomplete-custom/` | Custom autocomplete UI on Constructor's JS client. See [autocomplete-custom.md](./autocomplete-custom.md). |
| `src/autocomplete-shared/` | Helpers and theme CSS shared by the autocomplete demos. |
