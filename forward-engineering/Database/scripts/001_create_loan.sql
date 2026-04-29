CREATE TABLE dbo.Loan (
    LoanId INT IDENTITY(1,1) PRIMARY KEY,
    LoanNum CHAR(10) NOT NULL,               -- R-L-002
    BorrowerName NVARCHAR(100) NOT NULL,     -- R-L-009
    PropertyAddress NVARCHAR(255) NOT NULL,  -- R-L-011
    PropertyState CHAR(2) NULL,              -- R-L-003,R-L-004
    PropertyType NVARCHAR(20) NOT NULL,      -- R-L-013
    LoanStatus NVARCHAR(20) NOT NULL,        -- R-L-012,R-L-014
    PropertyValue DECIMAL(18,2) NOT NULL,    -- R-L-010
    UnpaidPrincipalBalance DECIMAL(18,2) NOT NULL, -- R-L-012,R-L-014
    QuoteReqd CHAR(1) NULL,                  -- R-L-005
    EdiFlag CHAR(1) NULL,                    -- R-L-006
    CycleType NVARCHAR(30) NULL,             -- R-L-007
    LenderFormId NVARCHAR(20) NULL,          -- R-L-008
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL
);
