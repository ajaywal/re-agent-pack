using System;
using System.Threading;
using System.Threading.Tasks;
using TrackAllLoanMaintenanceLegacy.Application.DTOs;
using TrackAllLoanMaintenanceLegacy.Domain.Entities;
using TrackAllLoanMaintenanceLegacy.Domain.Repositories;

namespace TrackAllLoanMaintenanceLegacy.Application.Commands;

public sealed record CreateLoanCommand(AddLoanRequestDto Request);

public sealed class CreateLoanCommandHandler
{
    private readonly ILoanRepository _repo;

    public CreateLoanCommandHandler(ILoanRepository repo) => _repo = repo;

    public async Task<string> HandleAsync(CreateLoanCommand command, CancellationToken ct)
    {
        var existing = await _repo.GetByLoanNumberAsync(command.Request.LoanNum, ct);
        if (existing is not null)
            throw new InvalidOperationException("Loan already exists.");

        var entity = LoanAggregate.Create(
            command.Request.LoanNum,
            command.Request.BorrowerName,
            command.Request.PropertyAddress,
            command.Request.PropertyType,
            command.Request.LoanStatus,
            command.Request.PropertyValue,
            command.Request.UnpaidPrincipalBalance,
            command.Request.PropertyState);

        await _repo.AddAsync(entity, ct);
        return entity.LoanNum.Value;
    }
}
