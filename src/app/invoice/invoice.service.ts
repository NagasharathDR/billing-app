import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InvoiceResponse } from './invoice-response.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InvoiceService {

private apiUrl = environment.apiBaseUrl;

  private baseUrl = this.apiUrl+'/invoices';

  constructor(private http: HttpClient) {}

  /** 🔢 Get next invoice / bill number */
//   getNextBillNo() {
//     return this.http.get<string>(this.baseUrl+'/next-bill-no');
//   }

  getNextBillNo(): Observable<{ billNo: string }> {
    return this.http.get<{ billNo: string }>(
      `${this.baseUrl}/next-bill-no`
    );
  }

  printInvoice(id: number) {
    return this.http.get(`${this.baseUrl}/${id}/print`, {
      responseType: 'blob',
      observe: 'response'
    });
  }

  saveInvoice(payload: any): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(
        this.baseUrl,
      payload
    );
  }
  searchInvoices(payload: any) {
    return this.http.post<any[]>(`${this.baseUrl}/search`, payload);
  }
}
