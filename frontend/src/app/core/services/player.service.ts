import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from './api.service';
import { Player, PlayerFormData, PlayerPosition, PlayerStatus, PreferredFoot } from '../models/player.model';
import { UserBasic } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  constructor(private apiService: ApiService) { }

  getPlayerById(id: number): Observable<Player> {
    return this.apiService.getPlayer(id);
  }

  createPlayer(playerData: PlayerFormData): Observable<Player> {
    // The ApiService.createPlayer expects Partial<Player>.
    // PlayerFormData is already largely compatible.
    // Ensure date fields are correctly formatted if necessary, though backend should handle ISO strings.
    return this.apiService.createPlayer(playerData as Partial<Player>);
  }

  updatePlayer(id: number, playerData: PlayerFormData): Observable<Player> {
    // ApiService.updatePlayer expects Partial<Player>.
    return this.apiService.updatePlayer(id, playerData as Partial<Player>);
  }

  getAssignableUsers(): Observable<UserBasic[]> {
    return this.apiService.getAssignableUsers();
  }

  // It might be useful to also expose methods for fetching enums if they are dynamic
  // For now, assuming enums for position, status, preferred_foot are hardcoded in the form component
  // or fetched via a different mechanism if needed.
  // Example:
  // getPlayerPositions(): Observable<PlayerPosition[]> {
  //   // This would typically call an endpoint like /players/positions
  //   // return this.apiService.get('/players/positions');
  //   // For now, returning a hardcoded list as an example if not from API
  //   return new Observable(observer => {
  //     observer.next(['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'CF', 'ST']);
  //     observer.complete();
  //   });
  // }

  // getPlayerStatusValues(): Observable<PlayerStatus[]> {
  //   return new Observable(observer => {
  //     observer.next(['active', 'injured', 'suspended', 'loaned', 'retired']);
  //     observer.complete();
  //   });
  // }

  // getPreferredFootValues(): Observable<PreferredFoot[]> {
  //   return new Observable(observer => {
  //     observer.next(['left', 'right', 'both']);
  //     observer.complete();
  //   });
  // }
}
