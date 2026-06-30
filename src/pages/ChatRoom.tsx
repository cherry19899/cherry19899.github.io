import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getChatMessages, sendMessage } from '../lib/api';
import { useAppCtx } from '../App';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

interface Msg { id: number; content: string; sender_uid: string; sender_username?: string; created_at: string; }

export default function ChatRoomPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAppCtx();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    getChatMessages(id).then((d: any) => setMsgs(d?.messages || d || [])).catch(() => {});
  }, [id]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const send = async () => {
    if (!text.trim() || !id || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);
    try {
      const msg = await sendMessage(id, content);
      setMsgs(p => [...p, msg]);
    } catch {}
    finally { setSending(false); }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header back />
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
        {msgs.map(m => {
          const mine = m.sender_uid === user?.uid;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                mine ? 'bg-emerald-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
              }`}>
                {!mine && m.sender_username && (
                  <p className="text-xs text-emerald-600 font-semibold mb-0.5">@{m.sender_username}</p>
                )}
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-2 max-w-lg mx-auto">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Type a message…"
          className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white disabled:opacity-50 shrink-0"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
