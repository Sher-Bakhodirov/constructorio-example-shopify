// Approach B: Constructor's official Autocomplete UI library, bundled by our webpack build.
// The "bundled" build ships with React inside, so the theme itself doesn't need React.
import CioAutocomplete from '@constructor-io/constructorio-ui-autocomplete/constructorio-ui-autocomplete-bundled';
import { readOptions } from '@/autocomplete-shared/options';
import renderCustomProductItem from './overrides/custom-product-item';

/**
 * Swaps in our own product markup via the Products section's `renderItem`.
 * Other sections keep the library's default rendering.
 */
function withCustomProductItem(options) {
  return {
    ...options,
    sections: options.sections?.map((section) =>
      section.indexSectionName === 'Products' ? { ...section, renderItem: renderCustomProductItem } : section
    ),
  };
}

/**
 * <cio-autocomplete-ui>
 *
 * Renders Constructor's Autocomplete UI into its `[data-cio-target]` child, using the
 * settings in its `<script type="application/json" data-cio-settings>` child.
 * The browser calls `connectedCallback` whenever the element is added to the page,
 * including when the theme editor re-renders a section.
 */
class CioAutocompleteUi extends HTMLElement {
  connectedCallback() {
    // The library has no unmount API, so never mount the same element twice (e.g. when it's moved).
    if (this.mounted) return;

    const options = readOptions(this);
    const target = this.querySelector('[data-cio-target]');

    if (!options || !target) return;

    this.mounted = true;

    CioAutocomplete({ ...withCustomProductItem(options), selector: `#${target.id}` });
  }
}

if (!customElements.get('cio-autocomplete-ui')) {
  customElements.define('cio-autocomplete-ui', CioAutocompleteUi);
}
