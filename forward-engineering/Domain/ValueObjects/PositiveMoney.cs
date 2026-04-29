using System;

namespace TrackAllLoanMaintenanceLegacy.Domain.ValueObjects;

public sealed record PositiveMoney
{
    public decimal Value { get; }

    public PositiveMoney(decimal value, string ruleId)
    {
        if (value <= 0)
            throw new ArgumentException($"{ruleId}: Value must be greater than zero.");

        Value = decimal.Round(value, 2, MidpointRounding.AwayFromZero);
    }

    public override string ToString() => Value.ToString("0.00");
}
