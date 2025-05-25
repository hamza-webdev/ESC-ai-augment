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
import { Player } from '../../../core/models/user.model';

@Component({
  selector: 'app-players-list',
  imports: [
    CommonModule,
    FormsModule,
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

  // Position options
  positions = [
    { value: 'GK', label: 'Gardien' },
    { value: 'DEF', label: 'Défenseur' },
    { value: 'MID', label: 'Milieu' },
    { value: 'ATT', label: 'Attaquant' }
  ];

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
    this.loadStatistics();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /**
   * Load players with current filters
   */
  loadPlayers(): void {
    this.loading = true;

    const params = {
      page: this.currentPage + 1,
      limit: this.pageSize,
      search: this.searchTerm,
      position: this.selectedPosition,
      status: this.selectedStatus,
      age_range: this.selectedAgeRange
    };

    // Remove empty parameters
    Object.keys(params).forEach(key => {
      if (!params[key as keyof typeof params]) {
        delete params[key as keyof typeof params];
      }
    });

    this.apiService.getPlayers(params).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalCount = response.total;
        this.loading = false;
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
  loadStatistics(): void {
    // This would typically come from a separate API endpoint
    this.apiService.getPlayers({ limit: 1000 }).subscribe({
      next: (response) => {
        const players = response.data;
        this.totalPlayers = players.length;
        this.activePlayers = players.filter(p => p.status === 'active').length;
        this.injuredPlayers = players.filter(p => p.status === 'injured').length;

        // Calculate average age
        const totalAge = players.reduce((sum, player) => {
          return sum + this.calculateAge(player.dateOfBirth);
        }, 0);
        this.averageAge = Math.round(totalAge / players.length);
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
      }
    });
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
  calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Get position label
   */
  getPositionLabel(position: string): string {
    const pos = this.positions.find(p => p.value === position);
    return pos ? pos.label : position;
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
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${player.firstName} ${player.lastName} ?`)) {
      this.apiService.deletePlayer(player.id).subscribe({
        next: () => {
          this.snackBar.open('Joueur supprimé avec succès', 'Fermer', {
            duration: 3000
          });
          this.loadPlayers();
          this.loadStatistics();
        },
        error: (error) => {
          console.error('Error deleting player:', error);
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', {
            duration: 3000
          });
        }
      });
    }
  }
}
