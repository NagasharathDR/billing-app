import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Customer } from './customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {

  private baseUrl = environment.apiBaseUrl+'/customers';

  constructor(private http: HttpClient) {}

  // 🔍 Phone autocomplete
  searchByPhone(phone: string): Observable<Customer[]> {
    return this.http.get<Customer[]>(
      `${this.baseUrl}/search?phone=${phone}`
    );
  }

  // ➕ Create customer if not exists
  create(customer: Customer): Observable<Customer> {
    return this.http.post<Customer>(this.baseUrl, customer);
  }

  update(customer: Customer) {
    return this.http.put<Customer>(
      `${this.baseUrl}/${customer.id}`,
      customer
    );
  }
  
  searchByNameOrPhone(query: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/searchcustomer?query=${encodeURIComponent(query)}`
    );
  }

}
