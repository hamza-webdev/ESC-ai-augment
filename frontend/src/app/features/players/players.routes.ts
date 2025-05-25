import { Routes } from '@angular/router';

export const playersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./players-list/players-list.component').then(m => m.PlayersListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./player-form/player-form.component').then(m => m.PlayerFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./player-detail/player-detail.component').then(m => m.PlayerDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./player-form/player-form.component').then(m => m.PlayerFormComponent)
  }
];
