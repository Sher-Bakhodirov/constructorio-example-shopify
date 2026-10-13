# PLP - Approach D: Custom UI

This demo theme shows four ways to add a Constructor-powered product listing page (PLP) to Shopify:

| Approach                       | What it is                                            | Docs                           |
| ------------------------------ | ----------------------------------------------------- | ------------------------------ |
| **A. Constructor Connect app** | Constructor's Shopify app with a ready-made PLP block | No doc yet                     |
| **B. UI library**              | Constructor's npm package, bundled build              | [plp-ui.md](./plp-ui.md)       |
| **C. React environment**       | The same npm package, used as React components        | [plp-react.md](./plp-react.md) |
| **D. Custom UI**               | Our own PLP on Constructor's JavaScript client        | **this doc**                   |

PLP stands for **product listing page**: the grid of products with filters, sorting and pagination that shoppers see on a collection page.

## How it works

Approaches B and C use Constructor's **PLP UI library**, which draws the whole page for us.

Approach D doesn't use a UI library or React. We use only Constructor's [JavaScript client](https://github.com/Constructor-io/constructorio-client-javascript) to fetch results and send tracking events, and we draw the filters, sort, grid and pagination ourselves.

What makes it different is that it **uses Liquid's server-side rendering**:

1. **Liquid renders a skeleton.** Shopify sends the page with the final layout already in place: a filter column, a toolbar with the product count, and grey placeholder cards. Shoppers see the page's shape immediately, before any JavaScript runs.
2. **JavaScript fetches from Constructor.** It calls the browse API for the collection.
3. **JavaScript fills the skeleton in.** The placeholders are swapped for real product cards, and the filters, sort and pagination appear.

```js
import ConstructorIOClient from '@constructor-io/constructorio-client-javascript';

const client = new ConstructorIOClient({ apiKey: 'key_…', sendTrackingEvents: true });
const { response } = await client.browse.getBrowseResults('group_id', 'shoes', { page: 1 });
// response.results, response.facets, response.sort_options, response.total_num_results
```

## Why a server-rendered skeleton?

With B and C, the PLP area is empty until the library's JavaScript loads and the first request returns. The page then jumps as the grid appears.

Here, Liquid already knows a lot when it builds the page, so it renders it straight away:

* **The layout.** The grid has the right number of placeholder cards (the **Products per page** setting), so nothing moves when results arrive.
* **The product count.** "126 products" comes from Shopify's `collection.products_count`, so it's correct on first paint.
* **Which Constructor group to browse.** The collection handle (`shoes`) becomes the Constructor group ID, written into the page as JSON.

The skeleton shimmers gently while loading. If the shopper has reduced motion turned on, the shimmer is turned off.

## Using it in Shopify

### 1. Set the API key

In the theme editor, go to:

**Theme settings → Constructor**

Paste your Constructor index key (`key_...`). You can also override it for an individual block.

### 2. Use it on a collection page

In Shopify admin, open a collection and, under **Theme template**, select:

`collection.cio-plp-custom`

### 3. Or preview without assigning

Add `?view=cio-plp-custom` to any collection URL:

```text
/collections/shoes?view=cio-plp-custom
```

You can also add **CIO PLP Custom** as a section from the theme editor.

## Block settings

| Setting              | What it does                                                         |
| -------------------- | -------------------------------------------------------------------- |
| API key              | Overrides the key from Theme settings for this block.                |
| Constructor group ID | The group to browse. Leave blank to use the collection's handle.     |
| Products per page    | How many products each page shows, and how many skeleton cards Liquid renders. |

## What shoppers see

* A skeleton with the final layout, replaced by products as soon as Constructor responds.
* Filters for each multi-choice facet (for example color, size and vendor), with the number of products for each option.
* Sorting: Most Relevant, Price Low to High, Price High to Low.
* Pagination.
* **Add to cart** adds the product and refreshes Horizon's cart drawer and cart icon.
* Clicking a product opens its product page on the current domain.

### State in the URL

Filters, sort and page are kept in the URL:

```text
/collections/shoes?filters[color]=Black&sort=Price:ascending&page=2
```

So the page can be shared or bookmarked, and the browser's back button goes back to the previous filter or page. Other parameters, such as Shopify's `?view=`, are kept.

## Tracking

The UI library tracks browse events for us. With a custom UI, we send them ourselves:

| When                     | Event                      |
| ------------------------ | -------------------------- |
| Results are shown        | `trackBrowseResultsLoaded` |
| A product is clicked     | `trackBrowseResultClick`   |

Both include the `resultId` from the browse response, so Constructor can connect the click to the results it served.

## How it is wired

```text
src/plp-custom/
├── cio-plp-custom.build.js     ← custom element: fetch, render, filters, sort, pagination, tracking
└── cio-plp-custom.build.css    ← all styles, including the skeleton

src/plp-shared/shopify.js       ← shared with B and C: product links, add to cart, prices

                 npm run build
                       │
                       ▼
assets/
├── cio-plp-custom.min.js
└── cio-plp-custom.min.css
                       │
                       ▼
blocks/cio-plp-custom.liquid           ← renders the skeleton on the server
sections/cio-plp-custom.liquid
templates/collection.cio-plp-custom.json
```

### From Liquid to the grid

1. **Liquid renders the skeleton** inside a `<cio-plp-custom>` element. Each part has a `data-cio-*` attribute (`data-cio-filters`, `data-cio-count`, `data-cio-grid`, `data-cio-sort`, `data-cio-pagination`) that JavaScript fills in later.

   ```liquid
   <cio-plp-custom loading>
     <script type="application/json" data-cio-settings>
       { "apiKey": "…", "groupId": {{ collection.handle | json }}, "resultsPerPage": 24 }
     </script>

     <p data-cio-count>{{ collection.products_count }} products</p>

     <div data-cio-grid>
       {% for i in (1..per_page) %}
         <div class="cio-plp-custom__card">…skeleton…</div>
       {% endfor %}
     </div>
   </cio-plp-custom>
   ```

2. **The custom element starts** when the browser finds it. It reads the settings, saves a copy of the skeleton, and calls Constructor.

3. **It renders each region** from the response. The `loading` attribute is removed when it's done.

4. **On every change** (a filter, sort or page), it updates the URL and shows the saved skeleton again while the next results load.

### Reused, not rebuilt

* `src/plp-shared/shopify.js`, shared with the B and C PLP demos: product links on the current domain, add to cart with the variant ID plus Horizon's cart drawer refresh, and prices in the store's currency.
* Horizon's own `button button-secondary` classes for the Add to cart button, and Horizon's CSS variables for colors, borders and radii.

### Safety

Every value from the API (product names, facet names, image URLs) is escaped before it goes into the page, so data from the catalog can't inject HTML.

## Bundle size

The numbers below are from the production files in `/assets`. The gzip and Brotli numbers matter most for page speed, because Shopify's CDN compresses files before sending them.

| Approach          |  JS (raw) | JS (gzip) | JS (Brotli) | CSS (gzip) |
| ----------------- | --------: | --------: | ----------: | ---------: |
| B. UI library     |    379 KB |    104 KB |       89 KB |     0.5 KB |
| C. React          |    443 KB |    130 KB |      111 KB |     9.7 KB |
| **D. Custom UI**  | **97 KB** | **25 KB** |   **21 KB** | **1.1 KB** |

D is about **4× smaller than B and 5× smaller than C**. Almost all of its file is Constructor's JavaScript client. Our own code is under 500 lines.

Approach A (the Connect app) isn't in the table because its JavaScript isn't in our `/assets`: the app loads the library from Constructor's CDN.

## Trade-offs

|                                  | B / C (UI library)                 | D (custom UI)                               |
| -------------------------------- | ---------------------------------- | ------------------------------------------- |
| JS size (gzip)                   | 104–130 KB                         | **25 KB**                                   |
| First paint                      | Empty until the library loads      | **Server-rendered skeleton, final layout**  |
| Code we maintain                 | A small wrapper                    | The whole PLP (~240 lines of JS)            |
| Tracking                         | Automatic                          | We call the tracking methods ourselves      |
| Filters                          | All facet types, including price range | Multi-choice facets only (no price slider) |
| Search pages                     | Supported                          | Collections only, for now                   |
| Markup and styling               | The library's, overridden with CSS | Fully ours                                  |

**When to choose D:** page speed and first paint matter most, or the design needs full control over the markup.
**When to choose B or C:** you want every PLP feature, such as range filters and search, without building them.

## Good to know

* **Product names come from the catalog.** The demo shows variant titles such as `Black / 11`, because that's what the catalog sync sends to Constructor. The fix is in the catalog, not in the theme.
* **Collection handles must match Constructor group IDs.** `/collections/shoes` works because the catalog has a `shoes` group. Use the block's **Constructor group ID** setting when they don't match.

## Updating

The only Constructor dependency is the JavaScript client:

```sh
npm install @constructor-io/constructorio-client-javascript@latest
npm run build
```

Then commit `package.json`, `package-lock.json`, and the rebuilt `assets/cio-plp-custom.min.*` files.
