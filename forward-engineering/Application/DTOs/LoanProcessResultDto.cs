using System;

namespace TrackAllLoanMaintenanceLegacy.Application.DTOs;

public sealed class LoanProcessResultDto
{
    public string LoanNum { get; init; } = string.Empty;
    public decimal? QuoteAmount { get; init; }
    public string? DispatchId { get; init; }
    public DateTime ProcessedAtUtc { get; init; }
}
