import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, catchError, tap, map } from 'rxjs/operators';

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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';


// Services and Models
import { MatchService } from '../../../core/services/match.service';
import { Match, MatchFormData, COMPETITION_TYPES, CompetitionType } from '../../../core/models/match.model';

@Component({
  selector: 'app-match-form',
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
    MatExpansionModule
  ],
  providers: [
    DatePipe,
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' } // Or your preferred locale
  ],
  templateUrl: './match-form.component.html',
  styleUrls: ['./match-form.component.scss'] // Corrected from styleUrl
})
export class MatchFormComponent implements OnInit {
  matchForm!: FormGroup;
  isEditMode = false;
  matchId: number | null = null;
  isLoading = false;
  pageTitle = 'Create Match';
  competitionTypes = COMPETITION_TYPES;
  postMatchPanelOpenState = false; // For expansion panel

  constructor(
    private fb: FormBuilder,
    private matchService: MatchService,
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
          this.matchId = +id;
          this.pageTitle = 'Edit Match';
          this.isLoading = true;
          return this.matchService.getMatchById(this.matchId).pipe(
            tap(() => this.isLoading = false),
            catchError(err => {
              this.snackBar.open(`Error loading match: ${err.message}`, 'Close', { duration: 5000 });
              this.isLoading = false;
              this.router.navigate(['/matches']);
              return of(null);
            })
          );
        }
        this.pageTitle = 'Create New Match';
        this.postMatchPanelOpenState = false; // Keep closed for new matches
        return of(null); // No match to load for create mode
      })
    ).subscribe(match => {
      if (this.isEditMode && match) {
        this.populateForm(match);
        // Decide if post-match section should be open for existing matches
        this.postMatchPanelOpenState = !!(match.goals_for !== null || match.goals_against !== null || match.match_report);
      }
    });
  }

  initForm(): void {
    this.matchForm = this.fb.group({
      // Pre-match fields
      opponent: ['', Validators.required],
      match_date: [null, Validators.required], // Stores Date object from picker
      match_time: ['', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]], // HH:mm format
      location: ['', Validators.required],
      is_home: [true, Validators.required],
      competition: [null, Validators.required],
      referee: [''],
      weather: [''],
      temperature: [null as number | null],

      // Post-match fields (can be in a sub-form group if preferred)
      goals_for: [null as number | null, [Validators.min(0)]],
      goals_against: [null as number | null, [Validators.min(0)]],
      attendance: [null as number | null, [Validators.min(0)]],
      match_report: [''],
      highlights: [''] // Textarea for JSON
    });
  }

  populateForm(match: Match): void {
    // Extract date and time from ISO string
    const matchDateTime = new Date(match.date);
    const matchDate = this.datePipe.transform(matchDateTime, 'yyyy-MM-dd');
    const matchTime = this.datePipe.transform(matchDateTime, 'HH:mm');

    this.matchForm.patchValue({
      opponent: match.opponent,
      match_date: matchDate,
      match_time: matchTime,
      location: match.location,
      is_home: match.is_home,
      competition: match.competition,
      referee: match.referee,
      weather: match.weather,
      temperature: match.temperature,
      goals_for: match.goals_for,
      goals_against: match.goals_against,
      attendance: match.attendance,
      match_report: match.match_report,
      highlights: match.highlights
    });
  }

  onSubmit(): void {
    if (this.matchForm.invalid) {
      this.snackBar.open('Please fill all required fields correctly.', 'Close', { duration: 3000 });
      this.matchForm.markAllAsTouched();
      // Check if post-match fields have errors and open panel if so
      const postMatchControls = ['goals_for', 'goals_against', 'attendance'];
      if (postMatchControls.some(controlName => this.matchForm.get(controlName)?.invalid)) {
          this.postMatchPanelOpenState = true;
      }
      return;
    }

    this.isLoading = true;
    const formData = this.matchForm.value as MatchFormData;

    const operation = this.isEditMode && this.matchId
      ? this.matchService.updateMatch(this.matchId, formData)
      : this.matchService.createMatch(formData);

    operation.pipe(
      catchError(err => {
        this.isLoading = false;
        const errorMessage = err.error?.message || err.message || 'An unknown error occurred.';
        this.snackBar.open(`Error: ${errorMessage}`, 'Close', { duration: 5000 });
        return of(null);
      })
    ).subscribe(savedMatch => {
      this.isLoading = false;
      if (savedMatch) {
        this.snackBar.open(`Match ${this.isEditMode ? 'updated' : 'created'} successfully!`, 'Close', { duration: 3000 });
        this.router.navigate(['/matches', savedMatch.id]); // Navigate to match detail
      }
    });
  }

  onCancel(): void {
    if (this.isEditMode && this.matchId) {
      this.router.navigate(['/matches', this.matchId]);
    } else {
      this.router.navigate(['/matches']);
    }
  }

  // Helper for form control access in template
  get f() { return this.matchForm.controls; }
}
