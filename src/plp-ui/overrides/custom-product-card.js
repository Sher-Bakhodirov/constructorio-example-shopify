// Component override example: replaces the library's product card with our own markup.
//
// The bundled build keeps React inside, so we can't pass it React components. Instead,
// `renderOverrides.productCard.renderHtml` can return a plain DOM element. It gets the same
// props as the library's own card; calling `onClick` / `onAddToCart` from those props keeps the
// library's behavior (Constructor tracking, product navigation, add to cart).

export default function renderCustomProductCard({ item, productInfo, formatPrice, onClick, onAddToCart }) {
  const { itemName, itemPrice, itemImageUrl, itemUrl } = productInfo;

  const card = document.createElement('div');
  card.className = 'cio-custom-card';

  const link = document.createElement('a');
  link.className = 'cio-custom-card__link';
  link.href = itemUrl || '#';
  link.addEventListener('click', (event) => onClick(event, item));

  if (itemImageUrl) {
    const image = document.createElement('img');
    image.className = 'cio-custom-card__image';
    image.src = itemImageUrl;
    image.alt = itemName;
    image.loading = 'lazy';
    link.append(image);
  }

  const title = document.createElement('span');
  title.className = 'cio-custom-card__title';
  title.textContent = itemName;
  link.append(title);

  if (Number(itemPrice) >= 0) {
    const price = document.createElement('span');
    price.className = 'cio-custom-card__price';
    price.textContent = formatPrice(itemPrice);
    link.append(price);
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'cio-custom-card__add';
  button.textContent = 'Add to cart';
  button.addEventListener('click', (event) => onAddToCart(event, item, itemPrice));

  card.append(link, button);
  return card;
}
