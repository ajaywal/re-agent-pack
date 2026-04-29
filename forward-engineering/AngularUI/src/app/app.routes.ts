import { Routes } from '@angular/router';
import { AddLoanComponent } from './features/add-loan/add-loan.component';
import { LoanSearchComponent } from './features/loan-search/loan-search.component';
import { ModifyLoanComponent } from './features/modify-loan/modify-loan.component';

export const routes: Routes = [
  { path: 'loans/search', component: LoanSearchComponent },
  { path: 'loans/add', component: AddLoanComponent },
  { path: 'loans/:loanNumber/modify', component: ModifyLoanComponent },
  { path: '', pathMatch: 'full', redirectTo: 'loans/search' },
];
