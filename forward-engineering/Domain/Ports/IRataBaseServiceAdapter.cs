using System.Threading;
using System.Threading.Tasks;

namespace TrackAllLoanMaintenanceLegacy.Domain.Ports;

public interface IRataBaseServiceAdapter
{
    // R-L-003,R-L-004,R-L-005
    Task<decimal> GetQuoteAsync(string loanNumber, string propertyState, CancellationToken ct);
}
