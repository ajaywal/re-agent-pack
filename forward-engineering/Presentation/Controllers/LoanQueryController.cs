using Microsoft.AspNetCore.Mvc;
using TrackAllLoanMaintenanceLegacy.Application.DTOs;
using TrackAllLoanMaintenanceLegacy.Application.Queries;

namespace TrackAllLoanMaintenanceLegacy.Presentation.Controllers;

[ApiController]
[Route("api/loans")]
public sealed class LoanQueryController : ControllerBase
{
    private readonly SearchLoansQueryHandler _handler;

    public LoanQueryController(SearchLoansQueryHandler handler) => _handler = handler;

    [HttpGet("search")]
    public async Task<ActionResult<object>> SearchLoans([FromQuery] LoanSearchCriteriaDto request, CancellationToken ct)
    {
        // 400 — Empty search criteria — R-L-001
        // 400 — Invalid loan number format — R-L-002
        // 404 — No matching loans
        try
        {
            var result = await _handler.HandleAsync(new SearchLoansQuery(request), ct);
            if (result.Count == 0)
                return NotFound(new { error = "No loans matched the supplied criteria." });

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
