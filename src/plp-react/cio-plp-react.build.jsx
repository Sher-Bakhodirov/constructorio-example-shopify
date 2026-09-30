// Constructor PLP (product listing page) UI, React version.
// Renders Constructor-powered collection (browse) and search pages inside the Shopify theme.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@constructor-io/constructorio-ui-plp/styles.css';
import { readJson } from '@/autocomplete-shared/options';
import Plp from './Plp';

/**
 * <cio-plp-react>
 *
 * Mounts a React root into its `[data-cio-target]` child, using the settings in its
 * `<script type="application/json" data-cio-settings>` child. The library reads what to
 * show from the page URL: `/collections/<handle>` browses that group, `/search?q=` searches.
 */
class CioPlpReact extends HTMLElement {
  connectedCallback() {
    // Already mounted: the element was just moved on the page.
    if (this.root) return;

    const settings = readJson(this, '[data-cio-settings]');
    const target = this.querySelector('[data-cio-target]');

    if (!settings.apiKey || !target) return;

    this.root = createRoot(target);
    this.root.render(
      <StrictMode>
        <Plp settings={settings} />
      </StrictMode>
    );
  }

  disconnectedCallback() {
    // A move fires disconnect + connect back to back, so wait a tick before unmounting.
    queueMicrotask(() => {
      if (this.isConnected || !this.root) return;

      this.root.unmount();
      this.root = null;
    });
  }
}

if (!customElements.get('cio-plp-react')) {
  customElements.define('cio-plp-react', CioPlpReact);
}
