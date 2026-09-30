# PLP — Approach B: Constructor UI library

This demo theme shows four ways to add a Constructor-powered product listing page (PLP) to Shopify:

| Approach                       | What it is                                            | Docs                           |
| ------------------------------ | ----------------------------------------------------- | ------------------------------ |
| **A. Constructor Connect app** | Constructor's Shopify app with a ready-made PLP block | No doc yet                     |
| **B. UI library**              | Constructor's npm package, bundled build              | **this doc**                   |
| **C. React environment**       | The same npm package, used as React components        | [plp-react.md](./plp-react.md) |
| **D. Custom UI**               | Our own PLP on Constructor's JavaScript client        | Not built yet                  |

PLP stands for **product listing page**: the grid of products with filters, sorting and pagination that shoppers see on a collection page or on search results.

## How it works

We install Constructor's [PLP UI library](https://github.com/Constructor-io/constructorio-ui-plp) from npm and use its **bundled build**. The bundled build has React inside it, so the theme doesn't need to install or manage React itself.

Instead of rendering a React component, we call a function with a CSS selector:

```js
import CioPlp from '@constructor-io/constructorio-ui-plp/constructorio-ui-plp-bundled';

CioPlp({
  selector: '#cio-plp-…',
  apiKey: 'key_…',
  useShopifyDefaults: true,
});
```

The library finds the element and renders the whole PLP inside it. The options are the same props the React `<CioPlp>` component takes.

**The library decides what to show from the URL:**

* `/collections/shoes` → browse the `shoes` group
* `/search?q=shoe` → search for `shoe`

So the same block works on both collection and search pages.

## Using it in Shopify

### 1. Set the API key

In the theme editor, go to:

**Theme settings → Constructor**

Paste your Constructor index key (`key_...`). You can also override it for an individual block.

### 2. Use it on a collection page

In Shopify admin, open a collection and, under **Theme template**, select:

`collection.cio-plp-ui`

### 3. Use it on the search page

In the theme editor, open **Search** and select the `search.cio-plp-ui` template.

### 4. Or preview without assigning

Add `?view=cio-plp-ui` to any collection or search URL:

```text
/collections/shoes?view=cio-plp-ui
/search?q=shoe&view=cio-plp-ui
```

You can also add **CIO PLP UI** as a section from the theme editor.

## Block settings

| Setting                 | What it does                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| API key                 | Overrides the key from Theme settings for this block.                                                                |
| Products per page       | How many products each page shows.                                                                                   |
| Use custom product card | Shows our own product card (see [Overriding components](#overriding-components)). Off = the library's default card. |

## The templates

Both templates keep Horizon's page heading and **replace Horizon's product grid** with the Constructor PLP:

```text
collection.cio-plp-ui.json          search.cio-plp-ui.json
├── section   ← collection title    ├── search   ← "Search results" + search box
└── plp       ← Constructor PLP     └── plp      ← Constructor PLP
```

## What shoppers see

It behaves the same as the React version:

* Filters (for example price, color, vendor and size), sorting and pagination.
* On search pages, a results header such as "357 results for 'shoe'", plus category filters.
* Filtering, sorting and changing pages keep Shopify's URLs, for example `/collections/shoes?filters[color]=Black`.
* Clicking a product opens its product page on the current domain.
* **Add to cart** adds the product to the Shopify cart and refreshes Horizon's cart drawer and cart icon. If **Auto-open cart drawer** is on in the theme settings, the drawer opens.

## How it is wired

```text
src/plp-ui/
├── cio-plp-ui.build.js                 ← custom element + CioPlp({ selector, … })
├── overrides/custom-product-card.js    ← our own product card (DOM)
└── cio-plp-ui.build.css

src/plp-shared/                          ← shared with the React version
├── shopify.js                           ← product links, add to cart, prices
└── cio-plp-theme.css                    ← card styles, checkbox fix

                 npm run build
                       │
                       ▼
assets/
├── cio-plp-ui.min.js
└── cio-plp-ui.min.css
                       │
                       ▼
blocks/cio-plp-ui.liquid
sections/cio-plp-ui.liquid
templates/collection.cio-plp-ui.json
templates/search.cio-plp-ui.json
```

### From Liquid to the library

The Liquid block renders a custom HTML element:

```liquid
<cio-plp-ui {{ block.shopify_attributes }}>
  <div id="cio-plp-{{ block.id }}" data-cio-target></div>

  <script type="application/json" data-cio-settings>
    { "apiKey": "…", "resultsPerPage": 24, "customProductCard": true }
  </script>
</cio-plp-ui>
```

When the browser finds a `<cio-plp-ui>` element, the setup code reads the JSON settings and calls `CioPlp({ selector, ...options })` on the inner `<div>`.

### Shared with the React version

Both PLP versions use the same Shopify helpers from `src/plp-shared/shopify.js`, so they behave the same way:

* **Product links:** the catalog stores `myshopify.com` URLs. `getItemUrl` keeps only the path, so links stay on the domain you're browsing.
* **Add to cart:** Shopify's `/cart/add.js` needs a variant ID, so `onAddToCart` sends the item's `variationId`. It then fires Horizon's `CartLinesUpdateEvent`, which makes the cart drawer and icon refresh themselves.
* **Prices:** formatted in the store's active currency.

See [plp-react.md](./plp-react.md) for more detail on each one.

## Overriding components

The PLP lets you replace parts of its UI with your own markup. We override one part, **the product card**, to show that it's possible.

### Why not React components?

In the [React version](./plp-react.md), the card override is a React component. The bundled build can't take one: its React is packaged **inside** the library, so our code can't hand it React components.

Instead, `renderOverrides.productCard.renderHtml` returns a **plain DOM element**:

```js
CioPlp({
  // …
  renderOverrides: { productCard: { renderHtml: renderCustomProductCard } },
});
```

### Example: our own product card

`src/plp-ui/overrides/custom-product-card.js` builds a card with image, title, price and an "Add to cart" button, using DOM APIs.

It has a **teal border**, so it's easy to tell apart from the library's default card and from the React version's card, which is purple.

The library calls it with the same props its own card uses. We call the library's `onClick` and `onAddToCart` from those props, so we keep:

* Constructor's click and add-to-cart tracking;
* navigating to the product page;
* adding the item to the Shopify cart.

The card sets text with `textContent`, never `innerHTML`, so product names from the API can't inject HTML.

### Why use a custom element?

Horizon already uses custom elements for its interactive parts, so this fits the theme:

* **No manual initialization.** The browser starts each `<cio-plp-ui>` automatically, including when the theme editor adds it.
* **Clear Liquid markup.** The HTML makes it obvious which part of the page is the PLP.

The bundled build has no unmount function, so an element is never mounted twice. If the theme editor removes the section, the PLP isn't cleaned up. That only matters while editing in the theme editor.

## Why use the bundled package?

The bundled build is the simplest way to use the PLP in a theme that doesn't use React: one import, one function call, and no React setup.

### Bundle size

The numbers below are from the production files in `/assets`. The gzip and Brotli numbers matter most for page speed, because Shopify's CDN compresses files before sending them.

| Approach          |   JS (raw) | JS (gzip) | JS (Brotli) | CSS (gzip) |
| ----------------- | ---------: | --------: | ----------: | ---------: |
| **B. UI library** | **379 KB** | **104 KB** |   **89 KB** | **0.5 KB** |
| C. React          |     443 KB |    130 KB |      111 KB |     9.7 KB |

The bundled version is about 20% smaller than the React version. Constructor pre-optimizes the bundled build, and the library injects its starter CSS at runtime, so our own CSS file is tiny.

Approach A (the Connect app) isn't in the table because its JavaScript isn't in our `/assets`: the app loads the library from Constructor's CDN.

The file is only loaded on pages that have the PLP block.

### React vs. bundled

|                       | B. Bundled                         | C. React                                  |
| --------------------- | ---------------------------------- | ----------------------------------------- |
| How it starts         | `CioPlp({ selector, ...props })`   | `<CioPlp {...props} />` in our React root |
| React                 | Inside the library                 | From our `package.json`                   |
| Card override         | DOM element                        | React component                           |
| Library CSS           | Injected by the library at runtime | Imported and built into our CSS file      |
| Clean-up when removed | Not supported                      | `root.unmount()`                          |
| JS size (gzip)        | ~104 KB                            | ~130 KB                                   |

Choose B when the theme doesn't use React and a card override is all you need. Choose C when you want to build on the PLP with your own React components and hooks.

## Styling

* The library injects its own starter CSS, scoped to `.cio-plp`.
* `src/plp-shared/cio-plp-theme.css` (shared with the React version) uses the theme's font and text color, and styles the custom card.
* **Hidden checkboxes:** Horizon styles every `<input type="checkbox">` on the page. The library hides the real checkbox and draws its own, but Horizon's style made both show up, so every filter had two boxes. The shared CSS hides the real one again.
* `src/plp-ui/cio-plp-ui.build.css` sets the teal border color for the bundled card.

## Updating the library

```sh
npm install @constructor-io/constructorio-ui-plp@latest
npm run build
```

Then commit:

* `package.json`
* `package-lock.json`
* `assets/cio-plp-ui.min.js`
* `assets/cio-plp-ui.min.css`
