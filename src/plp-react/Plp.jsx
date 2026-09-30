// The React app: Constructor's <CioPlp> with Shopify defaults, Shopify-friendly URLs,
// the store's currency, and our own product card (see ./overrides/).
import CioPlp from '@constructor-io/constructorio-ui-plp';
import { createFormatPrice, getItemUrl, onAddToCart } from '@/plp-shared/shopify';
import CustomProductCard from './overrides/CustomProductCard';

export default function Plp({ settings }) {
  return (
    <CioPlp
      apiKey={settings.apiKey}
      // Product clicks → /products/{handle}; collection links → /collections/{handle}.
      useShopifyDefaults
      callbacks={{ onAddToCart }}
      itemFieldGetters={{ getItemUrl }}
      formatters={{ formatPrice: createFormatPrice() }}
      staticRequestConfigs={{ resultsPerPage: settings.resultsPerPage }}
      renderOverrides={settings.customProductCard ? { productCard: { renderHtml: CustomProductCard } } : undefined}
    />
  );
}
