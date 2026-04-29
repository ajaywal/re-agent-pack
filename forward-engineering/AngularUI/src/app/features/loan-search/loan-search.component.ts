import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, ValidationErrors, AbstractControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TrackAllLoanMaintenanceLegacyApiService } from '../../core/track-all-loan-maintenance-legacy-api.service';
import { LoanSearchResult } from '../../core/track-all-loan-maintenance-legacy-api.models';

function atLeastOneFieldValidator(fieldNames: string[]): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const hasOne = fieldNames.some((name) => !!group.get(name)?.value?.toString().trim());
    return hasOne ? null : { atLeastOneField: true };
  };
}

@Component({
  selector: 'app-loan-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="loan-page">
      <header class="loan-hero">
        <div>
          <p class="eyebrow">Assurant Loan Maintenance</p>
          <h1>Loan search and<br />processing</h1>
          <p class="hero-copy">Modernized from TrackAll loan maintenance with rule-traced API validation.</p>
        </div>
        <button type="button" class="primary-action hero-action" (click)="goToAdd()">Add loan</button>
      </header>

      <form class="search-band" [formGroup]="searchForm" (ngSubmit)="onSearch()">
        <label>Loan number <input formControlName="loanNum" placeholder="1234567890" /></label>
        <label>Borrower name <input formControlName="borrowerName" placeholder="Jordan Smith" /></label>
        <label>Property address <input formControlName="propertyAddress" placeholder="120 Main St" /></label>
        <div class="search-actions">
          <button type="submit" class="primary-action">Search</button>
          <button type="button" class="secondary-action" (click)="onClear()">Clear</button>
        </div>
      </form>

      <p *ngIf="error" class="status-message">{{ error }}</p>

      <section class="workspace-grid">
        <article class="results-panel">
          <div class="panel-heading">
            <div>
              <p class="section-label">Search results</p>
              <h2>{{ results.length }} {{ results.length === 1 ? 'loan' : 'loans' }}</h2>
            </div>
            <span class="rule-chip">R-L-001 to R-L-008</span>
          </div>

          <table *ngIf="results.length">
            <thead>
              <tr>
                <th>Loan</th>
                <th>Borrower</th>
                <th>State</th>
                <th>Coverage</th>
                <th>Quote</th>
                <th>EDI</th>
                <th>Value</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                *ngFor="let row of results"
                [class.is-selected]="selectedLoan?.loanNum === row.loanNum"
                (click)="selectLoan(row)"
              >
                <td>
                  <strong>{{ row.loanNum }}</strong>
                  <span>{{ row.lenderFormId || 'No form' }}</span>
                </td>
                <td>{{ row.borrowerName }}</td>
                <td>{{ row.propertyState || '-' }}</td>
                <td>{{ coverageLabel(row) }}</td>
                <td><span class="flag-pill">{{ row.quoteReqd || '-' }}</span></td>
                <td><span class="flag-pill">{{ row.ediFlag || '-' }}</span></td>
                <td>{{ formatMoney(row.propertyValue) }}</td>
                <td>{{ row.loanStatus }}</td>
                <td><button type="button" class="row-action" (click)="onProcess(row); $event.stopPropagation()">Process</button></td>
              </tr>
            </tbody>
          </table>

          <div *ngIf="!results.length" class="empty-state">
            Search by loan number or borrower name to review loan processing rules.
          </div>
        </article>

        <aside class="detail-panel" *ngIf="selectedLoan as loan">
          <p class="section-label">Loan detail</p>
          <h2>{{ loan.loanNum }}</h2>

          <dl>
            <div>
              <dt>Cycle</dt>
              <dd>{{ loan.cycleType || '-' }}</dd>
            </div>
            <div>
              <dt>Form ID</dt>
              <dd>{{ loan.lenderFormId || '-' }}</dd>
            </div>
            <div>
              <dt>Property type</dt>
              <dd>{{ loan.propertyType }}</dd>
            </div>
            <div>
              <dt>Property value</dt>
              <dd>{{ formatMoney(loan.propertyValue) }}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{{ loan.propertyAddress }}</dd>
            </div>
            <div>
              <dt>UPB</dt>
              <dd>{{ formatMoney(loan.unpaidPrincipalBalance) }}</dd>
            </div>
          </dl>

          <button type="button" class="primary-action detail-action" (click)="onProcess(loan)">Process selected loan</button>
          <button type="button" class="secondary-action detail-action" (click)="onModify(loan)">Modify loan</button>
        </aside>
      </section>
    </section>
  `,
})
export class LoanSearchComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(TrackAllLoanMaintenanceLegacyApiService);
  private readonly router = inject(Router);

  readonly searchForm = this.fb.group(
    {
      loanNum: ['', [Validators.pattern(/^\d{10}$/)]], // R-L-002
      borrowerName: [''], // R-L-001
      propertyAddress: [''], // [inferred]
    },
    {
      validators: [atLeastOneFieldValidator(['loanNum', 'borrowerName'])], // R-L-001
    },
  );

  results: LoanSearchResult[] = [];
  selectedLoan: LoanSearchResult | null = null;
  error = '';

  onSearch(): void {
    this.error = '';
    if (this.searchForm.invalid) {
      this.error = 'Enter at least one search value before searching.';
      return;
    }

    const raw = this.searchForm.getRawValue();
    this.api.search({
      loanNum: raw.loanNum ?? undefined,
      borrowerName: raw.borrowerName ?? undefined,
      propertyAddress: raw.propertyAddress ?? undefined,
    }).subscribe({
      next: (rows) => {
        this.results = rows;
        this.selectedLoan = rows[0] ?? null;
      },
      error: (e: Error) => (this.error = e.message),
    });
  }

  onClear(): void {
    this.searchForm.reset({ loanNum: '', borrowerName: '', propertyAddress: '' });
    this.results = [];
    this.selectedLoan = null;
    this.error = '';
  }

  selectLoan(row: LoanSearchResult): void {
    this.selectedLoan = row;
  }

  onProcess(row: LoanSearchResult): void {
    this.error = '';
    this.api.process(row.loanNum).subscribe({
      next: () => {
        if (row.lenderFormId) {
          this.api.dispatch14E({ loanNumber: row.loanNum, formId: row.lenderFormId }).subscribe({
            next: () => (this.error = 'Process complete.'),
            error: (e: Error) => (this.error = e.message),
          });
          return;
        }

        this.error = 'Quote process complete.';
      },
      error: (e: Error) => (this.error = e.message),
    });
  }

  onModify(row: LoanSearchResult): void {
    this.router.navigateByUrl(`/loans/${row.loanNum}/modify`);
  }

  goToAdd(): void {
    this.router.navigateByUrl('/loans/add');
  }

  coverageLabel(row: LoanSearchResult): string {
    return row.propertyType === 'COMMERCIAL' ? 'Commercial' : 'Residential';
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value ?? 0);
  }
}
