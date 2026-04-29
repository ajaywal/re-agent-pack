using Microsoft.AspNetCore.Mvc;
using TrackAllLoanMaintenanceLegacy.Application.Commands;
using TrackAllLoanMaintenanceLegacy.Application.DTOs;

namespace TrackAllLoanMaintenanceLegacy.Presentation.Controllers;

[ApiController]
[Route("api/edi/notifications")]
[Produces("application/json")]
public sealed class EdiNotificationController : ControllerBase
{
    private readonly Dispatch14ENotificationCommandHandler _handler;

    public EdiNotificationController(Dispatch14ENotificationCommandHandler handler) => _handler = handler;

    [HttpPost("14e")]
    [ProducesResponseType(typeof(EdiDispatchResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status504GatewayTimeout)]
    public async Task<ActionResult<EdiDispatchResultDto>> Dispatch14E([FromBody] Dispatch14ERequestDto request, CancellationToken ct)
    {
        // 400 — Loan not enrolled for EDI — R-L-006
        // 400 — Instant Issue cycle suppresses 14E — R-L-007
        // 400 — Form ID not in registered list — R-L-008
        // 504 — External dispatch path timed out
        try
        {
            var result = await _handler.HandleAsync(new Dispatch14ENotificationCommand(request), ct);
            return Ok(result);
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
