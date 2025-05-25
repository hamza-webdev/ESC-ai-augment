import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // For delete confirmation
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list'; // For displaying details
import { MatChipsModule } from '@angular/material/chips'; // For status/position
import { MatTooltipModule } from '@angular/material/tooltip'; // For tooltips

import { PlayerService } from '../../../core/services/player.service';
import { Player, PlayerPosition, PlayerStatus } from '../../../core/models/player.model'; // Import enums if needed for display logic
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component'; // Import ConfirmDialogComponent

import { switchMap, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-player-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatListModule,
    MatChipsModule,
    MatTooltipModule,
    DatePipe // If you need to format dates
  ],
  templateUrl: './player-detail.component.html',
  styleUrls: ['./player-detail.component.scss'] // Corrected from styleUrl
})
export class PlayerDetailComponent implements OnInit {
  player: Player | null = null;
  isLoading = true;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private playerService: PlayerService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog // Made public if accessed from template, otherwise private
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      tap(() => this.isLoading = true),
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          return this.playerService.getPlayerById(+id).pipe(
            catchError(err => {
              this.errorMessage = `Error loading player: ${err.message || 'Unknown error'}`;
              this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
              this.isLoading = false;
              this.router.navigate(['/players']); // Or a 404 page
              return of(null);
            })
          );
        }
        this.errorMessage = 'Player ID not provided.';
        this.isLoading = false;
        this.router.navigate(['/players']); // Or a 404 page
        return of(null);
      })
    ).subscribe(player => {
      if (player) {
        this.player = player;
        this.errorMessage = null;
      } else if (!this.errorMessage) { // If player is null but no error was caught by catchError (e.g. service returned null)
        this.errorMessage = 'Player not found.';
        this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
      }
      this.isLoading = false;
    });
  }

  editPlayer(): void {
    if (this.player) {
      this.router.navigate(['/players', this.player.id, 'edit']);
    }
  }

  deletePlayer(): void {
    if (!this.player) return;

    const dialogData: ConfirmDialogData = {
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete player ${this.player.full_name || this.player.id}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.player) {
        this.isLoading = true;
        this.playerService.deletePlayer(this.player.id).subscribe({
          next: () => {
            this.snackBar.open('Player deleted successfully!', 'Close', { duration: 3000 });
            this.router.navigate(['/players']);
            this.isLoading = false;
          },
          error: (err) => {
            this.snackBar.open(`Error deleting player: ${err.message || 'Unknown error'}`, 'Close', { duration: 5000 });
            this.isLoading = false;
          }
        });
      }
    });
  }

  // Helper to get position label if you have a mapping, similar to PlayersListComponent
  getPositionLabel(positionValue: PlayerPosition | string): string {
    // Assuming PlayerPosition is an enum or type with known values.
    // If you have a more complex mapping:
    // const labels = { GK: 'Goalkeeper', CB: 'Center Back', ... };
    // return labels[positionValue] || positionValue;
    return positionValue as string; // Simple return for now
  }
  
  // Helper to get status label, similar to PlayersListComponent
  getStatusClass(status: PlayerStatus | string | undefined): string {
    if (!status) return '';
    return `status-${status.toLowerCase()}`;
  }


  goBack(): void {
    this.router.navigate(['/players']);
  }
}
