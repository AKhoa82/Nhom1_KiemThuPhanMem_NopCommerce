using Moq;
using Nop.Services.Localization;
using Nop.Services.Orders;
using NUnit.Framework;

namespace Nop.Tests.Nop.Services.Tests.Orders;

[TestFixture]
public class CheckoutErrorMessageTests
{
    private const string SafeMessage = "We couldn't complete your order. Check your order history before trying again.";

    [Test]
    public async Task MissingResourceUsesSafeFallback()
    {
        var localization = new Mock<ILocalizationService>();
        localization.Setup(x => x.GetResourceAsync(CheckoutErrorMessage.ResourceKey))
            .ReturnsAsync("checkout.orderprocessingerror");

        var result = await CheckoutErrorMessage.GetAsync(localization.Object);

        Assert.That(result, Is.EqualTo(SafeMessage));
    }

    [Test]
    public async Task KnownOrderIntervalMessageIsPreserved()
    {
        const string intervalMessage = "Please wait several seconds before placing a new order.";
        var localization = new Mock<ILocalizationService>();
        localization.Setup(x => x.GetResourceAsync("Checkout.MinOrderPlacementInterval"))
            .ReturnsAsync(intervalMessage);

        var result = await CheckoutErrorMessage.GetAsync(localization.Object, intervalMessage);

        Assert.That(result, Is.EqualTo(intervalMessage));
    }

    [Test]
    public async Task SqlErrorIsNeverReturnedToCustomer()
    {
        var localization = new Mock<ILocalizationService>();
        localization.Setup(x => x.GetResourceAsync("Checkout.MinOrderPlacementInterval"))
            .ReturnsAsync("Please wait several seconds before placing a new order.");
        localization.Setup(x => x.GetResourceAsync(CheckoutErrorMessage.ResourceKey))
            .ReturnsAsync(SafeMessage);

        var result = await CheckoutErrorMessage.GetAsync(localization.Object,
            "Cannot insert duplicate key row in object 'dbo.Order' with unique index 'AK_Order_OrderGuid'.");

        Assert.That(result, Is.EqualTo(SafeMessage));
    }

    [Test]
    public async Task LocalizationFailureUsesSafeFallback()
    {
        var localization = new Mock<ILocalizationService>();
        localization.Setup(x => x.GetResourceAsync(CheckoutErrorMessage.ResourceKey))
            .ThrowsAsync(new InvalidOperationException("Localization unavailable"));

        var result = await CheckoutErrorMessage.GetAsync(localization.Object);

        Assert.That(result, Is.EqualTo(SafeMessage));
    }
}
