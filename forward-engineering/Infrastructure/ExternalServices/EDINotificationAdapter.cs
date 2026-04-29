using TrackAllLoanMaintenanceLegacy.Domain.Ports;

namespace TrackAllLoanMaintenanceLegacy.Infrastructure.ExternalServices;

public sealed class EDINotificationAdapter : IEDINotificationAdapter
{
    public Task<string> Dispatch14EAsync(string loanNumber, string formId, CancellationToken ct)
    {
        // Wire to TKA920 / EDINotificationWriter legacy path — see service_decomposition.md.
        ct.ThrowIfCancellationRequested();

        _ = new TrackAllLoanMaintenanceLegacy.Domain.ValueObjects.LoanNumber(loanNumber);

        var registeredFormId = new TrackAllLoanMaintenanceLegacy.Domain.ValueObjects.LenderFormId(formId).Value;
        if (registeredFormId is not "LT-F100" and not "LT-F200")
            throw new InvalidOperationException("R-L-008: 14E notification is not allowed for this lender form ID.");

        return Task.FromResult($"14E-{loanNumber}-{registeredFormId}");
    }
}
