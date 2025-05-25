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
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // For loading state

// Services and Models
import { PlayerService } from '../../../core/services/player.service';
import { Player, PlayerFormData, PlayerPosition, PlayerStatus, PreferredFoot } from '../../../core/models/player.model';
import { UserBasic } from '../../../core/models/user.model';
import { PLAYER_POSITIONS, PLAYER_STATUSES_DETTAGLIATI, PLAYER_PREFERRED_FEET } from '../../../core/constants/player.constants';

@Component({
  selector: 'app-player-form',
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
    MatProgressSpinnerModule
  ],
  providers: [DatePipe], // For transforming dates if needed
  templateUrl: './player-form.component.html',
  styleUrl: './player-form.component.scss'
})
export class PlayerFormComponent implements OnInit {
  playerForm!: FormGroup;
  isEditMode = false;
  playerId: number | null = null;
  assignableUsers$: Observable<UserBasic[]> = of([]);
  isLoading = false; // For loading indicator
  pageTitle = 'Create Player';
  editingPlayerUserName: string | null = null; // For displaying user name in edit mode

  // Use constants for dropdowns
  playerPositions = PLAYER_POSITIONS;
  playerStatuses = PLAYER_STATUSES_DETTAGLIATI;
  playerPreferredFeet = PLAYER_PREFERRED_FEET;

  constructor(
    private fb: FormBuilder,
    private playerService: PlayerService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe // For date formatting if needed
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          this.isEditMode = true;
          this.playerId = +id;
          this.pageTitle = 'Edit Player';
          return this.playerService.getPlayerById(this.playerId);
        }
        this.pageTitle = 'Create New Player';
        return of(null); // No player to load for create mode
      })
    ).subscribe(player => {
      this.initForm();
      if (this.isEditMode && player) {
        this.loadPlayerData(player);
      } else {
        // For create mode, load assignable users
        this.loadAssignableUsers();
      }
    });
  }

  initForm(): void {
    this.playerForm = this.fb.group({
      user_id: [{ value: null, disabled: this.isEditMode }, Validators.required],
      jersey_number: [null, [Validators.min(1), Validators.max(999)]],
      position: [null, Validators.required],
      birth_date: [null, Validators.required],
      nationality: ['', Validators.required],
      height: [null, [Validators.min(100), Validators.max(250)]],
      weight: [null, [Validators.min(30), Validators.max(150)]],
      preferred_foot: [null],
      status: ['active', Validators.required],
      contract_start: [null],
      contract_end: [null],
      salary: [null, [Validators.min(0)]],
      // Medical and other optional fields from PlayerFormData
      blood_type: [''],
      medical_notes: [''],
      emergency_contact_name: [''],
      emergency_contact_phone: [''],
      address: ['']
    });

    if (this.isEditMode) {
      this.playerForm.get('user_id')?.disable();
    }
  }

  loadPlayerData(player: Player): void {
    this.isLoading = true;
    // Format dates for datepicker if they are not already in 'yyyy-MM-dd' or Date objects
    // The backend should ideally send ISO strings like 'YYYY-MM-DDTHH:mm:ssZ' or 'YYYY-MM-DD'
    // The MatDatepicker usually handles ISO strings well.
    this.playerForm.patchValue({
      ...player,
      birth_date: player.birth_date ? this.datePipe.transform(player.birth_date, 'yyyy-MM-dd') : null,
      contract_start: player.contract_start ? this.datePipe.transform(player.contract_start, 'yyyy-MM-dd') : null,
      contract_end: player.contract_end ? this.datePipe.transform(player.contract_end, 'yyyy-MM-dd') : null,
    });

    // For an existing player, we don't need to select the user from the dropdown.
    // Instead, we might want to display the user's name.
    // The Player object from the service should include full_name if the backend provides it.
    if (this.isEditMode && player.full_name) {
      this.editingPlayerUserName = player.full_name;
    } else if (this.isEditMode) {
      // Fallback or fetch user details if full_name is not directly on player object
      // For now, assume player.full_name is available or user_id display is acceptable.
      // If player.user_id is available and player.full_name is not, a call like:
      // this.userService.getUserById(player.user_id).subscribe(user => this.editingPlayerUserName = user.full_name);
      // would be needed. But PlayerService.getPlayerById should ideally provide this.
      this.editingPlayerUserName = `User ID: ${player.user_id}`; // Fallback
    }
    this.isLoading = false;
  }

  loadAssignableUsers(): void {
    this.isLoading = true;
    this.assignableUsers$ = this.playerService.getAssignableUsers().pipe(
      tap(() => this.isLoading = false),
      catchError(err => {
        this.snackBar.open('Error loading users: ' + err.message, 'Close', { duration: 3000 });
        this.isLoading = false;
        return of([]);
      })
    );
  }

  onSubmit(): void {
    if (this.playerForm.invalid) {
      this.snackBar.open('Please fill all required fields correctly.', 'Close', { duration: 3000 });
      this.playerForm.markAllAsTouched(); // Show validation errors
      return;
    }

    this.isLoading = true;
    const rawValues = this.playerForm.getRawValue(); // Use getRawValue to include disabled user_id

    // Ensure dates are in ISO format string if they are Date objects from datepicker
    const playerData: PlayerFormData = {
      ...rawValues,
      birth_date: this.datePipe.transform(rawValues.birth_date, 'yyyy-MM-dd')!,
      contract_start: rawValues.contract_start ? this.datePipe.transform(rawValues.contract_start, 'yyyy-MM-dd') : null,
      contract_end: rawValues.contract_end ? this.datePipe.transform(rawValues.contract_end, 'yyyy-MM-dd') : null,
    };

    const operation = this.isEditMode && this.playerId
      ? this.playerService.updatePlayer(this.playerId, playerData)
      : this.playerService.createPlayer(playerData);

    operation.pipe(
      catchError(err => {
        this.isLoading = false;
        const errorMessage = err.error?.message || err.message || 'An unknown error occurred.';
        this.snackBar.open(`Error: ${errorMessage}`, 'Close', { duration: 5000 });
        return of(null); // Prevent further processing in the subscription
      })
    ).subscribe(savedPlayer => {
      this.isLoading = false;
      if (savedPlayer) {
        this.snackBar.open(`Player ${this.isEditMode ? 'updated' : 'created'} successfully!`, 'Close', { duration: 3000 });
        this.router.navigate(['/players', savedPlayer.id]); // Navigate to player detail
      }
      // Error already handled by catchError
    });
  }

  onCancel(): void {
    if (this.isEditMode && this.playerId) {
      this.router.navigate(['/players', this.playerId]);
    } else {
      this.router.navigate(['/players']);
    }
  }

  // Helper for form control access in template
  get f() { return this.playerForm.controls; }
}
