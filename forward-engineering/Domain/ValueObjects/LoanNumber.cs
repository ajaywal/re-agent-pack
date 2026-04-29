using System;
using System.Linq;

namespace TrackAllLoanMaintenanceLegacy.Domain.ValueObjects;

public sealed record LoanNumber
{
    public string Value { get; }

    public LoanNumber(string value)
    {
        var trimmed = value?.Trim() ?? string.Empty;
        if (trimmed.Length != 10 || !trimmed.All(char.IsDigit))
            throw new ArgumentException("R-L-002: Loan number must be exactly 10 numeric digits.");

        Value = trimmed;
    }

    public override string ToString() => Value;
}
