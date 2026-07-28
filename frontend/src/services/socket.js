import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

let socket = null;

export const connectSocket = () => {
  const token = useAuthStore.getState().accessToken;
  if (!token) return null;

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  const baseUrl = apiUrl.replace(/\/api\/v\d+\/?$/, '') || 'http://localhost:5000';
  socket = io(baseUrl, {
    auth: { token },
    transports: ['websocket'],
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const joinShipmentTracking = (shipmentId) => {
  if (socket) {
    socket.emit('shipment:track', shipmentId);
  }
};

export const leaveShipmentTracking = (shipmentId) => {
  if (socket) {
    socket.emit('shipment:leave', shipmentId);
  }
};

export const onLocationUpdate = (callback) => {
  if (socket) {
    socket.on('location:update', callback);
  }
};

export const offLocationUpdate = () => {
  if (socket) {
    socket.off('location:update');
  }
};
