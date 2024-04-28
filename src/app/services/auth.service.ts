import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap, throwError } from 'rxjs';
import { TokenInfoDTO } from '../models/tokenInfoDTO';
import { RegisterDTO } from '../models/registerDTO';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'https://localhost:7045';

  constructor(private http: HttpClient, private router: Router) {}

 
  isLoggedIn(): boolean {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('AuthToken');
      return !!token;
    }
    return false;
  }
  getAuthToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('AuthToken');
    }
    return null;
  }
  authenticate(data: any): Observable<TokenInfoDTO> {
    console.log('data', data);
    return this.http.post<TokenInfoDTO>(`${this.apiUrl}/auth`, data).pipe(
      tap((response) => {
        localStorage.setItem('AuthToken', response.token);
        localStorage.setItem('User', response.fullname);
      })
    );
  }

  logout() {
    const token = this.getAuthToken();
    if (token) {
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
        });
        return this.http.post(`${this.apiUrl}/auth/logout`, {}, { headers }).subscribe({
            next: () => {
                this.clearLocalData();
                this.router.navigate(['/home']);
            },
            error: (error) => {
                console.error('Logout failed', error);
                this.clearLocalData(); 
                this.router.navigate(['/home']);
            }
        });
    } else {
        console.error('Authentication token missing, redirecting to home.');
        this.clearLocalData(); 
        this.router.navigate(['/home']);
    }
    return null; 
}

private clearLocalData() {
    localStorage.removeItem('AuthToken');
    localStorage.removeItem('User');
    localStorage.clear();
}


  register(data: any): Observable<RegisterDTO> {
    return this.http.post<RegisterDTO>(`${this.apiUrl}/user`, data);
  }
  update(data: any): Observable<RegisterDTO> {
    return this.http.put<RegisterDTO>(`${this.apiUrl}/user`, data);
  }
  getProfile(): Observable<RegisterDTO> {
    const token = this.getAuthToken();

    if (token) {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });

      return this.http.get<RegisterDTO>(`${this.apiUrl}/user`, { headers });
    } else {
      console.error('Authentication token missing');
      return throwError('Token missing');
    }
  }

  deleteProfile(): Observable<any> {
    const token = this.getAuthToken();

    if (token) {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });
      return this.http.delete<any>(`${this.apiUrl}/user`, { headers });
    } else {
      console.error('Authentication token missing');
      return throwError('Token missing');
    }
  }
}
