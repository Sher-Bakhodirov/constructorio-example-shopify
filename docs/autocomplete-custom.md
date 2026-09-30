# Autocomplete — Approach D: Custom UI

This demo theme shows four ways to add Constructor autocomplete to Shopify:

| Approach                       | What it is                                                                               | Status  |
| ------------------------------ | ---------------------------------------------------------------------------------------- | ------- |
| **A. Constructor Connect app** | Constructor's Shopify app with a ready-made block                                        | Planned |
| **B. UI library**              | Constructor's npm package using its bundled build ([docs](./autocomplete-ui-library.md)) | ✅ Done  |
| **C. React environment**       | The same npm package used as React components ([docs](./autocomplete-react.md))          | ✅ Done  |
| **D. Custom UI (this doc)**    | Our own autocomplete built on Constructor's JavaScript client                            | ✅ Done  |

## How it works

Approaches B and C use Constructor's UI library, which takes care of rendering the search box and dropdown.

Approach D doesn't use the UI library or React. Instead, we use only Constructor's [JavaScript client](https://github.com/Constructor-io/constructorio-client-javascript) to communicate with Constructor and send tracking events. We build the search box, dropdown, keyboard handling, and everything else ourselves.

```js
import ConstructorIOClient from '@constructor-io/constructorio-client-javascript';

const client = new ConstructorIOClient({
  apiKey: 'key_…',
  sendTrackingEvents: true
});

const response = await client.autocomplete.getAutocompleteResults('shirt');

// response.sections['Search Suggestions'], response.sections.Products
```

This means there is more code for us to maintain, but we get full control over the markup and styling, and the resulting bundle is much smaller.

## Size comparison

The numbers below are from the production files in `/assets`.

The gzip and Brotli numbers are more relevant for page performance because Shopify's CDN compresses the files before sending them to the browser.

| Approach         |   JS (raw) | JS (gzip) | JS (Brotli) | CSS (gzip) |
| ---------------- | ---------: | --------: | ----------: | ---------: |
| B. UI library    |     289 KB |     84 KB |       73 KB |     0.9 KB |
| C. React         |     359 KB |    106 KB |       90 KB |     1.5 KB |
| **D. Custom UI** | **100 KB** | **26 KB** |   **22 KB** | **1.4 KB** |

So the custom implementation is roughly **3× smaller than B and 4× smaller than C** when comparing the gzipped JavaScript.

### What's in the bundles?

|                        | B. UI library | C. React              | D. Custom UI            |
| ---------------------- | ------------- | --------------------- | ----------------------- |
| React + React DOM      | ✅ Bundled     | ✅ From `package.json` | ❌ Not needed            |
| Downshift (combobox)   | ✅             | ✅                     | ❌ We implement it       |
| Constructor UI library | ✅             | ✅                     | ❌ Not needed            |
| Constructor JS client  | ✅             | ✅                     | ✅                       |
| Our own code           | Small wrapper | Small wrapper         | ~29 KB before minifying |

Most of D's bundle is actually Constructor's JavaScript client. The client contains several Constructor modules — search, browse, recommendations, quizzes, etc. — even though autocomplete only needs one of them. The client doesn't currently provide a way to import only the autocomplete-related part.

### What else affects performance?

**Less JavaScript to execute.** Download size isn't the only consideration. The browser also needs to parse and execute the downloaded JavaScript, which matters more on slower devices. D runs roughly a third of the JavaScript of B and a quarter of C.

**No React.** B and C create a React app for each autocomplete block. D is just a custom element that creates the HTML and updates it when results arrive.

**The same number of API requests.** All three approaches use the same debounce behavior, so they wait until the shopper stops typing before requesting autocomplete results.

**Loaded only where needed.** Just like B and C, the custom UI JavaScript is only loaded on pages where the block is used.

## Using it in Shopify

The Shopify setup is the same as B and C:

1. **Set the API key**
   Go to **Theme settings → Constructor**, or override it for an individual block.

2. **Create a demo page**
   Create a page and select the `page.cio-autocomplete-custom` template.

3. **Or add it yourself**
   In the theme editor, select **Add section → CIO Autocomplete Custom**. You can also add the block inside Horizon's generic **Section**.

4. **Configure the block**
   The block exposes the same main settings as B and C: placeholder, number of suggestions and products, debounce, suggestion images and counts, "Show all results", recent searches, theme styling, width, and alignment.

### Advanced options

The **Advanced options (JSON)** setting works slightly differently here.

There isn't a UI library to pass the options to, so the JSON is used to override the block settings directly by name.

For example:

```json
{
  "numProducts": 3,
  "debounce": 150
}
```

## What shoppers see

From a shopper's perspective, the behavior is the same as B and C:

* Clicking the search box shows **recent searches**, if enabled.
* Typing shows **search suggestions** and **products** with their image, title, and price.
* Arrow keys move through the results.
* Enter opens the highlighted result.
* Escape closes the dropdown.
* Clicking a product opens its product page.
* Clicking a suggestion or pressing Enter takes the shopper to `/search?q=...`.
* Existing URL parameters such as `utm_source` are preserved.

Recent searches are stored in the same browser storage key used by Constructor's UI library (`_constructorio_recent_searches`), so the history is shared between B, C, and D.

## Tracking

The Constructor client doesn't automatically track the interactions that the UI library tracks for us, so the custom implementation sends those events itself.

D currently sends the same autocomplete events as the UI library:

| When                                | Event                     |
| ----------------------------------- | ------------------------- |
| Search box is focused               | `trackInputFocus`         |
| A suggestion or product is selected | `trackAutocompleteSelect` |
| A search is submitted               | `trackSearchSubmit`       |

There are two details worth knowing here:

* The JavaScript client has tracking disabled by default. We create it with `sendTrackingEvents: true`.
* Events are stored in the browser and sent shortly afterwards, or on the next page if the shopper navigates away first. Tracking also waits for the visitor to interact with the page, so bots aren't counted.

## How it is wired

```text
src/autocomplete-custom/
├── cio-autocomplete-custom.build.js   ← custom element, input, fetch, keyboard, tracking
├── render.js                          ← builds the dropdown HTML
├── recent-searches.js                 ← reads and saves recent searches
└── cio-autocomplete-custom.build.css  ← all styles

src/autocomplete-shared/options.js     ← shared with B and C

                 npm run build
                       │
                       ▼
assets/
├── cio-autocomplete-custom.min.js
└── cio-autocomplete-custom.min.css

                       │
                       ▼
blocks/cio-autocomplete-custom.liquid
sections/cio-autocomplete-custom.liquid
templates/page.cio-autocomplete-custom.json
```

### From Liquid to the dropdown

1. **Liquid renders the custom element.**

   The block outputs a `<cio-autocomplete-custom>` element with an empty `<div>` and the block settings as JSON, just like B and C.

2. **The custom element creates the search UI.**

   When the browser initializes the element, it creates the search input, clear and search buttons, and the results container.

3. **Typing requests autocomplete results.**

   After the debounce delay, the code calls:

   ```js
   client.autocomplete.getAutocompleteResults()
   ```

   If the shopper types again before an earlier request finishes, an older response is ignored. This prevents stale results from replacing newer ones.

4. **`render.js` builds the dropdown.**

   It converts the Constructor response into HTML. Values coming from the API are escaped before being inserted into the page, so product names and search terms can't inject HTML.

5. **The element cleans itself up.**

   Shopify's theme editor can remove and recreate sections while editing. When the custom element is removed, its event listeners are cleaned up as well.

## Accessibility

The search input follows the standard **combobox** pattern:

* The input uses `role="combobox"` and points to the results list using `aria-controls`.
* The results list uses `role="listbox"`.
* Each result uses `role="option"`.
* `aria-expanded` tells assistive technologies whether the dropdown is open.
* `aria-activedescendant` identifies the currently highlighted result.

The UI library provides this behavior for us. With a custom UI, we own it, so changes to the markup need to preserve these relationships.

## Styling

There is no library CSS in this approach. Everything is in:

`src/autocomplete-custom/cio-autocomplete-custom.build.css`

All class names use the `cio-custom__` prefix.

The component exposes its colors, borders, and radii through CSS variables on `.cio-custom`, for example:

```css
--cio-fg
--cio-bg
--cio-border
```

With **Use theme styling** turned off, these variables use neutral defaults.

With it turned on, the element gets `.cio-custom--theme`, which maps the variables to Horizon's theme variables such as:

```css
--color-foreground
--style-border-radius-inputs
```

This lets the component follow the theme's colors and color schemes.

Because we own the markup, changing the layout is also straightforward: edit `render.js` and the CSS instead of overriding styles from a UI library.

## Trade-offs

The main trade-off is straightforward: D gives us more control and a smaller bundle, but we also have to maintain more code ourselves.

|                                    | B / C (UI library)                  | D (custom UI)                          |
| ---------------------------------- | ----------------------------------- | -------------------------------------- |
| JavaScript size                    | 84–106 KB gzip                      | **26 KB gzip**                         |
| Code we maintain                   | Small wrapper                       | The whole UI (~525 lines of JS)        |
| Tracking                           | Automatic                           | We call the tracking methods ourselves |
| Keyboard and screen reader support | Built in                            | We implement it                        |
| Markup and styling                 | Library markup, customized with CSS | Fully ours                             |
| New Constructor UI features        | Available through library updates   | We need to implement them              |

D makes sense when page performance is a priority or when we need complete control over the markup and design.

B or C makes more sense when we want to get the UI running quickly and let Constructor maintain most of the implementation.

## Updating

The only Constructor dependency used directly by this approach is the JavaScript client:

```sh
npm install @constructor-io/constructorio-client-javascript@latest

npm run build
```

Then commit the updated `package.json`, `package-lock.json`, and rebuilt `assets/cio-autocomplete-custom.min.*` files.
