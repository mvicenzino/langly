import { io, Socket } from 'socket.io-client';

// Use empty URL so Socket.IO connects to the same origin (Vite proxy handles /socket.io → backend)
const URL = '';

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
