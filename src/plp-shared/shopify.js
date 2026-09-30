// Shopify helpers shared by both PLP demos (React and bundled).

/**
 * The catalog stores absolute product URLs (https://<shop>.myshopify.com/products/…).
 * Keep only the path, so links stay on whichever domain the store is served from.
 */
export function getItemUrl(item) {
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
export async function onAddToCart(event, item) {
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

/**
 * Formats prices in the store's active currency.
 */
export function createFormatPrice() {
  const formatter = new Intl.NumberFormat(window.Shopify?.locale || undefined, {
    style: 'currency',
    currency: window.Shopify?.currency?.active || 'USD',
  });

  return (price) => formatter.format(price ?? 0);
}
