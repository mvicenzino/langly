import { io, Socket } from 'socket.io-client';

// In dev, Vite proxy handles /socket.io → localhost:5001 (empty URL = same origin)
// In prod, VITE_API_URL points to the Railway backend
const URL = import.meta.env.VITE_API_URL || '';

export const socket: Socket = io(URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export function connectSocket() {
  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}
