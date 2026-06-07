import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap, throwError } from 'rxjs';
import { TokenInfoDTO } from '../models/tokenInfoDTO';
import { RegisterDTO } from '../models/registerDTO';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { BrowserStorageService } from './browser-storage.service';
import { LoginRequestDTO, RegisterRequestDTO, UpdateProfileRequestDTO } from '../models/authDTO';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly authTokenKey = 'AuthToken';
  private readonly userKey = 'User';

  constructor(
    private http: HttpClient,
    private router: Router,
    private storage: BrowserStorageService
  ) {}

 
  isLoggedIn(): boolean {
    return !!this.getAuthToken();
  }

  getAuthToken() {
    return this.storage.getItem(this.authTokenKey);
  }

  getStoredUserName(): string {
    return this.storage.getItem(this.userKey) || '';
  }

  authenticate(data: LoginRequestDTO): Observable<TokenInfoDTO> {
    return this.http.post<TokenInfoDTO>(`${this.apiUrl}/auth`, data).pipe(
      tap((response) => {
        this.storage.setItem(this.authTokenKey, response.token);
        this.storage.setItem(this.userKey, response.fullname);
      })
    );
  }

  logout() {
    const token = this.getAuthToken();
    if (token) {
        return this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({
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
    this.storage.removeItem(this.authTokenKey);
    this.storage.removeItem(this.userKey);
}


  register(data: RegisterRequestDTO): Observable<RegisterDTO> {
    return this.http.post<RegisterDTO>(`${this.apiUrl}/user`, data);
  }

  update(data: UpdateProfileRequestDTO): Observable<RegisterDTO> {
    return this.http.put<RegisterDTO>(`${this.apiUrl}/user`, data);
  }

  getProfile(): Observable<RegisterDTO> {
    const token = this.getAuthToken();

    if (token) {
      return this.http.get<RegisterDTO>(`${this.apiUrl}/user`);
    } else {
      console.error('Authentication token missing');
      return throwError(() => new Error('Token missing'));
    }
  }

  deleteProfile(): Observable<void> {
    const token = this.getAuthToken();

    if (token) {
      return this.http.delete<void>(`${this.apiUrl}/user`);
    } else {
      console.error('Authentication token missing');
      return throwError(() => new Error('Token missing'));
    }
  }
}
