// ChatRoom.js - Single Chat Room
const { useState, useEffect, useRef } = React;

function ChatRoom({ user, conversationId, onNavigate }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversationData();
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
      <div className="loading-container">
        <span className="spinner large"></span>
        <p>Loading messages...</p>
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

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
