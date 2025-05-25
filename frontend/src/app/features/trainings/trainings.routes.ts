import { Routes } from '@angular/router';

// Import components when they are created
// For now, TrainingFormComponent will be the primary one.
import { TrainingsListComponent } from './trainings-list/trainings-list.component';
import { TrainingDetailComponent } from './training-detail/training-detail.component'; // Import the detail component
import { TrainingFormComponent } from './training-form/training-form.component';

export const trainingsRoutes: Routes = [
  {
    path: '',
    component: TrainingsListComponent, // Set TrainingsListComponent as the default for this path
  },
  {
    path: 'create',
    component: TrainingFormComponent // Using component directly as it's standalone
    // loadComponent: () => import('./training-form/training-form.component').then(m => m.TrainingFormComponent) // if preferred
  },
  {
    path: ':id/edit',
    component: TrainingFormComponent
  },
  {
    path: ':id', // Route for training detail view
    component: TrainingDetailComponent
  }
];
