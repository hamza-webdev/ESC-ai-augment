import { Routes } from '@angular/router';

export const matchesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./matches-list/matches-list.component').then(m => m.MatchesListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./match-form/match-form.component').then(m => m.MatchFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./match-detail/match-detail.component').then(m => m.MatchDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./match-form/match-form.component').then(m => m.MatchFormComponent)
  },
  {
    path: 'calendar', // New route for the calendar view
    loadComponent: () => import('./match-calendar/match-calendar.component').then(m => m.MatchCalendarComponent)
  }
];
