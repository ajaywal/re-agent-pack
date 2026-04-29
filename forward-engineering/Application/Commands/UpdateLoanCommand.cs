using System;
using System.Threading;
using System.Threading.Tasks;
using TrackAllLoanMaintenanceLegacy.Application.DTOs;
using TrackAllLoanMaintenanceLegacy.Domain.Repositories;

namespace TrackAllLoanMaintenanceLegacy.Application.Commands;

public sealed record UpdateLoanCommand(string LoanNumber, ModifyLoanRequestDto Request);

public sealed class UpdateLoanCommandHandler
{
    private readonly ILoanRepository _repo;

    public UpdateLoanCommandHandler(ILoanRepository repo) => _repo = repo;

    public async Task HandleAsync(UpdateLoanCommand command, CancellationToken ct)
    {
        var entity = await _repo.GetByLoanNumberAsync(command.LoanNumber, ct)
            ?? throw new InvalidOperationException("Loan not found.");

        entity.ApplyModification(
            command.Request.PropertyAddress,
            command.Request.LoanStatus,
            command.Request.UnpaidPrincipalBalance,
            command.Request.BorrowerName,
            command.Request.PropertyValue);

        await _repo.UpdateAsync(entity, ct);
    }
}
