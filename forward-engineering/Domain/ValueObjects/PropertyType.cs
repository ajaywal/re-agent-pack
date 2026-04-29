using System;

namespace TrackAllLoanMaintenanceLegacy.Domain.ValueObjects;

public sealed record PropertyType
{
    public string Value { get; }

    public PropertyType(string value)
    {
        var normalized = value?.Trim().ToUpperInvariant() ?? string.Empty;
        if (normalized is not "RESIDENTIAL" and not "COMMERCIAL")
            throw new ArgumentException("R-L-013: Property type must be RESIDENTIAL or COMMERCIAL.");

        Value = normalized;
    }

    public override string ToString() => Value;
}
