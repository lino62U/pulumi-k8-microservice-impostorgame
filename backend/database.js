
const sqlite3 = require('sqlite3').verbose();
const DB_SOURCE = "game.db";

const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
      console.error(err.message);
      throw err;
    } else {
        console.log('Connected to the SQLite database.');
        // Enable foreign key support
        db.run('PRAGMA foreign_keys = ON', (err) => {
            if (err) {
                console.error("Error enabling foreign keys:", err.message);
            } else {
                createTables();
            }
        });
    }
});

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    gamePhase TEXT CHECK(gamePhase IN ('LOBBY', 'IN_GAME', 'FINISHED')) NOT NULL DEFAULT 'LOBBY',
    maxPlayers INTEGER NOT NULL,
    impostorCount INTEGER NOT NULL,
    isPrivate BOOLEAN NOT NULL DEFAULT 0,
    password TEXT,
    themeType TEXT CHECK(themeType IN ('CUSTOM', 'PREDEFINED')) NOT NULL,
    themeValue TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    roomId TEXT NOT NULL,
    name TEXT NOT NULL,
    isHost BOOLEAN NOT NULL DEFAULT 0,
    isReady BOOLEAN NOT NULL DEFAULT 0,
    role TEXT CHECK(role IN ('CREWMATE', 'IMPOSTOR', 'SPECTATOR')),
    word TEXT,
    FOREIGN KEY (roomId) REFERENCES rooms (id) ON DELETE CASCADE
);
`;

function createTables() {
    db.exec(SCHEMA_SQL, (err) => {
        if (err) {
            console.error("Error creating tables:", err.message);
        } else {
            console.log("Tables are successfully created or already exist.");
        }
    });
}

// Helper to run a single query with a Promise
const run = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
    });
});

// Helper to get a single row
const get = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, result) => {
        if (err) reject(err);
        else resolve(result);
    });
});

// Helper to get all rows
const all = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});


const getRoomWithPlayers = async (roomId) => {
    const roomRow = await get(`SELECT * FROM rooms WHERE id = ?`, [roomId]);
    if (!roomRow) return null;

    const players = await all(`SELECT * FROM players WHERE roomId = ?`, [roomId]);

    return {
        id: roomRow.id,
        name: roomRow.name,
        gamePhase: roomRow.gamePhase,
        players: players || [],
        settings: {
            maxPlayers: roomRow.maxPlayers,
            impostorCount: roomRow.impostorCount,
            isPrivate: !!roomRow.isPrivate,
            password: roomRow.password,
            theme: {
                type: roomRow.themeType,
                value: roomRow.themeValue
            }
        }
    };
};

module.exports = {
    run,
    get,
    all,
    getRoomWithPlayers
};