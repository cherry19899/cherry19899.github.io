import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { getChatMessages, sendMessage } from '../lib/api';
import { API_BASE } from '../lib/constants';
import { useAppCtx } from '../App';
import { getToken } from '../lib/api';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

interface Msg {
  id: number | string;
  content: string;
  sender_uid: string;
  sender_username?: string;
  created_at: string;
  pending?: boolean;
}

function formatTime(d: string) {
  const date = new Date(d);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatRoomPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { user } = useAppCtx();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load history
  useEffect(() => {
    if (!id) return;
    getChatMessages(id)
      .then((d: any) => setMsgs((d?.messages || d || []).map((m: any) => ({ ...m, content: m.content || m.message || '' }))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // Socket.io
  useEffect(() => {
    if (!id || !user) return;
    const token = getToken();
    const socket = io(API_BASE, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join', id);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('new_message', (raw: any) => {
      const msg: Msg = { ...raw, content: raw.content || raw.message || '' };
      setMsgs(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socket.emit('leave', id);
      socket.disconnect();
    };
  }, [id, user?.uid]);

  // Scroll to bottom on new msg
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const send = useCallback(async () => {
    const content = text.trim();
    if (!content || !id || sending) return;
    setText('');
    setSending(true);

    // Optimistic
    const tempId = `tmp-${crypto.randomUUID()}`;
    const optimistic: Msg = {
      id: tempId,
      content,
      sender_uid: user?.uid || '',
      sender_username: user?.username,
      created_at: new Date().toISOString(),
      pending: true,
    };
    setMsgs(prev => [...prev, optimistic]);

    try {
      const res = await sendMessage(id, content);
      const raw = res?.message || res;
      const msg: Msg = { ...raw, content: raw.content || raw.message || content, pending: false };
      setMsgs(prev => prev.map(m => m.id === tempId ? msg : m));
    } catch {
      setMsgs(prev => prev.filter(m => m.id !== tempId));
      setText(content);
    } finally { setSending(false); }
  }, [text, id, sending, user]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Custom header with back + room info */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-sm">
        <div className="flex items-center gap-3 px-4 h-14 max-w-lg mx-auto">
          <button
            onClick={() => nav('/chat')}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20"
          >
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">Chat</p>
            <p className="text-white/70 text-xs flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-300' : 'bg-white/40'}`} />
              {connected ? 'Live' : 'Connecting…'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-36">
        {loading ? (
          <div className="flex justify-center pt-10">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : msgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <span className="text-4xl mb-3">👋</span>
            <p className="text-gray-500 text-sm">Say hello to start the conversation!</p>
          </div>
        ) : (
          msgs.map(m => {
            const mine = m.sender_uid === user?.uid;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                {!mine && (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mr-2 self-end text-xs font-bold text-emerald-600">
                    {(m.sender_username || '?')[0].toUpperCase()}
                  </div>
                )}
                <div className="max-w-xs space-y-0.5">
                  {!mine && m.sender_username && (
                    <p className="text-xs text-gray-400 ml-1">@{m.sender_username}</p>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    mine
                      ? `bg-emerald-500 text-white rounded-br-sm ${m.pending ? 'opacity-60' : ''}`
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}>
                    {m.content}
                  </div>
                  <p className={`text-[10px] text-gray-400 ${mine ? 'text-right mr-1' : 'ml-1'}`}>
                    {formatTime(m.created_at)}
                    {mine && m.pending && ' · sending…'}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottom} />
      </div>

      {/* Input bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 max-w-lg mx-auto">
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKey}
            placeholder="Message…"
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 disabled:opacity-40 active:scale-95 transition-transform"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
