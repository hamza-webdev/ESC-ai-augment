import { Routes } from '@angular/router';

export const newsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./news-list/news-list.component').then(m => m.NewsListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./news-form/news-form.component').then(m => m.NewsFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./news-detail/news-detail.component').then(m => m.NewsDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./news-form/news-form.component').then(m => m.NewsFormComponent)
  }
];
