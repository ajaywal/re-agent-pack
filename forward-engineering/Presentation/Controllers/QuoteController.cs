using Microsoft.AspNetCore.Mvc;
using TrackAllLoanMaintenanceLegacy.Application.Commands;
using TrackAllLoanMaintenanceLegacy.Application.DTOs;

namespace TrackAllLoanMaintenanceLegacy.Presentation.Controllers;

[ApiController]
[Route("api/quotes")]
[Produces("application/json")]
public sealed class QuoteController : ControllerBase
{
    private readonly ProcessLoanResultCommandHandler _handler;

    public QuoteController(ProcessLoanResultCommandHandler handler) => _handler = handler;

    [HttpPost("loan/{loanNumber}")]
    [ProducesResponseType(typeof(QuoteResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status504GatewayTimeout)]
    public async Task<ActionResult<QuoteResultDto>> GetLoanQuote(string loanNumber, CancellationToken ct)
    {
        // 400 — Property state not approved for quote — R-L-003
        // 400 — Quote not required by cycle flag — R-L-005
        // 504 — KY ISO pre-call timed out — R-L-004
        try
        {
            var result = await _handler.HandleAsync(new ProcessLoanResultCommand(loanNumber), ct);
            var quote = new QuoteResultDto
            {
                LoanNumber = result.LoanNum,
                Amount = result.QuoteAmount ?? 0m
            };
            return Ok(quote);
        }
        catch (TimeoutException ex)
        {
            return StatusCode(StatusCodes.Status504GatewayTimeout, new ApiErrorDto { Error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ApiErrorDto { Error = ex.Message });
        }
    }
}
