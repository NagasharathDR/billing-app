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
import { BillingComponent } from '../billing/billing.component';
import { MatDialog } from '@angular/material/dialog';
import { HttpResponse } from '@angular/common/http';
import { MatCard } from "@angular/material/card";
import { MatProgressBar } from "@angular/material/progress-bar";



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
    MatAutocompleteModule,
    MatCard,
    MatProgressBar
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
  isPrinting = false;
  printProgress = 0;

  constructor(
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private customerService: CustomerService,
    private dialog: MatDialog
  ) { }

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
 
  deleteOldInvoices() {

    const confirmDelete = confirm(
      'Are you sure you want to delete invoices older than 90 days?'
    );
  
    if (!confirmDelete) return;
  
    this.invoiceService.deleteOldInvoices().subscribe({
      next: (res) => {
        alert(res.message);
        this.onSearch(); // refresh list
      },
      error: () => {
        alert('Failed to delete old invoices');
      }
    });
  }
  
  private formatDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  editInvoice(id: number) {
    const dialogRef = this.dialog.open(BillingComponent, {
      width: '1200px',
      maxWidth: '95vw',
      data: {
        mode: 'edit',
        invoiceId: id
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.onSearch();
      }
    });
  }

  deleteInvoice(id: number) {
    const ok = confirm('Are you sure you want to delete this invoice?');

    if (!ok) return;

    this.invoiceService.deleteInvoice(id).subscribe({
      next: () => {
        alert('Invoice deleted');
        this.onSearch(); // reload list with same filters
      },
      error: () => {
        alert('Failed to delete invoice');
      }
    });
  }

  downloadInvoice(id: number) {

    this.isPrinting = true;
    this.printProgress = 10;

    this.invoiceService.printInvoice(id).subscribe({
      next: (res) => {
        this.printProgress = 70;

        const blob = res.body!;
        const contentDisposition = res.headers.get('content-disposition');

        let fileName = 'invoice.pdf';

        if (contentDisposition) {
          const match = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
          if (match?.[1]) {
            fileName = decodeURIComponent(match[1]);
          } else {
            // 2️⃣ Fallback: filename=""
            const fileNameMatch = contentDisposition.match(/filename\s*=\s*"?([^"]+)"?/i);
            if (fileNameMatch?.[1]) {
              fileName = fileNameMatch[1];
            }
          }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);

        this.printProgress = 100;
      },
      error: () => {
        alert('Failed to generate invoice PDF');
        this.isPrinting = false;
      },
      complete: () => {
        setTimeout(() => {
          this.isPrinting = false;
          this.printProgress = 0;
        }, 400);
      }
    });
  }

}
