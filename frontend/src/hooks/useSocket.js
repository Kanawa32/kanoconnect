import { useEffect, useRef } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';

export const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = connectSocket();
    return () => {
      disconnectSocket();
    };
  }, []);

  return socketRef.current;
};

export const useSocketEvent = (event, callback) => {
  const socket = getSocket();

  useEffect(() => {
    if (!socket) return;
    socket.on(event, callback);
    return () => {
      socket.off(event, callback);
    };
  }, [socket, event, callback]);
};
