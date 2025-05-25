import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // Added ReactiveFormsModule for filter form
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { Subject, Subscription, merge } from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith, switchMap, catchError, map, tap } from 'rxjs/operators';

import { MatchService } from '../../../core/services/match.service';
import { Match, COMPETITION_TYPES, CompetitionType, MatchResult } from '../../../core/models/match.model';
import { PaginatedResponse } from '../../../core/models/api-interfaces.model';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component'; // Assuming path

@Component({
  selector: 'app-matches-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule, // For filter form
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    DatePipe
  ],
  templateUrl: './matches-list.component.html',
  styleUrls: ['./matches-list.component.scss'] // Corrected from styleUrl
})
export class MatchesListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['date', 'opponent', 'score', 'competition', 'location', 'is_home', 'status', 'actions'];
  dataSource = new MatTableDataSource<Match>([]);

  isLoading = true;
  totalCount = 0;
  pageSize = 10;
  currentPage = 0; // pageIndex for paginator

  filterForm!: FormGroup;
  private filterChangeSubscription!: Subscription;
  competitionTypes = COMPETITION_TYPES;
  matchStatuses: { value: string, label: string }[] = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'finished', label: 'Finished' },
    { value: 'pending', label: 'Pending Result'}, // if backend supports filtering by this
    { value: 'win', label: 'Win' },
    { value: 'loss', label: 'Loss' },
    { value: 'draw', label: 'Draw' }
  ];
  years: number[] = this.generateYearList();

  constructor(
    private matchService: MatchService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder // For filter form
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      search: [''],
      competition: [''],
      status: [''],
      year: ['']
    });
  }

  ngAfterViewInit(): void {
    // If server-side sorting, listen to sort changes
    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

    // Combine paginator, sort, and filter changes to trigger data loading
    this.filterChangeSubscription = merge(this.sort.sortChange, this.paginator.page, this.filterForm.valueChanges.pipe(debounceTime(400), distinctUntilChanged()))
      .pipe(
        startWith({}), // Trigger initial load
        tap(() => this.isLoading = true),
        switchMap(() => {
          this.currentPage = this.paginator.pageIndex;
          this.pageSize = this.paginator.pageSize;
          const filters = this.filterForm.value;
          const params: any = {
            page: this.currentPage + 1,
            limit: this.pageSize,
            sort_by: this.sort.active || 'date',
            sort_direction: this.sort.direction || 'desc',
            search: filters.search || null,
            competition: filters.competition || null,
            status: filters.status || null,
            year: filters.year || null
          };
          Object.keys(params).forEach(key => { // Remove null/empty params
            if (params[key] === null || params[key] === '') delete params[key];
          });
          return this.matchService.getMatches(params).pipe(
            catchError(err => {
              this.isLoading = false;
              this.snackBar.open(`Error loading matches: ${err.message}`, 'Close', { duration: 5000 });
              return of({ items: [], total: 0, page: 1, per_page: this.pageSize } as PaginatedResponse<Match>);
            })
          );
        }),
        map(response => {
          this.isLoading = false;
          this.totalCount = response.total;
          return response.items;
        })
      ).subscribe(matches => {
        this.dataSource.data = matches;
      });
  }

  ngOnDestroy(): void {
    if (this.filterChangeSubscription) {
      this.filterChangeSubscription.unsubscribe();
    }
  }
  
  generateYearList(): number[] {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear + 1; year >= currentYear - 5; year--) {
      years.push(year);
    }
    return years;
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', competition: '', status: '', year: '' });
    // loadMatches will be triggered by valueChanges
  }

  getMatchStatus(match: Match): string {
    if (match.result && match.result !== 'pending') {
        return match.result.charAt(0).toUpperCase() + match.result.slice(1);
    }
    const matchDate = new Date(match.date);
    if (matchDate > new Date()) {
        return 'Upcoming';
    }
    return 'Pending Result';
  }
  
  getScore(match: Match): string {
    if (match.goals_for !== null && match.goals_against !== null) {
      return `${match.goals_for} - ${match.goals_against}`;
    }
    return 'vs';
  }


  createMatch(): void {
    this.router.navigate(['/matches/create']);
  }

  viewMatchDetails(match: Match): void {
    this.router.navigate(['/matches', match.id]);
  }

  editMatch(match: Match): void {
    this.router.navigate(['/matches', match.id, 'edit']);
  }

  deleteMatch(match: Match): void {
    const dialogData: ConfirmDialogData = {
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete the match against ${match.opponent} on ${new Date(match.date).toLocaleDateString()}?`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.matchService.deleteMatch(match.id).subscribe({
          next: () => {
            this.snackBar.open('Match deleted successfully!', 'Close', { duration: 3000 });
            this.loadMatchesTrigger(); // Reload data
          },
          error: (err) => {
            this.isLoading = false;
            this.snackBar.open(`Error deleting match: ${err.message}`, 'Close', { duration: 5000 });
          }
        });
      }
    });
  }
  
  // Helper to manually trigger data loading if needed (e.g., after delete)
  loadMatchesTrigger(): void {
    // This will make the existing merge stream emit again due to startWith({})
    // or by directly calling the load logic.
    // A simpler way is to just re-trigger the stream.
    // Forcing a value change in filterForm if it's the main trigger:
    const currentFilters = this.filterForm.value;
    this.filterForm.setValue(currentFilters, { emitEvent: true }); // Re-emit current values
    this.isLoading = true; // Manually set loading as the stream might take a moment
  }
}
