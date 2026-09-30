// Component override example: replaces the library's product card with our own markup.
//
// `<CioPlp>` takes `renderOverrides.productCard.renderHtml`, and each card gets the same
// props the library's own card uses. Calling `onClick` / `onAddToCart` from those props keeps
// the library's behavior: Constructor tracking, and (with `useShopifyDefaults`) navigating to
// the product page and adding to the Shopify cart.
export default function CustomProductCard({ item, productInfo, formatPrice, onClick, onAddToCart }) {
  const { itemName, itemPrice, itemImageUrl, itemUrl, productSwatch } = productInfo;
  const variationId = productSwatch?.selectedVariation?.variationId;

  return (
    <div className="cio-custom-card">
      <a className="cio-custom-card__link" href={itemUrl} onClick={(event) => onClick(event, item, variationId)}>
        {itemImageUrl && <img className="cio-custom-card__image" src={itemImageUrl} alt={itemName} loading="lazy" />}
        <span className="cio-custom-card__title">{itemName}</span>
        {Number(itemPrice) >= 0 && <span className="cio-custom-card__price">{formatPrice(itemPrice)}</span>}
      </a>
      <button
        type="button"
        className="cio-custom-card__add"
        onClick={(event) => onAddToCart(event, item, itemPrice, variationId)}
      >
        Add to cart
      </button>
    </div>
  );
}
