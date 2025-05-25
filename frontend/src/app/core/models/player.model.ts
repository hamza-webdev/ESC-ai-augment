// Enums specific to Player
export type PlayerPosition = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM' | 'LW' | 'RW' | 'CF' | 'ST';
export type PreferredFoot = 'left' | 'right' | 'both';
export type PlayerStatus = 'active' | 'injured' | 'suspended' | 'loaned' | 'retired';

export interface Player {
  id: number;
  user_id: number; // Foreign key to User model
  full_name?: string; // Should be derived from associated User, backend provides it
  jersey_number?: number;
  position: PlayerPosition;
  // age?: number; // This is often calculated on the backend or dynamically on frontend
  birth_date: string; // ISO date string
  nationality: string;
  height?: number; // in cm
  weight?: number; // in kg
  preferred_foot?: PreferredFoot; // Optional, might have a default
  status: PlayerStatus;
  rating?: number; // Optional, might be calculated
  joined_date?: string; // ISO date string, backend might set default
  contract_active?: boolean; // Derived property
  is_available?: boolean; // Derived property

  // Contract and status information
  contract_start?: string; // ISO date string
  contract_end?: string; // ISO date string
  salary?: number; // Assuming numeric, adjust if it's a string with currency

  // Performance metrics - usually not part of a create/edit form directly
  market_value?: number;

  // Medical information - can be part of an extended form
  blood_type?: string;
  medical_notes?: string;

  // Contact information - usually part of User or specific emergency contact fields
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  address?: string; // Could be part of User model

  // Fields from User model that might be used in player context (denormalized or for display)
  // These are based on the previous user.model.ts having Player include User fields
  // It's better if the API returns these nested under a user_account object if needed
  // For the form, we primarily need user_id.
  // The `PlayersListComponent` used `player.avatar`, `player.firstName`, `player.lastName`.
  // This implies the backend /players endpoint is already denormalizing some User fields into the Player object.
  avatar?: string; // from associated User
  // firstName?: string; // from associated User - covered by full_name
  // lastName?: string; // from associated User - covered by full_name
  // nickname?: string; // from associated User? Or custom player nickname field?
  dateOfBirth?: string; // This was in PlayersListComponent, seems redundant with birth_date
}

// For the Player Form, we might need a slightly different interface for creation/update
export interface PlayerFormData {
  user_id: number;
  jersey_number?: number | null;
  position: PlayerPosition;
  birth_date: string; // ISO string
  nationality: string;
  height?: number | null;
  weight?: number | null;
  preferred_foot?: PreferredFoot | null;
  status: PlayerStatus;
  // contract details
  contract_start?: string | null;
  contract_end?: string | null;
  salary?: number | null;
  // Optional fields from Player interface
  blood_type?: string | null;
  medical_notes?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  address?: string | null;
  // avatar is NOT part of Player entity, it's part of User.
  // We won't manage user's avatar through player form directly unless specified.
}
