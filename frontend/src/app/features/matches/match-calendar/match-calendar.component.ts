import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CalendarEvent, CalendarEventAction, CalendarEventTimesChangedEvent, CalendarModule, CalendarView } from 'angular-calendar';
import { EventColor } from 'calendar-utils';
import { Subject } from 'rxjs';
import { map, finalize } from 'rxjs/operators';
import { addHours, startOfDay, endOfDay, subDays, addDays, endOfMonth, isSameDay, isSameMonth, addWeeks, subWeeks, startOfMonth, startOfWeek, endOfWeek } from 'date-fns';

import { MatchService } from '../../../core/services/match.service';
import { Match } from '../../../core/models/match.model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';


// Define colors for events (optional)
const eventColors: Record<string, EventColor> = {
  home: {
    primary: '#1e90ff', // Dodger Blue
    secondary: '#D1E8FF',
  },
  away: {
    primary: '#ad2121', // Red
    secondary: '#FAE3E3',
  },
  finished: {
    primary: '#808080', // Grey
    secondary: '#E8E8E8'
  }
};

@Component({
  selector: 'app-match-calendar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CalendarModule, // angular-calendar
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    DatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush, // Recommended for performance with angular-calendar
  templateUrl: './match-calendar.component.html',
  styleUrls: ['./match-calendar.component.scss']
})
export class MatchCalendarComponent implements OnInit {
  view: CalendarView = CalendarView.Month;
  CalendarView = CalendarView; // Make CalendarView enum available in template
  viewDate: Date = new Date();
  events: CalendarEvent<Match>[] = [];
  activeDayIsOpen: boolean = false;
  isLoading = false;

  refresh = new Subject<void>();

  constructor(
    private matchService: MatchService,
    private router: Router,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.fetchMatchesForCalendar(); // Initial fetch
  }

  fetchMatchesForCalendar(): void {
    this.isLoading = true;

    let startDate: Date;
    let endDate: Date;

    // Determine date range based on current view and viewDate
    if (this.view === CalendarView.Month) {
      startDate = startOfMonth(this.viewDate);
      endDate = endOfMonth(this.viewDate);
    } else if (this.view === CalendarView.Week) {
      startDate = startOfWeek(this.viewDate, { weekStartsOn: 1 }); // Assuming week starts on Monday
      endDate = endOfWeek(this.viewDate, { weekStartsOn: 1 });
    } else { // CalendarView.Day
      startDate = startOfDay(this.viewDate);
      endDate = endOfDay(this.viewDate);
    }

    // Format dates as YYYY-MM-DD strings for the API
    const formattedStartDate = this.datePipe.transform(startDate, 'yyyy-MM-dd');
    const formattedEndDate = this.datePipe.transform(endDate, 'yyyy-MM-dd');

    const params: any = {
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      limit: 500 // Keep a reasonable limit, backend should ideally not need it if date range is efficient
    };
    
    this.matchService.getMatches(params)
      .pipe(
        map(response => (response.items || []).map((match: Match): CalendarEvent<Match> => {
          const matchDate = new Date(match.date);
          let title = `${match.is_home ? 'ESC' : match.opponent} vs ${match.is_home ? match.opponent : 'ESC'}`;
          if (match.goals_for !== null && match.goals_against !== null) {
            title += ` (${match.goals_for}-${match.goals_against})`;
          }

          let color = match.is_home ? eventColors['home'] : eventColors['away'];
          if (match.result && match.result !== 'pending') {
            color = eventColors['finished'];
          }
          
          return {
            start: matchDate,
            title: title,
            color: color,
            allDay: false, // Matches usually have specific times
            meta: match, // Store the original match object
            // end: can be set if matches have a duration
          };
        })),
        finalize(() => this.isLoading = false)
      )
      .subscribe(calendarEvents => {
        this.events = calendarEvents;
        this.refresh.next();
      }, error => {
        console.error('Error fetching matches for calendar:', error);
        // Handle error (e.g., show a snackbar message)
      });
  }

  setView(view: CalendarView): void {
    this.view = view;
  }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
        this.viewDate = date; // Focus on the clicked day
      }
    }
  }

  eventClicked(action: string, event: CalendarEvent<Match>): void {
    if (event.meta) {
      this.router.navigate(['/matches', event.meta.id]);
    }
  }

  // Optional: Handle view date changes to fetch new data if API is period-based
  viewDateChanged(): void {
    this.activeDayIsOpen = false;
    this.fetchMatchesForCalendar(); // Fetch data for the new view date/period
    // this.refresh.next(); // refresh is called in fetchMatchesForCalendar success
  }

  // Navigation methods for the calendar header
  previousPeriod(): void {
    if (this.view === CalendarView.Month) {
      this.viewDate = subDays(startOfMonth(this.viewDate), 1);
    } else if (this.view === CalendarView.Week) {
      this.viewDate = subWeeks(this.viewDate, 1);
    } else { // Day
      this.viewDate = subDays(this.viewDate, 1);
    }
    this.viewDateChanged();
  }

  nextPeriod(): void {
    if (this.view === CalendarView.Month) {
      this.viewDate = addDays(endOfMonth(this.viewDate), 1);
    } else if (this.view === CalendarView.Week) {
      this.viewDate = addWeeks(this.viewDate, 1);
    } else { // Day
      this.viewDate = addDays(this.viewDate, 1);
    }
    this.viewDateChanged();
  }

  today(): void {
    this.viewDate = new Date();
    this.viewDateChanged();
  }
}
