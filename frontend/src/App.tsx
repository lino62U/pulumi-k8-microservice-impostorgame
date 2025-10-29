
import React, { useState, useEffect, useCallback, useRef } from 'react';
import HomeScreen from './components/HomeScreen';
import RoomLobbyScreen from './components/RoomLobbyScreen';
import GameScreen from './components/GameScreen';
import { Player, Room, RoomSettings } from './types';
import * as DB from './db';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'lobby' | 'game'>('home');
  const [room, setRoom] = useState<Room | null>(null);
  const [publicRooms, setPublicRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Using a ref to store the current player's info across renders/refreshes
  const meRef = useRef<{id: string, name: string} | null>(null);

  // Polling for lobby/game updates
  useEffect(() => {
    // FIX: Replaced interval handling logic to correctly infer timer ID type and prevent calling clearInterval with an uninitialized variable.
    // The previous use of `NodeJS.Timeout` is incorrect in a browser environment.
    if ((view === 'lobby' || view === 'game') && room?.id) {
      const interval = setInterval(async () => {
        const updatedRoom = await DB.getRoom(room.id);
        if (updatedRoom) {
          if (updatedRoom.gamePhase === 'LOBBY' && view !== 'lobby') {
            setView('lobby');
          } else if ((updatedRoom.gamePhase === 'FINISHED' || updatedRoom.gamePhase === 'IN_GAME') && view !== 'game') {
            setView('game');
          }
          setRoom(updatedRoom);
        } else {
            // Room no longer exists (e.g. host left)
            handleLeaveRoom(true); // silent leave
        }
      }, 2000); // Poll every 2 seconds
      return () => clearInterval(interval);
    }
  }, [view, room?.id]);

  useEffect(() => {
    const fetchPublicRooms = async () => {
      setIsLoading(true);
      const rooms = await DB.getPublicRooms();
      setPublicRooms(rooms);
      setIsLoading(false);
    };
    fetchPublicRooms();
  }, []);

  const handleCreateRoom = async (settings: RoomSettings, name: string) => {
    const playerName = `Player ${Math.floor(Math.random() * 1000)}`; // Simple name for now
    const newRoom = await DB.createRoom(settings, name, playerName);
    if (newRoom) {
      const host = newRoom.players.find(p => p.isHost);
      if(host) meRef.current = { id: host.id, name: host.name };
      setRoom(newRoom);
      setView('lobby');
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    const playerName = `Player ${Math.floor(Math.random() * 1000)}`;
    const updatedRoom = await DB.addPlayer(roomId, playerName);
     if (updatedRoom) {
       const me = updatedRoom.players.find(p => p.name === playerName);
       if(me) meRef.current = { id: me.id, name: me.name };
       
       setRoom(updatedRoom);
       setView('lobby');
     }
  };

  const handleLeaveRoom = async (silent = false) => {
    if (!silent && room && meRef.current) {
        await DB.removePlayer(room.id, meRef.current.id);
    }
    meRef.current = null;
    setRoom(null);
    setView('home');
    DB.getPublicRooms().then(setPublicRooms); // Refresh public rooms list
  };

  const handleUpdateSettings = useCallback(async (updatedSettings: Partial<RoomSettings>) => {
    if (!room) return;
    await DB.updateRoomSettings(room.id, updatedSettings);
  }, [room]);

  const handleToggleReady = useCallback(async () => {
    if (!room || !meRef.current) return;
    const me = room.players.find(p => p.id === meRef.current!.id);
    if (me && !me.isHost) {
        await DB.updatePlayer(room.id, me.id, { isReady: !me.isReady });
    }
  }, [room]);

  const handleStartGame = useCallback(async () => {
    if (!room) return;
    const gameStartedRoom = await DB.startGame(room.id);
    if (gameStartedRoom) {
        setRoom(gameStartedRoom);
        setView('game');
    }
  }, [room]);

  const handleReturnToLobby = useCallback(async () => {
    if (!room) return;
    const newLobby = await DB.playAgain(room.id);
    if(newLobby){
        setRoom(newLobby);
        setView('lobby');
    }
  }, [room]);

  const handleRestartGame = useCallback(async () => {
    if (!room) return;
    const restartedRoom = await DB.restartGame(room.id);
    if (restartedRoom) {
      setRoom(restartedRoom);
      // Stay in 'game' view
    }
  }, [room]);
  
  const renderContent = () => {
    switch (view) {
      case 'lobby':
        return room && <RoomLobbyScreen 
                            room={room} 
                            meId={meRef.current?.id}
                            onStartGame={handleStartGame} 
                            onLeaveRoom={handleLeaveRoom} 
                            onUpdateSettings={handleUpdateSettings}
                            onToggleReady={handleToggleReady}
                        />;
      case 'game':
        const meInGame = room?.players.find(p => p.id === meRef.current?.id);
        return room && <GameScreen 
                        room={room} 
                        me={meInGame}
                        isHost={meInGame?.isHost ?? false}
                        onRestartGame={handleRestartGame}
                        onReturnToLobby={handleReturnToLobby}
                       />;
      case 'home':
      default:
        return <HomeScreen onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} publicRooms={publicRooms} dbReady={!isLoading} />;
    }
  };

  return (
    <main className="bg-slate-900 text-white min-h-screen font-sans">
        {renderContent()}
    </main>
  );
};

export default App;