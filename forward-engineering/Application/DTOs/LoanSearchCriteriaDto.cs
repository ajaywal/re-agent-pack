namespace TrackAllLoanMaintenanceLegacy.Application.DTOs;

public sealed class LoanSearchCriteriaDto
{
    public string? LoanNum { get; init; }
    public string? BorrowerName { get; init; }
    public string? PropertyAddress { get; init; }
}
