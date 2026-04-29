namespace TrackAllLoanMaintenanceLegacy.Domain.Events;

public sealed record Edi14EDispatchSuppressedEvent(string LoanNumber, string Reason);
