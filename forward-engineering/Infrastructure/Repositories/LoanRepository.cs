using Microsoft.EntityFrameworkCore;
using TrackAllLoanMaintenanceLegacy.Domain.Entities;
using TrackAllLoanMaintenanceLegacy.Domain.Repositories;
using TrackAllLoanMaintenanceLegacy.Domain.ValueObjects;
using TrackAllLoanMaintenanceLegacy.Infrastructure.Persistence;

namespace TrackAllLoanMaintenanceLegacy.Infrastructure.Repositories;

public sealed class LoanRepository : ILoanRepository
{
    private readonly TrackAllLoanMaintenanceLegacyDbContext _db;

    public LoanRepository(TrackAllLoanMaintenanceLegacyDbContext db) => _db = db;

    public async Task<IReadOnlyList<LoanAggregate>> SearchAsync(LoanSearchCriteria criteria, CancellationToken ct)
    {
        var query = _db.Loans.AsQueryable();

        if (!string.IsNullOrWhiteSpace(criteria.LoanNum))
        {
            var loanNumber = new LoanNumber(criteria.LoanNum);
            query = query.Where(x => x.LoanNum == loanNumber);
        }

        if (!string.IsNullOrWhiteSpace(criteria.BorrowerName))
            query = query.Where(x => EF.Functions.Like(x.BorrowerName, $"%{criteria.BorrowerName}%"));

        if (!string.IsNullOrWhiteSpace(criteria.PropertyAddress))
            query = query.Where(x => EF.Functions.Like(x.PropertyAddress, $"%{criteria.PropertyAddress}%"));

        return await query.ToListAsync(ct);
    }

    public Task<LoanAggregate?> GetByLoanNumberAsync(string loanNumber, CancellationToken ct)
    {
        var loanNum = new LoanNumber(loanNumber);
        return _db.Loans.SingleOrDefaultAsync(x => x.LoanNum == loanNum, ct);
    }

    public async Task AddAsync(LoanAggregate loan, CancellationToken ct)
    {
        await _db.Loans.AddAsync(loan, ct);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(LoanAggregate loan, CancellationToken ct)
    {
        _db.Loans.Update(loan);
        await _db.SaveChangesAsync(ct);
    }
}
