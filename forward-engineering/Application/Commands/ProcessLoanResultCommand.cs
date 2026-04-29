using System;
using System.Threading;
using System.Threading.Tasks;
using TrackAllLoanMaintenanceLegacy.Application.DTOs;
using TrackAllLoanMaintenanceLegacy.Domain.Ports;
using TrackAllLoanMaintenanceLegacy.Domain.Repositories;

namespace TrackAllLoanMaintenanceLegacy.Application.Commands;

public sealed record ProcessLoanResultCommand(string LoanNumber);

public sealed class ProcessLoanResultCommandHandler
{
    private readonly ILoanRepository _repo;
    private readonly IRataBaseServiceAdapter _rataBase;
    private readonly IKentuckyIsoAdapter _kentuckyIso;
    private readonly IEDINotificationAdapter _edi;

    public ProcessLoanResultCommandHandler(
        ILoanRepository repo,
        IRataBaseServiceAdapter rataBase,
        IKentuckyIsoAdapter kentuckyIso,
        IEDINotificationAdapter edi)
    {
        _repo = repo;
        _rataBase = rataBase;
        _kentuckyIso = kentuckyIso;
        _edi = edi;
    }

    public async Task<LoanProcessResultDto> HandleAsync(ProcessLoanResultCommand command, CancellationToken ct)
    {
        var entity = await _repo.GetByLoanNumberAsync(command.LoanNumber, ct)
            ?? throw new InvalidOperationException("Loan not found.");

        decimal? quote = null;
        string? dispatch = null;

        if (entity.RequiresQuote())
        {
            entity.ValidateQuoteEligibility();
            if (string.Equals(entity.PropertyState, "KY", StringComparison.OrdinalIgnoreCase))
                _ = await _kentuckyIso.GetInfoAsync(entity.LoanNum.Value, ct);

            quote = await _rataBase.GetQuoteAsync(entity.LoanNum.Value, entity.PropertyState ?? string.Empty, ct);
        }

        if (string.Equals(entity.EdiFlag, "Y", StringComparison.OrdinalIgnoreCase))
        {
            entity.ValidateEdiEligibility();
            dispatch = await _edi.Dispatch14EAsync(entity.LoanNum.Value, entity.LenderFormId?.Value ?? string.Empty, ct);
        }

        return new LoanProcessResultDto
        {
            LoanNum = entity.LoanNum.Value,
            QuoteAmount = quote,
            DispatchId = dispatch,
            ProcessedAtUtc = DateTime.UtcNow
        };
    }
}
