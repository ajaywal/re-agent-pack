namespace TrackAllLoanMaintenanceLegacy.Application.DTOs;

public sealed class QuoteResultDto
{
    public string LoanNumber { get; init; } = string.Empty;
    public decimal Amount { get; init; }
}
