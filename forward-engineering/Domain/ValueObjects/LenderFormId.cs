using System;

namespace TrackAllLoanMaintenanceLegacy.Domain.ValueObjects;

public sealed record LenderFormId
{
    public string Value { get; }

    public LenderFormId(string value)
    {
        var trimmed = value?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("R-L-008: Lender form ID cannot be blank.");

        Value = trimmed.ToUpperInvariant();
    }

    public override string ToString() => Value;
}
