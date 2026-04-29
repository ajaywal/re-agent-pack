using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TrackAllLoanMaintenanceLegacy.Application.DTOs;
using TrackAllLoanMaintenanceLegacy.Domain.Entities;
using TrackAllLoanMaintenanceLegacy.Domain.Repositories;

namespace TrackAllLoanMaintenanceLegacy.Application.Queries;

public sealed record SearchLoansQuery(LoanSearchCriteriaDto Criteria);

public sealed class SearchLoansQueryHandler
{
    private readonly ILoanRepository _repo;

    public SearchLoansQueryHandler(ILoanRepository repo) => _repo = repo;

    public async Task<IReadOnlyList<LoanSearchResultDto>> HandleAsync(SearchLoansQuery query, CancellationToken ct)
    {
        LoanAggregate.ValidateSearchCriteria(query.Criteria.LoanNum, query.Criteria.BorrowerName);

        var result = await _repo.SearchAsync(
            new LoanSearchCriteria(query.Criteria.LoanNum, query.Criteria.BorrowerName, query.Criteria.PropertyAddress),
            ct);

        return result.Select(x => new LoanSearchResultDto
        {
            LoanNum = x.LoanNum.Value,
            BorrowerName = x.BorrowerName,
            PropertyAddress = x.PropertyAddress,
            PropertyState = x.PropertyState ?? string.Empty,
            QuoteReqd = x.QuoteReqd ?? string.Empty,
            EdiFlag = x.EdiFlag ?? string.Empty,
            CycleType = x.CycleType ?? string.Empty,
            LenderFormId = x.LenderFormId?.Value
        }).ToList();
    }
}
