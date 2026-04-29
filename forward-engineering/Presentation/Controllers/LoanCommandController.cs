using Microsoft.AspNetCore.Mvc;
using TrackAllLoanMaintenanceLegacy.Application.Commands;
using TrackAllLoanMaintenanceLegacy.Application.DTOs;

namespace TrackAllLoanMaintenanceLegacy.Presentation.Controllers;

[ApiController]
[Route("api/loans")]
[Produces("application/json")]
public sealed class LoanCommandController : ControllerBase
{
    private readonly CreateLoanCommandHandler _createHandler;
    private readonly UpdateLoanCommandHandler _updateHandler;

    public LoanCommandController(CreateLoanCommandHandler createHandler, UpdateLoanCommandHandler updateHandler)
    {
        _createHandler = createHandler;
        _updateHandler = updateHandler;
    }

    [HttpPost]
    [ProducesResponseType(typeof(LoanMutationResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<LoanMutationResultDto>> CreateLoan([FromBody] AddLoanRequestDto request, CancellationToken ct)
    {
        // 400 — Missing required identity fields — R-L-009
        // 400 — Property value <= 0 — R-L-010
        // 400 — Blank property address — R-L-011
        // 400 — Invalid initial status or UPB — R-L-012
        // 400 — Invalid property type — R-L-013
        // 409 — Duplicate loan key on create
        try
        {
            var id = await _createHandler.HandleAsync(new CreateLoanCommand(request), ct);
            return Ok(new LoanMutationResultDto { LoanNumber = id });
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase))
                return Conflict(new ApiErrorDto { Error = ex.Message });

            return BadRequest(new ApiErrorDto { Error = ex.Message });
        }
    }

    [HttpPut("{loanNumber}")]
    [ProducesResponseType(typeof(LoanMutationResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LoanMutationResultDto>> UpdateLoan(string loanNumber, [FromBody] ModifyLoanRequestDto request, CancellationToken ct)
    {
        // 400 — Modify transition or key constraints violated — R-L-014
        // 404 — Loan not found for update
        try
        {
            await _updateHandler.HandleAsync(new UpdateLoanCommand(loanNumber, request), ct);
            return Ok(new LoanMutationResultDto { LoanNumber = loanNumber });
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new ApiErrorDto { Error = ex.Message });

            return BadRequest(new ApiErrorDto { Error = ex.Message });
        }
    }
}
