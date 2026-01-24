import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'billing',
        loadComponent: () =>
          import('./billing/billing.component').then(m => m.BillingComponent)
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./products/product.component').then(m => m.ProductsComponent)
      },
      {
        path: '',
        redirectTo: 'billing',
        pathMatch: 'full'
      }
    ]
  }
];
