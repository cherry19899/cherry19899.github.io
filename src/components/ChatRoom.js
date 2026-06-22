// ChatRoom.js - Single Chat Room (with Socket.io real-time support + polling fallback)
const { useState, useEffect, useRef } = React;

function ChatRoom({ user, conversationId, onNavigate }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    loadConversationData();

    // Try to connect via Socket.io if available (set up by server)
    const token = localStorage.getItem('workpro_token');
    if (typeof io !== 'undefined' && token) {
      try {
        const sock = io(API_BASE, { auth: { token }, transports: ['websocket', 'polling'] });
        socketRef.current = sock;
        sock.on('connect', () => {
          sock.emit('join_room', conversationId);
        });
        sock.on('new_message', (msg) => {
          setMessages(prev => {
            // Avoid duplicate if our own message already arrived via sendMessage response
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        });
        sock.on('typing', ({ userId }) => {
          if (userId !== user?.uid) setTyping(true);
        });
        sock.on('stop_typing', ({ userId }) => {
          if (userId !== user?.uid) setTyping(false);
        });
        return () => { sock.disconnect(); };
      } catch (e) { /* Socket.io not available — fall through to polling */ }
    }

    // Polling fallback when Socket.io unavailable
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversationData = async () => {
    setLoading(true);
    try {
      const convData = await fetchConversations().catch(() => ({ conversations: [] }));
      const convs = convData.conversations || convData || [];
      const conv = convs.find(
        (c) => (c.id || c.conversation_id || c._id) === conversationId
      );
      if (conv) setConversation(conv);

      await loadMessages();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!user?.uid) return;
    try {
      const data = await fetchMessages(conversationId);
      setMessages(data.messages || data || []);
    } catch (e) {
      /* silent fail on polling */
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user?.uid) return;

    setSending(true);
    const tempId = Date.now();
    const tempMessage = {
      id: tempId,
      content: input.trim(),
      sender_uid: user.uid,
      created_at: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, tempMessage]);
    setInput("");

    try {
      const data = await sendMessage(conversationId, tempMessage.content);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...data, pending: false } : m
        )
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, failed: true, pending: false } : m
        )
      );
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const participantName =
    conversation?.participant_name ||
    conversation?.name ||
    "Chat";

  if (loading) {
    return (
      <div className="chat-room">
        <div className="chat-header">
          <button className="btn-back" onClick={() => onNavigate("/chat")}>&#8592; Back</button>
        </div>
        <SkeletonMessages count={5} />
      </div>
    );
  }

  return (
    <div className="chat-room">
      <div className="chat-header">
        <button className="btn-back" onClick={() => onNavigate("/chat")}>
          &#8592; Back
        </button>
        <div className="chat-participant">
          <div className="conv-avatar small">
            <span className="avatar-letter">
              {participantName.charAt(0).toUpperCase()}
            </span>
          </div>
          <strong>{participantName}</strong>
        </div>
      </div>

      {error && (
        <div className="chat-error">
          {error}
          <button className="btn btn-primary" onClick={loadConversationData}>
            Retry
          </button>
        </div>
      )}

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-messages">
            <p>No messages yet.</p>
            <p>Say hello to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_uid === user?.uid;
            return (
              <div
                key={msg.id || msg._id || msg.created_at}
                className={`message-bubble ${isMine ? "sent" : "received"} ${
                  msg.pending ? "pending" : ""
                } ${msg.failed ? "failed" : ""}`}
              >
                <p className="message-content">{msg.content}</p>
                <span className="message-time">
                  {msg.pending ? (
                    "Sending..."
                  ) : msg.failed ? (
                    "Failed"
                  ) : (
                    timeAgo(msg.created_at)
                  )}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {typing && (
        <div style={{ padding: '4px 16px', color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontStyle: 'italic' }}>
          typing...
        </div>
      )}
      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (socketRef.current) {
              socketRef.current.emit('typing', { roomId: conversationId, userId: user?.uid });
              clearTimeout(typingTimerRef.current);
              typingTimerRef.current = setTimeout(() => {
                socketRef.current && socketRef.current.emit('stop_typing', { roomId: conversationId, userId: user?.uid });
              }, 1500);
            }
          }}
          placeholder="Type a message..."
          className="chat-input"
          disabled={sending}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={sending || !input.trim()}
        >
          {sending ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
