import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';


import { TrainingService } from '../../../core/services/training.service';
import { PlayerService } from '../../../core/services/player.service'; // To get player list
import { Training, TrainingAttendance, TrainingAttendanceData, EffortLevel, EFFORT_LEVELS } from '../../../core/models/training.model';
import { UserBasic } from '../../../core/models/user.model'; // For player list
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

import { forkJoin, of } from 'rxjs';
import { switchMap, catchError, tap, map } from 'rxjs/operators';

@Component({
  selector: 'app-training-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatListModule,
    MatChipsModule,
    MatTooltipModule,
    MatExpansionModule,
    MatTableModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    DatePipe
  ],
  templateUrl: './training-detail.component.html',
  styleUrls: ['./training-detail.component.scss']
})
export class TrainingDetailComponent implements OnInit {
  training: Training | null = null;
  allPlayers: UserBasic[] = []; // Using UserBasic from PlayerService.getAssignableUsers
  
  attendanceForm!: FormGroup;
  
  isLoading = true;
  isSavingAttendance = false;
  errorMessage: string | null = null;
  
  effortLevels = EFFORT_LEVELS;
  attendanceDisplayedColumns: string[] = ['playerName', 'attended', 'excuse', 'lateArrival', 'earlyDeparture', 'effortLevel', 'performanceRating', 'notes'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private trainingService: TrainingService,
    private playerService: PlayerService, // For fetching players
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      tap(() => this.isLoading = true),
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          return forkJoin({
            training: this.trainingService.getTrainingById(+id),
            players: this.playerService.getAssignableUsers(), // Fetches UserBasic[]
            attendanceRecords: this.trainingService.getTrainingAttendance(+id)
          }).pipe(
            catchError(err => {
              this.errorMessage = `Error loading training data: ${err.message || 'Unknown error'}`;
              this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
              this.isLoading = false;
              this.router.navigate(['/trainings']);
              return of(null);
            })
          );
        }
        this.errorMessage = 'Training ID not provided.';
        this.isLoading = false;
        this.router.navigate(['/trainings']);
        return of(null);
      })
    ).subscribe(data => {
      if (data && data.training) {
        this.training = data.training;
        this.allPlayers = data.players || [];
        this.buildAttendanceForm(data.attendanceRecords || []);
        this.errorMessage = null;
      } else if (!this.errorMessage) {
        this.errorMessage = 'Training session not found.';
        this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
      }
      this.isLoading = false;
    });
  }

  buildAttendanceForm(existingAttendance: TrainingAttendance[]): void {
    const attendanceControls = this.allPlayers.map(player => {
      const record = existingAttendance.find(att => att.player_id === player.id);
      return this.fb.group({
        player_id: [player.id, Validators.required],
        player_name: [{ value: player.full_name || player.username, disabled: true }], // For display
        attended: [record?.attended ?? false, Validators.required],
        excuse: [record?.excuse ?? ''],
        late_arrival: [record?.late_arrival ?? false],
        early_departure: [record?.early_departure ?? false],
        effort_level: [record?.effort_level ?? null],
        performance_rating: [record?.performance_rating ?? null, [Validators.min(0), Validators.max(10)]],
        notes: [record?.notes ?? '']
      });
    });
    this.attendanceForm = this.fb.group({
      attendees: this.fb.array(attendanceControls)
    });
  }

  get attendeesFormArray(): FormArray {
    return this.attendanceForm.get('attendees') as FormArray;
  }
  
  getTrainingTime(): string {
    if (!this.training) return 'N/A';
    return `${this.training.start_time} - ${this.training.end_time}`;
  }


  saveAttendance(): void {
    if (!this.training || this.attendanceForm.invalid) {
      this.snackBar.open('Please correct any errors in the attendance form.', 'Close', { duration: 3000 });
      return;
    }
    this.isSavingAttendance = true;
    const attendanceData: TrainingAttendanceData[] = this.attendeesFormArray.value.map((att: any) => ({
      player_id: att.player_id,
      attended: att.attended,
      excuse: att.excuse || null,
      late_arrival: att.late_arrival || false,
      early_departure: att.early_departure || false,
      effort_level: att.effort_level || null,
      performance_rating: att.performance_rating !== null && att.performance_rating !== '' ? Number(att.performance_rating) : null,
      notes: att.notes || null
    }));

    this.trainingService.updateTrainingAttendance(this.training.id, attendanceData)
      .pipe(
        finalize(() => this.isSavingAttendance = false),
        catchError(err => {
          this.snackBar.open(`Error saving attendance: ${err.message || 'Unknown error'}`, 'Close', { duration: 5000 });
          return of(null);
        })
      )
      .subscribe(response => {
        if (response) {
          this.snackBar.open('Attendance saved successfully!', 'Close', { duration: 3000 });
          // Optionally, refresh attendance data if backend returns updated records
        }
      });
  }
  
  toggleAttended(index: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const control = this.attendeesFormArray.at(index);
    if (!checkbox.checked) { // If unchecking "attended"
        control.get('excuse')?.setValidators(Validators.required);
        control.get('excuse')?.updateValueAndValidity();
    } else {
        control.get('excuse')?.clearValidators();
        control.get('excuse')?.updateValueAndValidity();
    }
  }


  editTraining(): void {
    if (this.training) {
      this.router.navigate(['/trainings', this.training.id, 'edit']);
    }
  }

  deleteTraining(): void {
    if (!this.training) return;
    const dialogData: ConfirmDialogData = {
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete training session "${this.training.title}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    };
    const dialogRef = this.dialog.open(ConfirmDialogComponent, { width: '400px', data: dialogData });
    dialogRef.afterClosed().subscribe(result => {
      if (result && this.training) {
        this.isLoading = true; // Use main loading flag or a specific one
        this.trainingService.deleteTraining(this.training.id).subscribe({
          next: () => {
            this.snackBar.open('Training session deleted.', 'Close', { duration: 3000 });
            this.router.navigate(['/trainings']);
          },
          error: (err) => {
            this.isLoading = false;
            this.snackBar.open(`Error deleting: ${err.message}`, 'Close', { duration: 5000 });
          }
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/trainings']);
  }
}
