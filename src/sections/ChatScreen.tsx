import React, { useState, useEffect, useRef } from 'react';
import { TFunction } from '../hooks/useTranslation';
import { getConversations, getMessages, sendMessage } from '../lib/api';
import { timeAgo } from '../lib/utils';
import { ChatShimmer } from '../components/Shimmer';

interface ChatScreenProps {
  t: TFunction;
  user: { uid: string; username: string };
  openRoomId?: string | null;
}

export default function ChatScreen({ t, user, openRoomId }: ChatScreenProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (openRoomId) {
      const conv = conversations.find(c => String(c.room_id || c.id) === String(openRoomId));
      if (conv) openRoom(conv);
    }
  }, [openRoomId, conversations]);

  const loadConversations = async () => {
    try {
      const d = await getConversations();
      setConversations(d.conversations || d || []);
    } catch {}
    finally { setLoading(false); }
  };

  const openRoom = async (conv: any) => {
    setActiveRoom(conv);
    try {
      const d = await getMessages(conv.room_id || conv.id);
      setMessages(d.messages || d || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {}
  };

  useEffect(() => {
    if (!activeRoom) return;
    const interval = setInterval(async () => {
      try {
        const d = await getMessages(activeRoom.room_id || activeRoom.id);
        setMessages(d.messages || d || []);
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [activeRoom]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeRoom) return;
    setSending(true);
    const roomId = activeRoom.room_id || activeRoom.id;
    try {
      await sendMessage(roomId, text.trim());
      setText('');
      const d = await getMessages(roomId);
      setMessages(d.messages || d || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {}
    finally { setSending(false); }
  };

  const filtered = conversations.filter(c =>
    (c.participant_name || c.name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (activeRoom) {
    return (
      <div className="flex flex-col h-screen animate-fade-in">
        {/* Room header */}
        <div className="sticky top-0 z-10 glass border-b border-border px-4 h-14 flex items-center gap-3">
          <button onClick={() => setActiveRoom(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <div className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center text-sm font-bold">
            {(activeRoom.participant_name || activeRoom.name || '?')[0].toUpperCase()}
          </div>
          <p className="font-semibold text-sm">{activeRoom.participant_name || activeRoom.name}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-20">
          {messages.map((msg: any, i) => {
            const isMe = msg.sender_uid === user.uid || msg.sender_username === user.username;
            return (
              <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                  isMe ? 'bg-emerald-500 text-white rounded-br-sm' : 'bg-card border border-border rounded-bl-sm'
                }`}>
                  <p>{msg.content || msg.message}</p>
                  <p className={`text-[10px] mt-0.5 ${isMe ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {timeAgo(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="fixed bottom-0 left-0 right-0 p-4 glass border-t border-border flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={t('typeMessage')}
            className="flex-1 rounded-xl bg-card border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm disabled:opacity-60"
          >
            {t('send')}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-20">
      <div className="sticky top-0 z-10 glass border-b border-border px-4 h-14 flex items-center">
        <h1 className="font-bold text-base">{t('chat')}</h1>
      </div>

      <div className="p-4 space-y-3">
        <div className="relative">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('search') + '...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          filtered.map((conv: any) => (
            <button
              key={conv.id || conv.room_id}
              onClick={() => openRoom(conv)}
              className="w-full p-3 rounded-xl bg-card border border-border flex items-center gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/30 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {(conv.participant_name || conv.name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{conv.participant_name || conv.name}</p>
                <p className="text-xs text-muted-foreground truncate">{conv.last_message || t('noMessages')}</p>
              </div>
              {conv.unread_count > 0 && (
                <span className="w-5 h-5 bg-emerald-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                  {conv.unread_count}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
