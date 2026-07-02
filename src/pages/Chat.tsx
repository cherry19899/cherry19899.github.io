import React, { useState, useEffect } from 'react';
import { t } from '../lib/i18n';
import { useNavigate } from 'react-router-dom';
import { getChatRooms, markChatRead } from '../lib/api';
import { useAppCtx } from '../App';

function timeAgo(d?: string) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 2) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

interface Room { id: number; job_title?: string; other_user_name?: string; other_user_avatar?: string; last_message?: string; last_message_at?: string; unread_count?: number; }

export default function ChatPage() {
  const tr = t();
  const nav = useNavigate();
  const { refreshUnread } = useAppCtx();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChatRooms()
      .then((d: any) => setRooms(d?.rooms || d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const open = (room: Room) => {
    markChatRead(room.id).catch(() => {});
    refreshUnread();
    nav(`/chat/${room.id}`);
  };

  return (
    <div className="max-w-lg mx-auto p-4 animate-fade-in pb-24">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{tr.messages}</h2>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 skeleton rounded-2xl" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-3">💬</span>
          <p className="font-semibold text-gray-900">{tr.noMessages}</p>
          <p className="text-sm text-gray-400 mt-1">{tr.applyToStartChatting}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rooms.map(room => (
            <button
              key={room.id}
              onClick={() => open(room)}
              className="w-full bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-lg font-bold text-emerald-600 overflow-hidden">
                {room.other_user_avatar
                  ? <img src={room.other_user_avatar} className="w-full h-full object-cover" alt="" />
                  : (room.other_user_name || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {room.job_title || `Chat #${room.id}`}
                  </p>
                  <span className="text-xs text-gray-400 shrink-0">{timeAgo(room.last_message_at)}</span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {room.other_user_name && `@${room.other_user_name} · `}
                  {room.last_message || tr.noMessages}
                </p>
              </div>
              {(room.unread_count ?? 0) > 0 && (
                <span className="shrink-0 min-w-5 h-5 px-1 bg-emerald-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {room.unread_count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
