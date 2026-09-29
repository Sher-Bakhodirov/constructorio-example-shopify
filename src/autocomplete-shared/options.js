// Shared by every Constructor autocomplete demo (bundled and React).
// Turns the block settings that Liquid writes as JSON into CioAutocomplete options/props.

/**
 * Parses the <script type="application/json"> matching `selector` inside `root`.
 */
export function readJson(root, selector) {
  const tag = root.querySelector(selector);
  if (!tag || !tag.textContent.trim()) return {};

  try {
    return JSON.parse(tag.textContent);
  } catch (error) {
    console.error(`[cio-autocomplete] Invalid JSON in ${selector}`, error);
    return {};
  }
}

/**
 * Turns the block settings (written by Liquid) into CioAutocomplete options.
 */
export function buildOptions(settings) {
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
export function mergeOptions(options, overrides) {
  return {
    ...options,
    ...overrides,
    advancedParameters: { ...options.advancedParameters, ...overrides.advancedParameters },
  };
}

/**
 * Reads both JSON tags inside `root` and returns the final options.
 * Returns null when there's no API key, so callers can skip mounting.
 */
export function readOptions(root) {
  const settings = readJson(root, '[data-cio-settings]');
  if (!settings.apiKey) return null;

  return mergeOptions(buildOptions(settings), readJson(root, '[data-cio-options]'));
}
