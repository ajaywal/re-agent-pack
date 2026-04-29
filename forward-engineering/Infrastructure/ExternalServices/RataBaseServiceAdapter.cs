using TrackAllLoanMaintenanceLegacy.Domain.Ports;

namespace TrackAllLoanMaintenanceLegacy.Infrastructure.ExternalServices;

public sealed class RataBaseServiceAdapter : IRataBaseServiceAdapter
{
    public Task<decimal> GetQuoteAsync(string loanNumber, string propertyState, CancellationToken ct)
    {
        // Wire to RataBaseServiceAdapter/GetQuote legacy path — see service_decomposition.md.
        throw new NotImplementedException();
    }
}
