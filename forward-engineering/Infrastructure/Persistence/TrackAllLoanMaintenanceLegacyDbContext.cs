using Microsoft.EntityFrameworkCore;
using TrackAllLoanMaintenanceLegacy.Domain.Entities;
using TrackAllLoanMaintenanceLegacy.Domain.ValueObjects;

namespace TrackAllLoanMaintenanceLegacy.Infrastructure.Persistence;

public sealed class TrackAllLoanMaintenanceLegacyDbContext : DbContext
{
    public TrackAllLoanMaintenanceLegacyDbContext(DbContextOptions<TrackAllLoanMaintenanceLegacyDbContext> options)
        : base(options)
    {
    }

    public DbSet<LoanAggregate> Loans => Set<LoanAggregate>();
    public DbSet<LoanAuditRow> LoanAudits => Set<LoanAuditRow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var loan = modelBuilder.Entity<LoanAggregate>();

        loan.ToTable("Loan", "dbo");
        loan.HasKey(x => x.Id);
        loan.Property(x => x.Id).HasColumnName("LoanId");

        loan.Property(x => x.LoanNum)
            .HasConversion(v => v.Value, v => new LoanNumber(v))
            .HasColumnName("LoanNum")
            .HasMaxLength(10)
            .IsFixedLength()
            .IsRequired();

        loan.Property(x => x.BorrowerName).HasColumnName("BorrowerName").HasMaxLength(100).IsRequired();
        loan.Property(x => x.PropertyAddress).HasColumnName("PropertyAddress").HasMaxLength(255).IsRequired();
        loan.Property(x => x.PropertyState).HasColumnName("PropertyState").HasMaxLength(2).IsFixedLength();

        loan.Property(x => x.PropertyType)
            .HasConversion(v => v.Value, v => new PropertyType(v))
            .HasColumnName("PropertyType")
            .HasMaxLength(20)
            .IsRequired();

        loan.Property(x => x.LoanStatus)
            .HasConversion(v => v.Value, v => new LoanStatus(v))
            .HasColumnName("LoanStatus")
            .HasMaxLength(20)
            .IsRequired();

        loan.Property(x => x.PropertyValue)
            .HasConversion(v => v.Value, v => new PositiveMoney(v, "R-L-010"))
            .HasColumnName("PropertyValue")
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        loan.Property(x => x.UnpaidPrincipalBalance)
            .HasConversion(v => v.Value, v => new PositiveMoney(v, "R-L-012"))
            .HasColumnName("UnpaidPrincipalBalance")
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        loan.Property(x => x.QuoteReqd).HasColumnName("QuoteReqd").HasMaxLength(1).IsFixedLength();
        loan.Property(x => x.EdiFlag).HasColumnName("EdiFlag").HasMaxLength(1).IsFixedLength();
        loan.Property(x => x.CycleType).HasColumnName("CycleType").HasMaxLength(30);

        loan.Property(x => x.LenderFormId)
            .HasConversion(v => v == null ? null : v.Value, v => v == null ? null : new LenderFormId(v))
            .HasColumnName("LenderFormId")
            .HasMaxLength(20);

        loan.Property(x => x.CreatedAtUtc).HasColumnName("CreatedAt").HasColumnType("datetime2").IsRequired();
        loan.Property(x => x.UpdatedAtUtc).HasColumnName("UpdatedAt").HasColumnType("datetime2");

        loan.HasIndex(x => x.LoanNum).IsUnique().HasDatabaseName("UX_Loan_LoanNum");
        loan.HasIndex(x => new { x.LoanNum, x.BorrowerName, x.PropertyAddress }).HasDatabaseName("IX_Loan_Search");

        var audit = modelBuilder.Entity<LoanAuditRow>();
        audit.ToTable("LoanAudit", "dbo");
        audit.HasKey(x => x.AuditId);
        audit.Property(x => x.EntityType).HasMaxLength(50).IsRequired();
        audit.Property(x => x.EntityId).HasMaxLength(50).IsRequired();
        audit.Property(x => x.Action).HasMaxLength(30).IsRequired();
        audit.Property(x => x.ActorId).HasMaxLength(100);
        audit.Property(x => x.TimestampUtc).HasColumnType("datetime2").IsRequired();
        audit.Property(x => x.BeforeJson);
        audit.Property(x => x.AfterJson);
        audit.Property(x => x.RuleId).HasMaxLength(20);
    }
}

public sealed class LoanAuditRow
{
    public long AuditId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? ActorId { get; set; }
    public DateTime TimestampUtc { get; set; }
    public string? BeforeJson { get; set; }
    public string? AfterJson { get; set; }
    public string? RuleId { get; set; }
}
