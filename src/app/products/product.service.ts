import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Product } from './product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // getProducts() {
  //   return this.http.get<Product[]>(`${this.apiUrl}/products`);
  // }

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
  
}
