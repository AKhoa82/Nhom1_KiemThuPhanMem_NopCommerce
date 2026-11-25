import { cartManifest as manifest } from './cart-catalog';
import { executeReadonlySql } from './sql-fixture';
import { FixtureBlockedError } from './fixtures';

/** Verify expected fixture values after reset; never adapt the oracle to runtime values. */
export async function verifyCartManifest(checkShipping = false, n02 = false): Promise<string> {
  const { simple, variant } = manifest.products;
  const checks = [
    `IF NOT EXISTS (SELECT 1 FROM Product WHERE Sku='${variant.sku}' AND Price=${variant.price} AND IsTaxExempt=1 AND Deleted=0 AND Published=1 AND ManageInventoryMethodId=2 AND BackorderModeId=0) THROW 51000, 'FIXTURE_BLOCKED: variant price/tax/inventory differs from manifest.', 1;`,
    ...(!n02 ? [`IF NOT EXISTS (SELECT 1 FROM Product WHERE Sku='${simple.sku}' AND Price=${simple.price} AND StockQuantity=${simple.stock} AND Deleted=0 AND Published=1 AND BackorderModeId=0) THROW 51000, 'FIXTURE_BLOCKED: simple price/stock/tax differs from manifest.', 1;`,
      `IF NOT EXISTS (SELECT 1 FROM Discount WHERE CouponCode='${manifest.coupon.code}' AND DiscountTypeId=${manifest.coupon.discountTypeId} AND UsePercentage=1 AND DiscountPercentage=${manifest.coupon.percentage} AND IsActive=1 AND RequiresCouponCode=1 AND DiscountLimitationId=${manifest.coupon.limitationTypeId} AND (StartDateUtc IS NULL OR StartDateUtc<=GETUTCDATE()) AND (EndDateUtc IS NULL OR EndDateUtc>=GETUTCDATE())) THROW 51000, 'FIXTURE_BLOCKED: subtotal coupon differs from manifest.', 1;`] : []),
    `IF EXISTS (SELECT 1 FROM Product p JOIN TaxRate t ON t.TaxCategoryId=p.TaxCategoryId WHERE p.Sku IN ('${simple.sku}', '${variant.sku}') AND p.IsTaxExempt=0 AND t.Percentage<>0)
      OR EXISTS (SELECT 1 FROM Product p JOIN Setting s ON s.Name=CONCAT('tax.taxprovider.fixedorbycountrystatezip.taxcategoryid',p.TaxCategoryId) WHERE p.Sku IN ('${simple.sku}', '${variant.sku}') AND p.IsTaxExempt=0 AND TRY_CONVERT(decimal(18,4),s.Value)<>0)
      THROW 51000, 'FIXTURE_BLOCKED: nonzero fixture tax rate.', 1;`,
    `IF EXISTS (SELECT 1 FROM ProductAttributeValue pav JOIN Product_ProductAttribute_Mapping pam ON pam.Id=pav.ProductAttributeMappingId JOIN Product p ON p.Id=pam.ProductId WHERE p.Sku='${variant.sku}' AND pav.PriceAdjustment<>0) THROW 51000, 'FIXTURE_BLOCKED: unexpected variant price adjustment.', 1;`,
  ];
  for (const [key, stock] of Object.entries(variant.stock)) {
    if (n02 && !['RedS', 'BlueM'].includes(key)) continue;
    const color = key.startsWith('Red') ? 'Red' : 'Blue';
    const size = key.endsWith('S') ? 'S' : 'M';
    checks.push(`IF NOT EXISTS (SELECT 1 FROM ProductAttributeCombination pac JOIN Product p ON p.Id=pac.ProductId
      WHERE p.Sku='${variant.sku}' AND pac.StockQuantity=${stock} AND pac.AllowOutOfStockOrders=0
      AND EXISTS (SELECT 1 FROM ProductAttributeValue v JOIN Product_ProductAttribute_Mapping m ON m.Id=v.ProductAttributeMappingId WHERE m.ProductId=p.Id AND v.Name='${color}' AND pac.AttributesXml LIKE '%<Value>'+CONVERT(varchar(20),v.Id)+'</Value>%')
      AND EXISTS (SELECT 1 FROM ProductAttributeValue v JOIN Product_ProductAttribute_Mapping m ON m.Id=v.ProductAttributeMappingId WHERE m.ProductId=p.Id AND v.Name='${size}' AND pac.AttributesXml LIKE '%<Value>'+CONVERT(varchar(20),v.Id)+'</Value>%'))
      THROW 51000, 'FIXTURE_BLOCKED: ${key} stock differs from manifest.', 1;`);
  }
  if (checkShipping) checks.push(`IF NOT EXISTS (SELECT 1 FROM ShippingByWeightByTotalRecord WHERE ShippingMethodId=1 AND StoreId=0 AND WarehouseId=0 AND CountryId=0 AND StateProvinceId=0 AND AdditionalFixedCost=${manifest.checkout.groundShipping} AND RatePerWeightUnit=0 AND PercentageRateOfSubtotal=0) THROW 51000, 'FIXTURE_BLOCKED: Ground shipping differs from manifest.', 1;`);
  try {
    return await executeReadonlySql(`SET NOCOUNT ON;\n${checks.join('\n')}\nSELECT 'MANIFEST_OK|${manifest.version}';`);
  } catch (error) {
    throw new FixtureBlockedError(`FIXTURE_BLOCKED: cart manifest preflight failed: ${String(error)}`);
  }
}
