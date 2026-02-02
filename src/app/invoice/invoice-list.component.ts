import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { InvoiceService } from './invoice.service';
import { CustomerService } from '../customer/customer.service';



@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    // Material
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatAutocompleteModule
  ],
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.scss']
})
export class InvoiceListComponent implements OnInit {

  searchForm!: FormGroup;

  invoices: any[] = [];

  displayedColumns: string[] = [
    'slNo',
    'billNo',
    'customerName',
    'billDate',
    'grandTotal',
    'action'
  ];

  filteredCustomers$!: Observable<any[]>;
  lastCustomerResults: any[] = [];

  constructor(
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    const today = new Date();

    this.searchForm = this.fb.group({
      billNo: [''],
      customer: [''],     // phone OR name
      billDate: [today]   // default today
    });

    // ✅ Billing-style autocomplete (phone OR name)
    this.filteredCustomers$ = this.searchForm
      .get('customer')!
      .valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(value => {
          if (!value || value.length < 3) {
            return of([]);
          }
          return this.customerService.searchByNameOrPhone(value);
        }),
        tap(res => this.lastCustomerResults = res)
      );

    // ✅ Auto-load today's invoices
    this.onSearch();
  }

  onSearch(): void {
    const v = this.searchForm.value;

    const payload = {
      billNo: v.billNo,
      customer: v.customer,
      billDate: v.billDate ? this.formatDate(v.billDate) : null
    };

    this.invoiceService.searchInvoices(payload)
      .subscribe({
        next: res => this.invoices = res,
        error: () => this.invoices = []
      });
  }

  private formatDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  editInvoice(id: number) {}
  deleteInvoice(id: number) {}
  downloadInvoice(id: number) {}
}
