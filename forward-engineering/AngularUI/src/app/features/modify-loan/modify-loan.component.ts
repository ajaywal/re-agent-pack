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
    <h2>Modify Loan</h2>
    <form [formGroup]="modifyForm" (ngSubmit)="onSubmit()">
      <label>Loan Number <input formControlName="loanNum" readonly /></label>
      <label>Borrower Name <input formControlName="borrowerName" /></label>
      <label>Property Address <input formControlName="propertyAddress" /></label>
      <label>Loan Status <input formControlName="loanStatus" /></label>
      <label>UPB <input type="number" formControlName="unpaidPrincipalBalance" /></label>
      <label>Property Value <input type="number" formControlName="propertyValue" /></label>
      <button type="submit">Save Changes</button>
    </form>
    <p *ngIf="message">{{ message }}</p>
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
  });

  message = '';

  ngOnInit(): void {
    const loanNumber = this.route.snapshot.paramMap.get('loanNumber') ?? '';
    this.modifyForm.patchValue({ loanNum: loanNumber });
  }

  onSubmit(): void {
    this.message = '';
    if (this.modifyForm.invalid) {
      this.message = 'Please fix validation errors.';
      return;
    }

    const loanNumber = this.route.snapshot.paramMap.get('loanNumber') ?? '';
    const raw = this.modifyForm.getRawValue();

    this.api.modify(loanNumber, raw as any).subscribe({
      next: () => {
        this.message = 'Loan updated.';
        this.router.navigateByUrl('/loans/search');
      },
      error: (e: Error) => (this.message = e.message),
    });
  }
}
