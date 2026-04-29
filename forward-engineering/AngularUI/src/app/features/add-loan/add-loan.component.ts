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
    <section class="add-page">
      <button type="button" class="back-link" (click)="goBack()">Back to search</button>
      <h1>Add loan</h1>

      <form class="add-card" [formGroup]="addForm" (ngSubmit)="onSubmit()">
        <div class="form-grid two-column">
          <label>Loan number <input formControlName="loanNum" /></label>
          <label>Borrower name <input formControlName="borrowerName" /></label>
        </div>

        <div class="form-grid two-column">
          <label>Client ID <input formControlName="clientId" /></label>
          <label>State <input formControlName="propertyState" /></label>
        </div>

        <div class="form-grid two-column">
          <label>Coverage <input formControlName="coverage" /></label>
        </div>

        <label>Property address <input formControlName="propertyAddress" /></label>

        <div class="form-grid two-column">
          <label>
            Property type
            <select formControlName="propertyType">
              <option value="RESIDENTIAL">RESIDENTIAL</option>
              <option value="COMMERCIAL">COMMERCIAL</option>
            </select>
          </label>
          <label>Property value <input type="number" formControlName="propertyValue" /></label>
        </div>

        <div class="form-grid two-column">
          <label>Loan status <input formControlName="loanStatus" /></label>
          <label>UPB <input type="number" formControlName="unpaidPrincipalBalance" /></label>
        </div>

        <div class="form-grid two-column">
          <label>
            EDI flag
            <select formControlName="ediFlag">
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
          </label>
          <label>FCI code <input formControlName="fciCode" /></label>
        </div>

        <div class="form-grid two-column">
          <label>Form ID <input formControlName="formId" /></label>
          <button type="submit" class="primary-action add-submit">Add loan</button>
        </div>
      </form>

      <p *ngIf="message" class="status-message">{{ message }}</p>
    </section>
  `,
})
export class AddLoanComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(TrackAllLoanMaintenanceLegacyApiService);
  private readonly router = inject(Router);

  readonly addForm = this.fb.group({
    loanNum: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]], // R-L-002,R-L-009
    borrowerName: ['', [Validators.required]], // R-L-009
    clientId: ['ASSRNT01'],
    propertyState: ['KY'],
    coverage: ['Hazard'],
    propertyAddress: ['', [Validators.required]], // R-L-011
    propertyType: ['RESIDENTIAL', [Validators.required]], // R-L-013
    loanStatus: ['ACTIVE', [Validators.required]], // R-L-012
    propertyValue: [1, [Validators.min(0.01)]], // R-L-010
    unpaidPrincipalBalance: [1, [Validators.min(0.01)]], // R-L-012
    ediFlag: ['Y'],
    fciCode: ['BK140'],
    formId: ['FNMA14E'],
  });

  message = '';

  onSubmit(): void {
    this.message = '';
    if (this.addForm.invalid) {
      this.message = 'Please fix validation errors.';
      return;
    }

    const raw = this.addForm.getRawValue();
    this.api.add({
      loanNum: raw.loanNum ?? '',
      borrowerName: raw.borrowerName ?? '',
      propertyAddress: raw.propertyAddress ?? '',
      propertyState: raw.propertyState ?? undefined,
      propertyType: raw.propertyType ?? '',
      loanStatus: raw.loanStatus ?? '',
      propertyValue: raw.propertyValue ?? 0,
      unpaidPrincipalBalance: raw.unpaidPrincipalBalance ?? 0,
    }).subscribe({
      next: (res) => {
        this.message = `Created loan ${res.loanNumber}`;
        this.router.navigateByUrl('/loans/search');
      },
      error: (e: Error) => (this.message = e.message),
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/loans/search');
  }
}
