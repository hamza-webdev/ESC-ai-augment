import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from './api.service';
import { Training, TrainingFormData, TrainingAttendance, TrainingAttendanceData } from '../models/training.model'; // Added TrainingAttendance, TrainingAttendanceData
import { PaginatedResponse } from '../models/api-interfaces.model';

@Injectable({
  providedIn: 'root'
})
export class TrainingService {

  constructor(private apiService: ApiService) { }

  getTrainings(params?: any): Observable<PaginatedResponse<Training>> {
    return this.apiService.getTrainings(params);
  }

  getTrainingById(id: number): Observable<Training> {
    return this.apiService.getTraining(id);
  }

  createTraining(trainingData: TrainingFormData): Observable<Training> {
    const payload = this.preparePayload(trainingData);
    return this.apiService.createTraining(payload);
  }

  updateTraining(id: number, trainingData: TrainingFormData): Observable<Training> {
    const payload = this.preparePayload(trainingData);
    return this.apiService.updateTraining(id, payload);
  }

  deleteTraining(id: number): Observable<any> {
    return this.apiService.deleteTraining(id);
  }

  getTrainingAttendance(trainingId: number): Observable<TrainingAttendance[]> {
    return this.apiService.getTrainingAttendance(trainingId).pipe(
      map(response => response || []) // Ensure it returns an array
    );
  }

  updateTrainingAttendance(trainingId: number, attendanceData: TrainingAttendanceData[]): Observable<any> {
    // Assuming backend expects array of TrainingAttendanceData objects
    // The ApiService method is batchUpdateTrainingAttendance
    return this.apiService.batchUpdateTrainingAttendance(trainingId, attendanceData);
  }

  private preparePayload(formData: TrainingFormData): Partial<Training> {
    // Combine date and time into ISO strings if backend expects that,
    // or send as separate fields if backend handles it.
    // Backend Training model has 'date' (Date), 'start_time' (Time), 'end_time' (Time).
    // The ApiService methods for createTraining/updateTraining expect Partial<Training>.
    // The frontend Training model has date: string (ISO Date YYYY-MM-DD), start_time: string (HH:mm), end_time: string (HH:mm)
    // The backend Python model likely expects separate date, start_time, end_time.

    const payload: Partial<Training> = {
      title: formData.title,
      // The backend expects date as YYYY-MM-DD, and start_time/end_time as HH:MM strings.
      // The frontend Training model aligns with this if date is just date part.
      // The backend Training model has `date = db.Column(db.Date, nullable=False)`, `start_time = db.Column(db.Time, nullable=False)`.
      // So, we need to ensure formData.training_date is YYYY-MM-DD and start_time/end_time are HH:MM.
      date: formData.training_date, // Should be YYYY-MM-DD string
      start_time: formData.start_time, // Should be HH:MM string
      end_time: formData.end_time, // Should be HH:MM string
      location: formData.location,
      type: formData.type,
      intensity: formData.intensity,
      objectives: formData.objectives,
      description: formData.description,
      exercises: formData.exercises,
      equipment_needed: formData.equipment_needed,
      weather: formData.weather,
      temperature: formData.temperature,
      field_condition: formData.field_condition,
      completed: formData.completed,
      notes: formData.notes,
      coach_feedback: formData.coach_feedback
    };

    // Remove null or undefined fields to send a cleaner payload
    Object.keys(payload).forEach(key => {
        const k = key as keyof Partial<Training>;
        if (payload[k] === null || payload[k] === undefined || payload[k] === '') {
            delete payload[k];
        }
    });
    return payload;
  }
}
