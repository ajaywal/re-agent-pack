using TrackAllLoanMaintenanceLegacy.Domain.Ports;

namespace TrackAllLoanMaintenanceLegacy.Infrastructure.ExternalServices;

public sealed class KentuckyIsoAdapter : IKentuckyIsoAdapter
{
    public Task<string> GetInfoAsync(string loanNumber, CancellationToken ct)
    {
        // Wire to AIP930 legacy program path — see service_decomposition.md.
        ct.ThrowIfCancellationRequested();

        _ = new TrackAllLoanMaintenanceLegacy.Domain.ValueObjects.LoanNumber(loanNumber);
        return Task.FromResult($"R-L-004: Kentucky ISO advisory lookup completed for loan {loanNumber}.");
    }
}
