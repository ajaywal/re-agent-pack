namespace TrackAllLoanMaintenanceLegacy.Domain.Events;

public sealed record Edi14EDispatchRequestedEvent(string LoanNumber, string FormId);
