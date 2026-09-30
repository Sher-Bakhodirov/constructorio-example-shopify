# Autocomplete - Approach C: React environment

This demo theme shows four ways to add Constructor autocomplete to Shopify:

| Approach                            | What it is                                                                               | Status  |
| ----------------------------------- | ---------------------------------------------------------------------------------------- | ------- |
| **A. Constructor Connect app**      | Constructor's Shopify app with a ready-made block                                        | Planned |
| **B. UI library**                   | Constructor's npm package using its bundled build ([docs](./autocomplete-ui-library.md)) | ✅ Done  |
| **C. React environment (this doc)** | The same npm package used as React components inside the Shopify theme                   | ✅ Done  |
| **D. Custom UI**                    | A custom autocomplete built on Constructor's JavaScript client ([docs](./autocomplete-custom.md))                           | ✅ Done |

## How it works

Some merchants already use React on their storefront. For those stores, Constructor's React component can be used directly:

```jsx
import { CioAutocomplete } from '@constructor-io/constructorio-ui-autocomplete';

import '@constructor-io/constructorio-ui-autocomplete/styles.css';

<CioAutocomplete apiKey="key_…" useShopifyDefaults />
```

This approach shows how to do the same thing inside a Shopify theme.

We install React and the Constructor library from npm, build a small React app in `/src`, and use our [build setup](./build-setup.md) to compile it into files that Shopify can serve from `/assets`.

The resulting autocomplete is based on the same Constructor library and uses the same Shopify configuration as Approach B. The main difference is how the library is integrated: instead of using Constructor's bundled JavaScript build, we use its React components directly.

## Approach B vs. Approach C

|                                        | B. UI library (bundled)                       | C. React environment                                                            |
| -------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------- |
| What we import                         | `…/constructorio-ui-autocomplete-bundled`     | `<CioAutocomplete />` React component                                           |
| Who provides React                     | The library's bundled React 18                | `react` + `react-dom` from our `package.json` (React 19)                        |
| How it starts                          | `CioAutocomplete({ selector, ...options })`   | `createRoot(target).render(<Autocomplete options={options} />)`                 |
| Can we use it with our own React code? | No, the library's React is bundled internally | Yes, we can wrap it, add components, and use hooks such as `useCioAutocomplete` |
| Clean-up when removed                  | Not supported by the library                  | `root.unmount()`                                                                |
| File size                              | ~290 KB (~84 KB gzipped)                      | ~360 KB (~106 KB gzipped)                                                       |

The React version is somewhat larger because we're building the React packages ourselves instead of using Constructor's pre-built bundle.

If the merchant's storefront already loads React, it can potentially be shared with the autocomplete instead of loading another copy.

## Using it in Shopify

The Shopify setup is very similar to Approach B:

1. **Set the API key**
   Go to **Theme settings → Constructor**, or override it for an individual block.

2. **Create a demo page**
   Create a page and select the `page.cio-autocomplete-react` template.

3. **Or add it yourself**
   In the theme editor, select **Add section → CIO Autocomplete React**. You can also add the block inside Horizon's generic **Section**.

4. **Configure the block**
   The block exposes the same settings as Approach B, including **Advanced options (JSON)**.

You can also put the B and C blocks on the same page if you want to compare the two implementations.

## How it is wired

```text
src/autocomplete-react/
├── cio-autocomplete-react.build.jsx   ← custom element + React root
├── Autocomplete.jsx                   ← React app
└── cio-autocomplete-react.build.css

src/autocomplete-shared/
├── options.js                         ← shared with Approach B
└── cio-theme.css                      ← shared styling

                 npm run build
                       │
                       ▼
assets/
├── cio-autocomplete-react.min.js
└── cio-autocomplete-react.min.css

                       │
                       ▼
blocks/cio-autocomplete-react.liquid
sections/cio-autocomplete-react.liquid
templates/page.cio-autocomplete-react.json
```

### From Liquid to React

The flow is:

1. **Liquid renders the custom element.**
   The block outputs a `<cio-autocomplete-react>` element containing an empty `<div>` and the block settings as JSON, just like Approach B.

2. **The custom element creates a React root.**
   It reads the settings using the shared `readOptions` function and mounts React into the target `<div>`:

   ```jsx
   this.root = createRoot(target);
   this.root.render(<Autocomplete options={options} />);
   ```

3. **`Autocomplete.jsx` renders the Constructor component.**
   It is a normal React component and renders:

   ```jsx
   <CioAutocomplete {...options} />
   ```

   This is also the part a merchant could take as a starting point for their own React application.

4. **The React root is cleaned up when the element is removed.**
   Shopify's theme editor can remove and recreate sections while editing. When that happens, `disconnectedCallback` calls `root.unmount()` so the React tree is cleaned up properly.

### Why use a custom element?

The custom element is the bridge between Shopify and React.

Liquid can't render a React component directly, but it can render an HTML element. The custom element gives us a place to:

* read the settings generated by Liquid;
* create the React root;
* tell React where to render;
* clean up the React tree when Shopify removes the element.

Each autocomplete block gets its own React root, so multiple blocks can be used on the same page.

## Adding your own React code

Everything under `src/autocomplete-react/` is regular React, so you can extend it like any other React application.

For example, you can:

* Wrap `<CioAutocomplete>` in your own components or context providers.
* Pass function props that can't be represented in JSON, such as a custom `onSubmit` or `renderItem`.
* Build a completely custom autocomplete UI using the library's `useCioAutocomplete` hook.

See the [Storybook docs](https://constructor-io.github.io/constructorio-ui-autocomplete/) for the available React components, props, and hooks.

## React build setup

The theme's build setup needs a few additional dependencies and configuration to support React:

| Change                                                                  | Why                                                                                                                                   |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `react`, `react-dom`                                                    | React itself.                                                                                                                         |
| `downshift`, `tslib`, `@constructor-io/constructorio-client-javascript` | Peer dependencies required by the Constructor library. `downshift` must be v7.                                                        |
| `@babel/preset-react` in `babel.config.js`                              | Compiles JSX such as `<Component />` into JavaScript. With `runtime: 'automatic'`, React doesn't need to be imported into every file. |
| `.build.jsx` entries in `webpack.config.js`                             | Allows `foo.build.jsx` to be used as a build entry point and output as `assets/foo.min.js`.                                           |

Webpack also tells Babel whether it's creating a development or production build, so the React build is configured correctly for each environment.

## Styling

The library's default CSS is imported directly from the React entry point:

```jsx
import '@constructor-io/constructorio-ui-autocomplete/styles.css';
```

Webpack extracts it into:

`assets/cio-autocomplete-react.min.css`

Unlike Approach B, the CSS isn't injected by the library at runtime.

When **Use theme styling** is enabled, the component gets the `.cio-theme` class. The theme-specific styles come from the shared:

`src/autocomplete-shared/cio-theme.css`

This is the same styling used by Approach B, so both approaches can use the same Horizon-based look.

## Updating the library

To update the Constructor UI library:

```sh
npm install @constructor-io/constructorio-ui-autocomplete@latest
npm run build
```

The library may update its peer dependencies when a new version is released. You can check them with:

```sh
npm view @constructor-io/constructorio-ui-autocomplete peerDependencies
```

If necessary, update `react`, `react-dom`, or `downshift` as well.

Then commit the updated `package.json`, `package-lock.json`, and rebuilt `assets/cio-autocomplete-*.min.*` files.
