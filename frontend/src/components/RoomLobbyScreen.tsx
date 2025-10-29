
import React, { useEffect, useState } from 'react';
import { Room, RoomSettings, Player } from '../types';
import { UserGroupIcon, ArrowLeftOnRectangleIcon } from './icons';
import { FOOTBALL_PLAYERS } from '../constants';

interface RoomLobbyScreenProps {
  room: Room;
  meId: string | undefined;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onUpdateSettings: (settings: Partial<RoomSettings>) => void;
  onToggleReady: () => void;
}

const RoomLobbyScreen: React.FC<RoomLobbyScreenProps> = ({ room, meId, onStartGame, onLeaveRoom, onUpdateSettings, onToggleReady }) => {
  const [allReady, setAllReady] = useState(false);
  
  const me = room.players.find(p => p.id === meId);
  const isHost = me?.isHost ?? false;

  const [themeType, setThemeType] = useState(room.settings.theme.type);
  const [customTheme, setCustomTheme] = useState(room.settings.theme.type === 'CUSTOM' ? room.settings.theme.value : '');

  useEffect(() => {
    const nonHostPlayers = room.players.filter(p => !p.isHost);
    const minPlayersMet = room.players.length >= 3;
    const allNonHostsReady = nonHostPlayers.length > 0 && nonHostPlayers.every(p => p.isReady);
    setAllReady(minPlayersMet && allNonHostsReady);
  }, [room.players]);
  
  useEffect(() => {
    if (isHost) {
      const newThemeValue = themeType === 'CUSTOM' ? customTheme : 'Football Players';
      if (room.settings.theme.type !== themeType || room.settings.theme.value !== newThemeValue) {
        onUpdateSettings({
            theme: {
                type: themeType,
                value: newThemeValue
            }
        });
      }
    }
  }, [themeType, customTheme, isHost, onUpdateSettings, room.settings.theme]);

  const playerGridCols = `grid-cols-${Math.min(Math.ceil(room.settings.maxPlayers / 2), 6)}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-5xl bg-slate-800/50 border border-slate-700 rounded-2xl shadow-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">{room.name}</h1>
            <p className="text-slate-400">Room Code: <span className="font-mono bg-slate-700 px-2 py-1 rounded">{room.id}</span></p>
          </div>
          <button onClick={() => onLeaveRoom(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 bg-slate-700 rounded-lg hover:bg-red-500/80 hover:text-white transition-colors">
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            Leave
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-slate-300">Players ({room.players.length}/{room.settings.maxPlayers})</h2>
            <div className={`grid ${playerGridCols} gap-4`}>
              {room.players.map(player => (
                <div key={player.id} className="flex flex-col items-center p-3 bg-slate-700/50 rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-2xl font-bold mb-2">
                    {player.name.charAt(0)}
                  </div>
                  <p className="font-semibold text-center truncate w-full">{player.name}</p>
                  <p className={`text-xs ${player.isHost ? 'text-amber-400' : 'text-slate-400'}`}>{player.isHost ? 'Host' : 'Player'}</p>
                  <div className={`mt-2 w-full text-center py-1 rounded-full text-xs ${player.isReady ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/50 text-slate-400'}`}>
                    {player.isReady ? 'Ready' : 'Waiting...'}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {isHost ? (
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 text-slate-300">Game Settings</h2>
                <div className="space-y-4">
                  <div>
                      <p className="mb-2 text-slate-400">Theme</p>
                      <div className="flex gap-2">
                          <button onClick={() => setThemeType('PREDEFINED')} className={`flex-1 py-2 text-sm rounded-lg ${themeType === 'PREDEFINED' ? 'bg-cyan-500' : 'bg-slate-700 hover:bg-slate-600'} transition-colors`}>Predefined</button>
                          <button onClick={() => setThemeType('CUSTOM')} className={`flex-1 py-2 text-sm rounded-lg ${themeType === 'CUSTOM' ? 'bg-cyan-500' : 'bg-slate-700 hover:bg-slate-600'} transition-colors`}>Custom</button>
                      </div>
                      {themeType === 'PREDEFINED' && <p className="text-xs text-slate-400 mt-2">Topic: {FOOTBALL_PLAYERS.length} Football Players</p>}
                      {themeType === 'CUSTOM' && <input type="text" placeholder="Enter a word" value={customTheme} onChange={(e) => setCustomTheme(e.target.value)} className="mt-2 w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />}
                      {themeType === 'CUSTOM' && <p className="text-xs text-slate-400 mt-1">As host, you will be a spectator.</p>}
                  </div>
                  <div className="text-sm flex justify-between text-slate-400 pt-2 border-t border-slate-700"><span>Impostors:</span> <span className="font-semibold text-white">{room.settings.impostorCount}</span></div>
                  <div className="text-sm flex justify-between text-slate-400"><span>Max Players:</span> <span className="font-semibold text-white">{room.settings.maxPlayers}</span></div>
                  <div className="text-sm flex justify-between text-slate-400"><span>Privacy:</span> <span className="font-semibold text-white">{room.settings.isPrivate ? 'Private' : 'Public'}</span></div>
                </div>
              <button
                onClick={onStartGame}
                disabled={!allReady}
                className="mt-8 w-full py-3 font-bold text-xl rounded-lg bg-gradient-to-r from-green-500 to-teal-500 text-white transition-all transform hover:scale-105 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed disabled:scale-100"
              >
                {allReady ? 'Start Game' : 'Waiting for Players...'}
              </button>
            </div>
          ) : (
             <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700 flex flex-col justify-between">
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-slate-300">Game Info</h2>
                    <div className="space-y-3 text-slate-400">
                        <div className="flex justify-between"><span>Theme:</span> <span className="font-semibold text-white">{room.settings.theme.value}</span></div>
                        <div className="flex justify-between"><span>Impostors:</span> <span className="font-semibold text-white">{room.settings.impostorCount}</span></div>
                        <div className="flex justify-between"><span>Players:</span> <span className="font-semibold text-white">{room.settings.maxPlayers}</span></div>
                        <div className="flex justify-between"><span>Privacy:</span> <span className="font-semibold text-white">{room.settings.isPrivate ? 'Private' : 'Public'}</span></div>
                    </div>
                </div>
                <button
                    onClick={onToggleReady}
                    className={`mt-8 w-full py-3 font-bold text-xl rounded-lg transition-all transform hover:scale-105 ${
                        me?.isReady 
                        ? 'bg-slate-600 hover:bg-slate-500 text-slate-300' 
                        : 'bg-gradient-to-r from-green-500 to-teal-500 text-white'
                    }`}
                >
                    {me?.isReady ? 'Ready!' : 'Click to Ready'}
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomLobbyScreen;