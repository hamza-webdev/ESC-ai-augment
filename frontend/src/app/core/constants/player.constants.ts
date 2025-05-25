import { PlayerPosition, PlayerStatus } from '../models/player.model'; // Assuming PlayerPosition and PlayerStatus types are defined here

export const PLAYER_POSITIONS: { value: PlayerPosition | string; label: string }[] = [
  { value: 'GK', label: 'Gardien (GK)' },
  { value: 'CB', label: 'Défenseur Central (CB)' },
  { value: 'LB', label: 'Latéral Gauche (LB)' },
  { value: 'RB', label: 'Latéral Droit (RB)' },
  { value: 'CDM', label: 'Milieu Défensif (CDM)' },
  { value: 'CM', label: 'Milieu Central (CM)' },
  { value: 'CAM', label: 'Milieu Offensif (CAM)' },
  { value: 'LM', label: 'Milieu Gauche (LM)' },
  { value: 'RM', label: 'Milieu Droit (RM)' },
  { value: 'LW', label: 'Ailier Gauche (LW)' },
  { value: 'RW', label: 'Ailier Droit (RW)' },
  { value: 'CF', label: 'Avant-Centre (CF)' },
  { value: 'ST', label: 'Buteur (ST)' }
  // Broader categories that were in the component previously.
  // If the backend filters by these, keep them. Otherwise, use specific ones.
  // For now, I'm assuming the backend can handle specific positions.
  // { value: 'DEF', label: 'Défenseur (Générique)' },
  // { value: 'MID', label: 'Milieu (Générique)' },
  // { value: 'ATT', label: 'Attaquant (Générique)' }
];

// Using "PLAYER_STATUSES_DETTAGLIATI" as per the diff, consider renaming to PLAYER_STATUSES
export const PLAYER_STATUSES_DETTAGLIATI: { value: PlayerStatus; label: string }[] = [
  { value: 'active', label: 'Actif' },
  { value: 'injured', label: 'Blessé' },
  { value: 'suspended', label: 'Suspendu' },
  { value: 'loaned', label: 'En Prêt' },
  { value: 'retired', label: 'Retraité' }
  // 'inactive' was used in the HTML filter, but 'loaned' or 'retired' from PlayerStatus model might be more accurate.
  // If 'inactive' is a distinct, valid status on the backend, add it to PlayerStatus model and here.
  // For now, sticking to the PlayerStatus model definition.
];

export const PLAYER_AGE_RANGES: { value: string; label: string }[] = [
    { value: '16-20', label: '16-20 ans' },
    { value: '21-25', label: '21-25 ans' },
    { value: '26-30', label: '26-30 ans' },
    { value: '31+', label: '31+ ans' }
];

export const PLAYER_PREFERRED_FEET: { value: PreferredFoot; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'both', label: 'Both' }
];
