# PLP — Approach C: React environment

This demo theme shows four ways to add a Constructor-powered product listing page (PLP) to Shopify:

| Approach                       | What it is                                            | Docs                     |
| ------------------------------ | ----------------------------------------------------- | ------------------------ |
| **A. Constructor Connect app** | Constructor's Shopify app with a ready-made PLP block | No doc yet               |
| **B. UI library**              | Constructor's npm package, bundled build              | [plp-ui.md](./plp-ui.md) |
| **C. React environment**       | The same npm package, used as React components        | **this doc**             |
| **D. Custom UI**               | Our own PLP on Constructor's JavaScript client        | Not built yet            |

PLP stands for **product listing page**: the grid of products with filters, sorting and pagination that shoppers see on a collection page or on search results.

## How it works

Some merchants already use React on their storefront. For those stores, Constructor's PLP React component can be used directly:

```jsx
import CioPlp from '@constructor-io/constructorio-ui-plp';

<CioPlp apiKey="key_…" useShopifyDefaults />
```

This approach shows how to do the same inside a Shopify theme. We install React and Constructor's [PLP UI library](https://github.com/Constructor-io/constructorio-ui-plp) from npm, write a small React app in `/src`, and our [build setup](./build-setup.md) compiles it into `assets/cio-plp-react.min.js`.

`<CioPlp>` does the whole page: it reads the URL, fetches results from Constructor, and renders the filters, sorting, product grid and pagination.

**The library decides what to show from the URL:**

* `/collections/shoes` → browse the `shoes` group
* `/search?q=shoe` → search for `shoe`

So the same block works on both collection and search pages.

The result looks and behaves the same as [Approach B](./plp-ui.md). The difference is how the library is integrated: instead of the bundled build, we use its React components directly.

## Using it in Shopify

### 1. Set the API key

In the theme editor, go to:

**Theme settings → Constructor**

Paste your Constructor index key (`key_...`). You can also override it for an individual block.

### 2. Use it on a collection page

In Shopify admin, open a collection and, under **Theme template**, select:

`collection.cio-plp-react`

### 3. Use it on the search page

In the theme editor, open **Search** and select the `search.cio-plp-react` template.

### 4. Or preview without assigning

Add `?view=cio-plp-react` to any collection or search URL:

```text
/collections/shoes?view=cio-plp-react
/search?q=shoe&view=cio-plp-react
```

You can also add **CIO PLP React** as a section from the theme editor.

## Block settings

| Setting                 | What it does                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| API key                 | Overrides the key from Theme settings for this block.                                                                |
| Products per page       | How many products each page shows.                                                                                   |
| Use custom product card | Shows our own product card (see [Overriding components](#overriding-components)). Off = the library's default card. |

## The templates

Both templates keep Horizon's page heading and **replace Horizon's product grid** with the Constructor PLP:

```text
collection.cio-plp-react.json        search.cio-plp-react.json
├── section   ← collection title     ├── search   ← "Search results" + search box
└── plp       ← Constructor PLP      └── plp      ← Constructor PLP
```

## What shoppers see

* Filters (for example price, color, vendor and size), sorting and pagination.
* On search pages, a results header such as "357 results for 'shoe'", plus category filters.
* Filtering, sorting and changing pages keep Shopify's URLs, for example `/collections/shoes?filters[color]=Black`.
* Clicking a product opens its product page on the current domain.
* **Add to cart** adds the product to the Shopify cart and refreshes Horizon's cart drawer and cart icon. If **Auto-open cart drawer** is on in the theme settings, the drawer opens.

## How it is wired

```text
src/plp-react/
├── cio-plp-react.build.jsx          ← custom element + React root
├── Plp.jsx                          ← <CioPlp> + Shopify configuration
├── overrides/CustomProductCard.jsx  ← our own product card (React)
└── cio-plp-react.build.css

src/plp-shared/                      ← shared with the bundled version
├── shopify.js                       ← product links, add to cart, prices
└── cio-plp-theme.css                ← card styles, checkbox fix

                 npm run build
                       │
                       ▼
assets/
├── cio-plp-react.min.js
└── cio-plp-react.min.css
                       │
                       ▼
blocks/cio-plp-react.liquid
sections/cio-plp-react.liquid
templates/collection.cio-plp-react.json
templates/search.cio-plp-react.json
```

### From Liquid to React

1. **Liquid renders the custom element.**
   The block outputs a `<cio-plp-react>` element with an empty `<div>` and the block settings as JSON.

2. **The custom element creates a React root.**
   It reads the settings and mounts React into the `<div>`:

   ```jsx
   this.root = createRoot(target);
   this.root.render(<Plp settings={settings} />);
   ```

3. **`Plp.jsx` renders the Constructor component.**
   It's a normal React component that renders `<CioPlp>` with our Shopify settings. This is the part a merchant could take as a starting point for their own React app.

4. **The React root is cleaned up when the element is removed.**
   Shopify's theme editor can remove and recreate sections while editing. When that happens, `disconnectedCallback` calls `root.unmount()`.

### Making it work with Shopify

The library has Shopify support through `useShopifyDefaults`, but we adjust two things. Both live in `src/plp-shared/shopify.js`, shared with the bundled version.

**Keep product links on the current domain.**
The catalog stores product URLs with the store's `myshopify.com` domain, which would send shoppers away when the theme runs locally or on a custom domain. `itemFieldGetters.getItemUrl` keeps only the path, for example `/products/berri-canvas-slip-on-black`.

**Add to cart with the Shopify variant ID.**
Shopify's `/cart/add.js` needs a **variant ID**. The library's Shopify default uses the item's `__shopify_id`, and falls back to the product handle when that field is missing, which Shopify rejects. Our catalog has no `__shopify_id`, so `onAddToCart` sends the item's `variationId` instead.

After adding, it fires the same `CartLinesUpdateEvent` Horizon's own "Add to cart" uses (from `@shopify/events`). Horizon's cart drawer and cart icon listen for it and refresh themselves.

## Overriding components

This is the main reason to use the React version: you can **replace parts of the UI with your own React components** and keep everything else from the library. We override one part, **the product card**, to show that it's possible.

### Example: our own product card

`src/plp-react/overrides/CustomProductCard.jsx` is a card with image, title, price and an "Add to cart" button.

It has a **purple border**, so it's easy to tell apart from the library's default card and from the bundled version's card, which is teal.

We pass it through `renderOverrides`:

```jsx
<CioPlp
  apiKey={settings.apiKey}
  renderOverrides={{ productCard: { renderHtml: CustomProductCard } }}
/>
```

The library calls our component with the same props its own card uses:

```jsx
export default function CustomProductCard({ item, productInfo, formatPrice, onClick, onAddToCart }) {
  const { itemName, itemPrice, itemImageUrl, itemUrl } = productInfo;

  return (
    <div className="cio-custom-card">
      <a href={itemUrl} onClick={(event) => onClick(event, item)}>…</a>
      <button onClick={(event) => onAddToCart(event, item, itemPrice)}>Add to cart</button>
    </div>
  );
}
```

The markup is ours, but because we call the library's `onClick` and `onAddToCart`, we keep:

* Constructor's click and add-to-cart tracking;
* navigating to the product page;
* adding the item to the Shopify cart.

The library also puts its `data-cnstrc-*` tracking attributes on the element around our card.

### Other parts you can override

We only override the card. The same idea works for other parts:

| Override                                 | Replaces                                                          |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `renderOverrides.productCard.renderHtml` | The product card (what we use)                                    |
| `componentOverrides`                     | Filters, groups and other components                              |
| `<CioPlp>` children                      | The whole page layout (use hooks such as `useCioPlp` for the data) |

See the [Storybook docs](https://constructor-io.github.io/constructorio-ui-plp/) for the full list.

## Approach B vs. Approach C

### Bundle size

The numbers below are from the production files in `/assets`. The gzip and Brotli numbers matter most for page speed, because Shopify's CDN compresses files before sending them.

| Approach              |   JS (raw) |  JS (gzip) | JS (Brotli) | CSS (gzip) |
| --------------------- | ---------: | ---------: | ----------: | ---------: |
| B. UI library         |     379 KB |     104 KB |       89 KB |     0.5 KB |
| **C. React**          | **443 KB** | **130 KB** |  **111 KB** | **9.7 KB** |

The React version is about 25% larger than the bundled one. We compile React, the PLP library, its UI components and Constructor's JavaScript client ourselves, while the bundled build was pre-optimized by Constructor. Our CSS file is also bigger, because it includes the library's starter CSS instead of the library injecting it at runtime.

If the storefront already loads React for other features, React could be shared with the PLP instead of loaded twice.

Approach A (the Connect app) isn't in the table because its JavaScript isn't in our `/assets`: the app loads the library from Constructor's CDN.

The file is only loaded on pages that have the PLP block.

### React vs. bundled

|                                   | B. Bundled                         | C. React                                  |
| --------------------------------- | ---------------------------------- | ----------------------------------------- |
| How it starts                     | `CioPlp({ selector, ...props })`   | `<CioPlp {...props} />` in our React root |
| React                             | Inside the library                 | From our `package.json`                   |
| Card override                     | DOM element                        | React component                           |
| Use it with our own React code    | No                                 | Yes: wrap it, add components, use hooks   |
| Library CSS                       | Injected by the library at runtime | Imported and built into our CSS file      |
| Clean-up when removed             | Not supported                      | `root.unmount()`                          |
| JS size (gzip)                    | ~104 KB                            | ~130 KB                                   |

## React build setup

The PLP reuses the React setup from the [autocomplete React demo](./autocomplete-react.md#react-build-setup): `react`, `react-dom`, JSX in Babel, and `.build.jsx` entries in webpack. The PLP adds one more peer dependency:

| Package                                    | Why                                          |
| ------------------------------------------ | -------------------------------------------- |
| `@constructor-io/constructorio-ui-plp`     | The PLP library itself.                      |
| `@constructor-io/constructorio-ui-components` | UI components the PLP library is built on. |

## Styling

* The library's starter CSS (`styles.css`, scoped to `.cio-plp`) is imported in `cio-plp-react.build.jsx`, and webpack puts it in `assets/cio-plp-react.min.css`.
* `src/plp-shared/cio-plp-theme.css` (shared with the bundled version) uses the theme's font and text color, and styles the custom card.
* **Hidden checkboxes:** Horizon styles every `<input type="checkbox">` on the page. The library hides the real checkbox and draws its own, but Horizon's style made both show up, so every filter had two boxes. The shared CSS hides the real one again.

## Good to know

* **Product names come from the catalog.** The demo shows variant titles such as `Black / 11`, because that's what the catalog sync sends to Constructor. The fix is in the catalog, not in the theme.
* **Collection handles must match Constructor group IDs.** `/collections/shoes` works because the catalog has a `shoes` group.

## Updating the library

```sh
npm install @constructor-io/constructorio-ui-plp@latest @constructor-io/constructorio-ui-components@latest
npm run build
```

The library may change its peer dependencies in a new version. You can check them with:

```sh
npm view @constructor-io/constructorio-ui-plp peerDependencies
```

If necessary, update `react` or `react-dom` as well. Then commit:

* `package.json`
* `package-lock.json`
* `assets/cio-plp-react.min.js`
* `assets/cio-plp-react.min.css`
