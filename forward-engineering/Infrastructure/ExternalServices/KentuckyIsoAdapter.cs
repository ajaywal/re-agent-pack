using TrackAllLoanMaintenanceLegacy.Domain.Ports;

namespace TrackAllLoanMaintenanceLegacy.Infrastructure.ExternalServices;

public sealed class KentuckyIsoAdapter : IKentuckyIsoAdapter
{
    public Task<string> GetInfoAsync(string loanNumber, CancellationToken ct)
    {
        // Wire to AIP930 legacy program path — see service_decomposition.md.
        throw new NotImplementedException();
    }
}
