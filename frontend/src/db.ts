import { Room, Player, RoomSettings } from './types';

const API_BASE_URL_PRIMARY = 'https://5dn3g5xj-3001.brs.devtunnels.ms/api';
const API_BASE_URL_FALLBACK = 'http://localhost:3001/api'; // asegúrate del path correcto


const apiRequest = async (endpoint: string, method: string = 'GET', body?: any): Promise<any | null> => {
    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    // Helper interno para hacer fetch con un base URL
    const tryFetch = async (baseUrl: string) => {
        const response = await fetch(`${baseUrl}${endpoint}`, options);

        // Para DELETE exitosos con 200, devolvemos { success: true } directamente
        if (method === 'DELETE' && response.ok) {
            return { success: true };
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    };

    try {
        // 🔹 Intentar la API principal
        return await tryFetch(API_BASE_URL_PRIMARY);
    } catch (primaryError) {
        console.warn(`Primary API (${API_BASE_URL_PRIMARY}) failed:`, primaryError);

        // 🔹 Si falla, intentar el fallback local
        try {
            console.info(`Trying fallback API (${API_BASE_URL_FALLBACK})...`);
            return await tryFetch(API_BASE_URL_FALLBACK);
        } catch (fallbackError) {
            console.error(`Fallback API also failed:`, fallbackError);
            return null;
        }
    }
};

// FIX: The original implementation `apiRequest('/rooms') || []` was incorrect.
// `apiRequest` returns a Promise, which is always truthy, so `|| []` was never executed.
// This caused a type mismatch because `apiRequest` can resolve to `null`, but the function
// is expected to return a `Promise<any[]>`.
// The fix is to `await` the result and handle the `null` case by returning an empty array.

export const getPublicRooms = async (): Promise<any[]> => {
    const rooms = await apiRequest('/rooms');
    return rooms || [];
};

export const createRoom = (settings: RoomSettings, name: string, playerName: string): Promise<Room | null> => {
    return apiRequest('/rooms', 'POST', { settings, name, playerName });
};

export const getRoom = (roomId: string): Promise<Room | null> => {
    return apiRequest(`/rooms/${roomId}`);
};

export const addPlayer = (roomId: string, name: string): Promise<Room | null> => {
    return apiRequest(`/rooms/${roomId}/players`, 'POST', { name });
};

export const updatePlayer = (roomId: string, playerId: string, data: Partial<Player>): Promise<any> => {
    return apiRequest(`/rooms/${roomId}/players/${playerId}`, 'PATCH', data);
};

export const removePlayer = (roomId: string, playerId: string): Promise<any> => {
    return apiRequest(`/rooms/${roomId}/players/${playerId}`, 'DELETE');
}

export const updateRoomSettings = (roomId: string, settings: Partial<RoomSettings>): Promise<any> => {
    return apiRequest(`/rooms/${roomId}/settings`, 'PATCH', settings);
};

export const startGame = (roomId: string): Promise<Room | null> => {
    return apiRequest(`/rooms/${roomId}/start`, 'POST');
}

export const restartGame = (roomId: string): Promise<Room | null> => {
    return apiRequest(`/rooms/${roomId}/restart`, 'POST');
}

export const playAgain = (roomId: string): Promise<Room | null> => {
    return apiRequest(`/rooms/${roomId}/play-again`, 'POST');
}