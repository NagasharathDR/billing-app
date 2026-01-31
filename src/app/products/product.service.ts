import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Product } from './product.model';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/all`);
  }

  addProduct(product: Omit<Product, 'id'>) {
    return this.http.post(`${this.apiUrl}/products`, product);
  }

  updateProduct(id: number, product: any) {
    return this.http.put(`${this.apiUrl}/products/${id}`, product);
  }
  
  deleteProduct(id: number) {
    return this.http.delete(`${this.apiUrl}/products/${id}`);
  }

  getProducts(
    page: number,
    pageSize: number,
    search: string
  ) {
    return this.http.get<any>(`${this.apiUrl}/products`, {
      params: {
        page,
        pageSize,
        search
      }
    });
  }

  searchProducts(term: string): Observable<PagedResult<Product>> {
    return this.http.get<PagedResult<Product>>(
      `${this.apiUrl}/products?page=1&pageSize=20&search=${encodeURIComponent(term)}`
    );
  }

  updateProductPrice(productId: number, price: number) {
    return this.http.put(
      `${this.apiUrl}/products/${productId}/price`,
      { sellingPrice: price }
    );
  }
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}