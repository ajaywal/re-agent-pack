import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import {
  CreateLoanRequest,
  Dispatch14ERequest,
  EdiDispatchResult,
  LoanProcessResult,
  LoanSearchCriteria,
  LoanSearchResult,
  QuoteResult,
  UpdateLoanRequest,
} from './track-all-loan-maintenance-legacy-api.models';

@Injectable({ providedIn: 'root' })
export class TrackAllLoanMaintenanceLegacyApiService {
  private readonly http = inject(HttpClient);
  private readonly baseLoansUrl = 'http://localhost:5000/api/loans';
  private readonly baseQuotesUrl = 'http://localhost:5000/api/quotes';
  private readonly baseEdiUrl = 'http://localhost:5000/api/edi/notifications';

  search(criteria: LoanSearchCriteria) {
    return this.http
      .get<LoanSearchResult[]>(`${this.baseLoansUrl}/search`, { params: criteria as any })
      .pipe(catchError((err) => this.handleError(err)));
  }

  add(request: CreateLoanRequest) {
    return this.http
      .post<{ loanNumber: string }>(this.baseLoansUrl, request)
      .pipe(catchError((err) => this.handleError(err)));
  }

  modify(loanNumber: string, request: UpdateLoanRequest) {
    return this.http
      .put<{ loanNumber: string }>(`${this.baseLoansUrl}/${loanNumber}`, request)
      .pipe(catchError((err) => this.handleError(err)));
  }

  process(loanNumber: string) {
    return this.http
      .post<QuoteResult>(`${this.baseQuotesUrl}/loan/${loanNumber}`, {})
      .pipe(catchError((err) => this.handleError(err)));
  }

  dispatch14E(request: Dispatch14ERequest) {
    return this.http
      .post<EdiDispatchResult>(`${this.baseEdiUrl}/14e`, request)
      .pipe(catchError((err) => this.handleError(err)));
  }

  private handleError(err: any) {
    const message = err?.error?.error ?? err?.message ?? 'Unexpected API error';
    return throwError(() => new Error(message));
  }
}
