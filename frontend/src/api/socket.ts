import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

// In dev, use empty URL so socket.io goes through Vite proxy (/socket.io → localhost:5001)
// In prod, VITE_API_URL points to the Railway backend
const URL = import.meta.env.VITE_API_URL || '';

export const socket: Socket = io(URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

// If server rejects the connection (e.g. stale token after restart), clear auth
socket.on('connect_error', () => {
  const { token } = useAuthStore.getState();
  if (token) {
    useAuthStore.getState().logout();
  }
});

export function connectSocket() {
  // Set token on every connect so the server can authenticate
  const token = useAuthStore.getState().token || '';
  (socket.io.opts.query as Record<string, string>) = { token };
  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}
