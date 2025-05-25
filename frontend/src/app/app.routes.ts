import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Redirect root to dashboard
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },

  // Auth routes (no guard needed)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },

  // Protected routes
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'players',
    loadChildren: () => import('./features/players/players.routes').then(m => m.playersRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'matches',
    loadChildren: () => import('./features/matches/matches.routes').then(m => m.matchesRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'news',
    loadChildren: () => import('./features/news/news.routes').then(m => m.newsRoutes),
    canActivate: [authGuard]
  },

  // Wildcard route - must be last
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
