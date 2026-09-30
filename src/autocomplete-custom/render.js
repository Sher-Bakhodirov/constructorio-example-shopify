// Builds the dropdown's HTML from Constructor's autocomplete response.
// Plain template strings: every value from the API goes through `escape()`.

const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escape(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => escapeMap[char]);
}

/**
 * Wraps the part of `text` that matches `query` in <mark>.
 */
function highlight(text, query) {
  const value = String(text ?? '');
  const needle = String(query ?? '').trim();
  const index = needle ? value.toLowerCase().indexOf(needle.toLowerCase()) : -1;

  if (index === -1) return escape(value);

  return (
    escape(value.slice(0, index)) +
    `<mark>${escape(value.slice(index, index + needle.length))}</mark>` +
    escape(value.slice(index + needle.length))
  );
}

let priceFormatter;

/**
 * Creates the currency formatter once. The browser's first Intl.NumberFormat loads locale
 * data (~30ms on a slow phone), so the element calls this while idle, before the first render.
 */
export function getPriceFormatter() {
  if (!priceFormatter) {
    try {
      priceFormatter = new Intl.NumberFormat(window.Shopify?.locale || undefined, {
        style: 'currency',
        currency: window.Shopify?.currency?.active || 'USD',
      });
    } catch {
      priceFormatter = { format: (amount) => amount.toFixed(2) };
    }
  }
  return priceFormatter;
}

function formatPrice(price) {
  if (price === undefined || price === null || price === '') return '';

  const amount = Number(price);
  if (Number.isNaN(amount)) return escape(price);

  return getPriceFormatter().format(amount);
}

/**
 * One option in the listbox. `index` is its position across all sections,
 * used for keyboard navigation (`aria-activedescendant`).
 */
function option(id, index, item, inner, extraClass = '') {
  return `<li
    id="${id}-option-${index}"
    class="cio-custom__option ${extraClass}"
    role="option"
    aria-selected="false"
    data-index="${index}"
    data-cnstrc-item-section="${escape(item.section)}"
    data-cnstrc-item-name="${escape(item.value)}"
    ${item.data?.id ? `data-cnstrc-item-id="${escape(item.data.id)}"` : ''}
    ${item.data?.variation_id ? `data-cnstrc-item-variation-id="${escape(item.data.variation_id)}"` : ''}
  >${inner}</li>`;
}

function suggestionInner(item, query, settings) {
  const image =
    settings.displaySuggestionImages && item.data?.image_url
      ? `<img class="cio-custom__suggestion-image" src="${escape(item.data.image_url)}" alt="" loading="lazy">`
      : '';
  const count =
    settings.displaySuggestionCounts && item.data?.total_num_results
      ? `<span class="cio-custom__suggestion-count">${escape(item.data.total_num_results)}</span>`
      : '';

  return `${image}<span class="cio-custom__suggestion-text">${highlight(item.value, query)}</span>${count}`;
}

function productInner(item) {
  const image = item.data?.image_url
    ? `<img class="cio-custom__product-image" src="${escape(item.data.image_url)}" alt="" loading="lazy">`
    : '<span class="cio-custom__product-image cio-custom__product-image--empty"></span>';
  const price = formatPrice(item.data?.price);

  return `${image}
    <span class="cio-custom__product-title">${escape(item.value)}</span>
    ${price ? `<span class="cio-custom__product-price">${price}</span>` : ''}`;
}

function section(name, title, itemsHtml, listClass) {
  return `<div class="cio-custom__section cio-custom__section--${name}" role="presentation">
    ${title ? `<p class="cio-custom__section-title" aria-hidden="true">${escape(title)}</p>` : ''}
    <ul class="cio-custom__list ${listClass}" role="group" aria-label="${escape(title || name)}">${itemsHtml}</ul>
  </div>`;
}

/**
 * Returns `{ html, items }`. `items` is the flat list of options in the same
 * order as `data-index`, so the element can map a highlighted index back to its item.
 */
export function renderResults({ id, query, suggestions, products, recentSearches, settings }) {
  const items = [];
  let html = '';

  if (recentSearches.length) {
    const inner = recentSearches
      .map((term) => {
        const item = { value: term, section: 'recent-searches' };
        items.push(item);
        return option(id, items.length - 1, item, `<span class="cio-custom__suggestion-text">${escape(term)}</span>`);
      })
      .join('');
    html += section('recent-searches', settings.recentSearchesLabel, inner, 'cio-custom__list--suggestions');
  }

  if (suggestions.length) {
    const inner = suggestions
      .map((item) => {
        items.push(item);
        return option(id, items.length - 1, item, suggestionInner(item, query, settings));
      })
      .join('');
    html += section('suggestions', 'Search Suggestions', inner, 'cio-custom__list--suggestions');
  }

  if (products.length) {
    const inner = products
      .map((item) => {
        items.push(item);
        return option(id, items.length - 1, item, productInner(item), 'cio-custom__option--product');
      })
      .join('');
    html += section('products', 'Products', inner, 'cio-custom__list--products');

    if (settings.displayShowAllResults && query) {
      html += `<div class="cio-custom__footer">
        <button type="button" class="cio-custom__show-all" data-cio-show-all>Show all results</button>
      </div>`;
    }
  }

  return { html, items };
}
