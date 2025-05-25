// This file will host models that were previously in user.model.ts and are not User or Player
// For a larger application, each of these (Match, Training, etc.) might have their own file.

import { Player, PlayerPosition, PlayerStatus, PreferredFoot } from './player.model'; // For PlayerStats.player_name context if needed
import { User } from './user.model'; // For author_name context etc.
// Match, CompetitionType, MatchResult are now in match.model.ts
// Training, TrainingType, TrainingIntensity, FieldCondition are now in training.model.ts


// Enums previously in user.model.ts, now here if they belong to these domains
// Match related Enums are moved to match.model.ts
// Training related Enums are moved to training.model.ts
// EffortLevel is moved to training.model.ts

export type TransactionType = 'income' | 'expense';
export type FinanceCategory =
  'sponsorship' | 'ticket_sales' | 'merchandise' | 'transfer_fee' | 'prize_money' | 'donation' | 'membership_fee' | 'other_income' |
  'salary' | 'equipment' | 'travel' | 'facility' | 'medical' | 'training' | 'transfer_fee_out' | 'utilities' | 'insurance' | 'other_expense';
export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'check' | 'card' | 'other';
export type NewsCategory = 'match_report' | 'transfer' | 'training' | 'announcement' | 'interview' | 'injury_update' | 'club_news' | 'community' | 'achievement' | 'other';


// Match interface is now in match.model.ts
// Training interface is now in training.model.ts
// TrainingAttendance interface is now in training.model.ts

export interface PlayerStats {
  id: number;
  player_id: number;
  player_name?: string; // Denormalized from Player/User
  match_id: number; // Reference to Match ID
  minutes_played: number;
  started: boolean;
  substituted_in?: number;
  substituted_out?: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  shots?: number;
  shots_on_target?: number;
  shot_accuracy?: number; // Derived
  passes_completed?: number;
  passes_attempted?: number;
  pass_accuracy?: number; // Derived
  tackles?: number;
  interceptions?: number;
  fouls_committed?: number;
  fouls_suffered?: number;
  performance_rating?: number;
  notes?: string;
}


export interface TrainingAttendance { // This model still exists here or could be moved with Training if preferred
  id: number;
  training_id: number; // Reference to Training ID
  player_id: number;
  player_name?: string; // Denormalized
  attended: boolean;
  status?: string; // e.g. 'Present', 'Excused', 'Absent'
  excuse?: string;
  late_arrival?: boolean;
  early_departure?: boolean;
  effort_level?: EffortLevel;
  performance_rating?: number;
  notes?: string;
  created_at?: string; // ISO DateTime string
}

export interface Finance {
  id: number;
  type: TransactionType;
  category: FinanceCategory;
  amount: number;
  signed_amount?: number; // Derived: amount with sign based on type
  currency: string; // e.g. 'USD', 'EUR'
  title: string;
  description?: string;
  transaction_date: string; // ISO Date string
  due_date?: string; // ISO Date string
  status: TransactionStatus;
  is_pending?: boolean; // Derived
  is_approved?: boolean; // Derived
  is_overdue?: boolean; // Derived
  approval_date?: string; // ISO Date string
  is_recurring: boolean;
  recurring_frequency?: RecurringFrequency;
  next_occurrence?: string; // ISO Date string
  notes?: string;
  created_at?: string; // ISO DateTime string
  reference_number?: string;
  payment_method?: PaymentMethod;
  bank_account?: string;
  receipt_number?: string;
  created_by?: number; // User ID
  approved_by?: number; // User ID
  creator_name?: string; // Denormalized
  approver_name?: string; // Denormalized
  player_name?: string; // Denormalized, if related to a player transaction
  match_info?: string; // Denormalized, if related to a match
}

export interface News {
  id: number;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  category: NewsCategory;
  author_name?: string; // Denormalized from User
  author_id?: number; // User ID
  published: boolean;
  is_published?: boolean; // Derived
  published_at?: string; // ISO DateTime string
  featured_image?: string; // URL
  video_url?: string; // URL
  views_count?: number;
  likes_count?: number;
  reading_time?: number; // in minutes
  is_featured?: boolean;
  is_breaking?: boolean;
  priority?: number;
  tags?: string[];
  created_at?: string; // ISO DateTime string
  updated_at?: string; // ISO DateTime string
  related_match?: { // This is a simplified structure for linking, not the full Match model
    id: number;
    opponent: string;
    date: string;
  };
  related_player?: {
    id: number;
    name: string; // player full_name
    position: PlayerPosition;
  };
}
