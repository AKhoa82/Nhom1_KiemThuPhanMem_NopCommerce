using Microsoft.AspNetCore.Http;
using Nop.Core.Domain.Orders;
using Nop.Core.Domain.Payments;
using Nop.Services.Payments;
using Nop.Services.Plugins;

namespace Nop.Plugin.Payments.QaDecline;

/// <summary>
/// Deterministic, local-only payment processor for PAY-FAIL-01.
/// This processor deliberately declines every payment and never performs I/O.
/// </summary>
public sealed class QaDeclinePaymentProcessor : BasePlugin, IPaymentMethod
{
    private const string DeclineMessage = "QA decline: simulated payment processor rejected the transaction.";

    public Task<ProcessPaymentResult> ProcessPaymentAsync(ProcessPaymentRequest processPaymentRequest)
    {
        ArgumentNullException.ThrowIfNull(processPaymentRequest);

        var result = new ProcessPaymentResult();
        result.AddError(DeclineMessage);
        return Task.FromResult(result);
    }

    public Task PostProcessPaymentAsync(PostProcessPaymentRequest postProcessPaymentRequest) => Task.CompletedTask;

    public Task<bool> HidePaymentMethodAsync(IList<ShoppingCartItem> cart) => Task.FromResult(false);

    public Task<decimal> GetAdditionalHandlingFeeAsync(IList<ShoppingCartItem> cart) => Task.FromResult(decimal.Zero);

    public Task<CapturePaymentResult> CaptureAsync(CapturePaymentRequest capturePaymentRequest)
    {
        var result = new CapturePaymentResult();
        result.AddError("QA decline does not support capture.");
        return Task.FromResult(result);
    }

    public Task<RefundPaymentResult> RefundAsync(RefundPaymentRequest refundPaymentRequest)
    {
        var result = new RefundPaymentResult();
        result.AddError("QA decline does not support refund.");
        return Task.FromResult(result);
    }

    public Task<VoidPaymentResult> VoidAsync(VoidPaymentRequest voidPaymentRequest)
    {
        var result = new VoidPaymentResult();
        result.AddError("QA decline does not support void.");
        return Task.FromResult(result);
    }

    public Task<ProcessPaymentResult> ProcessRecurringPaymentAsync(ProcessPaymentRequest processPaymentRequest)
    {
        var result = new ProcessPaymentResult();
        result.AddError("QA decline does not support recurring payments.");
        return Task.FromResult(result);
    }

    public Task<CancelRecurringPaymentResult> CancelRecurringPaymentAsync(CancelRecurringPaymentRequest cancelRecurringPaymentRequest)
    {
        var result = new CancelRecurringPaymentResult();
        result.AddError("QA decline does not support recurring payments.");
        return Task.FromResult(result);
    }

    public Task<bool> CanRePostProcessPaymentAsync(Order order)
    {
        ArgumentNullException.ThrowIfNull(order);
        return Task.FromResult(false);
    }

    public Task<IList<string>> ValidatePaymentFormAsync(IFormCollection form) =>
        Task.FromResult<IList<string>>(new List<string>());

    public Task<ProcessPaymentRequest> GetPaymentInfoAsync(IFormCollection form) =>
        Task.FromResult(new ProcessPaymentRequest());

    public Type GetPublicViewComponent() => null;

    public Task<string> GetPaymentMethodDescriptionAsync() =>
        Task.FromResult("QA-only local processor: every payment is declined.");

    public bool SupportCapture => false;

    public bool SupportPartiallyRefund => false;

    public bool SupportRefund => false;

    public bool SupportVoid => false;

    public RecurringPaymentType RecurringPaymentType => RecurringPaymentType.NotSupported;

    public PaymentMethodType PaymentMethodType => PaymentMethodType.Standard;

    public bool SkipPaymentInfo => true;
}
