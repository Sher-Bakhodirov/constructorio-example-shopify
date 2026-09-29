// Approach C (React): Constructor's Autocomplete UI library used as React components.
// Unlike the bundled build, React and the library are separate npm packages we compile ourselves.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@constructor-io/constructorio-ui-autocomplete/styles.css';
import { readOptions } from '@/autocomplete-shared/options';
import Autocomplete from './Autocomplete';

/**
 * <cio-autocomplete-react>
 *
 * Mounts a React root into its `[data-cio-target]` child, using the settings in its
 * `<script type="application/json" data-cio-settings>` child.
 * React can unmount, so the root is cleaned up when the element leaves the page.
 */
class CioAutocompleteReact extends HTMLElement {
  connectedCallback() {
    // Already mounted: the element was just moved on the page.
    if (this.root) return;

    const options = readOptions(this);
    const target = this.querySelector('[data-cio-target]');

    if (!options || !target) return;

    this.root = createRoot(target);
    this.root.render(
      <StrictMode>
        <Autocomplete options={options} />
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

if (!customElements.get('cio-autocomplete-react')) {
  customElements.define('cio-autocomplete-react', CioAutocompleteReact);
}
