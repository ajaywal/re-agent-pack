using System.Threading;
using System.Threading.Tasks;

namespace TrackAllLoanMaintenanceLegacy.Domain.Ports;

public interface IKentuckyIsoAdapter
{
    // R-L-004
    Task<string> GetInfoAsync(string loanNumber, CancellationToken ct);
}
