# Autocomplete — Approach B: Constructor UI library

This demo theme shows four ways to add Constructor autocomplete to Shopify:

| Approach                       | What it is                                                 | Docs                                                         |
| ------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------ |
| **A. Constructor Connect app** | Constructor's Shopify app with a ready-made block, no code | [autocomplete-connect-app.md](./autocomplete-connect-app.md) |
| **B. UI library**              | Constructor's npm package, bundled build                   | **this doc**                                                 |
| **C. React environment**       | The same npm package, used as React components             | [autocomplete-react.md](./autocomplete-react.md)             |
| **D. Custom UI**               | Our own autocomplete on Constructor's JavaScript client    | [autocomplete-custom.md](./autocomplete-custom.md)           |

## How it works

We install Constructor's [Autocomplete UI library](https://github.com/Constructor-io/constructorio-ui-autocomplete) from npm and build it into a single file in `/assets`.

The Shopify theme then exposes it as a block, so you can add autocomplete from the theme editor and configure it without changing Liquid or JavaScript.

## Using it in Shopify

### 1. Set the API key

In the theme editor, go to:

**Theme settings → Constructor**

Paste your Constructor index key (`key_...`).

You can also override this key for an individual block if needed.

### 2. Create a demo page

In Shopify admin, go to:

**Online Store → Pages → Add page**

Under **Theme template**, select:

`page.cio-autocomplete-ui`

The template already contains the autocomplete section.

There's also a collection template, `collection.cio-autocomplete-ui`, with the autocomplete right above the product grid. Pick it under **Theme template** on any collection, or preview it by adding `?view=cio-autocomplete-ui` to a collection URL.

### 3. Or add the block yourself

In the theme editor, click **Add section** and select **CIO Autocomplete UI**.

You can also add the block inside a section that supports blocks, such as Horizon's generic **Section**.

### 4. Configure the block

Click the autocomplete block to see its settings.

The settings belong to the individual block, so you can have multiple autocomplete examples with different configurations. For example, one page could use recent searches while another uses the library's default styling.

If there is no API key, the block shows a small notice in the theme editor and doesn't render anything on the live store.

## Block settings

| Setting                       | What it does                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| API key                       | Overrides the key from Theme settings for this block.                                     |
| Search results URL            | URL to use for search results. If empty, the store's `/search` URL is used.               |
| Placeholder                   | Text displayed when the search box is empty.                                              |
| Open on focus                 | Opens the dropdown when the search box is focused.                                        |
| Search suggestions / Products | Number of suggestions and products to show. Set to `0` to hide a group.                   |
| Debounce                      | How long to wait after typing before requesting results from Constructor.                 |
| Suggestion images / counts    | Shows additional information next to suggestions.                                         |
| Show all results              | Adds a button at the bottom of the dropdown.                                              |
| Recent searches               | Shows the shopper's previous searches before they start typing.                           |
| Use theme styling             | Uses Horizon's colors, fonts, and border radius instead of the library's default styling. |
| Max width / Alignment         | Controls the size and position of the search box.                                         |
| Advanced options (JSON)       | Lets you pass additional options supported by the library.                                |

### Advanced options

The **Advanced options (JSON)** field is passed directly to the library. These options take precedence over the settings above.

For example, you can rename the products section and change the number of products shown:

```json
{
  "sections": [
    { "indexSectionName": "Search Suggestions", "numResults": 5 },
    { "indexSectionName": "Products", "displayName": "Top products", "numResults": 4 }
  ]
}
```

The full list of supported options is available in the library's [Storybook docs](https://constructor-io.github.io/constructorio-ui-autocomplete/).

Some options, such as `onSubmit`, are functions and can't be passed through JSON. Those need to be configured in JavaScript.

## What shoppers see

The block enables the library's **Shopify mode** (`useShopifyDefaults`), which provides the expected Shopify behavior:

* Typing fetches suggestions and products from Constructor.
* Clicking a product takes the shopper to that product's page.
* Clicking a suggestion or pressing Enter takes the shopper to `/search?q=...`.
* Tracking parameters already present in the URL, such as `utm_source`, are preserved.
* Click and search tracking is handled by the library, so no additional tracking code is needed.

Product links will only point to the correct Shopify products if the Constructor index was synced from **this store's catalog**.

## How it is wired

At a high level, the files work together like this:

```text
src/autocomplete-ui/cio-autocomplete-ui.build.js    ─┐
src/autocomplete-ui/overrides/custom-product-item.js │  (our own product markup)
src/autocomplete-ui/cio-autocomplete-ui.build.css   ─┤
                                                     │ npm run build
                                                     ▼
assets/cio-autocomplete-ui.min.js
assets/cio-autocomplete-ui.min.css
                                                     │
                                                     │ loaded by
                                                     ▼
blocks/cio-autocomplete-ui.liquid
sections/cio-autocomplete-ui.liquid
templates/page.cio-autocomplete-ui.json
templates/collection.cio-autocomplete-ui.json
config/settings_schema.json
```

The important pieces are:

* `blocks/cio-autocomplete-ui.liquid` — renders the block and its settings.
* `sections/cio-autocomplete-ui.liquid` — provides a section that contains the block.
* `templates/page.cio-autocomplete-ui.json` — ready-made page template for the demo.
* `config/settings_schema.json` — adds the shared Constructor API key to the theme settings.
* `src/autocomplete-ui/` — JavaScript and CSS source code.
* `src/autocomplete-ui/overrides/` — our own product markup (see [Overriding components](#overriding-components)).
* `src/autocomplete-shared/` — settings-to-options helper and theme CSS, shared with the React version.
* `assets/` — generated files that Shopify actually serves.

### From Liquid to the library

The Liquid block renders a custom HTML element:

```liquid
<cio-autocomplete-ui {{ block.shopify_attributes }}>
  <div id="cio-autocomplete-{{ block.id }}" data-cio-target></div>

  <script type="application/json" data-cio-settings>
    { "apiKey": "…", … }
  </script>
</cio-autocomplete-ui>
```

The JavaScript registers this element using `customElements.define()`.

Whenever the browser finds a `<cio-autocomplete-ui>` element, the setup code reads the JSON settings and passes them to the Constructor library:

```js
CioAutocomplete({ selector, ...options });
```

The library then renders the search box and dropdown inside the target `<div>`, using our own markup for products (see below).

## Overriding components

The UI library lets you replace parts of its UI with your own markup. We override one part, **the product items**, to show that it's possible. Everything else is the library's default.

### Why not React components?

In the [React version](./autocomplete-react.md#overriding-components) we pass our own React components as children. The bundled build can't do that: React is bundled **inside** the library, so our code can't hand it React components.

Instead, each section accepts a **`renderItem`** function that returns a **plain DOM element**.

### Example: our own product card

`src/autocomplete-ui/overrides/custom-product-item.js` builds a product card with image, title and price. It has a teal border (the React overrides are purple) so it's easy to tell apart from the library's default:

```js
export default function renderCustomProductItem({ item }) {
  const card = document.createElement('div');
  card.className = 'cio-custom-product';
  // … image, title and price
  return card;
}
```

We attach it to the **Products** section only, so suggestions keep the library's default look:

```js
sections: options.sections.map((section) =>
  section.indexSectionName === 'Products'
    ? { ...section, renderItem: renderCustomProductItem }
    : section
),
```

The library wraps the returned element in its own list item. That wrapper still handles, for us:

* clicking the product and navigating to its page;
* keyboard navigation and highlighting;
* Constructor's tracking events;
* the ARIA attributes for screen readers.

So we only write the markup, not the behavior.

The card is built with `textContent` and `setAttribute`, never `innerHTML`, so product names from the API can't inject HTML.

### What `renderItem` can and can't do

| Can | Can't |
| --- | --- |
| Replace one result (a product or a suggestion) | Replace the search input or the dropdown layout |
| Differ per section | Use React components or hooks |
| Use plain DOM APIs | Change the library's behavior (it still handles clicks and keys) |

If you need to replace the input or the dropdown layout, use the [React version](./autocomplete-react.md#overriding-components), which supports overriding every part of the UI.

### Why use a custom element?

Horizon already uses custom elements for its interactive components, such as `<predictive-search-component>` and `<dialog-component>`, so this approach fits naturally into the theme.

It also gives us a few useful things:

* **No manual initialization.** The browser initializes each `<cio-autocomplete-ui>` automatically, including elements added later by the theme editor.
* **Multiple instances.** Each element has its own settings, so you can have several autocomplete blocks on the same page.
* **Clear Liquid markup.** The HTML makes it obvious which part of the page is the autocomplete component.

There are two intentional limitations here:

* **No Shadow DOM.** The library injects its CSS into the page, and using Shadow DOM would prevent those styles from reaching the component. It would also make it harder for Horizon's color scheme variables to work.
* **Plain `HTMLElement`.** We don't extend Horizon's `Component` class because it is an ES module loaded through the theme's import map, while our build produces a regular script. We also don't need anything provided by `Component`.

One limitation of the library itself is that it doesn't expose an unmount function. Because of that, an element isn't mounted again if it is moved around, and removing an element doesn't clean up the library instance. This is mostly relevant when working in the Shopify theme editor.

## Why use the bundled package?

The library is built with React, but it also provides a bundled build that includes React itself. This means the Shopify theme doesn't need to load or manage React separately.

We import that build like this:

```js
import CioAutocomplete from '@constructor-io/constructorio-ui-autocomplete/constructorio-ui-autocomplete-bundled';
```

### Bundle size

Because React is included in the bundle, `cio-autocomplete-ui.min.js` is around **290 KB (about 88 KB gzipped)**.

The file is only loaded on pages where the autocomplete block is used, but the bundle size is still the main downside of this approach. This is one of the reasons we are also looking at **Approach D**, where we build the UI ourselves on top of Constructor's JavaScript client.

## Styling

The library provides its own base CSS. Its classes use the `cio-` prefix and are scoped under `.cio-autocomplete`.

When **Use theme styling** is enabled, the component also gets the `.cio-theme` class. Our CSS then uses Horizon's CSS variables, such as:

```css
--color-foreground
--style-border-radius-inputs
```

This allows the autocomplete to follow the theme's colors, fonts, and other styling.

To change the styling, edit:

`src/autocomplete-shared/cio-theme.css` (shared with the React version), or `src/autocomplete-ui/cio-autocomplete-ui.build.css` for the wrapper only.

Then run:

```sh
npm run build
```

## Updating the library

To update the Constructor UI library:

```sh
npm install @constructor-io/constructorio-ui-autocomplete@latest
npm run build
```

Commit the updated:

* `package.json`
* `package-lock.json`
* `assets/cio-autocomplete-ui.min.js`
* `assets/cio-autocomplete-ui.min.css`
