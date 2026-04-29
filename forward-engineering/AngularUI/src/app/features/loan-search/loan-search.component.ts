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
    <h2>Loan Search</h2>
    <form [formGroup]="searchForm" (ngSubmit)="onSearch()">
      <label>Loan Number <input formControlName="loanNum" /></label>
      <label>Borrower Name <input formControlName="borrowerName" /></label>
      <label>Property Address <input formControlName="propertyAddress" /></label>
      <button type="submit">Search</button>
    </form>

    <p *ngIf="error" style="color:#b00020">{{ error }}</p>

    <ul>
      <li *ngFor="let row of results">
        {{ row.loanNum }} - {{ row.borrowerName }}
        <button type="button" (click)="onProcess(row)">Process</button>
      </li>
    </ul>
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
  error = '';

  onSearch(): void {
    this.error = '';
    if (this.searchForm.invalid) {
      this.error = 'Enter at least one search value before searching.';
      return;
    }

    this.api.search(this.searchForm.getRawValue()).subscribe({
      next: (rows) => (this.results = rows),
      error: (e: Error) => (this.error = e.message),
    });
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

  goToAdd(): void {
    this.router.navigateByUrl('/loans/add');
  }
}
