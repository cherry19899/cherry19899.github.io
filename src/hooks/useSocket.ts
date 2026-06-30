import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE } from '../lib/constants';

let _socket: Socket | null = null;

export function useSocket(userId: string | null | undefined) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;
    if (!_socket) {
      const token = localStorage.getItem('workpro_token') || '';
      _socket = io(API_BASE, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
      });
    }
    socketRef.current = _socket;
    _socket.emit('join', { userId });

    return () => {};
  }, [userId]);

  const on = useCallback(<T>(event: string, handler: (data: T) => void) => {
    _socket?.on(event, handler);
    return () => { _socket?.off(event, handler); };
  }, []);

  const emit = useCallback((event: string, data: any) => {
    _socket?.emit(event, data);
  }, []);

  return { on, emit, socket: socketRef };
}
