import { Injectable } from '@angular/core';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from './api.service';
import { Match, MatchFormData } from '../models/match.model';
import { PaginatedResponse } from '../models/api-interfaces.model'; // Import PaginatedResponse

@Injectable({
  providedIn: 'root'
})
export class MatchService {

  constructor(private apiService: ApiService) { }

  getMatchById(id: number): Observable<Match> {
    return this.apiService.getMatch(id);
  }

  createMatch(matchData: MatchFormData): Observable<Match> {
    const payload = this.preparePayload(matchData);
    return this.apiService.createMatch(payload);
  }

  updateMatch(id: number, matchData: MatchFormData): Observable<Match> {
    const payload = this.preparePayload(matchData);
    return this.apiService.updateMatch(id, payload);
  }

  private preparePayload(formData: MatchFormData): Partial<Match> {
    // Combine date and time into a single ISO string for the 'date' field
    const dateTimeString = `${formData.match_date}T${formData.match_time}:00`; // Assuming time is HH:mm

    const payload: Partial<Match> = {
      opponent: formData.opponent,
      date: new Date(dateTimeString).toISOString(), // Convert to full ISO string
      location: formData.location,
      is_home: formData.is_home,
      competition: formData.competition,
      referee: formData.referee,
      weather: formData.weather,
      temperature: formData.temperature,
      goals_for: formData.goals_for,
      goals_against: formData.goals_against,
      attendance: formData.attendance,
      match_report: formData.match_report,
      highlights: formData.highlights
    };
    // Remove null or undefined fields to send a cleaner payload
    Object.keys(payload).forEach(key => {
        const k = key as keyof Partial<Match>;
        if (payload[k] === null || payload[k] === undefined) {
            delete payload[k];
        }
    });
    return payload;
  }

  getMatches(params?: any): Observable<PaginatedResponse<Match>> {
   // The ApiService.getMatches method already returns Observable<PaginatedResponse<Match>>
   // and handles HttpParams construction. No specific mapping needed here if the backend
   // PaginatedResponse structure is directly usable or if ApiService handles any necessary transformation.
   return this.apiService.getMatches(params);
  }

  deleteMatch(id: number): Observable<any> {
    return this.apiService.deleteMatch(id);
  }
}
