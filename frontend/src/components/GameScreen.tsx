
import React from 'react';
import { Room, Player } from '../types';
import { UserGroupIcon } from './icons';

interface GameScreenProps {
  room: Room;
  me: Player | undefined;
  isHost: boolean;
  onRestartGame: () => void;
  onReturnToLobby: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ room, me, isHost, onRestartGame, onReturnToLobby }) => {
  if (!me) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p>Loading your role...</p>
        </div>
    );
  }

  const isImpostor = me.role === 'IMPOSTOR';
  const isSpectator = me.role === 'SPECTATOR';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-4xl text-center">
        
        <div className={`mb-8 p-8 rounded-2xl border-2 ${isImpostor ? 'border-red-500 bg-red-900/30' : isSpectator ? 'border-amber-500 bg-amber-900/30' : 'border-cyan-500 bg-cyan-900/30'} shadow-2xl ${isImpostor ? 'shadow-red-500/20' : isSpectator ? 'shadow-amber-500/20' : 'shadow-cyan-500/20'}`}>
          { isSpectator ? (
            <>
              <p className="text-2xl text-slate-300">You are the Host</p>
              <h1 className="text-7xl font-extrabold my-2 bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-yellow-300">
                SPECTATOR
              </h1>
              <div className="h-1 w-24 mx-auto bg-slate-600 my-6"></div>
              <p className="text-xl text-slate-300">The word is:</p>
              <p className="text-5xl font-bold text-white my-2">{me.word}</p>
            </>
          ) : (
            <>
              <p className="text-2xl text-slate-300">Your Role is</p>
              <h1 className={`text-7xl font-extrabold my-2 bg-clip-text text-transparent ${isImpostor ? 'bg-gradient-to-r from-red-400 to-orange-400' : 'bg-gradient-to-r from-cyan-400 to-teal-300'}`}>
                {me.role}
              </h1>
              <div className="h-1 w-24 mx-auto bg-slate-600 my-6"></div>
              {isImpostor ? (
                <p className="text-xl text-slate-300">
                  Blend in. Don't get caught. The word is related to <span className="font-bold text-white">{room.settings.theme.value}</span>.
                </p>
              ) : (
                <>
                  <p className="text-xl text-slate-300">The word is:</p>
                  <p className="text-5xl font-bold text-white my-2">{me.word}</p>
                </>
              )}
            </>
          )}
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-slate-300 mb-4 flex items-center justify-center gap-2">
            <UserGroupIcon className="w-7 h-7" />
            Players in Game
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {room.players.map(player => (
              <div key={player.id} className="p-3 bg-slate-700 rounded-lg flex items-center justify-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-500 flex-shrink-0"></div>
                <span className="font-semibold truncate">{player.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
            {isHost ? (
                <div className="flex justify-center gap-4">
                    <button onClick={onRestartGame} className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors transform hover:scale-105">
                        Restart with Same Theme
                    </button>
                    <button onClick={onReturnToLobby} className="px-8 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-purple-600 hover:text-white transition-colors transform hover:scale-105">
                        Return to Lobby
                    </button>
                </div>
            ) : (
                <p className="text-slate-400 text-lg">Waiting for the host to start the next round...</p>
            )}
        </div>

      </div>
    </div>
  );
};

export default GameScreen;