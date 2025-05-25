import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { User, LoginRequest, LoginResponse } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = 'esc_access_token';
  private readonly REFRESH_TOKEN_KEY = 'esc_refresh_token';
  private readonly USER_KEY = 'esc_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getToken();
    const user = this.getStoredUser();

    if (token && user) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.setToken(response.access_token);
          this.setRefreshToken(response.refresh_token);
          this.setUser(response.user);
          this.currentUserSubject.next(response.user);
          this.isAuthenticatedSubject.next(true);
        })
      );
  }

  logout(): void {
    // Call logout endpoint
    this.http.post(`${this.API_URL}/auth/logout`, {}).subscribe();

    // Clear local storage
    this.clearTokens();
    this.clearUser();

    // Update subjects
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    // Redirect to login
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    return this.http.post(`${this.API_URL}/auth/refresh`, { refresh_token: refreshToken })
      .pipe(
        tap((response: any) => {
          this.setToken(response.access_token);
        })
      );
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/auth/profile`);
  }

  updateProfile(userData: Partial<User>): Observable<any> {
    return this.http.put(`${this.API_URL}/auth/profile`, userData)
      .pipe(
        tap((response: any) => {
          this.setUser(response.user);
          this.currentUserSubject.next(response.user);
        })
      );
  }

  changePassword(passwordData: { current_password: string; new_password: string }): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/change-password`, passwordData);
  }

  // Token management
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  private clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  // User management
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private clearUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  // Permission checks
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  isCoach(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'coach';
  }

  isPlayer(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'player';
  }

  isStaff(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'staff';
  }

  hasRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  canManagePlayers(): boolean {
    return this.hasRole(['admin', 'coach']);
  }

  canManageFinances(): boolean {
    return this.hasRole(['admin', 'staff']);
  }

  canManageNews(): boolean {
    return this.hasRole(['admin', 'coach', 'staff']);
  }
}
