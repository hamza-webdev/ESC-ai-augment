// Generic API Response Interfaces
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  errors?: any; // For validation errors, typically a key-value pair
}

export interface PaginatedResponse<T> {
  items: T[]; // Actual data items
  total: number; // Total number of items available on the server
  page: number; // Current page number
  per_page: number; // Items per page
  // Optional:
  pages?: number; // Total number of pages
  has_next?: boolean;
  has_prev?: boolean;
}

// Authentication related interfaces
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: any; // Should be User interface, but to avoid circular deps if User imports this
  access_token: string;
  refresh_token: string;
}

// Other specific interfaces that might be shared or are part of API responses
export interface TeamStats {
  total_goals: number;
  total_assists: number;
  total_yellow_cards: number;
  total_red_cards: number;
  players_used: number;
}

// Shared Enums (related to multiple domains or general use)

// Match related Enums (if not in a dedicated match.model.ts)
export type CompetitionType = 'league' | 'cup' | 'friendly' | 'playoff';
export type MatchResult = 'win' | 'draw' | 'loss' | 'pending';

// Training related Enums (if not in a dedicated training.model.ts)
export type TrainingType = 'technical' | 'physical' | 'tactical' | 'recovery' | 'friendly';
export type TrainingIntensity = 'low' | 'medium' | 'high';
export type FieldCondition = 'excellent' | 'good' | 'fair' | 'poor';
export type EffortLevel = 'poor' | 'fair' | 'good' | 'excellent';

// Finance related Enums (if not in a dedicated finance.model.ts)
export type TransactionType = 'income' | 'expense';
export type FinanceCategory =
  // Income categories
  'sponsorship' | 'ticket_sales' | 'merchandise' | 'transfer_fee' | 'prize_money' | 'donation' | 'membership_fee' | 'other_income' |
  // Expense categories
  'salary' | 'equipment' | 'travel' | 'facility' | 'medical' | 'training' | 'transfer_fee_out' | 'utilities' | 'insurance' | 'other_expense';
export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'check' | 'card' | 'other';

// News related Enums (if not in a dedicated news.model.ts)
export type NewsCategory = 'match_report' | 'transfer' | 'training' | 'announcement' | 'interview' | 'injury_update' | 'club_news' | 'community' | 'achievement' | 'other';
