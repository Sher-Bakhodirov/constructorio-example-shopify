// The React app: Constructor's <CioPlp> with Shopify defaults, Shopify-friendly URLs,
// the store's currency, and our own product card (see ./overrides/).
import CioPlp from '@constructor-io/constructorio-ui-plp';
import CustomProductCard from './overrides/CustomProductCard';

/**
 * The catalog stores absolute product URLs (https://<shop>.myshopify.com/products/…).
 * Keep only the path, so links stay on whichever domain the store is served from.
 */
function getItemUrl(item) {
  const url = item.url || item.data?.url;
  if (!url) return undefined;

  try {
    const { pathname, search } = new URL(url, window.location.origin);
    return `${pathname}${search}`;
  } catch {
    return url;
  }
}

/**
 * Adds the variant to the cart, then fires Horizon's cart event so the cart drawer and icon
 * refresh themselves. The catalog stores the Shopify variant ID as the item's `variationId`.
 */
async function onAddToCart(event, item) {
  const id = item.variationId;
  const { CartLinesUpdateEvent } = await import(/* webpackIgnore: true */ '@shopify/events');

  await fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, quantity: 1 }),
  });
  const cart = await fetch('/cart.js').then((response) => response.json());

  document.dispatchEvent(
    new CartLinesUpdateEvent({
      action: 'add',
      context: 'product',
      lines: [{ merchandiseId: `gid://shopify/ProductVariant/${id}`, quantity: 1 }],
      promise: Promise.resolve({ cart: CartLinesUpdateEvent.createCartFromAjaxResponse(cart), detail: {} }),
    })
  );
}

export default function Plp({ settings }) {
  const priceFormatter = new Intl.NumberFormat(window.Shopify?.locale || undefined, {
    style: 'currency',
    currency: window.Shopify?.currency?.active || 'USD',
  });

  return (
    <CioPlp
      apiKey={settings.apiKey}
      // Product clicks → /products/{handle}; collection links → /collections/{handle}.
      useShopifyDefaults
      callbacks={{ onAddToCart }}
      itemFieldGetters={{ getItemUrl }}
      formatters={{ formatPrice: (price) => priceFormatter.format(price ?? 0) }}
      staticRequestConfigs={{ resultsPerPage: settings.resultsPerPage }}
      renderOverrides={settings.customProductCard ? { productCard: { renderHtml: CustomProductCard } } : undefined}
    />
  );
}
