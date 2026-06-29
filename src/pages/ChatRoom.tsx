import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatMessages, useSendMessage, useSocket } from '../hooks/useChat';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';

export default function ChatRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: messages, isLoading } = useChatMessages(roomId!);
  const sendMutation = useSendMessage();
  const { socket } = useSocket(roomId);
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for new messages via socket
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg: any) => {
      // React Query will refetch, but we could optimistically update here
    };

    socket.on('new-message', handleMessage);
    return () => {
      socket.off('new-message', handleMessage);
    };
  }, [socket]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !roomId) return;

    await sendMutation.mutateAsync({ roomId, text: text.trim() });
    setText('');
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
        <button onClick={() => navigate('/chat')} className="p-2 rounded-full bg-slate-800 text-slate-300">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="font-semibold text-white">Chat</h2>
          <p className="text-xs text-slate-400">Job discussion</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="text-emerald-400 animate-spin" />
          </div>
        ) : (messages || []).length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-500">No messages yet</p>
            <p className="text-sm text-slate-600 mt-1">Start the conversation!</p>
          </div>
        ) : (
          (messages || []).map((msg: any) => {
            const isMe = msg.sender_id === user?.id || msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                  isMe 
                    ? 'bg-emerald-500 text-white rounded-br-md' 
                    : 'bg-slate-800 text-slate-200 rounded-bl-md'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {formatTime(msg.created_at || msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-slate-900/80 backdrop-blur-lg border-t border-slate-700/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 input py-2.5"
          />
          <button
            type="submit"
            disabled={!text.trim() || sendMutation.isPending}
            className="btn-primary px-4"
          >
            {sendMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </form>
    </div>
  );
}
