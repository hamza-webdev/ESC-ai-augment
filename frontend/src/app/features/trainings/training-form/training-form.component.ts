import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';

// Material Modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle'; // For 'completed' status
import { MatTooltipModule } from '@angular/material/tooltip';


// Services and Models
import { TrainingService } from '../../../core/services/training.service';
import { Training, TrainingFormData, TRAINING_TYPES, TRAINING_INTENSITIES, FIELD_CONDITIONS } from '../../../core/models/training.model';

@Component({
  selector: 'app-training-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatSnackBarModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatTooltipModule
  ],
  providers: [
    DatePipe,
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' } // Or your preferred locale
  ],
  templateUrl: './training-form.component.html',
  styleUrls: ['./training-form.component.scss']
})
export class TrainingFormComponent implements OnInit {
  trainingForm!: FormGroup;
  isEditMode = false;
  trainingId: number | null = null;
  isLoading = false;
  pageTitle = 'Create Training Session';

  // Constants for dropdowns
  trainingTypes = TRAINING_TYPES;
  trainingIntensities = TRAINING_INTENSITIES;
  fieldConditions = FIELD_CONDITIONS;

  constructor(
    private fb: FormBuilder,
    private trainingService: TrainingService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.initForm(); // Initialize form structure first

    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          this.isEditMode = true;
          this.trainingId = +id;
          this.pageTitle = 'Edit Training Session';
          this.isLoading = true;
          return this.trainingService.getTrainingById(this.trainingId).pipe(
            tap(() => this.isLoading = false),
            catchError(err => {
              this.snackBar.open(`Error loading training session: ${err.message}`, 'Close', { duration: 5000 });
              this.isLoading = false;
              this.router.navigate(['/trainings']); // Or a relevant fallback route
              return of(null);
            })
          );
        }
        this.pageTitle = 'Create New Training Session';
        return of(null); // No training session to load for create mode
      })
    ).subscribe(training => {
      if (this.isEditMode && training) {
        this.populateForm(training);
      }
    });
  }

  initForm(): void {
    this.trainingForm = this.fb.group({
      title: ['', Validators.required],
      training_date: [null, Validators.required], // Stores Date object from picker
      start_time: ['', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]], // HH:mm
      end_time: ['', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]],   // HH:mm
      location: ['', Validators.required],
      type: [null, Validators.required],
      intensity: [null, Validators.required],
      objectives: [''],
      description: [''],
      exercises: [''], // Simple textarea
      equipment_needed: [''],
      weather: [''],
      temperature: [null as number | null],
      field_condition: [null],
      completed: [false, Validators.required], // Default to not completed
      notes: [''],
      coach_feedback: ['']
    });
  }

  populateForm(training: Training): void {
    this.trainingForm.patchValue({
      title: training.title,
      training_date: training.date, // Assuming backend sends date as YYYY-MM-DD compatible with picker
      start_time: training.start_time, // Assuming HH:mm
      end_time: training.end_time,     // Assuming HH:mm
      location: training.location,
      type: training.type,
      intensity: training.intensity,
      objectives: training.objectives,
      description: training.description,
      exercises: training.exercises,
      equipment_needed: training.equipment_needed,
      weather: training.weather,
      temperature: training.temperature,
      field_condition: training.field_condition,
      completed: training.completed,
      notes: training.notes,
      coach_feedback: training.coach_feedback
    });
  }

  onSubmit(): void {
    if (this.trainingForm.invalid) {
      this.snackBar.open('Please fill all required fields correctly.', 'Close', { duration: 3000 });
      this.trainingForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    // Ensure dates and times are correctly formatted if necessary before creating formData
    const formValue = this.trainingForm.value;
    const formData: TrainingFormData = {
        ...formValue,
        training_date: this.datePipe.transform(formValue.training_date, 'yyyy-MM-dd') // Ensure correct date format
    };


    const operation = this.isEditMode && this.trainingId
      ? this.trainingService.updateTraining(this.trainingId, formData)
      : this.trainingService.createTraining(formData);

    operation.pipe(
      catchError(err => {
        this.isLoading = false;
        const errorMessage = err.error?.message || err.message || 'An unknown error occurred.';
        this.snackBar.open(`Error: ${errorMessage}`, 'Close', { duration: 5000 });
        return of(null);
      })
    ).subscribe(savedTraining => {
      this.isLoading = false;
      if (savedTraining) {
        this.snackBar.open(`Training session ${this.isEditMode ? 'updated' : 'created'} successfully!`, 'Close', { duration: 3000 });
        if (this.isEditMode && savedTraining.id) {
          this.router.navigate(['/trainings', savedTraining.id]); // Navigate to detail view for updated training
        } else {
          this.router.navigate(['/trainings']); // Navigate to list view for new training
        }
      }
    });
  }

  onCancel(): void {
    if (this.isEditMode && this.trainingId) {
      this.router.navigate(['/trainings', this.trainingId]); // Navigate back to detail view
    } else {
      this.router.navigate(['/trainings']); // Navigate back to list view
    }
  }

  // Helper for form control access in template
  get f() { return this.trainingForm.controls; }
}
