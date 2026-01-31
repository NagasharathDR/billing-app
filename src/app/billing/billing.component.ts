import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';

import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { Product } from '../products/product.model';
import { BillItem } from './bill-item.model';
import { ProductService } from '../products/product.service';
import { AddProductDialogComponent } from '../products/add-product-dialog.component';

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
    MatSelectModule
  ],
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss']
})
export class BillingComponent implements OnInit {

  billForm!: FormGroup;
  filteredProducts$!: Observable<Product[]>;
  selectedProduct!: Product;
  canUpdatePrice = false;

  billItems: BillItem[] = [];

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.billForm = this.fb.group({
      product: ['', Validators.required],
      unit: [{ value: '', disabled: true }],
      rate: [0, [Validators.required, Validators.min(0)]],
      qty: [1, [Validators.required, Validators.min(1)]]
    });

    /** 🔍 SERVER SIDE AUTOCOMPLETE */
    this.filteredProducts$ = this.billForm.get('product')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value !== 'string' || value.length < 2) {
          return of([]);
        }

        return this.productService.searchProducts(value)
          .pipe(
            switchMap(res => of(res.items))
          );
      })
    );
  }

  displayProduct(product: Product): string {
    return product ? `${product.name} (${product.code})` : '';
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
  

  addItem() {
    const product: Product = this.billForm.value.product;
    const qty = this.billForm.value.qty;
    const rate = this.billForm.value.rate;

    const item: BillItem = {
      productId: product.id,
      name: product.name,
      code: product.code,
      unit: product.unit,
      qty: qty,
      price: rate,               // ✅ OVERRIDDEN RATE
      total: rate * qty
    };

    this.billItems.push(item);

    this.billForm.reset({
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
        alert('Product price updated successfully');
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
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);
  
    if (isNaN(value) || value < 1) return;
  
    this.billItems[index].qty = value;
    this.recalculate(index);
  }
  
  onRateChange(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);
  
    if (isNaN(value) || value < 0) return;
  
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
  
}
