using System;

namespace TrackAllLoanMaintenanceLegacy.Domain.ValueObjects;

public sealed record LoanStatus
{
    public string Value { get; }

    public LoanStatus(string value)
    {
        var normalized = value?.Trim().ToUpperInvariant() ?? string.Empty;
        Value = normalized switch
        {
            "ACTIVE" => normalized,
            "DELINQUENT" => normalized,
            "CLOSED" => normalized,
            _ => throw new ArgumentException("R-L-012/R-L-014: Invalid loan status.")
        };
    }

    public bool IsActive() => Value == "ACTIVE";

    public bool CanTransitionTo(LoanStatus next)
    {
        if (Value == next.Value)
            return true;

        return (Value, next.Value) switch
        {
            ("ACTIVE", "DELINQUENT") => true,
            ("DELINQUENT", "CLOSED") => true,
            _ => false
        };
    }

    public override string ToString() => Value;
}
