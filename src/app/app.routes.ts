import { Routes } from '@angular/router';
import { ProductsComponent } from './products/product.component';

export const routes: Routes = [

  // ✅ DEFAULT PAGE → BILLING
  {
    path: '',
    redirectTo: 'billing',
    pathMatch: 'full'
  },

  {
    path: 'billing',
    loadComponent: () =>
      import('./billing/billing.component')
        .then(m => m.BillingComponent)
  },

  {
    path: 'products',
    component: ProductsComponent
  },

//   {
//     path: 'invoices',
//     loadComponent: () =>
//       import('./invoices/invoices.component')
//         .then(m => m.InvoicesComponent)
//   },

  // Optional safety fallback
  {
    path: '**',
    redirectTo: 'billing'
  }
];
