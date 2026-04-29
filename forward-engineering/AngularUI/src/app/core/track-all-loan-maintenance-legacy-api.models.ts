export interface LoanSearchCriteria {
  loanNum?: string;          // R-L-001,R-L-002: at least one criterion; 10-digit numeric if provided
  borrowerName?: string;     // R-L-001: alternate required criterion
  propertyAddress?: string;  // [inferred] optional search criterion from UI binding
}

export interface LoanSearchResult {
  loanNum: string;           // R-L-002
  borrowerName: string;
  propertyAddress: string;
  propertyState: string;     // R-L-003,R-L-004
  quoteReqd: string;         // R-L-005
  ediFlag: string;           // R-L-006
  cycleType: string;         // R-L-007
  lenderFormId?: string;     // R-L-008
}

export interface CreateLoanRequest {
  loanNum: string;            // R-L-002,R-L-009
  borrowerName: string;       // R-L-009
  propertyAddress: string;    // R-L-011
  propertyState?: string;
  propertyType: string;       // R-L-013
  loanStatus: string;         // R-L-012
  propertyValue: number;      // R-L-010
  unpaidPrincipalBalance: number; // R-L-012
}

export interface UpdateLoanRequest {
  loanNum: string;                 // R-L-014 immutable key
  borrowerName?: string;
  propertyAddress: string;         // R-L-014 non-blank
  loanStatus: string;              // R-L-014 transition guard
  unpaidPrincipalBalance: number;  // R-L-014 non-increasing
  propertyValue?: number;
}

export interface LoanProcessResult {
  loanNum: string;
  quoteAmount?: number;
  dispatchId?: string;
  processedAtUtc: string;
}

export interface QuoteResult {
  loanNumber: string;
  amount: number;
}

export interface Dispatch14ERequest {
  loanNumber: string;
  formId: string;
}

export interface EdiDispatchResult {
  loanNumber: string;
  dispatchId: string;
}
