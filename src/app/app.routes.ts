import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './gaurds/auth.gaurd';


export const routes: Routes = [

  // 🔓 Public route
  {
    path: 'login',
    component: LoginComponent
  },

  // 🔒 Protected routes with layout
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'billing',
        loadComponent: () =>
          import('./billing/billing.component')
            .then(m => m.BillingComponent)
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./products/product.component')
            .then(m => m.ProductsComponent)
      },
      {
        path: 'invoices',
        loadComponent: () =>
          import('./invoice/invoice-list.component')
            .then(m => m.InvoiceListComponent)
      },
      {
        path: '',
        redirectTo: 'billing',
        pathMatch: 'full'
      }
    ]
  },

  // Fallback
  { path: '**', redirectTo: 'login' }
];
