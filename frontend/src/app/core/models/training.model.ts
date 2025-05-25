// Enums specific to Training
export type TrainingType = 'technical' | 'physical' | 'tactical' | 'recovery' | 'friendly_match' | 'other';
export type TrainingIntensity = 'low' | 'medium' | 'high';
export type FieldCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'unplayable';

export interface Training {
  id: number;
  title: string;
  date: string; // ISO Date string (YYYY-MM-DD) from backend
  start_time: string; // HH:mm or HH:mm:ss string from backend
  end_time: string; // HH:mm or HH:mm:ss string from backend
  location: string;
  type: TrainingType;
  intensity: TrainingIntensity;
  objectives?: string | null;
  description?: string | null;
  exercises?: string | null; // Simple textarea as confirmed
  equipment_needed?: string | null;
  weather?: string | null;
  temperature?: number | null; // in Celsius
  field_condition?: FieldCondition | null;
  completed: boolean;
  notes?: string | null;
  coach_feedback?: string | null;

  // Read-only fields from backend if available
  readonly duration_minutes?: number;
  readonly created_at?: string; // ISO DateTime string
  readonly updated_at?: string; // ISO DateTime string
  // Attendance related fields are not part of this form
}

// Interface for the form data, handling date and time separately for input
export interface TrainingFormData {
  title: string;
  training_date: string; // YYYY-MM-DD from date picker
  start_time: string; // HH:mm from time input
  end_time: string; // HH:mm from time input
  location: string;
  type: TrainingType;
  intensity: TrainingIntensity;
  objectives?: string | null;
  description?: string | null;
  exercises?: string | null;
  equipment_needed?: string | null;
  weather?: string | null;
  temperature?: number | null;
  field_condition?: FieldCondition | null;
  completed: boolean; // Default to false for new trainings
  notes?: string | null;
  coach_feedback?: string | null;
}

// Constants for dropdowns
export const TRAINING_TYPES: { value: TrainingType; label: string }[] = [
  { value: 'technical', label: 'Technical' },
  { value: 'physical', label: 'Physical Conditioning' },
  { value: 'tactical', label: 'Tactical Session' },
  { value: 'recovery', label: 'Recovery Session' },
  { value: 'friendly_match', label: 'Friendly Match' },
  { value: 'other', label: 'Other' }
];

export const TRAINING_INTENSITIES: { value: TrainingIntensity; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

export const FIELD_CONDITIONS: { value: FieldCondition; label: string }[] = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'unplayable', label: 'Unplayable' }
];

// --- Training Attendance ---
export type EffortLevel = 'poor' | 'fair' | 'good' | 'excellent'; // Could be 1-5 scale too

export interface TrainingAttendance {
  id?: number; // Optional if creating new records that don't have an ID yet
  training_id: number;
  player_id: number; // Corresponds to User.id if players are users
  player_name?: string; // Denormalized, for display
  attended: boolean;
  excuse?: string | null;
  late_arrival?: boolean | null;
  early_departure?: boolean | null;
  effort_level?: EffortLevel | null;
  performance_rating?: number | null; // e.g., 1-10 scale
  notes?: string | null;
  created_at?: string; // ISO DateTime string
  updated_at?: string; // ISO DateTime string
}

// For form data, slightly different structure might be needed, or can reuse TrainingAttendance directly
// This interface is for submitting attendance data.
export interface TrainingAttendanceData {
  player_id: number;
  attended: boolean;
  excuse?: string | null;
  late_arrival?: boolean | null;
  early_departure?: boolean | null;
  effort_level?: EffortLevel | null;
  performance_rating?: number | null;
  notes?: string | null;
}

export const EFFORT_LEVELS: { value: EffortLevel; label: string }[] = [
  { value: 'poor', label: 'Poor' },
  { value: 'fair', label: 'Fair' },
  { value: 'good', label: 'Good' },
  { value: 'excellent', label: 'Excellent' }
];
