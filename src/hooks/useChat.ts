import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import api from '../lib/api';
import { ChatRoom, ChatMessage } from '../types';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://workpro-api.onrender.com';

export const useChatRooms = () => {
  return useQuery({
    queryKey: ['chat-rooms'],
    queryFn: async () => {
      const { data } = await api.get('/api/chat/rooms');
      return data as ChatRoom[];
    },
  });
};

export const useChatMessages = (roomId: string) => {
  return useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async () => {
      const { data } = await api.get(`/api/chat/messages/${roomId}`);
      return data as ChatMessage[];
    },
    enabled: !!roomId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roomId, text }: { roomId: string; text: string }) => {
      const { data } = await api.post(`/api/chat/messages/${roomId}`, { text });
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', vars.roomId] });
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
  });
};

export const useSocket = (roomId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('workpro_token');
    if (!token) return;

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => setIsConnected(true));
    s.on('disconnect', () => setIsConnected(false));

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && roomId) {
      socket.emit('join-room', roomId);
      return () => {
        socket.emit('leave-room', roomId);
      };
    }
  }, [socket, roomId]);

  return { socket, isConnected };
};
