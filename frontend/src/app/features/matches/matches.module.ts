import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { MAT_DATE_LOCALE } from '@angular/material/core'; // For locale if needed by date-fns adapter

import { MatchesRoutingModule } from './matches-routing.module';

@NgModule({
  declarations: [
    // MatchCalendarComponent, // Not declared here if standalone
  ],
  imports: [
    CommonModule,
    MatchesRoutingModule,
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory,
      deps: [MAT_DATE_LOCALE] // Add MAT_DATE_LOCALE if your adapter factory needs it
    })
  ],
  providers: [
    // Optionally provide MAT_DATE_LOCALE here if not provided globally
    // { provide: MAT_DATE_LOCALE, useValue: 'en-US' } 
  ]
})
export class MatchesModule { }
