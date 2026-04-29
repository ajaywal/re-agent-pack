using System.Threading;
using System.Threading.Tasks;
using TrackAllLoanMaintenanceLegacy.Domain.Repositories;

namespace TrackAllLoanMaintenanceLegacy.Application.Queries;

public sealed record GetLoanByIdQuery(string LoanNumber);

public sealed class GetLoanByIdQueryHandler
{
    private readonly ILoanRepository _repo;

    public GetLoanByIdQueryHandler(ILoanRepository repo) => _repo = repo;

    public Task<TrackAllLoanMaintenanceLegacy.Domain.Entities.LoanAggregate?> HandleAsync(GetLoanByIdQuery query, CancellationToken ct) =>
        _repo.GetByLoanNumberAsync(query.LoanNumber, ct);
}
