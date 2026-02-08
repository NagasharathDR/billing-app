import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsersService {

  private api = `${environment.apiBaseUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers() {
    return this.http.get<any[]>(this.api);
  }

  addUser(data: { username: string; password: string }) {
    return this.http.post(this.api, data);
  }

  updateUser(id: number, data: { username: string; password?: string }) {
    return this.http.put(`${this.api}/${id}`, data);
  }
}
