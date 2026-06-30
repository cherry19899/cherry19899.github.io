import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChatRooms, markChatRead } from '../lib/api';
import type { ChatRoom } from '../types';
import { useAppAuth } from '../App';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';

function timeAgo(d?: string) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 2) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function ChatPage() {
  const nav = useNavigate();
  const { refreshUnread } = useAppAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChatRooms()
      .then((d: any) => setRooms(d?.rooms || d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleOpen = (room: ChatRoom) => {
    markChatRead(room.id).catch(() => {});
    refreshUnread();
    nav(`/chat/${room.id}`);
  };

  return (
    <div className="max-w-lg mx-auto p-4 animate-fade-in">
      <h2 className="text-lg font-bold text-white mb-4">Messages</h2>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : rooms.length === 0 ? (
        <EmptyState icon="💬" title="No messages yet" subtitle="Start chatting by applying to a job or posting one" />
      ) : (
        <div className="space-y-2">
          {rooms.map(room => (
            <button
              key={room.id}
              onClick={() => handleOpen(room)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 text-lg font-bold text-emerald-400">
                {(room.other_username || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-white text-sm truncate">
                    {room.job_title || `Chat #${room.id}`}
                  </p>
                  <span className="text-xs text-slate-500 shrink-0">{timeAgo(room.last_message_at)}</span>
                </div>
                <p className="text-sm text-slate-400 truncate mt-0.5">
                  {room.other_username && <span className="text-slate-500">@{room.other_username} · </span>}
                  {room.last_message || 'No messages yet'}
                </p>
              </div>
              {(room.unread_count ?? 0) > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold shrink-0">
                  {room.unread_count! > 9 ? '9+' : room.unread_count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
