using Nop.Services.Localization;

namespace Nop.Services.Orders;

/// <summary>
/// Customer-facing fallback for unexpected order placement failures.
/// Keep exception details in the server log, never in the storefront response.
/// </summary>
public static class CheckoutErrorMessage
{
    public const string ResourceKey = "Checkout.OrderProcessingError";

    private const string Fallback = "We couldn't complete your order. Check your order history before trying again.";

    public static async Task<string> GetAsync(ILocalizationService localizationService)
    {
        try
        {
            var message = await localizationService.GetResourceAsync(ResourceKey);
            return string.IsNullOrWhiteSpace(message) ||
                string.Equals(message, ResourceKey, StringComparison.OrdinalIgnoreCase) ? Fallback : message;
        }
        catch
        {
            // An unavailable localization store must not turn error handling into another failure.
            return Fallback;
        }
    }
}
