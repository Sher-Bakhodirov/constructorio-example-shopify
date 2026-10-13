// Approach D: a custom PLP built on Constructor's JavaScript client (no UI library, no React).
//
// Liquid renders the page frame and skeleton cards on the server, so the layout is in place
// before any JavaScript runs. This script fetches the collection from Constructor and swaps the
// skeletons for real cards, filters and pagination. State lives in the URL (?page=, ?sort=,
// ?filters[color]=…), so links are shareable and the back button works.
import ConstructorIOClient from '@constructor-io/constructorio-client-javascript';
import { readJson } from '@/autocomplete-shared/options';
import { createFormatPrice, getItemUrl, onAddToCart } from '@/plp-shared/shopify';

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

/** Reads page, sort and filters from the current URL. */
function readState() {
  const params = new URLSearchParams(window.location.search);
  const filters = {};

  params.forEach((value, key) => {
    const name = key.match(/^filters\[(.+)\]$/)?.[1];
    if (name) (filters[name] ||= []).push(value);
  });

  const [sortBy, sortOrder] = (params.get('sort') || '').split(':');
  return { page: Number(params.get('page')) || 1, sortBy, sortOrder, filters };
}

/** Writes the state back to the URL (keeps other params such as Shopify's ?view=). */
function writeState({ page, sortBy, sortOrder, filters }) {
  const url = new URL(window.location.href);
  [...url.searchParams.keys()]
    .filter((key) => key === 'page' || key === 'sort' || key.startsWith('filters['))
    .forEach((key) => url.searchParams.delete(key));

  if (page > 1) url.searchParams.set('page', page);
  if (sortBy) url.searchParams.set('sort', `${sortBy}:${sortOrder}`);
  Object.entries(filters).forEach(([name, values]) =>
    values.forEach((value) => url.searchParams.append(`filters[${name}]`, value))
  );

  window.history.pushState({}, '', url);
}

/**
 * <cio-plp-custom>
 *
 * Expects the server-rendered skeleton from blocks/cio-plp-custom.liquid inside it.
 * Each region ([data-cio-filters], [data-cio-count], [data-cio-grid], …) is filled in place.
 */
class CioPlpCustom extends HTMLElement {
  connectedCallback() {
    if (this.client) return;

    this.settings = readJson(this, '[data-cio-settings]');
    if (!this.settings.apiKey) return;

    this.client = new ConstructorIOClient({ apiKey: this.settings.apiKey, sendTrackingEvents: true });
    this.formatPrice = createFormatPrice();
    this.skeleton = this.querySelector('[data-cio-grid]').innerHTML;

    this.addEventListener('change', this.onChange);
    this.addEventListener('click', this.onClick);
    window.addEventListener('popstate', this.load);

    this.load();
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this.load);
  }

  load = async () => {
    const state = readState();
    const grid = this.querySelector('[data-cio-grid]');

    this.toggleAttribute('loading', true);
    if (this.hasRendered) grid.innerHTML = this.skeleton;

    try {
      const { response, result_id: resultId } = await this.client.browse.getBrowseResults(
        'group_id',
        this.settings.groupId,
        {
          page: state.page,
          resultsPerPage: this.settings.resultsPerPage,
          filters: state.filters,
          ...(state.sortBy && { sortBy: state.sortBy, sortOrder: state.sortOrder }),
        }
      );

      this.results = response.results;
      this.resultId = resultId;
      this.render(response, state, resultId);
      this.client.tracker.trackBrowseResultsLoaded({
        filterName: 'group_id',
        filterValue: this.settings.groupId,
        resultId,
        url: window.location.href,
        items: response.results.map((item) => ({ itemId: item.data.id, variationId: item.data.variation_id })),
      });
    } catch (error) {
      console.error('[cio-plp-custom] Browse request failed', error);
      grid.innerHTML = '<p class="cio-plp-custom__empty">Something went wrong. Please refresh the page.</p>';
    } finally {
      this.hasRendered = true;
      this.removeAttribute('loading');
    }
  };

  render(response, state, resultId) {
    const grid = this.querySelector('[data-cio-grid]');
    grid.dataset.cnstrcResultId = resultId;
    grid.innerHTML = response.results.length
      ? response.results.map((item, index) => this.renderCard(item, index)).join('')
      : '<p class="cio-plp-custom__empty">No products match these filters.</p>';

    this.querySelector('[data-cio-count]').textContent = `${response.total_num_results} products`;
    this.querySelector('[data-cio-filters]').innerHTML = response.facets
      .filter((facet) => facet.type === 'multiple')
      .map((facet) => this.renderFacet(facet, state))
      .join('');
    this.querySelector('[data-cio-sort]').innerHTML = this.renderSort(response.sort_options, state);
    this.querySelector('[data-cio-pagination]').innerHTML = this.renderPagination(
      Math.ceil(response.total_num_results / this.settings.resultsPerPage),
      state.page
    );
  }

  renderCard(item, index) {
    const url = getItemUrl({ url: item.data.url });
    const image = item.data.image_url
      ? `<img class="cio-plp-custom__image" src="${escapeHtml(item.data.image_url)}" alt="" loading="${index < 4 ? 'eager' : 'lazy'}">`
      : '';

    return `<article class="cio-plp-custom__card" data-cnstrc-item-id="${escapeHtml(item.data.id)}" data-cnstrc-item-name="${escapeHtml(item.value)}" data-cnstrc-item-variation-id="${escapeHtml(item.data.variation_id)}">
      <a class="cio-plp-custom__link" href="${escapeHtml(url)}" data-index="${index}">
        <div class="cio-plp-custom__media">${image}</div>
        <p class="cio-plp-custom__title">${escapeHtml(item.value)}</p>
        <p class="cio-plp-custom__price">${escapeHtml(this.formatPrice(item.data.price))}</p>
      </a>
      <button type="button" class="button button-secondary cio-plp-custom__add" data-add-to-cart="${index}">Add to cart</button>
    </article>`;
  }

  renderFacet(facet, state) {
    const selected = state.filters[facet.name] || [];
    const options = facet.options
      .map(
        (option) => `<label class="cio-plp-custom__option">
          <input type="checkbox" data-facet="${escapeHtml(facet.name)}" value="${escapeHtml(option.value)}"${selected.includes(option.value) ? ' checked' : ''}>
          <span>${escapeHtml(option.display_name)}</span>
          <span class="cio-plp-custom__option-count">${option.count}</span>
        </label>`
      )
      .join('');

    return `<details class="cio-plp-custom__facet"${selected.length ? ' open' : ''}>
      <summary>${escapeHtml(facet.display_name)}</summary>
      <div class="cio-plp-custom__options">${options}</div>
    </details>`;
  }

  renderSort(sortOptions, state) {
    const current = state.sortBy ? `${state.sortBy}:${state.sortOrder}` : '';
    const options = sortOptions
      .map((option) => {
        const value = option.sort_by === 'relevance' ? '' : `${option.sort_by}:${option.sort_order}`;
        return `<option value="${escapeHtml(value)}"${value === current ? ' selected' : ''}>${escapeHtml(option.display_name)}</option>`;
      })
      .join('');

    return `<label class="cio-plp-custom__sort">Sort by <select data-sort>${options}</select></label>`;
  }

  renderPagination(totalPages, currentPage) {
    if (totalPages <= 1) return '';

    return Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
      .map((page) =>
        page === currentPage
          ? `<span class="cio-plp-custom__page" aria-current="page">${page}</span>`
          : `<button type="button" class="cio-plp-custom__page" data-page="${page}">${page}</button>`
      )
      .join('');
  }

  onChange = (event) => {
    const state = readState();

    if (event.target.matches('[data-facet]')) {
      const { facet } = event.target.dataset;
      const values = new Set(state.filters[facet] || []);
      event.target.checked ? values.add(event.target.value) : values.delete(event.target.value);
      state.filters[facet] = [...values];
      if (!values.size) delete state.filters[facet];
      state.page = 1;
    } else if (event.target.matches('[data-sort]')) {
      [state.sortBy, state.sortOrder] = event.target.value.split(':');
      state.page = 1;
    } else {
      return;
    }

    writeState(state);
    this.load();
  };

  onClick = (event) => {
    const pageButton = event.target.closest('[data-page]');
    if (pageButton) {
      writeState({ ...readState(), page: Number(pageButton.dataset.page) });
      this.load();
      this.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const addButton = event.target.closest('[data-add-to-cart]');
    if (addButton) {
      const item = this.results[Number(addButton.dataset.addToCart)];
      onAddToCart(event, { variationId: item.data.variation_id });
      return;
    }

    const link = event.target.closest('.cio-plp-custom__link');
    if (link) {
      const item = this.results[Number(link.dataset.index)];
      this.client.tracker.trackBrowseResultClick({
        filterName: 'group_id',
        filterValue: this.settings.groupId,
        itemId: item.data.id,
        variationId: item.data.variation_id,
        itemName: item.value,
        resultId: this.resultId,
        resultPositionOnPage: Number(link.dataset.index) + 1,
      });
    }
  };
}

if (!customElements.get('cio-plp-custom')) {
  customElements.define('cio-plp-custom', CioPlpCustom);
}
