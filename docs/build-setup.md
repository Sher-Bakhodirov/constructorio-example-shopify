# Build setup (JS & CSS)

This theme has a small build step. You write code in `/src`, and **webpack** turns it into small, browser-ready files in `/assets`, which is the folder Shopify serves.

## The one rule

> **Only files named `*.build.js` or `*.build.css` get built.**

That's the whole convention.

| You write in `/src`                        | You get in `/assets`   |
| ------------------------------------------ | ---------------------- |
| `src/search/search.build.js`               | `assets/search.min.js` |
| `src/search/search.build.css`              | `assets/search.min.css`|
| `src/search/helpers.js` (no `.build`)      | nothing on its own     |

Files **without** `.build` in the name are helpers. They don't become files in `/assets`. They only end up in the output when a `.build` file imports them.

## Quick start

You need [Node.js](https://nodejs.org) installed. Then, from the project root:

```sh
npm install        # once, to download the build tools
npm run dev        # while you work: rebuilds every time you save
npm run build      # before you commit or deploy: final, minified files
```

Run `npm run dev` in one terminal and `shopify theme dev` in another. Webpack writes to `/assets`, and the Shopify CLI uploads the changes to your store.

## What happens to your code

**JavaScript** (`*.build.js`)
1. Webpack pulls in everything the file `import`s and combines it into **one file**.
2. **Babel** rewrites modern syntax so the browsers we support can run it.
3. **Terser** minifies it: removes spaces and comments and shortens names.

**CSS** (`*.build.css`)
1. Any `@import`ed CSS is inlined into **one file**.
2. **Autoprefixer** adds browser prefixes such as `-webkit-` where they're needed.
3. The result is minified.

Which browsers count as "supported" is set in the `browserslist` field of `package.json`. Right now it's `"defaults"`, meaning current, widely used browsers.

## Adding a new file

1. Create a file, e.g. `src/autocomplete/autocomplete.build.js`.
2. Run `npm run build`. If `npm run dev` is running, stop it and start it again, because new files are only found at startup.
3. You now have `assets/autocomplete.min.js`. Load it in Liquid:

```liquid
<script src="{{ 'autocomplete.min.js' | asset_url }}" defer></script>
{{ 'autocomplete.min.css' | asset_url | stylesheet_tag }}
```

## Imports

You can import helpers with relative paths, or with `@/`, which points to `/src`:

```js
import { log } from '@/utils/log';   // same as '../utils/log'
```

npm packages work too. `npm install some-package`, then `import x from 'some-package'`.

## Good to know

- **Folders don't matter for the output name.** `src/a/b/foo.build.js` still becomes `assets/foo.min.js`. So two build files can't share a name. If they do, the build stops and tells you which ones clash.
- **A `.js` and a `.css` with the same name are fine.** `foo.build.js` + `foo.build.css` → `foo.min.js` + `foo.min.css`.
- **Commit the `.min` files.** Shopify only sees `/assets`, so the built files must be in git (and deployed).
- **Don't edit `.min` files by hand.** The next build overwrites them. Change the file in `/src` instead.
- **Horizon's own files are untouched.** The original theme JS/CSS in `/assets` is not part of this build, and the build never deletes anything in `/assets`.
- **`url(...)` in CSS is left as-is**, so Shopify asset URLs keep working.
- **Dev vs. build:** `npm run dev` output isn't minified and includes source maps, so errors in the browser point to your original `/src` lines. Always run `npm run build` before committing.

## The files involved

| File                | What it does                                                          |
| ------------------- | --------------------------------------------------------------------- |
| `package.json`      | Lists the tools and defines `npm run dev` / `npm run build`.          |
| `webpack.config.js` | Finds the `*.build.*` files and says where to put the results.        |
| `babel.config.js`   | Babel settings for JavaScript.                                        |
| `postcss.config.js` | Autoprefixer settings for CSS.                                        |
| `.shopifyignore`    | Stops `/src`, `/docs`, `node_modules`, and configs from being uploaded to Shopify. |
| `src/example/`      | A small working example (`example.build.js` / `.css`). Delete it once you have real files. |
