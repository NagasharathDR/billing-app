import { Component, Inject, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, map, tap } from 'rxjs/operators';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Product } from '../products/product.model';
import { BillItem } from './bill-item.model';
import { ProductService } from '../products/product.service';
import { AddProductDialogComponent } from '../products/add-product-dialog.component';
import { CustomerService } from '../customer/customer.service';
import { EditCustomerDialogComponent } from '../customer/edit-customer-dialog.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { InvoiceService } from '../invoice/invoice.service';
import { HttpResponse } from '@angular/common/http';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';




/* Simple Customer model */
interface Customer {
  id?: number;
  phone: string;
  name: string;
  address?: string;
}

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatIconModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    FormsModule,
    MatProgressBarModule,
    MatTableModule
  ], providers: [
    provideNativeDateAdapter() // 🔥 REQUIRED
  ],
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss']
})
export class BillingComponent implements OnInit {

  billForm!: FormGroup;

  /* Product */
  filteredProducts$!: Observable<Product[]>;
  selectedProduct!: Product;
  canUpdatePrice = false;
  isPrinting = false;
  printProgress = 0;
  
  /* Customer */
  filteredCustomers$!: Observable<Customer[]>;
  selectedCustomer!: Customer | null;
  isExistingCustomer = false;
  billNo = '';
  billDate = new Date();
  isSaving = false;
  isEditMode = false;
  editingInvoiceId?: number;
  billItems: BillItem[] = [];
  lastCustomerResults: Customer[] = [];
  isReturnMode: boolean = false;
  displayedColumns: string[] = [
    'sl',
    'name',
    'qty',
    'rate',
    'total',
    'actions'
  ];
  

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private invoiceService: InvoiceService,
    private customerService: CustomerService,
    private dialog: MatDialog,
    @Optional() @Inject(MAT_DIALOG_DATA) private dialogData: any,
    @Optional() private dialogRef?: MatDialogRef<BillingComponent>,
  ) { }

  ngOnInit() {
    this.billForm = this.fb.group({
      /* CUSTOMER */
      customerPhone: ['', Validators.required],
      customerName: ['', Validators.required],
      customerAddress: [''],

      /* PRODUCT */
      product: ['', Validators.required],
      unit: [{ value: '', disabled: true }],
      rate: [0, [Validators.required, Validators.min(0)]],
      qty: [1, [Validators.required, Validators.min(1)]],
      billDate: [new Date(), Validators.required],
      isReturn: [false],
    });


    this.billForm.get('billDate')!.valueChanges.subscribe(value => {
      console.log('Datepicker raw value:', value);
      console.log('Type:', typeof value);
      console.log('ISO:', value instanceof Date ? value.toISOString() : value);
    });

    this.loadBillNo();

    /* CUSTOMER AUTOCOMPLETE */
    this.filteredCustomers$ = this.billForm.get('customerPhone')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (!value || value.length < 3) {
          return of([]);
        }
        return this.customerService.searchByPhone(value);
      }),
      tap(r => this.lastCustomerResults = r)
    );

    /* PRODUCT AUTOCOMPLETE (UNCHANGED) */
    this.filteredProducts$ = this.billForm.get('product')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value !== 'string' || value.length < 2) {
          return of([]);
        }
        return this.productService.searchProducts(value).pipe(
          map(res => res.items)
        );
      })
    );

    // 🔥 Detect edit mode (ONLY when opened from popup)
    if (this.dialogData?.mode === 'edit' && this.dialogData?.invoiceId) {
      this.isEditMode = true;
      this.editingInvoiceId = this.dialogData.invoiceId;
      if (this.isEditMode) {
        this.loadInvoiceForEdit();
      }
    }

  }

  loadBillNo() {
    this.invoiceService.getNextBillNo()
      .subscribe(res => { this.billNo = res.billNo });
  }
  /* CUSTOMER */
  onCustomerSelected(phone: string) {
    const customer = this.lastCustomerResults.find(c => c.phone === phone);
    if (!customer) return;

    this.selectedCustomer = customer;

    this.billForm.patchValue({
      customerPhone: customer.phone,
      customerName: customer.name,
      customerAddress: customer.address ?? ''
    });
    this.isExistingCustomer = true;
  }


  saveCustomerIfNeeded() {
    if (this.selectedCustomer) return;

    const customer: Customer = {
      phone: this.billForm.value.customerPhone,
      name: this.billForm.value.customerName,
      address: this.billForm.value.customerAddress
    };

    this.customerService.create(customer).subscribe(c => {
      this.selectedCustomer = c;
    });
  }

  /* PRODUCT */
  displayProduct(p: Product): string {
    return p ? `${p.name} (${p.code})` : '';
  }

  onProductSelected(product: Product) {
    this.selectedProduct = product;

    this.billForm.patchValue({
      unit: product.unit,
      rate: product.sellingPrice
    });

    this.canUpdatePrice = false;
    this.billForm.get('rate')!.valueChanges.subscribe(rate => {
      this.canUpdatePrice = rate !== product.sellingPrice;
    });
  }

  private loadInvoiceForEdit() {
    if (!this.editingInvoiceId) return;

    this.invoiceService.getInvoiceById(this.editingInvoiceId)
      .subscribe(inv => {

        // Bill header
        this.billNo = inv.billNo;

        // Patch customer + bill date
        this.billForm.patchValue({
          customerPhone: inv.customer.phone,
          customerName: inv.customer.name,
          customerAddress: inv.customer.address,
          billDate: new Date(inv.billDate)
        });

        // 🔒 Lock customer fields
        this.billForm.get('customerPhone')?.disable();
        this.billForm.get('customerName')?.disable();
        this.billForm.get('customerAddress')?.disable();

        this.selectedCustomer = inv.customer;
        this.isExistingCustomer = true;

        // Items
        this.billItems = inv.items.map((i: any) => ({
          productId: i.productId,
          name: i.productName,
          code: i.code,
          unit: i.unit,
          qty: i.qty,
          price: i.rate,
          isReturn: i.isReturn,
          total: i.qty * i.rate
        }));
      });
  }


  addItem() {
    //this.saveCustomerIfNeeded();

    const product: Product = this.billForm.value.product;
    const qty = this.billForm.value.qty;
    const rate = this.billForm.value.rate;

    if (!product) return;

    const isReturn = this.isReturnMode;
    const signedQty = isReturn ? -qty : qty;

    // 🔥 MERGE ONLY WITH SAME MODE
    const existingItem = this.billItems.find(
      i =>
        i.productId === product.id &&
        i.price === rate &&
        i.isReturn === isReturn   // ✅ THIS IS THE KEY LINE
    );

    if (existingItem) {
      existingItem.qty += signedQty;
      existingItem.total = existingItem.qty * existingItem.price;
    } else {
      this.billItems.push({
        productId: product.id,
        name: product.name,
        code: product.code,
        unit: product.unit,
        qty: signedQty,
        price: rate,
        total: signedQty * rate,
        isReturn
      });
    }

    // reset product inputs
    this.billForm.patchValue({
      product: '',
      unit: '',
      qty: 1,
      rate: 0
    });
  }

  get saleItems(): BillItem[] {
    return this.billItems.filter(i => !i.isReturn);
  }

  get returnItems(): BillItem[] {
    return this.billItems.filter(i => i.isReturn);
  }

  updateProductPrice() {
    const newPrice = this.billForm.value.rate;
    this.productService
      .updateProductPrice(this.selectedProduct.id, newPrice)
      .subscribe(() => {
        this.selectedProduct.sellingPrice = newPrice;
        this.canUpdatePrice = false;
      });
  }

  openAddProductPopup() {
    const dialogRef = this.dialog.open(AddProductDialogComponent, {
      width: '420px'
    });

    dialogRef.afterClosed().subscribe((newProduct: Product) => {
      if (!newProduct) return;
      this.selectedProduct = newProduct;

      this.billForm.patchValue({
        product: newProduct,
        unit: newProduct.unit,
        rate: newProduct.sellingPrice
      });
    });

  }

  getSaleTotal(): number {
    return this.saleItems.reduce((sum, i) => sum + i.total, 0);
  }

  getReturnTotal(): number {
    return this.returnItems.reduce((sum, i) => sum + Math.abs(i.total), 0);
  }

  getGrandTotal(): number {
    return this.getSaleTotal() - this.getReturnTotal();
  }

  onQtyChange(index: number, event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    if (value < 1) return;
    this.billItems[index].qty = value;
    this.recalculate(index);
  }

  onRateChange(index: number, event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    if (value < 0) return;
    this.billItems[index].price = value;
    this.recalculate(index);
  }

  recalculate(index: number) {
    const item = this.billItems[index];

    const sign = item.isReturn ? -1 : 1;

    item.total = sign * item.qty * item.price;
  }

  removeItem(item: BillItem) {
    const idx = this.billItems.indexOf(item);
    if (idx > -1) {
      this.billItems.splice(idx, 1);
    }
  }

  ensureCustomerExists(): Promise<Customer> {
    if (this.selectedCustomer) {
      return Promise.resolve(this.selectedCustomer);
    }

    const customer: Customer = {
      phone: this.billForm.value.customerPhone,
      name: this.billForm.value.customerName,
      address: this.billForm.value.customerAddress
    };

    return new Promise((resolve) => {
      this.customerService.create(customer).subscribe(c => {
        this.selectedCustomer = c;
        resolve(c);
      });
    });
  }

  openEditCustomer() {
    this.dialog.open(EditCustomerDialogComponent, {
      width: '400px',
      data: { ...this.selectedCustomer }
    }).afterClosed().subscribe(updated => {
      if (!updated) return;

      this.selectedCustomer = updated;

      this.billForm.patchValue({
        customerName: updated.name,
        customerAddress: updated.address
      });
    });
  }

  saveBill() {
    if (this.billItems.length === 0) {
      alert('No items in bill');
      return;
    }
    if (this.isEditMode && this.editingInvoiceId) {
      this.updateExistingInvoice();
      return;
    }
    this.isSaving = true;
    this.billDate = this.billForm.get('billDate')?.value;

    const payload = {
      billDate: this.billDate.toLocaleDateString('en-CA'),
      customer: {
        name: this.billForm?.value?.customerName || '',
        phone: this.billForm?.value?.customerPhone || '',
        address: this.billForm?.value?.customerAddress || ''
      },
      items: this.billItems.map(i => ({
        productId: i.productId,
        productName: i.name,
        unit: i.unit,
        qty: i.qty,
        rate: i.price,
        isReturn: i.isReturn
      }))
    };


    this.invoiceService.saveInvoice(payload)
      .subscribe({
        next: res => {
          alert(`Invoice ${res.billNo} saved`);
          this.printInvoice(res.id);
          this.resetBilling();
        },
        error: () => {
          this.isSaving = false;
          alert('Failed to save invoice')
        },
        complete: () => this.isSaving = false
      });
  }

  resetBilling() {
    this.isReturnMode = false;
    this.billItems = [];
    this.selectedProduct = undefined as any; // ✅ CRITICAL
    this.canUpdatePrice = false;
    this.billForm.reset({ qty: 1, rate: 0, billDate: new Date() });
    this.invoiceService.getNextBillNo()
      .subscribe(no => { this.billNo = no.billNo });
  }

  printInvoice(invoiceId: number) {
    this.isPrinting = true;
  this.printProgress = 10;

    this.invoiceService.printInvoice(invoiceId).subscribe({
    next: (res) => {
      this.printProgress = 70;

      const blob = res.body!;
      const contentDisposition = res.headers.get('content-disposition');

      let fileName = 'invoice.pdf';

      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
        if (match?.[1]) {
          fileName = decodeURIComponent(match[1]);
        }else {
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

  private updateExistingInvoice() {

    if (this.billItems.length === 0) {
      alert('No items in bill');
      return;
    }

    this.isSaving = true;

    const raw = this.billForm.getRawValue();
    this.billDate = this.billForm.get('billDate')?.value;

    const payload = {
      billDate: this.billDate.toLocaleDateString('en-CA'),
      customer: {
        phone: raw.customerPhone,
        name: raw.customerName,
        address: raw.customerAddress
      },
      items: this.billItems.map(i => ({
        productId: i.productId,
        productName: i.name,
        unit: i.unit,
        qty: i.qty,
        rate: i.price,
        isReturn: i.isReturn
      }))
    };

    this.invoiceService.updateInvoice(this.editingInvoiceId!, payload)
      .subscribe({
        next: res => {
          alert(`Invoice ${res.billNo} updated`);
          this.printInvoice(res.id);   // ✅ reuse existing print
          this.dialogRef?.close(true);
        },
        error: () => alert('Failed to update invoice'),
        complete: () => this.isSaving = false
      });
  }



}
