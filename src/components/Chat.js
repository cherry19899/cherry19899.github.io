// Chat.js - Chat Component (Conversations List)
const { useState, useEffect } = React;

function Chat({ user, onNavigate }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    if (!user?.uid) return;
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": user.uid,
      };
      const res = await fetch(
        "https://workpro-api.onrender.com/api/chat/rooms",
        { headers }
      );
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const data = await res.json();
      setConversations(data.conversations || data || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const name = conv.participant_name || conv.name || "";
    const lastMsg = conv.last_message || "";
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      lastMsg.toLowerCase().includes(search.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="loading-container">
        <span className="spinner large"></span>
        <p>Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Messages</h1>
      </div>

      <div className="chat-search">
        <input
          type="text"
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button className="btn btn-primary" onClick={fetchConversations}>
            Retry
          </button>
        </div>
      )}

      {filteredConversations.length === 0 ? (
        <div className="empty-state">
          <p>No conversations yet.</p>
          <p>Start messaging from a job listing or application.</p>
        </div>
      ) : (
        <div className="conversations-list">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id || conv.conversation_id || conv._id}
              className={`conversation-card ${conv.unread_count > 0 ? "unread" : ""}`}
              onClick={() =>
                onNavigate(`/chat/${conv.id || conv.conversation_id || conv._id}`)
              }
            >
              <div className="conv-avatar">
                <span className="avatar-letter">
                  {(conv.participant_name || conv.name || "U").charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="conv-body">
                <div className="conv-header">
                  <strong className="conv-name">
                    {conv.participant_name || conv.name || "Unknown"}
                  </strong>
                  <span className="conv-time">
                    {timeAgo(conv.last_message_at || conv.updated_at)}
                  </span>
                </div>
                <p className="conv-preview">
                  {conv.last_message
                    ? truncate(conv.last_message, 80)
                    : "No messages yet"}
                </p>
                {conv.unread_count > 0 && (
                  <span className="conv-unread-badge">{conv.unread_count}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
