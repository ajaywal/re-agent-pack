import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TrackAllLoanMaintenanceLegacyApiService } from '../../core/track-all-loan-maintenance-legacy-api.service';

@Component({
  selector: 'app-add-loan',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <h2>Add Loan</h2>
    <form [formGroup]="addForm" (ngSubmit)="onSubmit()">
      <label>Loan Number <input formControlName="loanNum" /></label>
      <label>Borrower Name <input formControlName="borrowerName" /></label>
      <label>Property Address <input formControlName="propertyAddress" /></label>
      <label>Property Type <input formControlName="propertyType" /></label>
      <label>Loan Status <input formControlName="loanStatus" /></label>
      <label>Property Value <input type="number" formControlName="propertyValue" /></label>
      <label>UPB <input type="number" formControlName="unpaidPrincipalBalance" /></label>
      <button type="submit">Add Loan</button>
    </form>
    <p *ngIf="message">{{ message }}</p>
  `,
})
export class AddLoanComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(TrackAllLoanMaintenanceLegacyApiService);
  private readonly router = inject(Router);

  readonly addForm = this.fb.group({
    loanNum: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]], // R-L-002,R-L-009
    borrowerName: ['', [Validators.required]], // R-L-009
    propertyAddress: ['', [Validators.required]], // R-L-011
    propertyType: ['', [Validators.required]], // R-L-013
    loanStatus: ['ACTIVE', [Validators.required]], // R-L-012
    propertyValue: [0, [Validators.min(0.01)]], // R-L-010
    unpaidPrincipalBalance: [0, [Validators.min(0.01)]], // R-L-012
  });

  message = '';

  onSubmit(): void {
    this.message = '';
    if (this.addForm.invalid) {
      this.message = 'Please fix validation errors.';
      return;
    }

    this.api.add(this.addForm.getRawValue() as any).subscribe({
      next: (res) => {
        this.message = `Created loan ${res.loanNumber}`;
        this.router.navigateByUrl('/loans/search');
      },
      error: (e: Error) => (this.message = e.message),
    });
  }
}
