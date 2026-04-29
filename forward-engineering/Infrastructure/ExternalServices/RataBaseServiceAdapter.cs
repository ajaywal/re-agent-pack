using TrackAllLoanMaintenanceLegacy.Domain.Ports;

namespace TrackAllLoanMaintenanceLegacy.Infrastructure.ExternalServices;

public sealed class RataBaseServiceAdapter : IRataBaseServiceAdapter
{
    public Task<decimal> GetQuoteAsync(string loanNumber, string propertyState, CancellationToken ct)
    {
        // Wire to RataBaseServiceAdapter/GetQuote legacy path — see service_decomposition.md.
        ct.ThrowIfCancellationRequested();

        _ = new TrackAllLoanMaintenanceLegacy.Domain.ValueObjects.LoanNumber(loanNumber);

        var state = propertyState?.Trim().ToUpperInvariant() ?? string.Empty;
        if (state is not "KY" and not "TX")
            throw new InvalidOperationException("R-L-003: Quote is not available for this property state.");

        return Task.FromResult(state == "KY" ? 1250.00m : 1000.00m);
    }
}
