
const express = require('express');
const cors = require('cors');
const db = require('./database.js');

const { THEME_LISTS, FOOTBALL_PLAYERS, FAMOUS_MOVIES, UNIVERSITY_MAJORS } = require('./constants.js');

const app = express();
const PORT = 5000;

app.use(cors({
  origin: '*' 
}));
app.use(express.json());


const assignRolesAndWords = async (room) => {
  const { theme, impostorCount } = room.settings;
  let word; // La palabra que se asignará

  // --- LÓGICA MODIFICADA ---
  if (theme.type === 'CUSTOM') {
    word = theme.value;
  } else {
    // 1. Buscar la lista correspondiente en el mapa THEME_LISTS
    // theme.value será 'Football Players', 'Famous Movies', etc.
    const selectedList = THEME_LISTS[theme.value];

    if (selectedList) {
      // 2. Si encontramos la lista, elegimos una palabra al azar de ella
      word = selectedList[Math.floor(Math.random() * selectedList.length)];
    } else {
      // 3. Fallback: si el frontend envía un tema desconocido, usamos Football por defecto
      console.warn(`Tema predefinido desconocido: ${theme.value}. Usando Football Players.`);
      word = FOOTBALL_PLAYERS[Math.floor(Math.random() * FOOTBALL_PLAYERS.length)];
    }
  }
  // --- FIN DE LA LÓGICA MODIFICADA ---


  const playersToAssign = [...room.players];

  if (theme.type === 'CUSTOM' && theme.value.trim() !== '') {
    const hostIndex = playersToAssign.findIndex(p => p.isHost);
    if (hostIndex > -1) {
      const host = playersToAssign.splice(hostIndex, 1)[0];
      await db.run(`UPDATE players SET role = ?, word = ? WHERE id = ?`, ['SPECTATOR', word, host.id]);
    }
  }

  // Shuffle players
  for (let i = playersToAssign.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [playersToAssign[i], playersToAssign[j]] = [playersToAssign[j], playersToAssign[i]];
  }

  for (let i = 0; i < playersToAssign.length; i++) {
    const player = playersToAssign[i];
    const role = i < impostorCount ? 'IMPOSTOR' : 'CREWMATE';
    const playerWord = role === 'IMPOSTOR' ? null : word; // 'word' ahora viene de la lista correcta
    await db.run(`UPDATE players SET role = ?, word = ? WHERE id = ?`, [role, playerWord, player.id]);
  }
};

// --- ROUTES ---

// GET /api/rooms - Get all public rooms
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await db.all(`SELECT id, name, maxPlayers, isPrivate FROM rooms WHERE isPrivate = 0`);
    const roomsWithPlayerCounts = await Promise.all(rooms.map(async (room) => {
      const { count } = await db.get(`SELECT COUNT(*) as count FROM players WHERE roomId = ?`, [room.id]);
      return { ...room, playerCount: count };
    }));
    res.json(roomsWithPlayerCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rooms - Create a new room
app.post('/api/rooms', async (req, res) => {
  const { settings, name, playerName } = req.body;
  const roomId = `RM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const hostId = `P-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  try {
    await db.run(
      `INSERT INTO rooms (id, name, maxPlayers, impostorCount, isPrivate, password, themeType, themeValue) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [roomId, name, settings.maxPlayers, settings.impostorCount, settings.isPrivate, settings.password, settings.theme.type, settings.theme.value]
    );
    await db.run(
      `INSERT INTO players (id, roomId, name, isHost, isReady) VALUES (?, ?, ?, ?, ?)`,
      [hostId, roomId, playerName, true, true]
    );

    const newRoom = await db.getRoomWithPlayers(roomId);
    res.status(201).json(newRoom);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rooms/:id - Get a single room's details
app.get('/api/rooms/:id', async (req, res) => {
  try {
    const room = await db.getRoomWithPlayers(req.params.id);
    if (room) {
      res.json(room);
    } else {
      res.status(404).json({ error: "Room not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rooms/:id/players - Add a player to a room
app.post('/api/rooms/:id/players', async (req, res) => {
  const { name } = req.body;
  const roomId = req.params.id;
  const playerId = `P-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  try {
    const room = await db.getRoomWithPlayers(roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });
    if (room.players.length >= room.settings.maxPlayers) return res.status(400).json({ error: "Room is full" });

    await db.run(
      `INSERT INTO players (id, roomId, name, isHost, isReady) VALUES (?, ?, ?, ?, ?)`,
      [playerId, roomId, name, false, false]
    );

    const updatedRoom = await db.getRoomWithPlayers(roomId);
    res.status(201).json(updatedRoom);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/rooms/:roomId/players/:playerId - Remove a player from a room
app.delete('/api/rooms/:roomId/players/:playerId', async (req, res) => {
  const { roomId, playerId } = req.params;

  try {
    const player = await db.get(`SELECT isHost FROM players WHERE id = ?`, [playerId]);
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    if (player.isHost) {
      // Host is leaving, delete the entire room
      await db.run(`DELETE FROM rooms WHERE id = ?`, [roomId]);
      res.status(200).json({ message: "Room closed successfully." });
    } else {
      // A regular player is leaving
      await db.run(`DELETE FROM players WHERE id = ?`, [playerId]);
      res.status(200).json({ message: "Player removed successfully." });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/rooms/:roomId/players/:playerId - Update player status (e.g., isReady)
app.patch('/api/rooms/:roomId/players/:playerId', async (req, res) => {
  const { isReady } = req.body;
  try {
    await db.run(`UPDATE players SET isReady = ? WHERE id = ? AND roomId = ?`, [isReady, req.params.playerId, req.params.roomId]);
    res.status(200).json({ message: 'Player updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/rooms/:id/settings - Update room settings
app.patch('/api/rooms/:id/settings', async (req, res) => {
  const { theme } = req.body;
  if (!theme) return res.status(400).json({ error: "Invalid settings provided" });
  try {
    await db.run(`UPDATE rooms SET themeType = ?, themeValue = ? WHERE id = ?`, [theme.type, theme.value, req.params.id]);
    res.status(200).json({ message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST /api/rooms/:id/start - Start the game
app.post('/api/rooms/:id/start', async (req, res) => {
  try {
    const room = await db.getRoomWithPlayers(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // Server-side validation
    if (room.players.length < 3) {
      return res.status(400).json({ error: "A minimum of 3 players is required to start." });
    }
    const nonHostPlayers = room.players.filter(p => !p.isHost);
    if (nonHostPlayers.length > 0 && !nonHostPlayers.every(p => p.isReady)) {
      return res.status(400).json({ error: "Not all players are ready." });
    }

    await assignRolesAndWords(room);

    await db.run(`UPDATE rooms SET gamePhase = ? WHERE id = ?`, ['FINISHED', req.params.id]);

    const updatedRoom = await db.getRoomWithPlayers(req.params.id);
    res.status(200).json(updatedRoom);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rooms/:id/restart - Restart the game with the same settings
app.post('/api/rooms/:id/restart', async (req, res) => {
  try {
    const room = await db.getRoomWithPlayers(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // Reset player roles/words/readiness
    await db.run(`UPDATE players SET role = NULL, word = NULL, isReady = CASE WHEN isHost = 1 THEN 1 ELSE 0 END WHERE roomId = ?`, [req.params.id]);

    const resetRoom = await db.getRoomWithPlayers(req.params.id);

    // Re-assign roles and words
    await assignRolesAndWords(resetRoom);

    const updatedRoom = await db.getRoomWithPlayers(req.params.id);
    res.status(200).json(updatedRoom);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST /api/rooms/:id/play-again - Reset a room for a new game (back to lobby)
app.post('/api/rooms/:id/play-again', async (req, res) => {
  const roomId = req.params.id;
  try {
    await db.run(`UPDATE rooms SET gamePhase = 'LOBBY' WHERE id = ?`, [roomId]);
    await db.run(`UPDATE players SET role = NULL, word = NULL, isReady = CASE WHEN isHost = 1 THEN 1 ELSE 0 END WHERE roomId = ?`, [roomId]);

    const updatedRoom = await db.getRoomWithPlayers(roomId);
    res.status(200).json(updatedRoom);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
