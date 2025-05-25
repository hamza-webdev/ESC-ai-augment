import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
// Corrected Player model import path
import { Player, PlayerPosition, PlayerStatus } from '../../../core/models/player.model';
// Import constants for filters
import { PLAYER_POSITIONS, PLAYER_STATUSES_DETTAGLIATI, PLAYER_AGE_RANGES } from '../../../core/constants/player.constants'; // Corrected constant name
// Import the new ConfirmDialogComponent
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MatDialogModule } from '@angular/material/dialog'; // Import MatDialogModule


@Component({
  selector: 'app-players-list',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule, // Added MatDialogModule
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
    MatProgressSpinnerModule
  ],
  templateUrl: './players-list.component.html',
  styleUrl: './players-list.component.scss'
})
export class PlayersListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Table configuration
  displayedColumns: string[] = ['avatar', 'number', 'name', 'position', 'age', 'status', 'actions'];
  dataSource = new MatTableDataSource<Player>([]);

  // Loading and pagination
  loading = false;
  totalCount = 0;
  pageSize = 10;
  currentPage = 0;

  // Filters
  searchTerm = '';
  selectedPosition = '';
  selectedStatus = '';
  selectedAgeRange = '';

  // Search subject for debouncing
  private searchSubject = new Subject<string>();

  // View mode
  viewMode: 'table' | 'cards' = 'table';

  // Statistics
  totalPlayers = 0;
  activePlayers = 0;
  injuredPlayers = 0;
  averageAge = 0;

  // Use imported constants
  playerPositions = PLAYER_POSITIONS;
  playerStatuses = PLAYER_STATUSES_DETTAGLIATI; // For status filter dropdown - corrected name
  playerAgeRanges = PLAYER_AGE_RANGES; // For age range filter

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.performSearch();
    });
  }

  ngOnInit(): void {
    this.loadPlayers();
    // loadStatistics will be called within loadPlayers success
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    // Note: MatSort should be applied to the dataSource if server-side sorting is not used
    // or if client-side sorting is desired on the fetched page.
    // If sorting is done server-side, this.sort might interact with API calls.
    // For now, assuming sort is for client-side operations on the current page,
    // or handled by API if sort headers are set.
    this.dataSource.sort = this.sort;
  }

  /**
   * Load players with current filters
   */
  loadPlayers(): void {
    this.loading = true;

    const params: any = { // Use 'any' for params to avoid type issues with delete
      page: this.currentPage + 1,
      limit: this.pageSize,
      search: this.searchTerm,
      position: this.selectedPosition,
      status: this.selectedStatus,
      age_range: this.selectedAgeRange
      // Add sorting parameters if backend supports it:
      // sort_by: this.sort?.active,
      // sort_direction: this.sort?.direction
    };

    // Remove empty parameters
    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    this.apiService.getPlayers(params).subscribe({
      next: (response) => {
        this.dataSource.data = response.data || []; // Ensure data is always an array
        this.totalCount = response.total || 0;
        this.loading = false;
        this.updateHeaderStatistics(); // Update header stats based on new data
      },
      error: (error) => {
        console.error('Error loading players:', error);
        this.snackBar.open('Erreur lors du chargement des joueurs', 'Fermer', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  /**
   * Load statistics
   */
  /**
   * Update header statistics based on current data.
   * Note: Active players, injured players, and average age are based on the *currently loaded page data*,
   * not the entire dataset, unless the API provides these aggregates.
   * Total players is based on the paginated response's total count.
   */
  updateHeaderStatistics(): void {
    this.totalPlayers = this.totalCount; // This is accurate for the filtered set

    const currentPagePlayers = this.dataSource.data;
    if (currentPagePlayers && currentPagePlayers.length > 0) {
      this.activePlayers = currentPagePlayers.filter(p => p.status === 'active').length;
      this.injuredPlayers = currentPagePlayers.filter(p => p.status === 'injured').length;
      
      const totalAgeOnPage = currentPagePlayers.reduce((sum, player) => sum + (player.age || 0), 0);
      this.averageAge = Math.round(totalAgeOnPage / currentPagePlayers.length);
    } else {
      this.activePlayers = 0;
      this.injuredPlayers = 0;
      this.averageAge = 0;
    }
    // For a more accurate global average age, active/injured counts, a dedicated backend API endpoint is needed.
  }

  /**
   * Handle search input
   */
  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  /**
   * Perform search
   */
  performSearch(): void {
    this.currentPage = 0;
    this.loadPlayers();
  }

  /**
   * Handle filter changes
   */
  onFilterChange(): void {
    this.currentPage = 0;
    this.loadPlayers();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedPosition = '';
    this.selectedStatus = '';
    this.selectedAgeRange = '';
    this.currentPage = 0;
    this.loadPlayers();
  }

  /**
   * Handle page change
   */
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPlayers();
  }

  /**
   * Toggle view mode
   */
  toggleView(mode: 'table' | 'cards'): void {
    this.viewMode = mode;
  }

  /**
   * Calculate age from date of birth
   */
  // calculateAge method is removed as player.age is assumed to be provided by the backend.
  // If player.age is not available, this method would need to be reinstated and used.

  /**
   * Get position label
   */
  getPositionLabel(positionValue: PlayerPosition | string): string {
    const position = this.playerPositions.find(p => p.value === positionValue);
    return position ? position.label : positionValue;
  }

  /**
   * Get status label
   */
  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'active': 'Actif',
      'injured': 'Blessé',
      'suspended': 'Suspendu',
      'inactive': 'Inactif'
    };
    return statusLabels[status] || status;
  }

  /**
   * Get status icon
   */
  getStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      'active': 'check_circle',
      'injured': 'healing',
      'suspended': 'block',
      'inactive': 'pause_circle'
    };
    return statusIcons[status] || 'help';
  }

  /**
   * Handle image error
   */
  onImageError(event: any): void {
    event.target.src = '/assets/images/default-avatar.png';
  }

  /**
   * Open add player dialog
   */
  openAddPlayerDialog(): void {
    this.router.navigate(['/players/create']);
  }

  /**
   * View player details
   */
  viewPlayer(player: Player): void {
    this.router.navigate(['/players', player.id]);
  }

  /**
   * Edit player
   */
  editPlayer(player: Player): void {
    this.router.navigate(['/players', player.id, 'edit']);
  }

  /**
   * View player statistics
   */
  viewStats(player: Player): void {
    this.router.navigate(['/players', player.id, 'stats']);
  }

  /**
   * Delete player
   */
  deletePlayer(player: Player): void {
    const dialogData: ConfirmDialogData = {
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete player ${player.firstName} ${player.lastName}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px', // Or any other appropriate width
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true; // Optional: show loading indicator during delete
        this.apiService.deletePlayer(player.id).subscribe({
          next: () => {
            this.loading = false;
            this.snackBar.open('Player deleted successfully!', 'Fermer', {
              duration: 3000
            });
            // Reload current page data and update stats
            this.loadPlayers();
          },
          error: (error) => {
            this.loading = false;
            console.error('Error deleting player:', error);
            this.snackBar.open('Error deleting player. Please try again.', 'Fermer', { // Corrected message
              duration: 3000
            });
          }
        });
      }
    });
  }
}
