import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion'; // For player stats section
import { MatTableModule } from '@angular/material/table'; // For player stats table


import { MatchService } from '../../../core/services/match.service';
import { Match, MatchResult, CompetitionType } from '../../../core/models/match.model';
import { PlayerStats } from '../../../core/models/domain.model'; // For goalscorers
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

import { switchMap, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-match-detail',
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
    MatExpansionModule,
    MatTableModule,
    DatePipe
  ],
  templateUrl: './match-detail.component.html',
  styleUrls: ['./match-detail.component.scss']
})
export class MatchDetailComponent implements OnInit {
  match: Match | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  
  // For displaying player stats if available
  playerStatsDisplayedColumns: string[] = ['playerName', 'goals', 'assists', 'minutesPlayed'];


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private matchService: MatchService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      tap(() => this.isLoading = true),
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          // Assuming getMatchById fetches detailed match data including stats
          return this.matchService.getMatchById(+id).pipe(
            catchError(err => {
              this.errorMessage = `Error loading match details: ${err.message || 'Unknown error'}`;
              this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
              this.isLoading = false;
              this.router.navigate(['/matches']); // Or a 404 page
              return of(null);
            })
          );
        }
        this.errorMessage = 'Match ID not provided.';
        this.isLoading = false;
        this.router.navigate(['/matches']); // Or a 404 page
        return of(null);
      })
    ).subscribe(matchData => {
      if (matchData) {
        this.match = matchData;
        this.errorMessage = null;
      } else if (!this.errorMessage) {
        this.errorMessage = 'Match not found.';
        this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
      }
      this.isLoading = false;
    });
  }

  getMatchScore(): string {
    if (this.match) {
      if (this.match.goals_for !== null && this.match.goals_against !== null) {
        return `${this.match.goals_for} - ${this.match.goals_against}`;
      }
      return this.match.score || 'vs'; // Fallback to score if direct goals not available
    }
    return 'N/A';
  }

  getMatchStatusLabel(): string {
    if (!this.match) return 'N/A';
    if (this.match.result && this.match.result !== 'pending') {
      return this.match.result.charAt(0).toUpperCase() + this.match.result.slice(1);
    }
    const matchDate = new Date(this.match.date);
    if (matchDate > new Date()) {
      return 'Upcoming';
    }
    return 'Pending Result';
  }
  
  getCompetitionLabel(competitionValue: CompetitionType | string | undefined): string {
    if (!competitionValue) return 'N/A';
    // Assuming COMPETITION_TYPES might be imported if needed for labels
    // For now, just capitalize
    return competitionValue.charAt(0).toUpperCase() + competitionValue.slice(1);
  }

  editMatch(): void {
    if (this.match) {
      this.router.navigate(['/matches', this.match.id, 'edit']);
    }
  }

  deleteMatch(): void {
    if (!this.match) return;

    const dialogData: ConfirmDialogData = {
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete the match against ${this.match.opponent} on ${new Date(this.match.date).toLocaleDateString()}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.match) {
        this.isLoading = true;
        this.matchService.deleteMatch(this.match.id).subscribe({
          next: () => {
            this.snackBar.open('Match deleted successfully!', 'Close', { duration: 3000 });
            this.router.navigate(['/matches']);
            this.isLoading = false;
          },
          error: (err) => {
            this.isLoading = false;
            this.snackBar.open(`Error deleting match: ${err.message || 'Unknown error'}`, 'Close', { duration: 5000 });
          }
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/matches']);
  }
}
