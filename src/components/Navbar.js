// Navbar.js - Navigation Bar
const { useState, useEffect } = React;

function Navbar({ user, onLogout, onNavigate, currentPath }) {
  const [connects, setConnects] = useState(user?.balance_connects || 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (user?.balance_connects !== undefined) {
      setConnects(user.balance_connects);
    }
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;
    const fetchBalance = async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          "x-user-id": user.uid,
        };
        const res = await fetch(
          "https://workpro-api.onrender.com/api/connects/balance",
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          setConnects(data.balance ?? data.balance_connects ?? 0);
        }
      } catch (e) {
        /* silent fail */
      }
    };
    const fetchUnread = async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          "x-user-id": user.uid,
        };
        const res = await fetch(
          "https://workpro-api.onrender.com/api/chat/unread",
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          setUnread(data.count || 0);
        }
      } catch (e) {
        /* silent fail */
      }
    };
    fetchBalance();
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/jobs", label: "Jobs" },
    { path: "/create-job", label: "Post a Job" },
    { path: "/my-jobs", label: "My Jobs" },
    { path: "/chat", label: "Messages" },
    { path: "/escrow", label: "Escrow" },
    { path: "/connects", label: "Connects" },
    { path: "/profile", label: "Profile" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => onNavigate("/")}>
          <span className="brand-icon">&#928;</span>
          <span className="brand-text">Work Pro</span>
        </div>

        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          {navLinks.map((link) => (
            <a
              key={link.path}
              className={`nav-link ${currentPath === link.path ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(link.path);
                setMenuOpen(false);
              }}
              href={link.path}
            >
              {link.label}
              {link.path === "/chat" && unread > 0 && (
                <span className="nav-badge">{unread}</span>
              )}
            </a>
          ))}
        </div>

        <div className="navbar-right">
          <div className="connects-badge">
            <span className="connects-icon">&#128268;</span>
            <span className="connects-count">{connects}</span>
          </div>
          <div className="user-info">
            <span className="user-name">
              {user?.username || "Pi User"}
            </span>
            <button className="logout-btn" onClick={onLogout} title="Sign Out">
              &#8594;
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
