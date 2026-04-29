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

        var quoteNotRequired = LoanAggregate.Create(
            loanNum: "3333333333",
            borrowerName: "Quote Skip",
            propertyAddress: "333 Cycle Rd",
            propertyType: "RESIDENTIAL",
            loanStatus: "ACTIVE",
            propertyValue: 310000m,
            unpaidPrincipalBalance: 250000m,
            propertyState: "TX",
            quoteReqd: "N",
            ediFlag: "Y",
            cycleType: "STANDARD",
            lenderFormId: "LT-F100");

        var unapprovedQuoteState = LoanAggregate.Create(
            loanNum: "4444444444",
            borrowerName: "State Block",
            propertyAddress: "444 State Line",
            propertyType: "RESIDENTIAL",
            loanStatus: "ACTIVE",
            propertyValue: 275000m,
            unpaidPrincipalBalance: 210000m,
            propertyState: "CA",
            quoteReqd: "Y",
            ediFlag: "Y",
            cycleType: "STANDARD",
            lenderFormId: "LT-F100");

        var instantIssueEdi = LoanAggregate.Create(
            loanNum: "5555555555",
            borrowerName: "Instant Issue",
            propertyAddress: "555 Fast Lane",
            propertyType: "COMMERCIAL",
            loanStatus: "ACTIVE",
            propertyValue: 600000m,
            unpaidPrincipalBalance: 450000m,
            propertyState: "TX",
            quoteReqd: "N",
            ediFlag: "Y",
            cycleType: "INSTANT_ISSUE",
            lenderFormId: "LT-F200");

        await db.Loans.AddRangeAsync(seedA, seedB, quoteNotRequired, unapprovedQuoteState, instantIssueEdi);
        await db.SaveChangesAsync();
    }
}
