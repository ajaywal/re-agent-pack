import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TrackAllLoanMaintenanceLegacyApiService } from '../../core/track-all-loan-maintenance-legacy-api.service';

@Component({
  selector: 'app-modify-loan',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="modify-page">
      <button type="button" class="back-link" (click)="goBack()">Back to search</button>
      <h1>Modify loan</h1>

      <form class="modify-card" [formGroup]="modifyForm" (ngSubmit)="onSubmit()">
        <div class="modify-grid two-column">
          <label>Loan number <input formControlName="loanNum" readonly /></label>
          <label>Borrower name <input formControlName="borrowerName" /></label>
        </div>

        <label>Property address <input formControlName="propertyAddress" /></label>

        <div class="modify-grid two-column">
          <label>Loan status <input formControlName="loanStatus" /></label>
          <label>UPB <input type="number" formControlName="unpaidPrincipalBalance" /></label>
        </div>

        <div class="modify-grid two-column">
          <label>Property value <input type="number" formControlName="propertyValue" /></label>
        </div>

        <label>Mortgagee clause <input formControlName="mortgageeClause" /></label>

        <button type="submit" class="primary-action save-action">Save changes</button>
      </form>

      <p *ngIf="message" class="status-message">{{ message }}</p>
    </section>
  `,
})
export class ModifyLoanComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(TrackAllLoanMaintenanceLegacyApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly modifyForm = this.fb.group({
    loanNum: [{ value: '', disabled: true }], // R-L-014
    borrowerName: [''],
    propertyAddress: ['', [Validators.required]], // R-L-014
    loanStatus: ['', [Validators.required]], // R-L-014
    unpaidPrincipalBalance: [0, [Validators.min(0)]], // R-L-014
    propertyValue: [0],
    mortgageeClause: [''],
  });

  message = '';

  ngOnInit(): void {
    const loanNumber = this.route.snapshot.paramMap.get('loanNumber') ?? '';
    this.modifyForm.patchValue({ loanNum: loanNumber });

    if (!loanNumber) {
      return;
    }

    this.api.search({ loanNum: loanNumber }).subscribe({
      next: ([loan]) => {
        if (!loan) {
          this.message = 'Loan not found.';
          return;
        }

        this.modifyForm.patchValue({
          loanNum: loan.loanNum,
          borrowerName: loan.borrowerName,
          propertyAddress: loan.propertyAddress,
          loanStatus: loan.loanStatus,
          unpaidPrincipalBalance: loan.unpaidPrincipalBalance,
          propertyValue: loan.propertyValue,
        });
      },
      error: (e: Error) => (this.message = e.message),
    });
  }

  onSubmit(): void {
    this.message = '';
    if (this.modifyForm.invalid) {
      this.message = 'Please fix validation errors.';
      return;
    }

    const loanNumber = this.route.snapshot.paramMap.get('loanNumber') ?? '';
    const raw = this.modifyForm.getRawValue();

    this.api.modify(loanNumber, {
      loanNum: raw.loanNum ?? loanNumber,
      borrowerName: raw.borrowerName ?? undefined,
      propertyAddress: raw.propertyAddress ?? '',
      loanStatus: raw.loanStatus ?? '',
      unpaidPrincipalBalance: raw.unpaidPrincipalBalance ?? 0,
      propertyValue: raw.propertyValue ?? undefined,
    }).subscribe({
      next: () => {
        this.message = 'Loan updated.';
        this.router.navigateByUrl('/loans/search');
      },
      error: (e: Error) => (this.message = e.message),
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/loans/search');
  }
}
