export interface User {
  id: number;
  username: string;
  email?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  avatar?: string;
  phone?: string;
  created_at?: string;
  last_login?: string;
  player_profile?: Player;
}

export interface Player {
  id: number;
  user_id: number;
  full_name: string;
  jersey_number?: number;
  position: PlayerPosition;
  age: number;
  birth_date: string;
  nationality: string;
  height?: number;
  weight?: number;
  preferred_foot: PreferredFoot;
  status: PlayerStatus;
  rating: number;
  joined_date: string;
  contract_active: boolean;
  is_available: boolean;
  salary?: number;
  market_value?: number;
  contract_start?: string;
  contract_end?: string;
  blood_type?: string;
  medical_notes?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  address?: string;
}

export interface Match {
  id: number;
  opponent: string;
  date: string;
  location: string;
  is_home: boolean;
  home_away: string;
  competition: CompetitionType;
  goals_for?: number;
  goals_against?: number;
  score: string;
  result: MatchResult;
  is_finished: boolean;
  is_upcoming: boolean;
  attendance?: number;
  referee?: string;
  weather?: string;
  temperature?: number;
  match_report?: string;
  created_at: string;
  team_stats?: TeamStats;
  goalscorers?: PlayerStats[];
}

export interface PlayerStats {
  id: number;
  player_id: number;
  player_name: string;
  match_id: number;
  minutes_played: number;
  started: boolean;
  substituted_in?: number;
  substituted_out?: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  shots: number;
  shots_on_target: number;
  shot_accuracy: number;
  passes_completed: number;
  passes_attempted: number;
  pass_accuracy: number;
  tackles: number;
  interceptions: number;
  fouls_committed: number;
  fouls_suffered: number;
  performance_rating?: number;
  notes?: string;
}

export interface Training {
  id: number;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  location: string;
  type: TrainingType;
  intensity: TrainingIntensity;
  objectives?: string;
  description?: string;
  equipment_needed?: string;
  weather?: string;
  temperature?: number;
  field_condition?: FieldCondition;
  completed: boolean;
  notes?: string;
  coach_feedback?: string;
  is_upcoming: boolean;
  is_today: boolean;
  attendance_count: number;
  total_invited: number;
  attendance_rate: number;
  created_at: string;
  attendees?: TrainingAttendance[];
  absentees?: TrainingAttendance[];
}

export interface TrainingAttendance {
  id: number;
  training_id: number;
  player_id: number;
  player_name: string;
  attended: boolean;
  status: string;
  excuse?: string;
  late_arrival: boolean;
  early_departure: boolean;
  effort_level?: EffortLevel;
  performance_rating?: number;
  notes?: string;
  created_at: string;
}

export interface Finance {
  id: number;
  type: TransactionType;
  category: FinanceCategory;
  amount: number;
  signed_amount: number;
  currency: string;
  title: string;
  description?: string;
  transaction_date: string;
  due_date?: string;
  status: TransactionStatus;
  is_pending: boolean;
  is_approved: boolean;
  is_overdue: boolean;
  approval_date?: string;
  is_recurring: boolean;
  recurring_frequency?: RecurringFrequency;
  next_occurrence?: string;
  notes?: string;
  created_at: string;
  reference_number?: string;
  payment_method?: PaymentMethod;
  bank_account?: string;
  receipt_number?: string;
  created_by?: number;
  approved_by?: number;
  creator_name?: string;
  approver_name?: string;
  player_name?: string;
  match_info?: string;
}

export interface News {
  id: number;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  category: NewsCategory;
  author_name: string;
  published: boolean;
  is_published: boolean;
  published_at?: string;
  featured_image?: string;
  video_url?: string;
  views_count: number;
  likes_count: number;
  reading_time: number;
  is_featured: boolean;
  is_breaking: boolean;
  priority: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  related_match?: {
    id: number;
    opponent: string;
    date: string;
  };
  related_player?: {
    id: number;
    name: string;
    position: string;
  };
}

// Enums
export type UserRole = 'admin' | 'coach' | 'player' | 'staff' | 'supporter';

export type PlayerPosition = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM' | 'LW' | 'RW' | 'CF' | 'ST';

export type PreferredFoot = 'left' | 'right' | 'both';

export type PlayerStatus = 'active' | 'injured' | 'suspended' | 'loaned' | 'retired';

export type CompetitionType = 'league' | 'cup' | 'friendly' | 'playoff';

export type MatchResult = 'win' | 'draw' | 'loss' | 'pending';

export type TrainingType = 'technical' | 'physical' | 'tactical' | 'recovery' | 'friendly';

export type TrainingIntensity = 'low' | 'medium' | 'high';

export type FieldCondition = 'excellent' | 'good' | 'fair' | 'poor';

export type EffortLevel = 'poor' | 'fair' | 'good' | 'excellent';

export type TransactionType = 'income' | 'expense';

export type FinanceCategory = 
  // Income categories
  'sponsorship' | 'ticket_sales' | 'merchandise' | 'transfer_fee' | 'prize_money' | 'donation' | 'membership_fee' | 'other_income' |
  // Expense categories
  'salary' | 'equipment' | 'travel' | 'facility' | 'medical' | 'training' | 'transfer_fee_out' | 'utilities' | 'insurance' | 'other_expense';

export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'check' | 'card' | 'other';

export type NewsCategory = 'match_report' | 'transfer' | 'training' | 'announcement' | 'interview' | 'injury_update' | 'club_news' | 'community' | 'achievement' | 'other';

// API Response interfaces
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  errors?: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    total: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface TeamStats {
  total_goals: number;
  total_assists: number;
  total_yellow_cards: number;
  total_red_cards: number;
  players_used: number;
}
