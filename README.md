# Constructor × Shopify example theme

A Shopify theme that shows the different ways to integrate [Constructor](https://constructor.com) search and browse into a Shopify storefront, side by side, on one store.

Each approach is implemented for two features:

- **Autocomplete**: the search box and its dropdown
- **PLP** (product listing page): the product grid with filters, sorting and pagination on collection and search pages

The theme is based on Shopify's [Horizon](https://github.com/Shopify/horizon) theme. All Constructor code is kept separate from Horizon's own files, so you can copy an approach into another theme.

## The approaches

| Approach | What it is | Code you maintain | Autocomplete | PLP |
| --- | --- | --- | --- | --- |
| **A. Constructor Connect app** | Constructor's [Shopify app](https://apps.shopify.com/constructor-connect) with ready-made theme blocks. No code. | None | [docs](docs/autocomplete-connect-app.md) | No doc yet |
| **B. UI library (bundled)** | Constructor's UI library from npm, using its pre-built bundle (React included). Exposed as a theme block. | A small wrapper | [docs](docs/autocomplete-ui-library.md) | [docs](docs/plp-ui.md) |
| **C. React environment** | The same UI library used as React components, with React installed by the theme. | A small React app | [docs](docs/autocomplete-react.md) | [docs](docs/plp-react.md) |
| **D. Custom UI** | Our own UI built only on Constructor's [JavaScript client](https://github.com/Constructor-io/constructorio-client-javascript). | The whole UI | [docs](docs/autocomplete-custom.md) | [docs](docs/plp-custom.md) |

### Which one to choose?

- **A** when the merchant wants Constructor running with no development work, and the app's blocks and settings are enough.
- **B** when you need more control than the app gives (custom settings, overriding how items render) but still want Constructor to maintain the UI.
- **C** when the storefront already uses React, or you want to wrap the library in your own React components and hooks.
- **D** when page speed or full control over markup and design matters most. You own the UI, keyboard support and tracking calls.

### Size and trade-offs

JavaScript size, gzipped, from the production files in `/assets`:

| | B. UI library | C. React | D. Custom UI |
| --- | ---: | ---: | ---: |
| Autocomplete | 84 KB | 106 KB | **26 KB** |
| PLP | 104 KB | 130 KB | **25 KB** |

Approach A isn't listed because the app loads the UI library from Constructor's CDN, not from this theme. Its size is in the same range as B.

The smaller size of D has a cost. You implement and maintain features that the UI library gives you for free. For example, the custom PLP supports multi-choice filters only (no price range) and collection pages only (no search page). Each approach's doc has a full trade-off table.

## Getting started

### Requirements

- A Shopify development store
- [Shopify CLI](https://shopify.dev/docs/storefronts/themes/tools/cli)
- [Node.js](https://nodejs.org/), only if you want to change the code of approaches B, C or D
- A Constructor index with your Shopify catalog synced to it

### Run the theme locally

```sh
git clone <this repo>
cd constructorio-example-shopify
shopify theme dev --store <your-store>.myshopify.com
```

The built JavaScript and CSS are committed to `/assets`, so the theme works without running the build.

### Add your Constructor key

Every Constructor block in this theme looks for your index key (`key_...`) in this order and uses the first one it finds:

1. The block's own **API key** setting
2. **Theme settings → Constructor → API key**
3. The shop metafield **`constructor.api_key`**

**Use the shop metafield (recommended).** Shopify saves theme editor settings (1 and 2) as files in the theme: `config/settings_data.json` and `templates/*.json`. If your theme is connected to GitHub, Shopify commits those files, so a key typed into the theme editor ends up in git. A shop metafield is stored in Shopify admin instead, so it never appears in the theme files.

To set it up:

1. In Shopify admin, go to **Settings → Metafields and metaobjects → Shop**.
2. Click **Add definition**. Set **Namespace and key** to `constructor.api_key` and the type to **Single line text**.
3. Enter your index key as the value and save.
4. Leave **Theme settings → Constructor → API key** and the blocks' **API key** settings blank.

If your admin doesn't offer a field for the value, set it with the Admin API instead:

```graphql
mutation {
  metafieldsSet(metafields: [{
    ownerId: "gid://shopify/Shop/<your-shop-id>"
    namespace: "constructor"
    key: "api_key"
    type: "single_line_text_field"
    value: "key_..."
  }]) {
    userErrors { field message }
  }
}
```

Use the block's **API key** setting only when one block should use a different index, for example to compare two indexes on one page.

The index key isn't a secret. It's sent to the browser on every page that uses Constructor. Keeping it out of git avoids publishing which index the demo uses, and lets each store that installs this theme use its own key without changing the code.

The Constructor Connect app (approach A) has its own **Constructor Index Key** setting and doesn't read the metafield. See [its doc](docs/autocomplete-connect-app.md#4-add-the-app-block).

### Demo store password

Shopify development stores can't be made public: Shopify always keeps them behind a password. Since this store is only a demo, the password page (`sections/cio-demo-access.liquid`) explains why there's a password, fills it in, and lets visitors enter with one click.

The password comes from the shop metafield **`constructor.storefront_password`**, for the same reason as the index key: it stays in Shopify admin and out of git. To set it up:

1. Find the store password in **Online Store → Preferences → Password protection**.
2. Create a shop metafield definition `constructor.storefront_password` of type **Single line text**, and set its value to the password, the same way as the [index key](#add-your-constructor-key).

If the metafield is empty, the page shows a normal password field instead. If you change the store password, update the metafield too, or visitors will see a "That password didn't work" message.

In the theme editor, under **Password page → CIO Demo access**, you can change the heading and intro text and add links to the GitHub repo and the Shopify Explorer page.

### See an approach

Every approach has its own template. Assign the template to a page or collection in Shopify admin under **Theme template**, or preview it without assigning by adding `?view=<template>` to the URL:

```
/collections/shoes?view=cio-plp-custom
```

| Approach | Autocomplete templates | PLP templates |
| --- | --- | --- |
| A. Connect app | `collection.cio-autocomplete-app` | — |
| B. UI library | `page.cio-autocomplete-ui`, `collection.cio-autocomplete-ui` | `collection.cio-plp-ui`, `search.cio-plp-ui` |
| C. React | `page.cio-autocomplete-react`, `collection.cio-autocomplete-react` | `collection.cio-plp-react`, `search.cio-plp-react` |
| D. Custom UI | `page.cio-autocomplete-custom`, `collection.cio-autocomplete-custom` | `collection.cio-plp-custom` |

You can also add any Constructor block yourself: in the theme editor, click **Add section** and look for the **CIO** sections.

Approach A needs the Constructor Connect app installed first. See [its doc](docs/autocomplete-connect-app.md) for the setup steps.

### Change the code

Approaches B, C and D are written in `/src` and built with webpack into `/assets`:

```sh
npm install
npm run dev     # rebuild on change, in one terminal
shopify theme dev   # in another terminal
npm run build   # minified build, run before committing
```

See [build setup](docs/build-setup.md) for how the build works. You don't need this setup to integrate Constructor; use your own build if you have one.

## Project structure

Only the Constructor-specific files are listed. Everything else is Horizon.

```
src/                    Source for approaches B, C, D (not uploaded to Shopify)
  autocomplete-ui/        B. Autocomplete, bundled UI library
  autocomplete-react/     C. Autocomplete, React
  autocomplete-custom/    D. Autocomplete, custom UI
  autocomplete-shared/    Options and theme styling shared by autocomplete approaches
  plp-ui/                 B. PLP, bundled UI library
  plp-react/              C. PLP, React
  plp-custom/             D. PLP, custom UI
  plp-shared/             Shopify helpers and theme styling shared by PLP approaches
assets/cio-*.min.*      Build output from /src (committed, don't edit by hand)
blocks/cio-*.liquid     Theme blocks for each approach and their settings
sections/cio-*.liquid   Sections that wrap the blocks, so they can be added on their own
templates/*.cio-*.json  Demo templates, one per approach and page type
sections/cio-demo-access.liquid   Password page that fills in the demo store password
config/settings_schema.json   "Constructor" theme settings (index key)
docs/                   Documentation for each approach (not uploaded to Shopify)
```

## Shopify Explorer

[`docs/shopify-explorer.html`](docs/shopify-explorer.html) is an interactive walkthrough of how a Shopify storefront is put together: themes, templates, sections, blocks, apps, and where Constructor fits in. It's useful if you're new to Shopify.

Open the file in a browser, or view it on the store by assigning the `page.explorer` template to a page. The template is a copy of the HTML file, so update both when you change it.

## Staying up to date with Horizon

This theme tracks Horizon's releases. To pull in the latest Horizon changes:

```sh
git remote add upstream https://github.com/Shopify/horizon.git   # first time only
git fetch upstream
git merge upstream/main
```

Because the Constructor code lives in its own `cio-*` files, conflicts are usually limited to the files Shopify writes when settings change in the theme editor, such as `config/settings_data.json` and `templates/*.json`.

Note: themes based on Horizon can't be submitted to the Shopify Theme Store. This theme is a reference implementation, not a theme to publish.
