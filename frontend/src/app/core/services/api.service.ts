import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Player,
  Match,
  Training,
  Finance,
  News,
  PaginatedResponse,
  PlayerStats,
  TrainingAttendance
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) { }

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
    return this.http.get<PaginatedResponse<Player>>(`${this.API_URL}/players`, {
      params: httpParams,
      headers: this.getHeaders()
    }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  getPlayer(id: number): Observable<Player> {
    return this.http.get<Player>(`${this.API_URL}/players/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  createPlayer(player: Partial<Player>): Observable<any> {
    return this.http.post(`${this.API_URL}/players`, player, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  updatePlayer(id: number, player: Partial<Player>): Observable<any> {
    return this.http.put(`${this.API_URL}/players/${id}`, player, {
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

  getMatch(id: number): Observable<Match> {
    return this.http.get<Match>(`${this.API_URL}/matches/${id}`);
  }

  createMatch(match: Partial<Match>): Observable<any> {
    return this.http.post(`${this.API_URL}/matches`, match);
  }

  updateMatch(id: number, match: Partial<Match>): Observable<any> {
    return this.http.put(`${this.API_URL}/matches/${id}`, match);
  }

  deleteMatch(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/matches/${id}`);
  }

  addPlayerStats(matchId: number, stats: Partial<PlayerStats>): Observable<any> {
    return this.http.post(`${this.API_URL}/matches/${matchId}/stats`, stats);
  }

  getMatchStats(matchId: number): Observable<any> {
    return this.http.get(`${this.API_URL}/matches/${matchId}/stats`);
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

  getTraining(id: number): Observable<Training> {
    return this.http.get<Training>(`${this.API_URL}/trainings/${id}`);
  }

  createTraining(training: Partial<Training>): Observable<any> {
    return this.http.post(`${this.API_URL}/trainings`, training);
  }

  updateTraining(id: number, training: Partial<Training>): Observable<any> {
    return this.http.put(`${this.API_URL}/trainings/${id}`, training);
  }

  deleteTraining(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/trainings/${id}`);
  }

  markAttendance(trainingId: number, attendance: Partial<TrainingAttendance>): Observable<any> {
    return this.http.post(`${this.API_URL}/trainings/${trainingId}/attendance`, attendance);
  }

  getTrainingAttendance(trainingId: number): Observable<any> {
    return this.http.get(`${this.API_URL}/trainings/${trainingId}/attendance`);
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

  getFinance(id: number): Observable<Finance> {
    return this.http.get<Finance>(`${this.API_URL}/finances/${id}`);
  }

  createFinance(finance: Partial<Finance>): Observable<any> {
    return this.http.post(`${this.API_URL}/finances`, finance);
  }

  updateFinance(id: number, finance: Partial<Finance>): Observable<any> {
    return this.http.put(`${this.API_URL}/finances/${id}`, finance);
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

  getNewsArticle(id: number): Observable<News> {
    return this.http.get<News>(`${this.API_URL}/news/${id}`);
  }

  getNewsBySlug(slug: string): Observable<News> {
    return this.http.get<News>(`${this.API_URL}/news/slug/${slug}`);
  }

  createNews(news: Partial<News>): Observable<any> {
    return this.http.post(`${this.API_URL}/news`, news);
  }

  updateNews(id: number, news: Partial<News>): Observable<any> {
    return this.http.put(`${this.API_URL}/news/${id}`, news);
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
}
