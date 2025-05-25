import { Player } from './player.model'; // Import Player model

// Enum specific to User
export type UserRole = 'admin' | 'coach' | 'player' | 'staff' | 'supporter';

export interface User {
  id: number;
  username: string;
  email?: string; // Optional as it might be hidden for privacy
  first_name: string;
  last_name: string;
  full_name?: string; // Often derived, backend might provide it
  role: UserRole;
  is_active: boolean;
  avatar?: string; // URL to avatar image
  phone?: string; // Optional
  created_at?: string; // ISO date string
  last_login?: string; // ISO date string

  // Relationship: A user might have a player profile
  player_profile?: Player; // This links to the Player model
}

// Minimal User interface for cases where only basic info is needed (e.g., dropdowns)
export interface UserBasic {
  id: number;
  username: string;
  full_name?: string; // Construct from first_name, last_name if available
  first_name?: string;
  last_name?: string;
}
