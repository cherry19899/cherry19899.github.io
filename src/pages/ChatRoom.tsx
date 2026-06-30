import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChatMessages, sendChatMessage, markChatRead, getChatRoom } from '../lib/api';
import type { Message } from '../types';
import { useAppAuth } from '../App';
import { io, Socket } from 'socket.io-client';
import { API_BASE } from '../lib/constants';

let _socket: Socket | null = null;
function getSocket(token: string): Socket {
  if (!_socket || !_socket.connected) {
    _socket?.disconnect();
    _socket = io(API_BASE, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
  }
  return _socket;
}

function fmt(d: string) {
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatRoomPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { user } = useAppAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [roomTitle, setRoomTitle] = useState('Chat');
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load initial messages & room info
  useEffect(() => {
    if (!id) return;
    Promise.all([
      getChatMessages(id),
      getChatRoom(id).catch(() => null),
    ]).then(([msgs, room]) => {
      const list: Message[] = msgs?.messages || msgs || [];
      setMessages(list);
      if (room?.job_title) setRoomTitle(room.job_title);
      else if (room?.other_username) setRoomTitle(`@${room.other_username}`);
    }).catch(() => {}).finally(() => setLoading(false));
    markChatRead(id).catch(() => {});
  }, [id]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Socket.io real-time
  useEffect(() => {
    if (!id || !user) return;
    const token = localStorage.getItem('workpro_token') || '';
    const socket = getSocket(token);

    socket.emit('join_room', { room_id: id });

    const onMsg = (msg: Message) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on('new_message', onMsg);
    socket.on('message', onMsg);

    return () => {
      socket.off('new_message', onMsg);
      socket.off('message', onMsg);
      socket.emit('leave_room', { room_id: id });
    };
  }, [id, user]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t || !id || sending) return;
    setSending(true);
    setText('');
    // Optimistic
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      room_id: id,
      sender_id: user?.uid || '',
      sender_username: user?.username,
      content: t,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    try {
      const msg = await sendChatMessage(id, t);
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...optimistic, ...msg } : m));
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setText(t);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 56px)' }}>
      {/* Sub-header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/90 backdrop-blur border-b border-slate-700/50 shrink-0">
        <button onClick={() => nav('/chat')} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{roomTitle}</p>
          <p className="text-xs text-slate-500">Job discussion</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <span className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-500 text-sm">No messages yet</p>
            <p className="text-slate-600 text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender_id === user?.uid || msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl ${
                  isMe ? 'bg-emerald-500 text-white rounded-br-md' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-md'
                }`}>
                  {!isMe && msg.sender_username && (
                    <p className="text-xs font-semibold text-emerald-400 mb-1">@{msg.sender_username}</p>
                  )}
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-emerald-100' : 'text-slate-500'}`}>{fmt(msg.created_at)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-slate-900/90 backdrop-blur border-t border-slate-700/50 shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="w-11 h-11 rounded-xl bg-emerald-500 disabled:opacity-40 flex items-center justify-center text-white"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
