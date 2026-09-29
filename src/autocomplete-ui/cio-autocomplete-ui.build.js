// Approach A: Constructor's official Autocomplete UI library, bundled by webpack build.
// The "bundled" build ships with React inside, so the theme itself doesn't need React.
import CioAutocomplete from '@constructor-io/constructorio-ui-autocomplete/constructorio-ui-autocomplete-bundled';

/**
 * Turns the block settings (written by Liquid) into CioAutocomplete options.
 */
function buildOptions(settings) {
  const zeroStateSections = settings.showRecentSearches
    ? [{ type: 'recentSearches', displayName: settings.recentSearchesLabel }]
    : undefined;

  return {
    apiKey: settings.apiKey,
    placeholder: settings.placeholder,
    openOnFocus: settings.openOnFocus,
    autocompleteClassName: settings.themeStyling ? 'cio-autocomplete cio-theme' : 'cio-autocomplete',
    useShopifyDefaults: true,
    shopifySettings: { searchUrl: settings.searchUrl },
    sections: [
      { indexSectionName: 'Search Suggestions', numResults: settings.numSuggestions },
      { indexSectionName: 'Products', numResults: settings.numProducts },
    ],
    zeroStateSections,
    advancedParameters: {
      debounce: settings.debounce,
      displaySearchSuggestionImages: settings.displaySuggestionImages,
      displaySearchSuggestionResultCounts: settings.displaySuggestionCounts,
      displayShowAllResultsButton: settings.displayShowAllResults,
    },
  };
}

/**
 * Merges the block's "Advanced options (JSON)" on top of the generated options.
 * `advancedParameters` is merged one level deep so single keys can be overridden.
 */
function mergeOptions(options, overrides) {
  return {
    ...options,
    ...overrides,
    advancedParameters: { ...options.advancedParameters, ...overrides.advancedParameters },
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

    const settings = this.readJson('[data-cio-settings]');
    const target = this.querySelector('[data-cio-target]');

    if (!settings.apiKey || !target) return;

    this.mounted = true;

    const options = mergeOptions(buildOptions(settings), this.readJson('[data-cio-options]'));

    CioAutocomplete({ ...options, selector: `#${target.id}` });
  }

  /**
   * Reads and parses a <script type="application/json"> child.
   */
  readJson(selector) {
    const tag = this.querySelector(selector);
    if (!tag || !tag.textContent.trim()) return {};

    try {
      return JSON.parse(tag.textContent);
    } catch (error) {
      console.error(`[cio-autocomplete-ui] Invalid JSON in ${selector}`, error);
      return {};
    }
  }
}

if (!customElements.get('cio-autocomplete-ui')) {
  customElements.define('cio-autocomplete-ui', CioAutocompleteUi);
}
