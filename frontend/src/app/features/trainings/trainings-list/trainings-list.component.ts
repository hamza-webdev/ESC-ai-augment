import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips'; // For status display
import { MatMenuModule } from '@angular/material/menu'; // For actions menu if needed
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { Subject, Subscription, merge, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith, switchMap, catchError, map, tap } from 'rxjs/operators';

import { TrainingService } from '../../../core/services/training.service';
import { Training, TRAINING_TYPES, TrainingType, TRAINING_INTENSITIES, TrainingIntensity } from '../../../core/models/training.model';
import { PaginatedResponse } from '../../../core/models/api-interfaces.model';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-trainings-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
  templateUrl: './trainings-list.component.html',
  styleUrls: ['./trainings-list.component.scss']
})
export class TrainingsListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['title', 'date', 'time', 'location', 'type', 'intensity', 'status', 'actions'];
  dataSource = new MatTableDataSource<Training>([]);

  isLoading = true;
  totalCount = 0;
  pageSize = 10;
  currentPage = 0;

  filterForm!: FormGroup;
  private filterChangeSubscription!: Subscription;

  // For filter dropdowns
  trainingTypes = TRAINING_TYPES;
  trainingIntensities = TRAINING_INTENSITIES;
  // Example: if you want to filter by completion status
  completionStatuses = [
    { value: 'true', label: 'Completed' },
    { value: 'false', label: 'Upcoming/Pending' }
  ];
  // Years for date range filtering (optional)
  years: number[] = this.generateYearList();


  constructor(
    private trainingService: TrainingService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      search: [''], // For title, location
      type: [''],
      intensity: [''],
      status: [''], // 'completed', 'upcoming', 'today' (derived)
      // date_from: [''], // Optional: for date range
      // date_to: ['']    // Optional: for date range
      year: [''] // Simpler year filter for now
    });
  }

  ngAfterViewInit(): void {
    // Initial sort
    this.sort.active = 'date';
    this.sort.direction = 'desc';

    this.filterChangeSubscription = merge(this.sort.sortChange, this.paginator.page, this.filterForm.valueChanges.pipe(debounceTime(400), distinctUntilChanged()))
      .pipe(
        startWith({}),
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
            type: filters.type || null,
            intensity: filters.intensity || null,
            // Backend needs to support 'status' (completed, upcoming, today) or date range
            // For now, 'status' might be client-side or need specific backend logic
            completed: filters.status === 'completed' ? true : (filters.status === 'upcoming' ? false : null),
            // year: filters.year || null // If backend supports year filtering
          };
           if (filters.year) {
            params.year = filters.year;
           }


          Object.keys(params).forEach(key => {
            if (params[key] === null || params[key] === '' || params[key] === undefined) delete params[key];
          });

          return this.trainingService.getTrainings(params).pipe(
            catchError(err => {
              this.isLoading = false;
              this.snackBar.open(`Error loading training sessions: ${err.message}`, 'Close', { duration: 5000 });
              return of({ items: [], total: 0, page: 1, per_page: this.pageSize } as PaginatedResponse<Training>);
            })
          );
        }),
        map(response => {
          this.isLoading = false;
          this.totalCount = response.total;
          return response.items;
        })
      ).subscribe(trainings => {
        this.dataSource.data = trainings;
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
    for (let year = currentYear + 1; year >= currentYear - 3; year--) {
      years.push(year);
    }
    return years;
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', type: '', intensity: '', status: '', year: '' });
  }

  getTrainingDisplayStatus(training: Training): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Compare dates only
    const trainingDate = new Date(training.date);
    trainingDate.setHours(0,0,0,0);


    if (training.completed) {
      return 'Completed';
    } else if (trainingDate < today) {
      return 'Pending (Past)'; // Past but not marked completed
    } else if (trainingDate.getTime() === today.getTime()) {
      return 'Today';
    } else {
      return 'Upcoming';
    }
  }
  
  getTrainingTime(training: Training): string {
    if (!training.start_time || !training.end_time) return 'N/A';
    // Assuming start_time and end_time are HH:mm strings
    return `${training.start_time} - ${training.end_time}`;
  }


  createTraining(): void {
    this.router.navigate(['/trainings/create']);
  }

  viewTrainingDetails(training: Training): void {
    this.router.navigate(['/trainings', training.id]); // Navigate to detail view
  }

  editTraining(training: Training): void {
    this.router.navigate(['/trainings', training.id, 'edit']);
  }

  deleteTraining(training: Training): void {
    const dialogData: ConfirmDialogData = {
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete the training session "${training.title}" on ${this.datePipe.transform(training.date, 'mediumDate')}?`,
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
        this.trainingService.deleteTraining(training.id).subscribe({
          next: () => {
            this.snackBar.open('Training session deleted successfully!', 'Close', { duration: 3000 });
            this.triggerDataLoad(); 
          },
          error: (err) => {
            this.isLoading = false;
            this.snackBar.open(`Error deleting training session: ${err.message}`, 'Close', { duration: 5000 });
          }
        });
      }
    });
  }
  
  triggerDataLoad(): void {
    const currentFilters = this.filterForm.value;
    this.filterForm.setValue(currentFilters, { emitEvent: true });
    this.isLoading = true;
  }
}
