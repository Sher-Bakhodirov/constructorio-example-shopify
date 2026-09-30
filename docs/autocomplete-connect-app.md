# Autocomplete — Approach A: Constructor Connect app

This demo theme shows four ways to add Constructor autocomplete to Shopify:

| Approach                       | What it is                                                    | Docs                                                       |
| ------------------------------ | ------------------------------------------------------------- | ---------------------------------------------------------- |
| **A. Constructor Connect app** | Constructor's Shopify app with a ready-made block, no code    | **this doc**                                               |
| **B. UI library**              | Constructor's npm package, bundled build                      | [autocomplete-ui-library.md](./autocomplete-ui-library.md) |
| **C. React environment**       | The same npm package, used as React components                | [autocomplete-react.md](./autocomplete-react.md)           |
| **D. Custom UI**               | Our own autocomplete built on Constructor's JavaScript client | [autocomplete-custom.md](./autocomplete-custom.md)         |

## How it works

This is the **no-code** approach.

Constructor publishes a Shopify app, [Constructor Connect](https://apps.shopify.com/constructor-connect). Once installed, it adds Constructor blocks to the theme editor, including an **autocomplete** block. You drag the block onto a page, enter your index key, and it works.

Nothing is installed with npm, and nothing goes through our [build setup](./build-setup.md). The app loads Constructor's UI library directly from Constructor's CDN:

```html
<div id="cio-autocomplete-ui-container"></div>

<script type="module">
  import CioAutocomplete from 'https://cdn.cnstrc.com/ui/autocomplete/1.23.22.js';

  CioAutocomplete({
    selector: '#cio-autocomplete-ui-container',
    apiKey: 'key_…'
  });
</script>
```

This is the same autocomplete UI library used by Approach B. The difference is **who ships it**: the app ships it in A, while the theme ships it in B.

## Using it in Shopify

### 1. Install the app

Install [Constructor Connect](https://apps.shopify.com/constructor-connect) from the Shopify App Store and approve the requested permissions.

### 2. Turn on the beacon

In the theme editor, open **App embeds** and enable **Constructor Beacon**. Enter your **Bundle Name**.

The beacon is Constructor's tracking script. Shopify saves it in `config/settings_data.json` as an app embed block.

### 3. Pick the demo template

Open a collection in Shopify admin and, under **Theme template**, select:

`collection.cio-autocomplete-app`

In this demo, the template is used on the **Shoes** collection (`/collections/shoes`).

### 4. Add the app block

In the theme editor, select the section above the product grid, click **Add block**, and choose the Constructor Connect **autocomplete** block under **Apps**.

Then fill in the block settings:

| Setting                  | What it does                                                 |
| ------------------------ | ------------------------------------------------------------ |
| Autocomplete UI Version  | Which version of the library to load from Constructor's CDN. |
| Constructor Index Key    | Your API key (`key_…`).                                      |
| Search URL               | Where searches go, for example `/search`.                    |
| Enable default CSS?      | Loads the app's own stylesheet.                              |
| Override default search? | Hides the theme's own header search.                         |
| Options (JSON)           | Any other option supported by                                |
