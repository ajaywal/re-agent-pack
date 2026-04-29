namespace TrackAllLoanMaintenanceLegacy.Application.DTOs;

public sealed class EdiDispatchResultDto
{
    public string LoanNumber { get; init; } = string.Empty;
    public string DispatchId { get; init; } = string.Empty;
}
