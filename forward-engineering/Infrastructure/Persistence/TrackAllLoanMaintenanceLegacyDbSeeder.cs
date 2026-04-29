using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TrackAllLoanMaintenanceLegacy.Domain.Entities;

namespace TrackAllLoanMaintenanceLegacy.Infrastructure.Persistence;

public static class TrackAllLoanMaintenanceLegacyDbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TrackAllLoanMaintenanceLegacyDbContext>();

        await db.Database.EnsureCreatedAsync();
        if (await db.Loans.AnyAsync())
            return;

        var seedA = LoanAggregate.Create(
            loanNum: "1234567890",
            borrowerName: "Jordan Smith",
            propertyAddress: "120 Main St",
            propertyType: "RESIDENTIAL",
            loanStatus: "ACTIVE",
            propertyValue: 250000m,
            unpaidPrincipalBalance: 200000m,
            propertyState: "KY",
            quoteReqd: "Y",
            ediFlag: "Y",
            cycleType: "STANDARD",
            lenderFormId: "LT-F100");

        var seedB = LoanAggregate.Create(
            loanNum: "2234567890",
            borrowerName: "Casey Brown",
            propertyAddress: "89 Oak Ave",
            propertyType: "COMMERCIAL",
            loanStatus: "ACTIVE",
            propertyValue: 525000m,
            unpaidPrincipalBalance: 500000m,
            propertyState: "TX",
            quoteReqd: "N",
            ediFlag: "N",
            cycleType: "INSTANT_ISSUE",
            lenderFormId: "LT-F200");

        await db.Loans.AddRangeAsync(seedA, seedB);
        await db.SaveChangesAsync();
    }
}
