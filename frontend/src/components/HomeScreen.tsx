import React, { useState } from 'react';
import { FOOTBALL_PLAYERS } from '../constants';
import { RoomSettings } from '../types';
import { LockClosedIcon, UserGroupIcon, PlusIcon } from './icons';

interface CreateRoomModalProps {
  onClose: () => void;
  onCreate: (settings: RoomSettings, name: string) => void;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ onClose, onCreate }) => {
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [impostorCount, setImpostorCount] = useState(1);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [themeType, setThemeType] = useState<'PREDEFINED' | 'CUSTOM'>('PREDEFINED');
  const [customTheme, setCustomTheme] = useState('');
  
  const handleCreate = () => {
    if (!roomName) {
      alert('Please enter a room name.');
      return;
    }
    if (themeType === 'CUSTOM' && !customTheme) {
        alert('Please enter a custom theme word.');
        return;
    }

    onCreate({
      maxPlayers,
      impostorCount,
      isPrivate,
      password: isPrivate ? password : undefined,
      theme: {
        type: themeType,
        value: themeType === 'CUSTOM' ? customTheme : 'Football Players'
      }
    }, roomName);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl shadow-2xl shadow-cyan-500/10 p-8 w-full max-w-md border border-slate-700">
        <h2 className="text-3xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">Create Game Room</h2>
        
        <div className="space-y-4">
          <input type="text" placeholder="Room Name" value={roomName} onChange={(e) => setRoomName(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
          
          <div className="flex items-center justify-between">
            <label>Max Players: {maxPlayers}</label>
            <input type="range" min="3" max="12" value={maxPlayers} onChange={(e) => setMaxPlayers(parseInt(e.target.value))} className="w-1/2" />
          </div>
          
          <div className="flex items-center justify-between">
            <label>Impostors: {impostorCount}</label>
            <input type="range" min="1" max={Math.floor(maxPlayers/2)} value={impostorCount} onChange={(e) => setImpostorCount(parseInt(e.target.value))} className="w-1/2" />
          </div>

          <div>
            <p className="mb-2">Theme</p>
            <div className="flex gap-4">
              <button onClick={() => setThemeType('PREDEFINED')} className={`flex-1 py-2 rounded-lg ${themeType === 'PREDEFINED' ? 'bg-cyan-500' : 'bg-slate-700'}`}>Predefined List</button>
              <button onClick={() => setThemeType('CUSTOM')} className={`flex-1 py-2 rounded-lg ${themeType === 'CUSTOM' ? 'bg-cyan-500' : 'bg-slate-700'}`}>Custom Word</button>
            </div>
            {themeType === 'PREDEFINED' && <p className="text-sm text-slate-400 mt-2">Topic: {FOOTBALL_PLAYERS.length} Famous Football Players</p>}
            {themeType === 'CUSTOM' && <input type="text" placeholder="Enter a word or topic" value={customTheme} onChange={(e) => setCustomTheme(e.target.value)} className="mt-2 w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500" />}
          </div>
          
          <div className="flex items-center justify-between">
            <label htmlFor="isPrivate" className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="isPrivate" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="form-checkbox h-5 w-5 text-cyan-500 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500" />
              Private Room
            </label>
            {isPrivate && <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-1/2 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500" />}
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button onClick={onClose} className="px-6 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 transition-colors">Cancel</button>
          <button onClick={handleCreate} className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 transition-all transform hover:scale-105">Create</button>
        </div>
      </div>
    </div>
  );
};


interface HomeScreenProps {
  onCreateRoom: (settings: RoomSettings, name: string) => void;
  onJoinRoom: (roomId: string) => void;
  publicRooms: any[];
  dbReady: boolean;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onCreateRoom, onJoinRoom, publicRooms, dbReady }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreate = (settings: RoomSettings, name: string) => {
    onCreateRoom(settings, name);
    setIsModalOpen(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {isModalOpen && <CreateRoomModal onClose={() => setIsModalOpen(false)} onCreate={handleCreate} />}
      
      <div className="text-center mb-10">
        <h1 className="text-6xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
          IMPOSTOR
        </h1>
        <p className="text-slate-400 text-lg">Find the liar among your friends.</p>
      </div>

      <div className="w-full max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-300">Public Rooms</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            disabled={!dbReady}
            className="flex items-center gap-2 px-6 py-3 font-bold text-white rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/20 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed"
          >
            <PlusIcon className="w-5 h-5" />
            Create Room
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {!dbReady && <p className="text-slate-400 col-span-full text-center">Initializing Database...</p>}
          {dbReady && publicRooms.length === 0 && <p className="text-slate-400 col-span-full text-center">No public rooms available. Why not create one?</p>}
          {dbReady && publicRooms.map(room => (
            <div key={room.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col justify-between hover:bg-slate-700/50 hover:border-cyan-500 transition-all duration-300">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-white">{room.name}</h3>
                  {room.isPrivate && <LockClosedIcon className="w-5 h-5 text-slate-400"/>}
                </div>
                <div className="flex items-center text-slate-400 text-sm gap-2">
                  <UserGroupIcon className="w-4 h-4"/>
                  <span>{room.playerCount} / {room.maxPlayers} Players</span>
                </div>
              </div>
              <button onClick={() => onJoinRoom(room.id)} className="mt-4 w-full bg-slate-700 text-slate-300 py-2 rounded-lg hover:bg-cyan-600 hover:text-white transition-colors">
                Join Room
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;