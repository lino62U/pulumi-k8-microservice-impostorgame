
export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  role: 'CREWMATE' | 'IMPOSTOR' | 'SPECTATOR' | null;
  word: string | null;
}

export type Theme = {
  type: 'CUSTOM' | 'PREDEFINED';
  value: string; 
};

export interface RoomSettings {
  maxPlayers: number;
  impostorCount: number;
  isPrivate: boolean;
  password?: string;
  theme: Theme;
}

export interface Room {
  id: string;
  name:string;
  players: Player[];
  settings: RoomSettings;
  gamePhase: 'LOBBY' | 'IN_GAME' | 'FINISHED';
}