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

import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, map, tap } from 'rxjs/operators';

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
import { MatDivider } from "@angular/material/divider";



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
    MatDivider
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

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private invoiceService: InvoiceService,
    private customerService: CustomerService,
    private dialog: MatDialog,
    @Optional() @Inject(MAT_DIALOG_DATA) private dialogData: any ,
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
      billDate: [new Date(), Validators.required]
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
      tap(r => this.lastCustomerResults=r)
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
      .subscribe(res => {this.billNo = res.billNo});
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
  this.isExistingCustomer =true;
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
          total: i.qty * i.rate
        }));
      });
  }
  

  addItem() {
    //this.saveCustomerIfNeeded();

    const product: Product = this.billForm.value.product;
    const qty = this.billForm.value.qty;
    const rate = this.billForm.value.rate;

    const existingItem = this.billItems.find(
      i => i.productId === product.id && i.price === rate
    );

    if (existingItem) {
      existingItem.qty += qty;
      existingItem.total = existingItem.qty * existingItem.price;
    } else {
      this.billItems.push({
        productId: product.id,
        name: product.name,
        code: product.code,
        unit: product.unit,
        qty,
        price: rate,
        total: rate * qty
      });
    }

    //this.billForm.patchValue({ qty: 1, rate: 0 });
    this.billForm.patchValue({
      product: '',
      unit: '',
      qty: 1,
      rate: 0
    });
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

      this.billForm.patchValue({
        product: newProduct,
        unit: newProduct.unit,
        rate: newProduct.sellingPrice
      });
    });
  }

  getGrandTotal(): number {
    return this.billItems.reduce((sum, i) => sum + i.total, 0);
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
    item.total = item.qty * item.price;
  }

  removeItem(index: number) {
    this.billItems.splice(index, 1);
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
  
    const payload = {
      billDate: this.billDate,
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
        rate: i.price
      }))
    };
  
    
    this.invoiceService.saveInvoice(payload)
      .subscribe({
        next: res => {
          alert(`Invoice ${res.billNo} saved`);
          this.printInvoice(res.id);
          this.resetBilling();
        },
        error: () => alert('Failed to save invoice'),
        complete: () => this.isSaving = false
      });
  }

  resetBilling() {
    this.billItems = [];
    this.selectedProduct = undefined as any; // ✅ CRITICAL
    this.canUpdatePrice = false;
    this.billForm.reset({ qty: 1, rate: 0,billDate: new Date() });
    this.invoiceService.getNextBillNo()
      .subscribe(no => {this.billNo = no.billNo});
  }

  printInvoice(invoiceId: number) {
    this.invoiceService.printInvoice(invoiceId)
      .subscribe((res: HttpResponse<Blob>) => {
  
        const blob = res.body!;
        const contentDisposition = res.headers.get('content-disposition');
  
        let fileName = 'invoice.pdf';
  
        if (contentDisposition) {
          // 1️⃣ RFC 5987 (filename*)
          const fileNameStarMatch = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
          if (fileNameStarMatch?.[1]) {
            fileName = decodeURIComponent(fileNameStarMatch[1]);
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
      });
  }
  
  private updateExistingInvoice() {

    if (this.billItems.length === 0) {
      alert('No items in bill');
      return;
    }
  
    this.isSaving = true;
  
    const raw = this.billForm.getRawValue();
  
    const payload = {
      billDate: raw.billDate,
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
        rate: i.price
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
