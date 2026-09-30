// Constructor PLP (product listing page) UI, bundled version.
// The "bundled" build ships with React inside, so the theme itself doesn't need React.
import CioPlp from '@constructor-io/constructorio-ui-plp/constructorio-ui-plp-bundled';
import { readJson } from '@/autocomplete-shared/options';
import { createFormatPrice, getItemUrl, onAddToCart } from '@/plp-shared/shopify';
import renderCustomProductCard from './overrides/custom-product-card';

/**
 * <cio-plp-ui>
 *
 * Renders Constructor's PLP into its `[data-cio-target]` child, using the settings in its
 * `<script type="application/json" data-cio-settings>` child. The library reads what to show
 * from the page URL: `/collections/<handle>` browses that group, `/search?q=` searches.
 */
class CioPlpUi extends HTMLElement {
  connectedCallback() {
    // The library has no unmount API, so never mount the same element twice (e.g. when it's moved).
    if (this.mounted) return;

    const settings = readJson(this, '[data-cio-settings]');
    const target = this.querySelector('[data-cio-target]');

    if (!settings.apiKey || !target) return;

    this.mounted = true;

    CioPlp({
      selector: `#${target.id}`,
      apiKey: settings.apiKey,
      // Product clicks → /products/{handle}; collection links → /collections/{handle}.
      useShopifyDefaults: true,
      callbacks: { onAddToCart },
      itemFieldGetters: { getItemUrl },
      formatters: { formatPrice: createFormatPrice() },
      staticRequestConfigs: { resultsPerPage: settings.resultsPerPage },
      renderOverrides: settings.customProductCard ? { productCard: { renderHtml: renderCustomProductCard } } : undefined,
    });
  }
}

if (!customElements.get('cio-plp-ui')) {
  customElements.define('cio-plp-ui', CioPlpUi);
}
