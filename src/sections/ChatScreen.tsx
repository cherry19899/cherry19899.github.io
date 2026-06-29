import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { TFunction } from '../hooks/useTranslation';
import { getChatRooms, getChatMessages, sendChatMessage, getApiBase } from '../lib/api';
import { timeAgo } from '../lib/utils';
import { ChatShimmer } from '../components/Shimmer';

interface ChatScreenProps {
  t: TFunction;
  user: { uid: string; username: string };
  openRoomId?: string | null;
  onRoomClose?: () => void;
}

let _socket: Socket | null = null;

function getSocket(): Socket {
  if (!_socket || !_socket.connected) {
    const token = localStorage.getItem('workpro_token') || localStorage.getItem('workpro_jwt') || '';
    _socket = io(getApiBase(), {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
  }
  return _socket;
}

export default function ChatScreen({ t, user, openRoomId, onRoomClose }: ChatScreenProps) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRoomRef = useRef<any>(null);
  activeRoomRef.current = activeRoom;

  const scrollBottom = () =>
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);

  // Load room list
  const loadRooms = useCallback(async () => {
    try {
      const d = await getChatRooms();
      setRooms(d.rooms || d.conversations || d || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadRooms();
    // Socket.io real-time: new message arrives in any room → refresh room list
    const sock = getSocket();
    sock.on('new_message', (msg: any) => {
      // If this is the open room, append message
      if (activeRoomRef.current) {
        const roomId = activeRoomRef.current.room_id || activeRoomRef.current.id;
        if (String(msg.room_id) === String(roomId)) {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            scrollBottom();
            return [...prev, msg];
          });
        }
      }
      // Refresh sidebar unread counts
      loadRooms();
    });
    return () => { sock.off('new_message'); };
  }, [loadRooms]);

  // Auto-open room from notification tap / prop
  useEffect(() => {
    if (!openRoomId || !rooms.length) return;
    const room = rooms.find(r => String(r.room_id || r.id) === String(openRoomId));
    if (room) openRoom(room);
  }, [openRoomId, rooms]);

  const openRoom = async (room: any) => {
    const roomId = room.room_id || room.id;
    setActiveRoom(room);
    setMsgLoading(true);
    try {
      const d = await getChatMessages(roomId);
      setMessages(d.messages || d || []);
      scrollBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    } catch {}
    finally { setMsgLoading(false); }
    // Join Socket.io room
    getSocket().emit('join_room', { room_id: roomId });
  };

  const closeRoom = () => {
    const roomId = activeRoom?.room_id || activeRoom?.id;
    if (roomId) getSocket().emit('leave_room', { room_id: roomId });
    setActiveRoom(null);
    setMessages([]);
    onRoomClose?.();
    loadRooms();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeRoom) return;
    const content = text.trim();
    setText('');
    setSending(true);
    const roomId = activeRoom.room_id || activeRoom.id;
    // Optimistic
    const optimistic = {
      id: `tmp-${Date.now()}`,
      content,
      sender_uid: user.uid,
      sender_username: user.username,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    scrollBottom();
    try {
      await sendChatMessage(roomId, content);
      // Server will emit new_message via socket; also fetch to sync
      const d = await getChatMessages(roomId);
      setMessages(d.messages || d || []);
      scrollBottom();
    } catch {}
    finally { setSending(false); }
  };

  const filtered = rooms.filter(r =>
    (r.participant_name || r.name || '').toLowerCase().includes(search.toLowerCase())
  );

  // ── Room view ────────────────────────────────────────────────────────────
  if (activeRoom) {
    return (
      <div className="flex flex-col h-[calc(100vh-56px)] animate-fade-in">
        <div className="sticky top-14 z-10 glass border-b border-border px-4 h-14 flex items-center gap-3">
          <button onClick={closeRoom} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <div className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {(activeRoom.participant_name || activeRoom.name || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{activeRoom.participant_name || activeRoom.name}</p>
            {activeRoom.job_title && (
              <p className="text-xs text-muted-foreground truncate">{activeRoom.job_title}</p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-4">
          {msgLoading ? (
            <div className="flex justify-center pt-8">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground pt-8">{t('noMessages')}</p>
          ) : (
            messages.map((msg: any, i) => {
              const isMe = msg.sender_uid === user.uid || msg.sender_username === user.username;
              const showDate = i === 0 ||
                new Date(msg.created_at).toDateString() !== new Date(messages[i - 1]?.created_at).toDateString();
              return (
                <React.Fragment key={msg.id || i}>
                  {showDate && (
                    <p className="text-center text-[10px] text-muted-foreground py-1">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </p>
                  )}
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-emerald-500 text-white rounded-br-sm'
                        : 'bg-card border border-border rounded-bl-sm'
                    }`}>
                      <p className="leading-relaxed break-words">{msg.content || msg.message}</p>
                      <p className={`text-[10px] mt-0.5 ${isMe ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {timeAgo(msg.created_at)}
                      </p>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-3 glass border-t border-border flex gap-2">
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={t('typeMessage')}
            className="flex-1 rounded-xl bg-card border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm disabled:opacity-60 flex-shrink-0"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </form>
      </div>
    );
  }

  // ── Room list ────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in pb-20">
      <div className="sticky top-14 z-10 glass border-b border-border px-4 h-14 flex items-center">
        <h1 className="font-bold text-base flex-1">{t('chat')}</h1>
      </div>

      <div className="p-4 space-y-3">
        <div className="relative">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('search') + '...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <ChatShimmer key={i} />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">💬</p>
            <p>{t('noMessages')}</p>
          </div>
        ) : (
          filtered.map((room: any) => (
            <button
              key={room.id || room.room_id}
              onClick={() => openRoom(room)}
              className="w-full p-3 rounded-xl bg-card border border-border flex items-center gap-3 text-left active:bg-muted transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/30 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {(room.participant_name || room.name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{room.participant_name || room.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {room.last_message || room.job_title || t('noMessages')}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {room.last_message_at && (
                  <p className="text-[10px] text-muted-foreground">{timeAgo(room.last_message_at)}</p>
                )}
                {room.unread_count > 0 && (
                  <span className="min-w-[20px] h-5 px-1 bg-emerald-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                    {room.unread_count > 99 ? '99+' : room.unread_count}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
