using System.Threading;
using System.Threading.Tasks;

namespace TrackAllLoanMaintenanceLegacy.Domain.Ports;

public interface IEDINotificationAdapter
{
    // R-L-006,R-L-007,R-L-008
    Task<string> Dispatch14EAsync(string loanNumber, string formId, CancellationToken ct);
}
