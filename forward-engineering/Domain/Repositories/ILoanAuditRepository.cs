using System;
using System.Threading;
using System.Threading.Tasks;

namespace TrackAllLoanMaintenanceLegacy.Domain.Repositories;

public sealed record LoanAuditEntry(
    string EntityType,
    string EntityId,
    string Action,
    string? ActorId,
    DateTime TimestampUtc,
    string? BeforeJson,
    string? AfterJson,
    string? RuleId);

public interface ILoanAuditRepository
{
    Task WriteAsync(LoanAuditEntry entry, CancellationToken ct);
}
