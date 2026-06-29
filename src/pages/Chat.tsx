import { useNavigate } from 'react-router-dom';
import { useChatRooms } from '../hooks/useChat';
import EmptyState from '../components/EmptyState';
import { MessageCircle, Loader2, ChevronRight } from 'lucide-react';

export default function Chat() {
  const navigate = useNavigate();
  const { data: rooms, isLoading } = useChatRooms();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!rooms?.length) {
    return (
      <EmptyState
        icon={<MessageCircle size={28} />}
        title="No messages yet"
        description="Start chatting by applying to a job or posting one"
      />
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold text-white mb-4">Messages</h2>
      <div className="space-y-2">
        {rooms.map(room => (
          <button
            key={room.id}
            onClick={() => navigate(`/chat/${room.id}`)}
            className="w-full card flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <MessageCircle size={20} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">Job Discussion</p>
              <p className="text-sm text-slate-400 truncate">
                {room.lastMessage?.text || 'No messages yet'}
              </p>
            </div>
            {room.unreadCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">
                {room.unreadCount}
              </span>
            )}
            <ChevronRight size={18} className="text-slate-600 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
