// Component override example: replaces how the library renders each product.
//
// The bundled build keeps React inside, so we can't pass it React components. Instead, a
// section's `renderItem` can return a plain DOM element: the library wraps it in its own
// list item, so clicks, keyboard navigation and tracking still work.

function formatPrice(price) {
  if (price === undefined || price === null || price === '') return '';

  const amount = Number(price);
  if (Number.isNaN(amount)) return String(price);

  try {
    return new Intl.NumberFormat(window.Shopify?.locale || undefined, {
      style: 'currency',
      currency: window.Shopify?.currency?.active || 'USD',
    }).format(amount);
  } catch {
    return amount.toFixed(2);
  }
}

/**
 * `renderItem` for the Products section: a card with image, title and price.
 * Uses textContent / setAttribute only, so values from the API can't inject HTML.
 */
export default function renderCustomProductItem({ item }) {
  const card = document.createElement('div');
  card.className = 'cio-custom-product';

  if (item.data?.image_url) {
    const image = document.createElement('img');
    image.className = 'cio-custom-product__image';
    image.src = item.data.image_url;
    image.alt = '';
    image.loading = 'lazy';
    card.append(image);
  }

  const title = document.createElement('p');
  title.className = 'cio-custom-product__title';
  title.textContent = item.value;
  card.append(title);

  const price = formatPrice(item.data?.price);
  if (price) {
    const priceNode = document.createElement('p');
    priceNode.className = 'cio-custom-product__price';
    priceNode.textContent = price;
    card.append(priceNode);
  }

  return card;
}
