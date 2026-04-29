using System;
using System.Threading.Tasks;
using Xunit;

namespace TrackAllLoanMaintenanceLegacy.Tests.xUnit;

// R-L-008: Only pre-registered lender form IDs are allowed for 14E dispatch.
public class EdiNotification_UnregisteredFormId_Tests
{
    [Fact]
    public async Task given_unregistered_form_id_when_dispatch_14e_then_blocked_R_L_008()
    {
        // Arrange
        var adapter = new TrackAllLoanMaintenanceLegacy.Infrastructure.ExternalServices.EDINotificationAdapter();

        // Act
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            adapter.Dispatch14EAsync("1234567890", "UNREGISTERED", System.Threading.CancellationToken.None));

        // Assert
        Assert.Contains("R-L-008", ex.Message);
    }
}

// R-L-014: Existing loans can be modified only through approved status progression, non-increasing balance, and non-blank address while keeping loan number unchanged.
public class LoanModify_GovernedUpdate_Tests
{
    [Fact]
    public async Task given_invalid_modify_transition_when_update_then_rejected_R_L_014()
    {
        // Arrange
        var loan = TrackAllLoanMaintenanceLegacy.Domain.Entities.LoanAggregate.Create(
            loanNum: "1234567890",
            borrowerName: "Jordan Smith",
            propertyAddress: "120 Main St",
            propertyType: "RESIDENTIAL",
            loanStatus: "ACTIVE",
            propertyValue: 250000m,
            unpaidPrincipalBalance: 200000m);

        // Act
        var ex = Assert.Throws<InvalidOperationException>(() =>
            loan.ApplyModification("120 Main St", "CLOSED", 190000m, "Jordan Smith", 250000m));

        // Assert
        Assert.Contains("R-L-014", ex.Message);
        await Task.CompletedTask;
    }
}

public class LoanSearch_AtLeastOneCriterion_Tests
{
    [Fact]
    public async Task given_empty_search_criteria_when_search_then_rejected_R_L_001()
    {
        var ex = Assert.Throws<InvalidOperationException>(() =>
            TrackAllLoanMaintenanceLegacy.Domain.Entities.LoanAggregate.ValidateSearchCriteria(null, null));

        Assert.Contains("R-L-001", ex.Message);
        await Task.CompletedTask;
    }
}

public class Loan_IdentifierFormat_Tests
{
    [Fact]
    public async Task given_invalid_loan_number_when_submit_then_validation_error_R_L_002()
    {
        var ex = Assert.Throws<ArgumentException>(() =>
            new TrackAllLoanMaintenanceLegacy.Domain.ValueObjects.LoanNumber("12345"));

        Assert.Contains("R-L-002", ex.Message);
        await Task.CompletedTask;
    }
}

public class Quote_ApprovedStateEligibility_Tests
{
    [Fact]
    public async Task given_unapproved_state_when_quote_then_blocked_R_L_003()
    {
        var adapter = new TrackAllLoanMaintenanceLegacy.Infrastructure.ExternalServices.RataBaseServiceAdapter();

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            adapter.GetQuoteAsync("1234567890", "ZZ", System.Threading.CancellationToken.None));

        Assert.Contains("R-L-003", ex.Message);
    }
}

public class Quote_KentuckyIsoPrecall_Tests
{
    [Fact]
    public async Task given_kentucky_loan_when_quote_then_iso_precall_required_R_L_004()
    {
        var adapter = new TrackAllLoanMaintenanceLegacy.Infrastructure.ExternalServices.KentuckyIsoAdapter();

        var result = await adapter.GetInfoAsync("1234567890", System.Threading.CancellationToken.None);

        Assert.Contains("R-L-004", result);
    }
}

public class Quote_RequiredFlag_Tests
{
    [Fact]
    public async Task given_quote_flag_not_y_when_process_result_then_quote_skipped_R_L_005()
    {
        var loan = TrackAllLoanMaintenanceLegacy.Domain.Entities.LoanAggregate.Create(
            loanNum: "1234567890",
            borrowerName: "Jordan Smith",
            propertyAddress: "120 Main St",
            propertyType: "RESIDENTIAL",
            loanStatus: "ACTIVE",
            propertyValue: 250000m,
            unpaidPrincipalBalance: 200000m,
            quoteReqd: "N");

        Assert.False(loan.RequiresQuote());
        await Task.CompletedTask;
    }
}

public class Edi_EnrollmentRequired_Tests
{
    [Fact]
    public async Task given_loan_not_edi_enrolled_when_dispatch_14e_then_suppressed_R_L_006()
    {
        var loan = TrackAllLoanMaintenanceLegacy.Domain.Entities.LoanAggregate.Create(
            loanNum: "1234567890",
            borrowerName: "Jordan Smith",
            propertyAddress: "120 Main St",
            propertyType: "RESIDENTIAL",
            loanStatus: "ACTIVE",
            propertyValue: 250000m,
            unpaidPrincipalBalance: 200000m,
            ediFlag: "N",
            cycleType: "STANDARD",
            lenderFormId: "LT-F100");

        var ex = Assert.Throws<InvalidOperationException>(loan.ValidateEdiEligibility);

        Assert.Contains("R-L-006", ex.Message);
        await Task.CompletedTask;
    }
}

public class Edi_InstantIssueSuppression_Tests
{
    [Fact]
    public async Task given_instant_issue_cycle_when_dispatch_14e_then_suppressed_R_L_007()
    {
        var loan = TrackAllLoanMaintenanceLegacy.Domain.Entities.LoanAggregate.Create(
            loanNum: "1234567890",
            borrowerName: "Jordan Smith",
            propertyAddress: "120 Main St",
            propertyType: "RESIDENTIAL",
            loanStatus: "ACTIVE",
            propertyValue: 250000m,
            unpaidPrincipalBalance: 200000m,
            ediFlag: "Y",
            cycleType: "INSTANT_ISSUE",
            lenderFormId: "LT-F100");

        var ex = Assert.Throws<InvalidOperationException>(loan.ValidateEdiEligibility);

        Assert.Contains("R-L-007", ex.Message);
        await Task.CompletedTask;
    }
}

public class LoanCreate_CoreIdentityRequired_Tests
{
    [Fact]
    public async Task given_missing_loan_or_borrower_when_create_then_rejected_R_L_009()
    {
        var ex = Assert.Throws<InvalidOperationException>(() =>
            TrackAllLoanMaintenanceLegacy.Domain.Entities.LoanAggregate.Create(
                loanNum: "1234567890",
                borrowerName: "",
                propertyAddress: "120 Main St",
                propertyType: "RESIDENTIAL",
                loanStatus: "ACTIVE",
                propertyValue: 250000m,
                unpaidPrincipalBalance: 200000m));

        Assert.Contains("R-L-009", ex.Message);
        await Task.CompletedTask;
    }
}

public class LoanCreate_PositivePropertyValue_Tests
{
    [Fact]
    public async Task given_non_positive_property_value_when_create_then_rejected_R_L_010()
    {
        var ex = Assert.Throws<ArgumentException>(() =>
            TrackAllLoanMaintenanceLegacy.Domain.Entities.LoanAggregate.Create(
                loanNum: "1234567890",
                borrowerName: "Jordan Smith",
                propertyAddress: "120 Main St",
                propertyType: "RESIDENTIAL",
                loanStatus: "ACTIVE",
                propertyValue: 0m,
                unpaidPrincipalBalance: 200000m));

        Assert.Contains("R-L-010", ex.Message);
        await Task.CompletedTask;
    }
}

public class LoanCreate_PropertyAddressRequired_Tests
{
    [Fact]
    public async Task given_blank_property_address_when_create_then_rejected_R_L_011()
    {
        var ex = Assert.Throws<InvalidOperationException>(() =>
            TrackAllLoanMaintenanceLegacy.Domain.Entities.LoanAggregate.Create(
                loanNum: "1234567890",
                borrowerName: "Jordan Smith",
                propertyAddress: "",
                propertyType: "RESIDENTIAL",
                loanStatus: "ACTIVE",
                propertyValue: 250000m,
                unpaidPrincipalBalance: 200000m));

        Assert.Contains("R-L-011", ex.Message);
        await Task.CompletedTask;
    }
}

public class LoanCreate_ActiveStatusAndPositiveUpb_Tests
{
    [Fact]
    public async Task given_invalid_initial_status_or_upb_when_create_then_rejected_R_L_012()
    {
        var invalidStatus = Assert.Throws<InvalidOperationException>(() =>
            TrackAllLoanMaintenanceLegacy.Domain.Entities.LoanAggregate.Create(
                loanNum: "1234567890",
                borrowerName: "Jordan Smith",
                propertyAddress: "120 Main St",
                propertyType: "RESIDENTIAL",
                loanStatus: "CLOSED",
                propertyValue: 250000m,
                unpaidPrincipalBalance: 200000m));

        var invalidUpb = Assert.Throws<ArgumentException>(() =>
            TrackAllLoanMaintenanceLegacy.Domain.Entities.LoanAggregate.Create(
                loanNum: "1234567890",
                borrowerName: "Jordan Smith",
                propertyAddress: "120 Main St",
                propertyType: "RESIDENTIAL",
                loanStatus: "ACTIVE",
                propertyValue: 250000m,
                unpaidPrincipalBalance: 0m));

        Assert.Contains("R-L-012", invalidStatus.Message);
        Assert.Contains("R-L-012", invalidUpb.Message);
        await Task.CompletedTask;
    }
}

public class LoanCreate_PropertyTypeEnum_Tests
{
    [Fact]
    public async Task given_invalid_property_type_when_create_then_rejected_R_L_013()
    {
        var ex = Assert.Throws<ArgumentException>(() =>
            TrackAllLoanMaintenanceLegacy.Domain.Entities.LoanAggregate.Create(
                loanNum: "1234567890",
                borrowerName: "Jordan Smith",
                propertyAddress: "120 Main St",
                propertyType: "AGRICULTURAL",
                loanStatus: "ACTIVE",
                propertyValue: 250000m,
                unpaidPrincipalBalance: 200000m));

        Assert.Contains("R-L-013", ex.Message);
        await Task.CompletedTask;
    }
}
