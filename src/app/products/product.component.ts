import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';

import { ProductService } from './product.service';
import { Product } from './product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatPaginatorModule
  ],
  templateUrl: './product.component.html'
})
export class ProductsComponent implements OnInit {

  displayedColumns = ['name', 'code', 'price', 'actions'];

  products: Product[] = [];
  totalCount = 0;

  pageSize = 5;
  currentPage = 1;
  searchText = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  model = {
    name: '',
    code: '',
    price: 0
  };

  constructor(private service: ProductService) {}

  ngOnInit() {
    this.load(1);
  }

  // 🔹 CENTRAL LOAD METHOD
  load(page: number) {
    this.currentPage = page;

    this.service
      .getProducts(this.currentPage, this.pageSize, this.searchText)
      .subscribe(res => {
        this.products = res.items;
        this.totalCount = res.totalCount;
      });
  }

  // 🔹 ADD PRODUCT → GO TO FIRST PAGE
  save() {
    this.service.addProduct(this.model).subscribe(() => {
      this.model = { name: '', code: '', price: 0 };

      this.currentPage = 1;
      this.paginator?.firstPage();
      this.load(1);
    });
  }

  // 🔹 PAGINATION
  onPageChange(event: any) {
    this.pageSize = event.pageSize;
    this.load(event.pageIndex + 1);
  }

  // 🔹 SEARCH → RESET TO FIRST PAGE
  onSearch(value: string) {
    this.searchText = value;
    this.currentPage = 1;
    this.paginator?.firstPage();
    this.load(1);
  }

  // 🔹 EDIT → STAY ON SAME PAGE
  edit(product: Product) {
    const updated = {
      name: product.name,
      code: product.code,
      price: product.price
    };

    this.service.updateProduct(product.id, updated)
      .subscribe(() => this.load(this.currentPage));
  }

  // 🔹 DELETE → STAY ON SAME PAGE
  delete(product: Product) {
    if (!confirm(`Delete product "${product.name}"?`)) return;

    this.service.deleteProduct(product.id)
      .subscribe(() => this.load(this.currentPage));
  }
}
