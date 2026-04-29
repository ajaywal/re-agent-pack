using System.Threading;
using System.Threading.Tasks;
using TrackAllLoanMaintenanceLegacy.Application.DTOs;
using TrackAllLoanMaintenanceLegacy.Domain.Ports;
using TrackAllLoanMaintenanceLegacy.Domain.Repositories;

namespace TrackAllLoanMaintenanceLegacy.Application.Commands;

public sealed record Dispatch14ENotificationCommand(Dispatch14ERequestDto Request);

public sealed class Dispatch14ENotificationCommandHandler
{
    private readonly ILoanRepository _repo;
    private readonly IEDINotificationAdapter _edi;

    public Dispatch14ENotificationCommandHandler(ILoanRepository repo, IEDINotificationAdapter edi)
    {
        _repo = repo;
        _edi = edi;
    }

    public async Task<EdiDispatchResultDto> HandleAsync(Dispatch14ENotificationCommand command, CancellationToken ct)
    {
        var entity = await _repo.GetByLoanNumberAsync(command.Request.LoanNumber, ct);
        if (entity is null)
            throw new System.InvalidOperationException("Loan not found.");

        entity.ValidateEdiEligibility();
        var dispatchId = await _edi.Dispatch14EAsync(entity.LoanNum.Value, command.Request.FormId, ct);

        return new EdiDispatchResultDto
        {
            LoanNumber = entity.LoanNum.Value,
            DispatchId = dispatchId
        };
    }
}
