using TrackAllLoanMaintenanceLegacy.Domain.Ports;

namespace TrackAllLoanMaintenanceLegacy.Infrastructure.ExternalServices;

public sealed class EDINotificationAdapter : IEDINotificationAdapter
{
    public Task<string> Dispatch14EAsync(string loanNumber, string formId, CancellationToken ct)
    {
        // Wire to TKA920 / EDINotificationWriter legacy path — see service_decomposition.md.
        throw new NotImplementedException();
    }
}
