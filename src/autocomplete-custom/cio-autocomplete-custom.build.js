// Approach D: a custom autocomplete built on Constructor's JavaScript client.
// No UI library and no React: we fetch results, render the HTML, and send tracking events ourselves.
import ConstructorIOClient from '@constructor-io/constructorio-client-javascript';
import { readJson } from '@/autocomplete-shared/options';
import { getPriceFormatter, renderResults } from './render';
import { getRecentSearches, storeRecentSearch } from './recent-searches';

let instanceCount = 0;

const escapeAttribute = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

/**
 * Copies the current page's query params (e.g. utm_*) onto `url`, like the library's Shopify mode.
 */
function withCurrentParams(url) {
  const target = new URL(url, window.location.origin);
  new URLSearchParams(window.location.search).forEach((value, key) => {
    if (!target.searchParams.has(key)) target.searchParams.set(key, value);
  });
  return target.toString();
}

/**
 * <cio-autocomplete-custom>
 *
 * Renders a search input + dropdown into its `[data-cio-target]` child, using the
 * settings in its `<script type="application/json" data-cio-settings>` child.
 * Follows the WAI-ARIA combobox pattern: the input owns a listbox of options,
 * and arrow keys move `aria-activedescendant`.
 */
class CioAutocompleteCustom extends HTMLElement {
  connectedCallback() {
    if (this.mounted) return;

    const settings = readJson(this, '[data-cio-settings]');
    const target = this.querySelector('[data-cio-target]');
    if (!settings.apiKey || !target) return;

    this.mounted = true;
    this.settings = { ...settings, ...readJson(this, '[data-cio-options]') };
    this.listboxId = `cio-custom-${(instanceCount += 1)}`;
    // Same client options as Constructor's UI library: tracking is off by default in the client.
    this.client = new ConstructorIOClient({
      apiKey: this.settings.apiKey,
      sendTrackingEvents: true,
      version: 'cio-shopify-demo-custom-autocomplete',
      eventDispatcher: { waitForBeacon: false },
    });
    this.items = [];
    this.activeIndex = -1;
    this.query = '';
    this.requestId = 0;

    target.innerHTML = this.template();
    this.form = target.querySelector('form');
    this.input = target.querySelector('input');
    this.clearButton = target.querySelector('[data-cio-clear]');
    this.listbox = target.querySelector('[role="listbox"]');

    this.abort = new AbortController();
    const { signal } = this.abort;

    this.input.addEventListener('input', () => this.onInput(), { signal });
    this.input.addEventListener('focus', () => this.onFocus(), { signal });
    this.input.addEventListener('keydown', (event) => this.onKeyDown(event), { signal });
    this.form.addEventListener('submit', (event) => this.onSubmit(event), { signal });
    this.clearButton.addEventListener('click', () => this.clear(), { signal });
    // mousedown (not click) so the input doesn't lose focus and close the list first.
    this.listbox.addEventListener('mousedown', (event) => this.onListMouseDown(event), { signal });
    this.listbox.addEventListener('mousemove', (event) => this.onListHover(event), { signal });
    document.addEventListener('click', (event) => !this.contains(event.target) && this.close(), { signal });

    // Warm up the price formatter while the page is idle, so the first results render fast.
    (window.requestIdleCallback || setTimeout)(() => getPriceFormatter());
  }

  disconnectedCallback() {
    // A move fires disconnect + connect back to back, so wait a tick before cleaning up.
    queueMicrotask(() => {
      if (this.isConnected || !this.abort) return;

      this.abort.abort();
      clearTimeout(this.debounceTimer);
      this.mounted = false;
    });
  }

  template() {
    const { themeStyling } = this.settings;
    const placeholder = escapeAttribute(this.settings.placeholder || 'Search');
    const searchUrl = escapeAttribute(this.settings.searchUrl || '/search');

    return `<div class="cio-custom${themeStyling ? ' cio-custom--theme' : ''}">
      <form class="cio-custom__form" role="search" action="${searchUrl}" method="get">
        <input
          class="cio-custom__input"
          type="search"
          name="q"
          autocomplete="off"
          enterkeyhint="search"
          placeholder="${placeholder}"
          aria-label="${placeholder}"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="false"
          aria-controls="${this.listboxId}-listbox"
          data-cnstrc-search-input
        >
        <button type="button" class="cio-custom__clear" data-cio-clear hidden aria-label="Clear search">&times;</button>
        <button type="submit" class="cio-custom__submit" aria-label="Search">
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m13 13 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      </form>
      <div class="cio-custom__results" id="${this.listboxId}-listbox" role="listbox" aria-label="Search results" hidden data-cnstrc-autosuggest></div>
    </div>`;
  }

  // ---------- Input ----------

  onFocus() {
    this.client.tracker.trackInputFocus();
    if (this.settings.openOnFocus !== false) this.update();
  }

  onInput() {
    this.clearButton.hidden = !this.input.value;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.update(), this.settings.debounce ?? 250);
  }

  clear() {
    this.input.value = '';
    this.clearButton.hidden = true;
    this.input.focus();
    this.update();
  }

  /**
   * Fetches results for the current input and renders them.
   * An empty input shows recent searches ("zero state") instead.
   */
  async update() {
    const query = this.input.value.trim();
    const requestId = ++this.requestId;
    this.query = query;

    if (!query) {
      const recentSearches = this.settings.showRecentSearches ? getRecentSearches() : [];
      this.render({ suggestions: [], products: [], recentSearches });
      return;
    }

    try {
      const response = await this.client.autocomplete.getAutocompleteResults(query, {
        resultsPerSection: {
          'Search Suggestions': this.settings.numSuggestions ?? 8,
          Products: this.settings.numProducts ?? 6,
        },
      });

      // A newer request started while this one was in flight: drop the stale response.
      if (requestId !== this.requestId) return;

      this.resultId = response.result_id;
      this.render({
        suggestions: response.sections?.['Search Suggestions'] || [],
        products: response.sections?.Products || [],
        recentSearches: [],
      });
    } catch (error) {
      if (requestId === this.requestId) this.close();
      console.error('[cio-autocomplete-custom] Autocomplete request failed', error);
    }
  }

  render({ suggestions, products, recentSearches }) {
    const { html, items } = renderResults({
      id: this.listboxId,
      query: this.query,
      suggestions,
      products,
      recentSearches,
      settings: this.settings,
    });

    this.items = items;
    this.activeIndex = -1;
    this.listbox.innerHTML = html;
    this.listbox.dataset.cnstrcResultId = this.resultId || '';

    if (items.length) {
      this.open();
    } else {
      this.close();
    }
  }

  open() {
    this.listbox.hidden = false;
    this.input.setAttribute('aria-expanded', 'true');
  }

  close() {
    if (!this.listbox) return;
    this.listbox.hidden = true;
    this.input.setAttribute('aria-expanded', 'false');
    this.input.removeAttribute('aria-activedescendant');
    this.activeIndex = -1;
  }

  // ---------- Keyboard (combobox pattern) ----------

  onKeyDown(event) {
    const isOpen = !this.listbox.hidden;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) return this.update();
        return this.setActive(this.activeIndex + 1);
      case 'ArrowUp':
        event.preventDefault();
        return isOpen && this.setActive(this.activeIndex - 1);
      case 'Enter':
        if (isOpen && this.activeIndex >= 0) {
          event.preventDefault();
          this.select(this.items[this.activeIndex]);
        }
        return undefined;
      case 'Escape':
        if (isOpen) {
          event.preventDefault();
          // Stop Horizon's search modal from closing on the same key press.
          event.stopPropagation();
          this.close();
        }
        return undefined;
      default:
        return undefined;
    }
  }

  setActive(index) {
    const count = this.items.length;
    if (!count) return;

    this.activeIndex = (index + count) % count;

    this.listbox.querySelectorAll('[role="option"]').forEach((node) => {
      node.setAttribute('aria-selected', String(Number(node.dataset.index) === this.activeIndex));
    });

    const active = this.listbox.querySelector(`[data-index="${this.activeIndex}"]`);
    this.input.setAttribute('aria-activedescendant', active.id);
    active.scrollIntoView({ block: 'nearest' });
  }

  // ---------- Mouse ----------

  onListHover(event) {
    const option = event.target.closest('[role="option"]');
    if (option && Number(option.dataset.index) !== this.activeIndex) this.setActive(Number(option.dataset.index));
  }

  onListMouseDown(event) {
    if (event.button !== 0) return;

    if (event.target.closest('[data-cio-show-all]')) {
      event.preventDefault();
      this.submitSearch(this.query);
      return;
    }

    const option = event.target.closest('[role="option"]');
    if (!option) return;

    event.preventDefault();
    this.select(this.items[Number(option.dataset.index)]);
  }

  // ---------- Select + submit (tracking + Shopify navigation) ----------

  /**
   * An option was chosen. Sends the same tracking events as Constructor's UI library,
   * then navigates the way its Shopify mode does.
   */
  select(item) {
    if (!item) return;
    const originalQuery = this.query;

    if (item.section === 'Products') {
      this.client.tracker.trackAutocompleteSelect(item.value, {
        originalQuery,
        section: 'Products',
        itemId: item.data?.id,
        resultId: this.resultId,
      });

      if (item.data?.url) window.location.href = withCurrentParams(item.data.url);
      return;
    }

    // Search suggestions and recent searches both go to the search results page.
    this.client.tracker.trackAutocompleteSelect(item.value, {
      originalQuery,
      section: 'Search Suggestions',
      resultId: item.section === 'recent-searches' ? undefined : this.resultId,
    });
    this.submitSearch(item.value, originalQuery);
  }

  onSubmit(event) {
    event.preventDefault();
    if (this.activeIndex >= 0 && !this.listbox.hidden) return;
    this.submitSearch(this.input.value.trim());
  }

  submitSearch(term, originalQuery = term) {
    if (!term) return;

    this.client.tracker.trackSearchSubmit(term, { originalQuery });
    storeRecentSearch(term);

    const url = new URL(withCurrentParams(this.settings.searchUrl || '/search'));
    url.searchParams.set('q', term);
    window.location.href = url.toString();
  }
}

if (!customElements.get('cio-autocomplete-custom')) {
  customElements.define('cio-autocomplete-custom', CioAutocompleteCustom);
}
