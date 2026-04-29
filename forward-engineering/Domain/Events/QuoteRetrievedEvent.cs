namespace TrackAllLoanMaintenanceLegacy.Domain.Events;

public sealed record QuoteRetrievedEvent(string LoanNumber, decimal QuoteAmount);
