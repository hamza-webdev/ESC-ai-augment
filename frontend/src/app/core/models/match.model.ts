// Enums specific to Match
export type CompetitionType = 'league' | 'cup' | 'friendly' | 'playoff';
export type MatchResult = 'win' | 'draw' | 'loss' | 'pending'; // Or 'scheduled', 'postponed', 'cancelled'

export interface Match {
  id: number;
  opponent: string;
  date: string; // ISO DateTime string (e.g., "YYYY-MM-DDTHH:mm:ssZ" or "YYYY-MM-DD HH:mm:ss")
  location: string;
  is_home: boolean;
  competition: CompetitionType;

  // Optional pre-match details
  referee?: string | null;
  weather?: string | null;
  temperature?: number | null; // in Celsius

  // Post-match details (all optional initially)
  goals_for?: number | null;
  goals_against?: number | null;
  result?: MatchResult | null; // Should be set based on goals_for and goals_against by backend if possible
  attendance?: number | null;
  match_report?: string | null;
  highlights?: string | null; // JSON string for video/photo links

  // Read-only fields from backend, not part of form data for create/update directly
  readonly score?: string;
  readonly home_away?: string;
  readonly is_finished?: boolean;
  readonly is_upcoming?: boolean;
  readonly created_at?: string;
  // team_stats and goalscorers are complex objects, typically not part of a simple match form
}

// Interface for the form data, handling date and time separately
export interface MatchFormData {
  opponent: string;
  match_date: string; // YYYY-MM-DD from date picker
  match_time: string; // HH:mm from time input
  location: string;
  is_home: boolean;
  competition: CompetitionType;
  referee?: string | null;
  weather?: string | null;
  temperature?: number | null;
  // Post-match fields
  goals_for?: number | null;
  goals_against?: number | null;
  attendance?: number | null;
  match_report?: string | null;
  highlights?: string | null;
}

export const COMPETITION_TYPES: { value: CompetitionType; label: string }[] = [
  { value: 'league', label: 'League' },
  { value: 'cup', label: 'Cup' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'playoff', label: 'Playoff' }
];
