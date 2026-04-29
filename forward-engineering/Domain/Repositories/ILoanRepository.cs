using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TrackAllLoanMaintenanceLegacy.Domain.Entities;

namespace TrackAllLoanMaintenanceLegacy.Domain.Repositories;

public sealed record LoanSearchCriteria(string? LoanNum, string? BorrowerName, string? PropertyAddress);

public interface ILoanRepository
{
    Task<IReadOnlyList<LoanAggregate>> SearchAsync(LoanSearchCriteria criteria, CancellationToken ct);
    Task<LoanAggregate?> GetByLoanNumberAsync(string loanNumber, CancellationToken ct);
    Task AddAsync(LoanAggregate loan, CancellationToken ct);
    Task UpdateAsync(LoanAggregate loan, CancellationToken ct);
}
