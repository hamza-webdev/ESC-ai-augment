import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Import models from their new locations
import { Player } from '../models/player.model';
import { User, UserBasic } from '../models/user.model';
import { PaginatedResponse } from '../models/api-interfaces.model';
import { Match } from '../models/match.model';
import { Match } from '../models/match.model';
import { Training, TrainingAttendance } from '../models/training.model'; // Corrected import for Training & TrainingAttendance
import {
  // Match, // Removed from here
  // Training, // Removed from here
  // TrainingAttendance, // Removed from here
  Finance,
  News,
  PlayerStats
} from '../models/domain.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Centralized GET, POST, PUT, DELETE methods could be an option too
  // For now, keeping specific methods as they are, but with corrected model imports.

  /**
   * Get headers with authentication
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      switch (error.status) {
        case 401:
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          // Redirect to login
          window.location.href = '/auth/login';
          break;
        case 403:
          errorMessage = 'Accès non autorisé.';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée.';
          break;
        case 422:
          errorMessage = error.error?.message || 'Données invalides.';
          break;
        case 500:
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          break;
        default:
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
      }
    }

    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  // Players API
  getPlayers(params?: any): Observable<PaginatedResponse<Player>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<PaginatedResponse<Player>>(`${this.API_URL}/players`, { // Player type from player.model
      params: httpParams,
      headers: this.getHeaders()
    }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  getPlayer(id: number): Observable<Player> { // Player type from player.model
    return this.http.get<Player>(`${this.API_URL}/players/${id}`, { // Player type from player.model
      headers: this.getHeaders()
    }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  createPlayer(player: Partial<Player>): Observable<Player> { // Return type Player
    return this.http.post<Player>(`${this.API_URL}/players`, player, { // Return type Player
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  updatePlayer(id: number, player: Partial<Player>): Observable<Player> { // Return type Player
    return this.http.put<Player>(`${this.API_URL}/players/${id}`, player, { // Return type Player
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  deletePlayer(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/players/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getPlayerStats(id: number, season?: number): Observable<any> {
    let params = new HttpParams();
    if (season) {
      params = params.set('season', season.toString());
    }
    return this.http.get(`${this.API_URL}/players/${id}/stats`, { params });
  }

  getPositions(): Observable<any> {
    return this.http.get(`${this.API_URL}/players/positions`);
  }

  // Matches API
  getMatches(params?: any): Observable<PaginatedResponse<Match>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<PaginatedResponse<Match>>(`${this.API_URL}/matches`, { params: httpParams });
  }

  getMatch(id: number): Observable<Match> { // Match type from domain.model
    return this.http.get<Match>(`${this.API_URL}/matches/${id}`); // Match type from domain.model
  }

  createMatch(match: Partial<Match>): Observable<Match> { // Return type Match
    return this.http.post<Match>(`${this.API_URL}/matches`, match); // Return type Match
  }

  updateMatch(id: number, match: Partial<Match>): Observable<Match> { // Return type Match
    return this.http.put<Match>(`${this.API_URL}/matches/${id}`, match); // Return type Match
  }

  deleteMatch(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/matches/${id}`);
  }

  addPlayerStats(matchId: number, stats: Partial<PlayerStats>): Observable<PlayerStats> { // Return type PlayerStats
    return this.http.post<PlayerStats>(`${this.API_URL}/matches/${matchId}/stats`, stats); // Return type PlayerStats
  }

  getMatchStats(matchId: number): Observable<PlayerStats[]> { // Return type PlayerStats[]
    return this.http.get<PlayerStats[]>(`${this.API_URL}/matches/${matchId}/stats`); // Return type PlayerStats[]
  }

  getUpcomingMatches(limit?: number): Observable<any> {
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    return this.http.get(`${this.API_URL}/matches/upcoming`, { params });
  }

  getRecentResults(limit?: number): Observable<any> {
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    return this.http.get(`${this.API_URL}/matches/results`, { params });
  }

  // Training API
  getTrainings(params?: any): Observable<PaginatedResponse<Training>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<PaginatedResponse<Training>>(`${this.API_URL}/trainings`, { params: httpParams });
  }

  getTraining(id: number): Observable<Training> { // Training type from domain.model
    return this.http.get<Training>(`${this.API_URL}/trainings/${id}`); // Training type from domain.model
  }

  createTraining(training: Partial<Training>): Observable<Training> { // Return type Training
    return this.http.post<Training>(`${this.API_URL}/trainings`, training); // Return type Training
  }

  updateTraining(id: number, training: Partial<Training>): Observable<Training> { // Return type Training
    return this.http.put<Training>(`${this.API_URL}/trainings/${id}`, training); // Return type Training
  }

  deleteTraining(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/trainings/${id}`);
  }

  markAttendance(trainingId: number, attendance: Partial<TrainingAttendance>): Observable<TrainingAttendance> { // Return type TrainingAttendance
    return this.http.post<TrainingAttendance>(`${this.API_URL}/trainings/${trainingId}/attendance`, attendance); // Return type TrainingAttendance
  }

  getTrainingAttendance(trainingId: number): Observable<TrainingAttendance[]> { // Return type TrainingAttendance[]
    return this.http.get<TrainingAttendance[]>(`${this.API_URL}/trainings/${trainingId}/attendance`); // Return type TrainingAttendance[]
  }

  getUpcomingTrainings(limit?: number): Observable<any> {
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    return this.http.get(`${this.API_URL}/trainings/upcoming`, { params });
  }

  getTodayTrainings(): Observable<any> {
    return this.http.get(`${this.API_URL}/trainings/today`);
  }

  batchUpdateTrainingAttendance(trainingId: number, attendanceData: Partial<TrainingAttendance>[]): Observable<any> {
    return this.http.post(`${this.API_URL}/trainings/${trainingId}/attendance/batch`, attendanceData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Finance API
  getFinances(params?: any): Observable<PaginatedResponse<Finance>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<PaginatedResponse<Finance>>(`${this.API_URL}/finances`, { params: httpParams });
  }

  getFinance(id: number): Observable<Finance> { // Finance type from domain.model
    return this.http.get<Finance>(`${this.API_URL}/finances/${id}`); // Finance type from domain.model
  }

  createFinance(finance: Partial<Finance>): Observable<Finance> { // Return type Finance
    return this.http.post<Finance>(`${this.API_URL}/finances`, finance); // Return type Finance
  }

  updateFinance(id: number, finance: Partial<Finance>): Observable<Finance> { // Return type Finance
    return this.http.put<Finance>(`${this.API_URL}/finances/${id}`, finance); // Return type Finance
  }

  deleteFinance(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/finances/${id}`);
  }

  approveFinance(id: number): Observable<any> {
    return this.http.post(`${this.API_URL}/finances/${id}/approve`, {});
  }

  rejectFinance(id: number): Observable<any> {
    return this.http.post(`${this.API_URL}/finances/${id}/reject`, {});
  }

  getFinancialSummary(year?: number, month?: number): Observable<any> {
    let params = new HttpParams();
    if (year) {
      params = params.set('year', year.toString());
    }
    if (month) {
      params = params.set('month', month.toString());
    }
    return this.http.get(`${this.API_URL}/finances/summary`, { params });
  }

  getFinanceCategories(): Observable<any> {
    return this.http.get(`${this.API_URL}/finances/categories`);
  }

  // News API
  getNews(params?: any): Observable<PaginatedResponse<News>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<PaginatedResponse<News>>(`${this.API_URL}/news`, { params: httpParams });
  }

  getNewsArticle(id: number): Observable<News> { // News type from domain.model
    return this.http.get<News>(`${this.API_URL}/news/${id}`); // News type from domain.model
  }

  getNewsBySlug(slug: string): Observable<News> { // News type from domain.model
    return this.http.get<News>(`${this.API_URL}/news/slug/${slug}`); // News type from domain.model
  }

  createNews(news: Partial<News>): Observable<News> { // Return type News
    return this.http.post<News>(`${this.API_URL}/news`, news); // Return type News
  }

  updateNews(id: number, news: Partial<News>): Observable<News> { // Return type News
    return this.http.put<News>(`${this.API_URL}/news/${id}`, news); // Return type News
  }

  deleteNews(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/news/${id}`);
  }

  publishNews(id: number): Observable<any> {
    return this.http.post(`${this.API_URL}/news/${id}/publish`, {});
  }

  unpublishNews(id: number): Observable<any> {
    return this.http.post(`${this.API_URL}/news/${id}/unpublish`, {});
  }

  getFeaturedNews(limit?: number): Observable<any> {
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    return this.http.get(`${this.API_URL}/news/featured`, { params });
  }

  getBreakingNews(limit?: number): Observable<any> {
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    return this.http.get(`${this.API_URL}/news/breaking`, { params });
  }

  getRecentNews(limit?: number, category?: string): Observable<any> {
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    if (category) {
      params = params.set('category', category);
    }
    return this.http.get(`${this.API_URL}/news/recent`, { params });
  }

  searchNews(query: string, limit?: number): Observable<any> {
    let params = new HttpParams().set('q', query);
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    return this.http.get(`${this.API_URL}/news/search`, { params });
  }

  getNewsCategories(): Observable<any> {
    return this.http.get(`${this.API_URL}/news/categories`);
  }

  // Health check
  healthCheck(): Observable<any> {
    return this.http.get(`${this.API_URL}/health`);
  }

  // Method to get users who can be assigned to a player profile
  getAssignableUsers(): Observable<UserBasic[]> {
    // Assuming an endpoint like GET /users?has_player_profile=false or a dedicated one
    // For now, let's use a hypothetical endpoint /users/assignable-to-player
    // Adjust the endpoint and params as per actual backend implementation
    return this.http.get<UserBasic[]>(`${this.API_URL}/users/assignable-to-player`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response || []), // Ensure it returns an array even if API sends null
      retry(1),
      catchError(this.handleError)
    );
  }
}
