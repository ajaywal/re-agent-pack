using Microsoft.AspNetCore.Mvc;
using TrackAllLoanMaintenanceLegacy.Application.DTOs;
using TrackAllLoanMaintenanceLegacy.Application.Queries;

namespace TrackAllLoanMaintenanceLegacy.Presentation.Controllers;

[ApiController]
[Route("api/loans")]
[Produces("application/json")]
public sealed class LoanQueryController : ControllerBase
{
    private readonly SearchLoansQueryHandler _handler;

    public LoanQueryController(SearchLoansQueryHandler handler) => _handler = handler;

    [HttpGet("search")]
    [ProducesResponseType(typeof(IReadOnlyList<LoanSearchResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<LoanSearchResultDto>>> SearchLoans([FromQuery] LoanSearchCriteriaDto request, CancellationToken ct)
    {
        // 400 — Empty search criteria — R-L-001
        // 400 — Invalid loan number format — R-L-002
        // 404 — No matching loans
        try
        {
            var result = await _handler.HandleAsync(new SearchLoansQuery(request), ct);
            if (result.Count == 0)
                return NotFound(new ApiErrorDto { Error = "No loans matched the supplied criteria." });

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ApiErrorDto { Error = ex.Message });
        }
    }
}
