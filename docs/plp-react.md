# PLP - React

This demo shows how to use Constructor's **PLP UI library** with React in a Shopify theme.

PLP stands for **product listing page** - the page where shoppers see a grid of products along with filters, sorting and pagination. In this demo, Constructor handles a single collection page - `/collections/boys`.

## How it works

The demo installs Constructor's [PLP UI library](https://github.com/Constructor-io/constructorio-ui-plp) from npm and renders its React component:

```jsx
import CioPlp from '@constructor-io/constructorio-ui-plp';

<CioPlp apiKey="key_…" useShopifyDefaults />
```

`<CioPlp>` handles the main PLP functionality: it reads the current URL, gets the results from Constructor, and renders the filters, sorting, product grid and pagination.

The same component works for both collections and search. It uses the current URL to figure out what to request:

* `/collections/boys` → browse the `boys` group
* `/search?q=shoe` → search for `shoe`

The [build setup](./build-setup.md) bundles the React app into `assets/cio-plp-react.min.js`.

## Using it in Shopify

There are a few ways to use the PLP in the theme.

1. **Set the API key.** Go to **Theme settings → Constructor**, or set a different key on the block.

2. **Use it on a collection page.** Open a collection in Shopify admin and select the `collection.cio-plp-react` template.

3. **Use it on the search page.** In the theme editor, open **Search** and select the `search.cio-plp-react` template. You can also preview it with `/search?q=shoe&view=cio-plp-react`.

4. **Add the block manually.** In the theme editor, choose **Add section → CIO PLP React**.

You can also preview a template without assigning it to a page by adding `?view=<template>` to the URL:

```text
/collections/shoes?view=cio-plp-react
```

### Block settings

| Setting                 | What it does                                                       |
| ----------------------- | ------------------------------------------------------------------ |
| API key                 | Overrides the API key from Theme settings for this block.          |
| Products per page       | Controls how many products are shown on each page.                 |
| Use custom product card | Uses our custom product card instead of the library's default one. |

## The templates

The two templates keep the existing Horizon page heading and replace its product grid with Constructor's PLP:

```text
collection.cio-plp-react.json        search.cio-plp-react.json

├── section   ← collection title     ├── search   ← "Search results" + search box
└── plp       ← Constructor PLP      └── plp      ← Constructor PLP
```

So Horizon still provides the page heading/search box, but the filters, sorting, product grid and pagination all come from Constructor.

## Shopify-specific changes

The PLP library already has Shopify support through `useShopifyDefaults`, but there are a few things we need to handle in the theme.

### 1. Keep product links on the current domain

The catalog contains product URLs with the store's `myshopify.com` domain.

That means a product link could send a shopper away from the current domain when you're running the theme locally or using a custom domain.

We pass `itemFieldGetters.getItemUrl` to keep only the path:

```text
/products/berri-canvas-slip-on-black
```

The browser then uses the current domain automatically.

### 3. Use the Shopify variant ID when adding to cart

Shopify's `/cart/add.js` endpoint needs a **variant ID**.

The library's Shopify defaults normally use the item's `__shopify_id`, falling back to the product handle if that field isn't available. Our catalog doesn't contain `__shopify_id`, so Shopify rejects the request.

In `Plp.jsx`, our `onAddToCart` callback uses `variationId` instead. In this catalog, `variationId` is the Shopify variant ID.

After adding the product, we also fire the same `CartLinesUpdateEvent` that Horizon's own "Add to cart" flow uses. Horizon's cart drawer and cart icon listen for this event and update themselves.

If **Auto-open cart drawer** is enabled in the theme settings, the cart drawer opens as well.

## Customizing the product card

The PLP library lets you replace parts of its UI. This demo replaces the **product card** to show how that works.

Our custom card lives in:

```text
src/plp-react/overrides/CustomProductCard.jsx
```

It contains the product image, title, price and an "Add to cart" button. It also has a purple border so it's easy to distinguish from the library's default card.

We pass it to the PLP through `renderOverrides`:

```jsx
<CioPlp
  apiKey={settings.apiKey}
  renderOverrides={{
    productCard: {
      renderHtml: CustomProductCard
    }
  }}
/>
```

The library calls our component with the same props used by its own product card:

```jsx
export default function CustomProductCard({
  item,
  productInfo,
  formatPrice,
  onClick,
  onAddToCart
}) {
  const { itemName, itemPrice, itemImageUrl, itemUrl } = productInfo;

  return (
    <div className="cio-custom-card">
      <a href={itemUrl} onClick={(event) => onClick(event, item)}>
        …
      </a>

      <button
        onClick={(event) => onAddToCart(event, item, itemPrice)}
      >
        Add to cart
      </button>
    </div>
  );
}
```

The markup is ours, but we still use the library's `onClick` and `onAddToCart` handlers. That means we keep:

* Constructor click and add-to-cart tracking
* navigation to the product page
* adding the product to the Shopify cart

The library also adds its `data-cnstrc-*` tracking attributes around the card.

### Other things you can override

The demo only replaces the product card, but the library provides other customization points:

| Override                                 | Replaces                             |
| ---------------------------------------- | ------------------------------------ |
| `renderOverrides.productCard.renderHtml` | Product card                         |
| `componentOverrides`                     | Filters, groups and other components |
| `<CioPlp>` children                      | The whole page layout                |

For the full list of available overrides, see the [Storybook docs](https://constructor-io.github.io/constructorio-ui-plp/).

## Project structure

Most of the React-specific code lives under `src/plp-react/`:

```text
src/plp-react/

├── cio-plp-react.build.jsx          ← custom element + React root
├── Plp.jsx                          ← <CioPlp> + Shopify configuration
├── shopify-url-helpers.js           ← keeps Shopify URLs working
├── overrides/CustomProductCard.jsx  ← custom product card
└── cio-plp-react.build.css          ← theme and card styles

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

Liquid renders a custom element:

```html
<cio-plp-react>
```

The element receives the block settings as JSON, creates a React root and renders `Plp.jsx`.

When the theme editor removes the section, the React app is unmounted as well.

## Styling

The library's starter CSS is imported from `cio-plp-react.build.jsx`. After the build, it becomes:

```text
assets/cio-plp-react.min.css
```

Our CSS mainly does two things:

* uses the theme's font and text color
* styles the custom product card

### One Horizon-specific detail

Horizon applies its checkbox styles to every `<input type="checkbox">` on the page.

The PLP library hides the real checkbox and draws its own UI. Horizon's styles were causing both to appear, so we explicitly hide the underlying checkbox again.

## Bundle size

| File                    |    Raw |   Gzip |
| ----------------------- | -----: | -----: |
| `cio-plp-react.min.js`  | 444 KB | 130 KB |
| `cio-plp-react.min.css` |  52 KB |  10 KB |

The JavaScript bundle includes React, the PLP library, its UI components and Constructor's JavaScript client.

The bundle is only loaded on pages that use the PLP block.

## A couple of things to keep in mind

**Product names come from the catalog.**

For example, the demo may show variant titles such as `Black / 11`. That's what the catalog sync sends to Constructor, so changing the theme won't fix it. The catalog data needs to be changed instead.

**Collection handles must match Constructor group IDs.**

For example:

```text
/collections/shoes
```

works because the Constructor catalog contains a `shoes` group.

## Updating the PLP library

To update the PLP packages:

```sh
npm install @constructor-io/constructorio-ui-plp@latest \
  @constructor-io/constructorio-ui-components@latest

npm run build
```

You can check the current peer dependencies with:

```sh
npm view @constructor-io/constructorio-ui-plp peerDependencies
```

After updating, commit:

* `package.json`
* `package-lock.json`
* the rebuilt `assets/cio-plp-react.min.*` files
