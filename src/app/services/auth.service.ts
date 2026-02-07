import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private api = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  login(data: { username: string; password: string }) {
    return this.http.post<{ token: string }>(
      `${this.api}/auth/login`,
      data
    ).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
