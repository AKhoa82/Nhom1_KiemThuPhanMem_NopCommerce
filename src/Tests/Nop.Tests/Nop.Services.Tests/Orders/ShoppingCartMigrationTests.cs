using AwesomeAssertions;
using Nop.Core;
using Nop.Core.Domain.Catalog;
using Nop.Core.Domain.Customers;
using Nop.Core.Domain.Orders;
using Nop.Data;
using Nop.Services.Catalog;
using Nop.Services.Customers;
using Nop.Services.Common;
using Nop.Services.Orders;
using NUnit.Framework;

namespace Nop.Tests.Nop.Services.Tests.Orders;

[TestFixture]
public class ShoppingCartMigrationTests : ServiceTest
{
    private ICustomerService _customerService;
    private IProductService _productService;
    private IGenericAttributeService _genericAttributeService;
    private IShoppingCartService _shoppingCartService;
    private IRepository<ShoppingCartItem> _cartRepository;
    private int _storeId;
    private readonly List<Customer> _customers = [];
    private readonly List<Product> _products = [];

    [SetUp]
    public async Task SetUp()
    {
        _customerService = GetService<ICustomerService>();
        _productService = GetService<IProductService>();
        _genericAttributeService = GetService<IGenericAttributeService>();
        _shoppingCartService = GetService<IShoppingCartService>();
        _cartRepository = GetService<IRepository<ShoppingCartItem>>();
        _storeId = (await GetService<IStoreContext>().GetCurrentStoreAsync()).Id;
    }

    [TearDown]
    public async Task TearDown()
    {
        foreach (var customer in _customers)
        {
            foreach (var item in await _shoppingCartService.GetShoppingCartAsync(customer))
                await _cartRepository.DeleteAsync(item);
            await _customerService.DeleteCustomerAsync(customer);
        }

        foreach (var product in _products)
            await _productService.DeleteProductAsync(product);

        _customers.Clear();
        _products.Clear();
    }

    private async Task<Customer> CreateCustomerAsync(bool registered)
    {
        var customer = new Customer { Active = true, CustomerGuid = Guid.NewGuid() };
        await _customerService.InsertCustomerAsync(customer);
        var role = await _customerService.GetCustomerRoleBySystemNameAsync(registered
            ? NopCustomerDefaults.RegisteredRoleName
            : NopCustomerDefaults.GuestsRoleName);
        await _customerService.AddCustomerRoleMappingAsync(new CustomerCustomerRoleMapping
        {
            CustomerId = customer.Id,
            CustomerRoleId = role.Id
        });
        _customers.Add(customer);
        return customer;
    }

    private async Task<Product> CreateProductAsync(int stock = 5)
    {
        var product = new Product
        {
            Name = $"SCRUM-96-{Guid.NewGuid():N}",
            ProductType = ProductType.SimpleProduct,
            Published = true,
            VisibleIndividually = true,
            Price = 200,
            ManageInventoryMethod = ManageInventoryMethod.ManageStock,
            BackorderMode = BackorderMode.NoBackorders,
            StockQuantity = stock,
            OrderMinimumQuantity = 1,
            OrderMaximumQuantity = 100
        };
        await _productService.InsertProductAsync(product);
        _products.Add(product);
        return product;
    }

    private async Task AddCartLineAsync(Customer customer, Product product, int quantity)
    {
        await _cartRepository.InsertAsync(new ShoppingCartItem
        {
            CustomerId = customer.Id,
            ProductId = product.Id,
            StoreId = _storeId,
            ShoppingCartType = ShoppingCartType.ShoppingCart,
            Quantity = quantity,
            CreatedOnUtc = DateTime.UtcNow,
            UpdatedOnUtc = DateTime.UtcNow
        });
    }

    private async Task<int> QuantityAsync(Customer customer, Product product)
    {
        return (await _shoppingCartService.GetShoppingCartAsync(customer, ShoppingCartType.ShoppingCart, _storeId))
            .Where(item => item.ProductId == product.Id).Sum(item => item.Quantity);
    }

    [Test]
    public async Task OverStockMergeKeepsGuestItemAndWarns()
    {
        var account = await CreateCustomerAsync(true);
        var guest = await CreateCustomerAsync(false);
        var product = await CreateProductAsync();
        await AddCartLineAsync(account, product, 4);
        await AddCartLineAsync(guest, product, 2);

        var warnings = await _shoppingCartService.MigrateShoppingCartAsync(guest, account, true);

        warnings.Should().NotBeEmpty();
        (await QuantityAsync(account, product)).Should().Be(4);
        (await QuantityAsync(guest, product)).Should().Be(2);
    }

    [Test]
    public async Task RejectedGuestItemCanBeReducedAndMergedOnRetry()
    {
        var account = await CreateCustomerAsync(true);
        var guest = await CreateCustomerAsync(false);
        var product = await CreateProductAsync();
        await AddCartLineAsync(account, product, 4);
        await AddCartLineAsync(guest, product, 2);

        (await _shoppingCartService.MigrateShoppingCartAsync(guest, account, true)).Should().NotBeEmpty();
        var guestItem = (await _shoppingCartService.GetShoppingCartAsync(guest, ShoppingCartType.ShoppingCart, _storeId)).Single();
        guestItem.Quantity = 1;
        await _cartRepository.UpdateAsync(guestItem);

        (await _shoppingCartService.MigrateShoppingCartAsync(guest, account, true)).Should().BeEmpty();
        (await QuantityAsync(account, product)).Should().Be(5);
        (await QuantityAsync(guest, product)).Should().Be(0);
    }

    [TestCase(2, 2, 4)]
    [TestCase(2, 3, 5)]
    public async Task ValidMergeMovesItemExactlyOnce(int accountQuantity, int guestQuantity, int expectedQuantity)
    {
        var account = await CreateCustomerAsync(true);
        var guest = await CreateCustomerAsync(false);
        var product = await CreateProductAsync();
        await AddCartLineAsync(account, product, accountQuantity);
        await AddCartLineAsync(guest, product, guestQuantity);

        var warnings = await _shoppingCartService.MigrateShoppingCartAsync(guest, account, true);

        warnings.Should().BeEmpty();
        (await QuantityAsync(account, product)).Should().Be(expectedQuantity);
        (await QuantityAsync(guest, product)).Should().Be(0);
    }

    [Test]
    public async Task MixedMergeMovesValidLineAndPreservesRejectedLine()
    {
        var account = await CreateCustomerAsync(true);
        var guest = await CreateCustomerAsync(false);
        var limitedProduct = await CreateProductAsync();
        var otherProduct = await CreateProductAsync();
        await AddCartLineAsync(account, limitedProduct, 4);
        await AddCartLineAsync(guest, limitedProduct, 2);
        await AddCartLineAsync(guest, otherProduct, 1);

        var warnings = await _shoppingCartService.MigrateShoppingCartAsync(guest, account, true);

        warnings.Should().NotBeEmpty();
        (await QuantityAsync(account, limitedProduct)).Should().Be(4);
        (await QuantityAsync(guest, limitedProduct)).Should().Be(2);
        (await QuantityAsync(account, otherProduct)).Should().Be(1);
        (await QuantityAsync(guest, otherProduct)).Should().Be(0);
    }

    [Test]
    public async Task CouponCodesTransferOnlyAfterRejectedItemIsRecovered()
    {
        var account = await CreateCustomerAsync(true);
        var guest = await CreateCustomerAsync(false);
        var product = await CreateProductAsync();
        await AddCartLineAsync(account, product, 4);
        await AddCartLineAsync(guest, product, 2);
        await _customerService.ApplyDiscountCouponCodeAsync(guest, "b01-discount");
        await _customerService.ApplyGiftCardCouponCodeAsync(guest, "b01-gift");

        (await _shoppingCartService.MigrateShoppingCartAsync(guest, account, true)).Should().NotBeEmpty();
        (await _customerService.ParseAppliedDiscountCouponCodesAsync(account)).Should().BeEmpty();
        (await _customerService.ParseAppliedGiftCardCouponCodesAsync(account)).Should().BeEmpty();
        (await _customerService.ParseAppliedDiscountCouponCodesAsync(guest)).Should().ContainSingle().Which.Should().Be("b01-discount");
        (await _customerService.ParseAppliedGiftCardCouponCodesAsync(guest)).Should().ContainSingle().Which.Should().Be("b01-gift");

        var guestItem = (await _shoppingCartService.GetShoppingCartAsync(guest, ShoppingCartType.ShoppingCart, _storeId)).Single();
        guestItem.Quantity = 1;
        await _cartRepository.UpdateAsync(guestItem);

        (await _shoppingCartService.MigrateShoppingCartAsync(guest, account, true)).Should().BeEmpty();
        (await _customerService.ParseAppliedDiscountCouponCodesAsync(account)).Should().ContainSingle().Which.Should().Be("b01-discount");
        (await _customerService.ParseAppliedGiftCardCouponCodesAsync(account)).Should().ContainSingle().Which.Should().Be("b01-gift");
        (await QuantityAsync(guest, product)).Should().Be(0);
        (await QuantityAsync(account, product)).Should().Be(5);
    }

    [Test]
    public async Task RejectedMergePreservesAccountCheckoutSelectionsUntilRetrySucceeds()
    {
        var account = await CreateCustomerAsync(true);
        var guest = await CreateCustomerAsync(false);
        var product = await CreateProductAsync();
        await AddCartLineAsync(account, product, 4);
        await AddCartLineAsync(guest, product, 2);
        await _genericAttributeService.SaveAttributeAsync(account, NopCustomerDefaults.UseRewardPointsDuringCheckoutAttribute, true, _storeId);
        await _genericAttributeService.SaveAttributeAsync(account, NopCustomerDefaults.SelectedShippingOptionAttribute, "B01 shipping", _storeId);
        await _genericAttributeService.SaveAttributeAsync(account, NopCustomerDefaults.SelectedPaymentMethodAttribute, "B01 payment", _storeId);

        (await _shoppingCartService.MigrateShoppingCartAsync(guest, account, true)).Should().NotBeEmpty();
        (await QuantityAsync(account, product)).Should().Be(4);
        (await QuantityAsync(guest, product)).Should().Be(2);
        (await _genericAttributeService.GetAttributeAsync<bool>(account, NopCustomerDefaults.UseRewardPointsDuringCheckoutAttribute, _storeId)).Should().BeTrue();
        (await _genericAttributeService.GetAttributeAsync<string>(account, NopCustomerDefaults.SelectedShippingOptionAttribute, _storeId)).Should().Be("B01 shipping");
        (await _genericAttributeService.GetAttributeAsync<string>(account, NopCustomerDefaults.SelectedPaymentMethodAttribute, _storeId)).Should().Be("B01 payment");

        var guestItem = (await _shoppingCartService.GetShoppingCartAsync(guest, ShoppingCartType.ShoppingCart, _storeId)).Single();
        guestItem.Quantity = 1;
        await _cartRepository.UpdateAsync(guestItem);

        (await _shoppingCartService.MigrateShoppingCartAsync(guest, account, true)).Should().BeEmpty();
        (await QuantityAsync(account, product)).Should().Be(5);
        (await QuantityAsync(guest, product)).Should().Be(0);
        (await _genericAttributeService.GetAttributeAsync<bool>(account, NopCustomerDefaults.UseRewardPointsDuringCheckoutAttribute, _storeId)).Should().BeFalse();
        (await _genericAttributeService.GetAttributeAsync<string>(account, NopCustomerDefaults.SelectedShippingOptionAttribute, _storeId)).Should().BeNull();
        (await _genericAttributeService.GetAttributeAsync<string>(account, NopCustomerDefaults.SelectedPaymentMethodAttribute, _storeId)).Should().BeNull();
    }
}
