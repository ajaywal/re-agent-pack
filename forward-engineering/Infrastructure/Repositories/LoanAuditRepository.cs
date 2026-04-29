using TrackAllLoanMaintenanceLegacy.Domain.Repositories;
using TrackAllLoanMaintenanceLegacy.Infrastructure.Persistence;

namespace TrackAllLoanMaintenanceLegacy.Infrastructure.Repositories;

public sealed class LoanAuditRepository : ILoanAuditRepository
{
    private readonly TrackAllLoanMaintenanceLegacyDbContext _db;

    public LoanAuditRepository(TrackAllLoanMaintenanceLegacyDbContext db) => _db = db;

    public async Task WriteAsync(LoanAuditEntry entry, CancellationToken ct)
    {
        var row = new LoanAuditRow
        {
            EntityType = entry.EntityType,
            EntityId = entry.EntityId,
            Action = entry.Action,
            ActorId = entry.ActorId,
            TimestampUtc = entry.TimestampUtc,
            BeforeJson = entry.BeforeJson,
            AfterJson = entry.AfterJson,
            RuleId = entry.RuleId
        };

        await _db.LoanAudits.AddAsync(row, ct);
        await _db.SaveChangesAsync(ct);
    }
}
