import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';

import { ProductService } from './product.service';
import { Product } from './product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatSelectModule
  ],
  templateUrl: './product.component.html'
})
export class ProductsComponent implements OnInit {
  showActualPrice = false;
  displayedColumns: string[] = [];

  // get displayedColumns(): string[] {
  //   return this.showActualPrice
  //     ? ['name', 'code', 'unit', 'actualPrice', 'sellingPrice', 'actions']
  //     : ['name', 'code', 'unit', 'sellingPrice', 'actions'];
  // }
  products: Product[] = [];

  totalCount = 0;
  pageSize = 5;
  currentPage = 1;
  searchText = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  productForm!: FormGroup;
  editingProductId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private service: ProductService
  ) { }

  ngOnInit() {
    this.buildForm();
    this.updateDisplayedColumns();
    this.load(1);
  }

  // 🔹 REACTIVE FORM (FUTURE-PROOF)
  buildForm() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      unit: ['PCS', Validators.required],

      actualPrice: [null, [Validators.required, Validators.min(0.01)]],
      sellingPrice: [null, [Validators.required, Validators.min(0.01)]]
    });
  }

  updateDisplayedColumns() {
    this.displayedColumns = this.showActualPrice
      ? ['name', 'code', 'unit', 'actualPrice', 'sellingPrice', 'actions']
      : ['name', 'code', 'unit', 'sellingPrice', 'actions'];
  }
  // 🔹 LOAD PRODUCTS
  load(page: number) {
    this.currentPage = page;

    this.service
      .getProducts(this.currentPage, this.pageSize, this.searchText)
      .subscribe(res => {
        this.products = res.items;
        this.totalCount = res.totalCount;
      });
  }

  // 🔹 SAVE (ADD / UPDATE)
  save() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.productForm.reset({ unit: 'PCS' });
      return;
    }

    const payload: Product = this.productForm.value;

    // 👉 EDIT
    if (this.editingProductId) {
      this.service
        .updateProduct(this.editingProductId, payload)
        .subscribe(() => {
          this.resetForm();
          this.load(this.currentPage);
        });
      return;
    }

    // 👉 ADD
    this.service.addProduct(payload).subscribe(() => {
      this.resetForm();
      this.currentPage = 1;
      this.paginator?.firstPage();
      this.load(1);
    });
  }

  // 🔹 EDIT (FIXED)
  edit(product: Product) {
    this.editingProductId = product.id!;

    // 🔥 RESET FORM STATE FIRST
    this.productForm.reset();

    this.productForm.patchValue({
      name: product.name,
      code: product.code,
      unit: product.unit,
      actualPrice: product.actualPrice,
      sellingPrice: product.sellingPrice
    });

    // 🔥 MARK AS PRISTINE
    this.productForm.markAsPristine();
    this.productForm.markAsUntouched();
  }

  // 🔹 DELETE
  delete(product: Product) {
    if (!confirm(`Delete product "${product.name}"?`)) return;

    this.service
      .deleteProduct(product.id!)
      .subscribe(() => this.load(this.currentPage));
  }

  // 🔹 SEARCH
  onSearch(value: string) {
    this.searchText = value;
    this.currentPage = 1;
    this.paginator?.firstPage();
    this.load(1);
  }

  // 🔹 PAGINATION
  onPageChange(event: any) {
    this.pageSize = event.pageSize;
    this.load(event.pageIndex + 1);
  }

  // 🔹 RESET (USED AFTER SAVE & CANCEL)
  resetForm() {
    this.productForm.reset({ unit: 'PCS' });
    this.editingProductId = null;
  }
}
