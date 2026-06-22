/* WorkPro App Bundle — built by build-bundle.js */
(function(React, ReactDOM) {
"use strict";
var useState=React.useState,useEffect=React.useEffect,useCallback=React.useCallback,useRef=React.useRef,useMemo=React.useMemo;
var API_BASE = (window.__WP_API_BASE__ || "https://workpro-api.onrender.com");


/* === utils.js === */
// Utility functions for Work Pro

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const now = new Date();
  const then = new Date(dateStr);
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
function formatBudget(budget) {
  if (!budget) return "N/A";
  return `π${Number(budget).toFixed(2)}`;
}
function truncate(text, len = 120) {
  if (!text) return "";
  return text.length > len ? text.substring(0, len) + "..." : text;
}
function getStatusColor(status) {
  switch ((status || "").toLowerCase()) {
    case "open":
      return "#27ae60";
    case "in_progress":
      return "#f39c12";
    case "completed":
      return "#2980b9";
    case "cancelled":
      return "#e74c3c";
    case "pending":
      return "#f39c12";
    case "released":
      return "#27ae60";
    case "refunded":
      return "#95a5a6";
    default:
      return "#7f8c8d";
  }
}
function useCurrentUser() {
  const [user, setUser] = React.useState(null);
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("workpro_user");
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {
      console.error("Error parsing user:", e);
      localStorage.removeItem("workpro_user");
    }
  }, []);
  return {
    user,
    setUser
  };
}
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function generateId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}
function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
function useLocalStorage(key, initialValue) {
  const [value, setValue] = React.useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });
  const setStoredValue = val => {
    setValue(val);
    localStorage.setItem(key, JSON.stringify(val));
  };
  return [value, setStoredValue];
}
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

/* === api.js === */
// API helper functions
// API_BASE is declared by the bundle preamble (window.__WP_API_BASE__ || hardcoded fallback).
// When used in a Vite build (no preamble), declare it here from the env var.
if (typeof API_BASE === 'undefined') {
  var API_BASE = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE ? import.meta.env.VITE_API_BASE : "https://workpro-api.onrender.com";
}
function getHeaders() {
  const token = localStorage.getItem("workpro_token") || "";
  const headers = {
    "Content-Type": "application/json"
  };
  if (token) headers["Authorization"] = "Bearer " + token;
  // x-user-id fallback removed: JWT covers auth; sending uid without token is a security risk
  return headers;
}

// Queue for in-flight refresh so multiple 401s only trigger one refresh
let _refreshPromise = null;
async function _refreshToken() {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = (async () => {
    try {
      const raw = localStorage.getItem("workpro_user");
      const u = raw ? JSON.parse(raw) : null;
      const uid = u && (u.uid || u.id);
      if (!uid) return false;
      const body = {
        uid,
        username: u.username || ""
      };
      const piTok = window._wp_pendingAccessToken || null;
      if (piTok) body.accessToken = piTok;
      const r = await fetch(`${API_BASE}/api/me`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      if (!r.ok) return false;
      const d = await r.json();
      if (d && d.token) {
        localStorage.setItem("workpro_token", d.token);
        return true;
      }
    } catch (_) {}
    return false;
  })().finally(() => {
    _refreshPromise = null;
  });
  return _refreshPromise;
}
async function apiFetch(path, options = {}, _retry = true) {
  const url = `${API_BASE}${path}`;
  const headers = getHeaders();
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {})
    }
  });
  if (response.status === 401 && _retry) {
    const refreshed = await _refreshToken();
    if (refreshed) return apiFetch(path, options, false);
  }
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

// Jobs
function fetchJobs(params = "") {
  return apiFetch(`/api/jobs${params ? "?" + params : ""}`);
}
function fetchJob(id) {
  return apiFetch(`/api/jobs/${id}`);
}
function createJob(data) {
  return apiFetch("/api/jobs", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
function updateJob(id, data) {
  return apiFetch(`/api/jobs/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}
function deleteJob(id) {
  return apiFetch(`/api/jobs/${id}`, {
    method: "DELETE"
  });
}

// Applications
async function checkApplication(jobId) {
  try {
    return await apiFetch(`/api/jobs/${jobId}/check-applied`);
  } catch (e) {
    return {
      applied: false,
      status: null
    };
  }
}
async function applyToJob(data) {
  const response = await fetch(`${API_BASE}/api/applications`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (response.status === 409) {
    const d = await response.json().catch(() => ({}));
    const err = new Error(d.error || "Already applied");
    err.alreadyApplied = true;
    throw err;
  }
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }
  return response.json();
}
function fetchApplications(jobId) {
  return apiFetch(`/api/applications/job/${jobId}`);
}
function fetchMyApplications() {
  return apiFetch("/api/applications/my");
}
function updateApplicationStatus(appId, status) {
  return apiFetch(`/api/applications/${appId}/status`, {
    method: "PUT",
    body: JSON.stringify({
      status
    })
  });
}

// Escrow
function createEscrow(data) {
  return apiFetch("/api/escrow", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
function fetchEscrows() {
  return apiFetch("/api/escrow");
}
function releaseEscrow(escrowId) {
  return apiFetch(`/api/escrow/${escrowId}/release`, {
    method: "POST"
  });
}
function refundEscrow(escrowId) {
  return apiFetch(`/api/escrow/${escrowId}/refund`, {
    method: "POST"
  });
}

// Chat
function fetchConversations() {
  return apiFetch("/api/chat/conversations");
}
function fetchMessages(convId) {
  return apiFetch(`/api/chat/conversations/${convId}/messages`);
}
function sendMessage(convId, content) {
  return apiFetch(`/api/chat/conversations/${convId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      content
    })
  });
}
function createConversation(data) {
  return apiFetch("/api/chat/conversations", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

// Connects
function buyConnects(quantity, payment_id, txid, status) {
  return apiFetch("/api/connects/buy", {
    method: "POST",
    body: JSON.stringify({
      quantity,
      payment_id,
      txid,
      status
    })
  });
}
function fetchConnectsBalance() {
  return apiFetch("/api/connects/balance");
}

// Reviews
function submitReview(data) {
  return apiFetch("/api/reviews", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
function fetchUserReviews(userId) {
  return apiFetch(`/api/reviews/user/${userId}`);
}

// Auth / User
function fetchUserProfile() {
  return apiFetch("/api/users/me");
}
function updateUserProfile(data) {
  return apiFetch("/api/users/me", {
    method: "PUT",
    body: JSON.stringify(data)
  });
}
function getUnreadCount() {
  return apiFetch("/api/chat/unread");
}

/* === components/Skeleton.js === */
// Skeleton.js - Reusable skeleton loader components
function SkeletonBox({
  width,
  height,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "skeleton-box",
    style: {
      width: width || '100%',
      height: height || '16px',
      borderRadius: '6px',
      ...style
    }
  });
}
function SkeletonJobCard() {
  return /*#__PURE__*/React.createElement("div", {
    className: "job-card skeleton-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "job-card-header"
  }, /*#__PURE__*/React.createElement(SkeletonBox, {
    width: "60px",
    height: "22px"
  }), /*#__PURE__*/React.createElement(SkeletonBox, {
    width: "80px",
    height: "14px"
  })), /*#__PURE__*/React.createElement(SkeletonBox, {
    height: "22px",
    style: {
      marginTop: '12px',
      marginBottom: '8px'
    }
  }), /*#__PURE__*/React.createElement(SkeletonBox, {
    height: "14px",
    style: {
      marginBottom: '4px'
    }
  }), /*#__PURE__*/React.createElement(SkeletonBox, {
    height: "14px",
    width: "80%",
    style: {
      marginBottom: '12px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement(SkeletonBox, {
    width: "70px",
    height: "20px"
  }), /*#__PURE__*/React.createElement(SkeletonBox, {
    width: "90px",
    height: "20px"
  }), /*#__PURE__*/React.createElement(SkeletonBox, {
    width: "60px",
    height: "20px"
  })));
}
function SkeletonJobGrid({
  count
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "jobs-grid"
  }, Array.from({
    length: count || 6
  }).map((_, i) => /*#__PURE__*/React.createElement(SkeletonJobCard, {
    key: i
  })));
}
function SkeletonProfile() {
  return /*#__PURE__*/React.createElement("div", {
    className: "page-container"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      marginBottom: '24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "skeleton-box",
    style: {
      width: '72px',
      height: '72px',
      borderRadius: '50%'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(SkeletonBox, {
    width: "160px",
    height: "22px",
    style: {
      marginBottom: '8px'
    }
  }), /*#__PURE__*/React.createElement(SkeletonBox, {
    width: "120px",
    height: "16px"
  }))), /*#__PURE__*/React.createElement(SkeletonBox, {
    height: "16px",
    style: {
      marginBottom: '8px'
    }
  }), /*#__PURE__*/React.createElement(SkeletonBox, {
    height: "16px",
    width: "90%",
    style: {
      marginBottom: '8px'
    }
  }), /*#__PURE__*/React.createElement(SkeletonBox, {
    height: "16px",
    width: "70%",
    style: {
      marginBottom: '24px'
    }
  }), /*#__PURE__*/React.createElement(SkeletonBox, {
    height: "44px",
    style: {
      marginBottom: '12px'
    }
  }), /*#__PURE__*/React.createElement(SkeletonBox, {
    height: "44px",
    style: {
      marginBottom: '12px'
    }
  }), /*#__PURE__*/React.createElement(SkeletonBox, {
    height: "44px"
  }));
}
function SkeletonMessages({
  count
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "messages-container",
    style: {
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }
  }, Array.from({
    length: count || 5
  }).map((_, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      justifyContent: i % 2 === 0 ? 'flex-end' : 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "skeleton-box",
    style: {
      width: `${50 + i * 23 % 30}%`,
      height: '44px',
      borderRadius: '12px'
    }
  }))));
}

/* === components/Auth.js === */
// Auth.js - Pi Authentication Component

function Auth({
  onLogin
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    // Check for stored user on mount
    const stored = localStorage.getItem("workpro_user");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user && user.uid) {
          onLogin(user);
        }
      } catch (e) {
        localStorage.removeItem("workpro_user");
        localStorage.removeItem("workpro_token");
      }
    }
  }, []);
  const handleAuth = async () => {
    setLoading(true);
    setError("");
    try {
      if (typeof Pi === 'undefined' || !Pi.authenticate) {
        throw new Error("Pi SDK not loaded. Please open in Pi Browser.");
      }
      const scopes = ["username", "payments"];
      const authResult = await Pi.authenticate(scopes, onIncompletePaymentFound);

      // Send auth data to backend to register/login
      const response = await fetch(API_BASE + "/api/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          uid: authResult.user.uid,
          username: authResult.user.username || "Pi User",
          accessToken: authResult.accessToken
        })
      });
      if (!response.ok) {
        throw new Error("Backend authentication failed");
      }
      const data = await response.json();
      const userData = {
        uid: authResult.user.uid,
        username: authResult.user.username || "Pi User",
        token: authResult.accessToken,
        balance_connects: data.balance_connects || 0,
        ...data
      };
      if (data.token) {
        localStorage.setItem("workpro_token", data.token);
      }
      localStorage.setItem("workpro_user", JSON.stringify(userData));
      onLogin(userData);
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  function onIncompletePaymentFound(payment) {
    return apiFetch("/api/payments/incomplete", {
      method: "POST",
      body: JSON.stringify({
        payment
      })
    }).catch(err => {
      console.error("Failed to handle incomplete payment:", err);
      return Promise.resolve();
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "auth-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-logo"
  }, /*#__PURE__*/React.createElement("span", {
    className: "logo-icon"
  }, "\u03A0"), /*#__PURE__*/React.createElement("h1", null, "Work Pro")), /*#__PURE__*/React.createElement("p", {
    className: "auth-subtitle"
  }, "The decentralized freelance marketplace powered by Pi Network"), /*#__PURE__*/React.createElement("button", {
    className: "pi-auth-btn",
    onClick: handleAuth,
    disabled: loading
  }, loading ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "spinner"
  }), "Connecting...") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "pi-icon"
  }, "\u03A0"), "Sign in with Pi")), error && /*#__PURE__*/React.createElement("div", {
    className: "auth-error"
  }, error), /*#__PURE__*/React.createElement("div", {
    className: "auth-features"
  }, /*#__PURE__*/React.createElement("div", {
    className: "feature-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "feature-icon"
  }, "\uD83D\uDCBC"), /*#__PURE__*/React.createElement("span", null, "Find work & hire talent")), /*#__PURE__*/React.createElement("div", {
    className: "feature-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "feature-icon"
  }, "\uD83D\uDD11"), /*#__PURE__*/React.createElement("span", null, "Secure escrow payments")), /*#__PURE__*/React.createElement("div", {
    className: "feature-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "feature-icon"
  }, "\uD83D\uDCAC"), /*#__PURE__*/React.createElement("span", null, "Built-in messaging")), /*#__PURE__*/React.createElement("div", {
    className: "feature-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "feature-icon"
  }, "\u2B50"), /*#__PURE__*/React.createElement("span", null, "Reputation system")))));
}

/* === components/Navbar.js === */
// Navbar.js - Navigation Bar

function Navbar({
  user,
  onLogout,
  onNavigate,
  currentPath
}) {
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
        const data = await fetchConnectsBalance();
        setConnects(data.balance ?? data.balance_connects ?? 0);
      } catch (e) {
        /* silent fail */
      }
    };
    const fetchUnread = async () => {
      try {
        const data = await apiFetch("/api/chat/unread");
        setUnread(data.count || 0);
      } catch (e) {
        /* silent fail */
      }
    };
    fetchBalance();
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [user]);
  const navLinks = [{
    path: "/",
    label: "Home"
  }, {
    path: "/jobs",
    label: "Jobs"
  }, {
    path: "/create-job",
    label: "Post a Job"
  }, {
    path: "/my-jobs",
    label: "My Jobs"
  }, {
    path: "/chat",
    label: "Messages"
  }, {
    path: "/escrow",
    label: "Escrow"
  }, {
    path: "/connects",
    label: "Connects"
  }, {
    path: "/portfolio",
    label: "Portfolio"
  }, {
    path: "/profile",
    label: "Profile"
  }];
  const isAdmin = user?.is_admin || user?.username === 'cherry19899';
  if (isAdmin) {
    navLinks.push({
      path: "/admin",
      label: "Admin"
    });
  }
  return /*#__PURE__*/React.createElement("nav", {
    className: "navbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "navbar-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "navbar-brand",
    onClick: () => onNavigate("/")
  }, /*#__PURE__*/React.createElement("span", {
    className: "brand-icon"
  }, "\u03A0"), /*#__PURE__*/React.createElement("span", {
    className: "brand-text"
  }, "Work Pro")), /*#__PURE__*/React.createElement("button", {
    className: "navbar-toggle",
    onClick: () => setMenuOpen(!menuOpen),
    "aria-label": "Toggle menu"
  }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null)), /*#__PURE__*/React.createElement("div", {
    className: `navbar-links ${menuOpen ? "open" : ""}`
  }, navLinks.map(link => /*#__PURE__*/React.createElement("a", {
    key: link.path,
    className: `nav-link ${currentPath === link.path ? "active" : ""}`,
    onClick: e => {
      e.preventDefault();
      onNavigate(link.path);
      setMenuOpen(false);
    },
    href: link.path
  }, link.label, link.path === "/chat" && unread > 0 && /*#__PURE__*/React.createElement("span", {
    className: "nav-badge"
  }, unread)))), /*#__PURE__*/React.createElement("div", {
    className: "navbar-right"
  }, /*#__PURE__*/React.createElement("div", {
    className: "connects-badge"
  }, /*#__PURE__*/React.createElement("span", {
    className: "connects-icon"
  }, "\uD83D\uDD0C"), /*#__PURE__*/React.createElement("span", {
    className: "connects-count"
  }, connects)), /*#__PURE__*/React.createElement("div", {
    className: "user-info"
  }, /*#__PURE__*/React.createElement("span", {
    className: "user-name"
  }, user?.username || "Pi User"), /*#__PURE__*/React.createElement("button", {
    className: "logout-btn",
    onClick: onLogout,
    title: "Sign Out"
  }, "\u2192")))));
}

/* === components/Home.js === */
// Home.js - Landing / Job Listing Page

function Home({
  user,
  onNavigate
}) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const categories = ["Development", "Design", "Writing", "Marketing", "Data", "Translation", "Admin", "Other"];
  useEffect(() => {
    fetchJobsData();
  }, []);
  const fetchJobsData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchJobs("limit=8");
      setJobs(data.jobs || data || []);
    } catch (err) {
      setError(err.message);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !search || (job.title || "").toLowerCase().includes(search.toLowerCase()) || (job.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || job.category === category;
    return matchesSearch && matchesCategory;
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "home-container"
  }, /*#__PURE__*/React.createElement("section", {
    className: "hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero-content"
  }, /*#__PURE__*/React.createElement("h1", null, "Find Work. Hire Talent. Pay in Pi."), /*#__PURE__*/React.createElement("p", null, "The leading freelance marketplace on the Pi Network. Connect, collaborate, and get paid securely."), /*#__PURE__*/React.createElement("div", {
    className: "hero-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: () => onNavigate("/jobs")
  }, "Find Jobs"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary",
    onClick: () => onNavigate("/create-job")
  }, "Post a Job")))), /*#__PURE__*/React.createElement("section", {
    className: "search-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "search-bar"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Search jobs by keyword...",
    value: search,
    onChange: e => setSearch(e.target.value),
    className: "search-input"
  }), /*#__PURE__*/React.createElement("select", {
    value: category,
    onChange: e => setCategory(e.target.value),
    className: "category-select"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "All Categories"), categories.map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  }, c))), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: () => {
      setSearch("");
      setCategory("");
    }
  }, "Clear"))), /*#__PURE__*/React.createElement("section", {
    className: "jobs-section"
  }, /*#__PURE__*/React.createElement("h2", null, "Latest Jobs"), loading ? /*#__PURE__*/React.createElement("div", {
    className: "loading-container"
  }, /*#__PURE__*/React.createElement("span", {
    className: "spinner large"
  }), /*#__PURE__*/React.createElement("p", null, "Loading jobs...")) : error ? /*#__PURE__*/React.createElement("div", {
    className: "error-message"
  }, /*#__PURE__*/React.createElement("p", null, error), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: fetchJobsData
  }, "Retry")) : filteredJobs.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement("p", null, "No jobs found matching your criteria."), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: () => onNavigate("/create-job")
  }, "Be the first to post a job!")) : /*#__PURE__*/React.createElement("div", {
    className: "jobs-grid"
  }, filteredJobs.map(job => /*#__PURE__*/React.createElement("div", {
    key: job.id || job._id,
    className: "job-card",
    onClick: () => onNavigate(`/jobs/${job.id || job._id}`)
  }, /*#__PURE__*/React.createElement("div", {
    className: "job-card-header"
  }, /*#__PURE__*/React.createElement("span", {
    className: "job-status-badge",
    style: {
      backgroundColor: getStatusColor(job.status)
    }
  }, job.status || "Open"), /*#__PURE__*/React.createElement("span", {
    className: "job-date"
  }, timeAgo(job.created_at))), /*#__PURE__*/React.createElement("h3", {
    className: "job-title"
  }, job.title), /*#__PURE__*/React.createElement("p", {
    className: "job-description"
  }, truncate(job.description, 150)), /*#__PURE__*/React.createElement("div", {
    className: "job-client",
    onClick: e => {
      e.stopPropagation();
      onNavigate(`/portfolio/${job.client_id || job.client_uid || job.user_id || job.uid}`);
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "client-label"
  }, "Posted by:"), /*#__PURE__*/React.createElement("span", {
    className: "client-name"
  }, job.client_username || job.client_name || job.client_id || job.client_uid || job.user_id || 'Unknown')), /*#__PURE__*/React.createElement("div", {
    className: "job-meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "job-budget"
  }, formatBudget(job.budget)), /*#__PURE__*/React.createElement("span", {
    className: "job-category"
  }, job.category), /*#__PURE__*/React.createElement("span", {
    className: "job-connects"
  }, job.connects_required || 1, " connects")), /*#__PURE__*/React.createElement("div", {
    className: "job-skills"
  }, (job.skills || []).slice(0, 4).map(skill => /*#__PURE__*/React.createElement("span", {
    key: skill,
    className: "skill-tag"
  }, skill)))))), /*#__PURE__*/React.createElement("div", {
    className: "section-footer"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary",
    onClick: () => onNavigate("/jobs")
  }, "View All Jobs"))), /*#__PURE__*/React.createElement("section", {
    className: "how-it-works"
  }, /*#__PURE__*/React.createElement("h2", null, "How It Works"), /*#__PURE__*/React.createElement("div", {
    className: "steps-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "step-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "step-number"
  }, "1"), /*#__PURE__*/React.createElement("h3", null, "Sign In with Pi"), /*#__PURE__*/React.createElement("p", null, "Connect your Pi Network account securely in seconds.")), /*#__PURE__*/React.createElement("div", {
    className: "step-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "step-number"
  }, "2"), /*#__PURE__*/React.createElement("h3", null, "Post or Find Jobs"), /*#__PURE__*/React.createElement("p", null, "Create job listings or browse opportunities that match your skills.")), /*#__PURE__*/React.createElement("div", {
    className: "step-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "step-number"
  }, "3"), /*#__PURE__*/React.createElement("h3", null, "Apply & Collaborate"), /*#__PURE__*/React.createElement("p", null, "Send proposals, chat with clients, and agree on terms.")), /*#__PURE__*/React.createElement("div", {
    className: "step-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "step-number"
  }, "4"), /*#__PURE__*/React.createElement("h3", null, "Secure Payment"), /*#__PURE__*/React.createElement("p", null, "Work is secured via escrow and released when complete.")))), /*#__PURE__*/React.createElement("footer", {
    className: "footer"
  }, /*#__PURE__*/React.createElement("p", null, "\xA9 ", new Date().getFullYear(), " Work Pro. Powered by Pi Network.")));
}

/* === components/JobList.js === */
// JobList.js - All Jobs Page

function JobList({
  user,
  onNavigate
}) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 12;
  const categories = ["Development", "Design", "Writing", "Marketing", "Data", "Translation", "Admin", "Other"];
  useEffect(() => {
    loadJobs();
  }, [category, sortBy, page]);
  const loadJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (search) params.append("search", search);
      params.append("sort", sortBy);
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      const data = await fetchJobs(params.toString());
      const fetched = data.jobs || data || [];
      if (page === 1) {
        setJobs(fetched);
      } else {
        setJobs(prev => [...prev, ...fetched]);
      }
      setHasMore(fetched.length === limit);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = e => {
    e.preventDefault();
    setPage(1);
    loadJobs();
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "page-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-header"
  }, /*#__PURE__*/React.createElement("h1", null, "Browse Jobs"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: () => onNavigate("/create-job")
  }, "+ Post a Job")), /*#__PURE__*/React.createElement("div", {
    className: "filters-bar"
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSearch,
    className: "search-form"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Search jobs...",
    value: search,
    onChange: e => setSearch(e.target.value),
    className: "search-input"
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary"
  }, "Search")), /*#__PURE__*/React.createElement("select", {
    value: category,
    onChange: e => {
      setCategory(e.target.value);
      setPage(1);
    },
    className: "category-select"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "All Categories"), categories.map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  }, c))), /*#__PURE__*/React.createElement("select", {
    value: sortBy,
    onChange: e => {
      setSortBy(e.target.value);
      setPage(1);
    },
    className: "sort-select"
  }, /*#__PURE__*/React.createElement("option", {
    value: "newest"
  }, "Newest First"), /*#__PURE__*/React.createElement("option", {
    value: "budget_high"
  }, "Budget: High to Low"), /*#__PURE__*/React.createElement("option", {
    value: "budget_low"
  }, "Budget: Low to High"))), error && /*#__PURE__*/React.createElement("div", {
    className: "error-message"
  }, error, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: loadJobs
  }, "Retry")), loading && page === 1 ? /*#__PURE__*/React.createElement(SkeletonJobGrid, {
    count: 6
  }) : jobs.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement("p", null, "No jobs found."), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: () => onNavigate("/create-job")
  }, "Post the first job!")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "jobs-grid"
  }, jobs.map(job => /*#__PURE__*/React.createElement("div", {
    key: job.id || job._id,
    className: "job-card",
    onClick: () => onNavigate(`/jobs/${job.id || job._id}`)
  }, /*#__PURE__*/React.createElement("div", {
    className: "job-card-header"
  }, /*#__PURE__*/React.createElement("span", {
    className: "job-status-badge",
    style: {
      backgroundColor: getStatusColor(job.status)
    }
  }, job.status || "Open"), /*#__PURE__*/React.createElement("span", {
    className: "job-date"
  }, timeAgo(job.created_at))), /*#__PURE__*/React.createElement("h3", {
    className: "job-title"
  }, job.title), /*#__PURE__*/React.createElement("p", {
    className: "job-description"
  }, truncate(job.description, 150)), /*#__PURE__*/React.createElement("div", {
    className: "job-client",
    onClick: e => {
      e.stopPropagation();
      onNavigate(`/portfolio/${job.client_id || job.client_uid || job.user_id || job.uid}`);
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "client-label"
  }, "Posted by:"), /*#__PURE__*/React.createElement("span", {
    className: "client-name"
  }, job.client_username || job.client_name || job.client_id || job.client_uid || job.user_id || 'Unknown')), /*#__PURE__*/React.createElement("div", {
    className: "job-meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "job-budget"
  }, formatBudget(job.budget)), /*#__PURE__*/React.createElement("span", {
    className: "job-category"
  }, job.category), /*#__PURE__*/React.createElement("span", {
    className: "job-connects"
  }, job.connects_required || 1, " connects")), /*#__PURE__*/React.createElement("div", {
    className: "job-skills"
  }, (job.skills || []).slice(0, 4).map(skill => /*#__PURE__*/React.createElement("span", {
    key: skill,
    className: "skill-tag"
  }, skill)))))), hasMore && /*#__PURE__*/React.createElement("div", {
    className: "load-more"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary",
    onClick: () => setPage(p => p + 1),
    disabled: loading
  }, loading ? "Loading..." : "Load More"))));
}

/* === components/JobDetail.js === */
// JobDetail.js - Single Job Detail + Apply + Hire with Pi Escrow

function JobDetail({
  user,
  jobId,
  onNavigate
}) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyData, setApplyData] = useState({
    cover_letter: "",
    proposed_budget: ""
  });
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applications, setApplications] = useState([]);
  const [showApps, setShowApps] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [hiringId, setHiringId] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: ""
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  useEffect(() => {
    fetchJobDetail();
    if (user?.uid) checkApplied();
  }, [jobId]);
  const checkApplied = async () => {
    try {
      const data = await checkApplication(jobId);
      if (data?.applied) setHasApplied(true);
    } catch (e) {}
  };
  const fetchJobDetail = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchJob(jobId);
      setJob(data);
      setIsOwner(data.client_id === user?.uid || data.client_uid === user?.uid || data.posted_by === user?.uid);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const loadApplications = async () => {
    try {
      const data = await fetchApplications(jobId);
      setApplications(data.applications || data || []);
    } catch (e) {
      console.error("Failed to load applications:", e);
    }
  };
  const handleApply = async e => {
    e.preventDefault();
    if (!user?.uid) {
      onNavigate("/");
      return;
    }
    setApplying(true);
    try {
      await applyToJob({
        job_id: parseInt(jobId),
        message: applyData.cover_letter,
        bid_amount: parseFloat(applyData.proposed_budget) || job.budget,
        username: user.username
      });
      setHasApplied(true);
      setShowApplyForm(false);
      setApplyData({
        cover_letter: "",
        proposed_budget: ""
      });
    } catch (err) {
      if (err.alreadyApplied) {
        setHasApplied(true);
        setShowApplyForm(false);
        return;
      }
      alert(err.message);
    } finally {
      setApplying(false);
    }
  };

  // Hire freelancer with Pi payment → creates escrow
  const handleHire = async app => {
    if (!user?.uid) return;
    const amount = app.bid_amount || app.proposed_budget || job.budget || 1;
    const freelancerId = app.freelancer_uid || app.user_id || app.freelancer_id;
    const freelancerName = app.freelancer_username || freelancerId;
    const confirmed = window.confirm(`Hire ${freelancerName} for π${amount}?\n\nThis will initiate a Pi payment. The funds will be held in escrow until the job is completed.`);
    if (!confirmed) return;
    setHiringId(app.id);
    try {
      const paymentData = {
        amount: parseFloat(amount),
        memo: `WorkPro Escrow: ${job.title}`,
        metadata: {
          type: "escrow",
          job_id: jobId,
          application_id: app.id,
          freelancer_id: freelancerId,
          client_id: user.uid
        }
      };
      if (typeof Pi === 'undefined' || !Pi.initialized) {
        alert("Pi SDK not loaded. Please open in Pi Browser.");
        setHiringId(null);
        return;
      }
      await Pi.createPayment(paymentData, {
        onReadyForServerApproval: async paymentId => {
          try {
            await apiFetch("/api/payments/approve", {
              method: "POST",
              body: JSON.stringify({
                payment_id: paymentId,
                metadata: paymentData.metadata
              })
            });
          } catch (e) {
            console.error("Approval error:", e);
          }
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          try {
            await apiFetch("/api/payments/complete", {
              method: "POST",
              body: JSON.stringify({
                payment_id: paymentId,
                txid,
                metadata: paymentData.metadata
              })
            });
            await apiFetch(`/api/applications/${app.id}/hire`, {
              method: "POST",
              body: JSON.stringify({
                payment_id: paymentId,
                txid,
                amount
              })
            });
            alert(`${freelancerName} hired! π${amount} locked in escrow.`);
            fetchJobDetail();
            loadApplications();
          } catch (e) {
            console.error("Hire completion error:", e);
            alert("Payment sent but escrow creation failed. Contact support.");
          }
        },
        onCancel: () => {
          setHiringId(null);
          alert("Payment cancelled.");
        },
        onError: err => {
          setHiringId(null);
          alert(`Payment error: ${err.message || "Unknown error"}`);
        }
      });
    } catch (err) {
      alert(err.message || "Failed to initiate payment.");
    } finally {
      setHiringId(null);
    }
  };
  const handleStatusUpdate = async (appId, status) => {
    try {
      await updateApplicationStatus(appId, status);
      alert(`Application ${status}!`);
      loadApplications();
    } catch (err) {
      alert(err.message);
    }
  };

  // Release escrow (client marks job complete)
  const handleReleaseEscrow = async () => {
    const confirmed = window.confirm("Mark job as complete and release funds to freelancer?");
    if (!confirmed) return;
    try {
      const escrowData = await fetchEscrows();
      const escrow = (escrowData.escrows || []).find(e => String(e.job_id) === String(jobId) && e.status === "funded");
      if (!escrow) {
        alert("No active escrow found for this job.");
        return;
      }
      await releaseEscrow(escrow.id);
      alert("Funds released! Job marked as complete.");
      setShowReviewForm(true);
      fetchJobDetail();
    } catch (err) {
      alert(err.message);
    }
  };

  // Submit review after job completion
  const handleSubmitReview = async e => {
    e.preventDefault();
    if (!job) return;
    setSubmittingReview(true);
    try {
      // Find freelancer from applications
      const hired = applications.find(a => a.status === "accepted");
      const toUserId = hired?.freelancer_uid || hired?.user_id || hired?.freelancer_id;
      if (!toUserId) {
        alert("Could not determine freelancer to review.");
        return;
      }
      await submitReview({
        to_user_id: toUserId,
        job_id: parseInt(jobId),
        rating: reviewData.rating,
        comment: reviewData.comment
      });
      alert("Review submitted! Thank you.");
      setShowReviewForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };
  const startChat = async freelancerId => {
    try {
      const data = await createConversation({
        participant_uid: freelancerId,
        job_id: jobId
      });
      onNavigate(`/chat/${data.room_id || data.id || data.conversation_id}`);
    } catch (e) {
      console.error("Failed to start chat:", e);
    }
  };
  if (loading) {
    return /*#__PURE__*/React.createElement("div", {
      className: "loading-container"
    }, /*#__PURE__*/React.createElement("span", {
      className: "spinner large"
    }), /*#__PURE__*/React.createElement("p", null, "Loading job details..."));
  }
  if (error || !job) {
    return /*#__PURE__*/React.createElement("div", {
      className: "error-container"
    }, /*#__PURE__*/React.createElement("h2", null, "Error"), /*#__PURE__*/React.createElement("p", null, error || "Job not found"), /*#__PURE__*/React.createElement("button", {
      className: "btn btn-primary",
      onClick: () => onNavigate("/jobs")
    }, "Back to Jobs"));
  }
  const isInProgress = job.status === "in_progress";
  const isCompleted = job.status === "completed";
  return /*#__PURE__*/React.createElement("div", {
    className: "page-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "job-detail"
  }, /*#__PURE__*/React.createElement("div", {
    className: "job-detail-header"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-back",
    onClick: () => onNavigate("/jobs")
  }, "\u2190 Back"), /*#__PURE__*/React.createElement("span", {
    className: "job-status-badge large",
    style: {
      backgroundColor: getStatusColor(job.status)
    }
  }, job.status || "Open")), /*#__PURE__*/React.createElement("h1", {
    className: "job-detail-title"
  }, job.title), /*#__PURE__*/React.createElement("div", {
    className: "job-detail-meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "meta-item"
  }, /*#__PURE__*/React.createElement("strong", null, "Posted by:"), ' ', /*#__PURE__*/React.createElement("span", {
    className: "client-link",
    onClick: () => onNavigate(`/portfolio/${job.client_id || job.client_uid || job.user_id || job.posted_by}`),
    style: {
      cursor: 'pointer',
      color: '#7c3aed',
      textDecoration: 'underline'
    }
  }, job.client_username || job.client_name || job.posted_by_name || job.client_id || 'Unknown')), /*#__PURE__*/React.createElement("span", {
    className: "meta-item"
  }, /*#__PURE__*/React.createElement("strong", null, "Budget:"), " ", formatBudget(job.budget)), /*#__PURE__*/React.createElement("span", {
    className: "meta-item"
  }, /*#__PURE__*/React.createElement("strong", null, "Category:"), " ", job.category), /*#__PURE__*/React.createElement("span", {
    className: "meta-item"
  }, /*#__PURE__*/React.createElement("strong", null, "Connects Required:"), " ", job.connects_required || 1), /*#__PURE__*/React.createElement("span", {
    className: "meta-item"
  }, /*#__PURE__*/React.createElement("strong", null, "Posted:"), " ", formatDate(job.created_at)), job.duration && /*#__PURE__*/React.createElement("span", {
    className: "meta-item"
  }, /*#__PURE__*/React.createElement("strong", null, "Duration:"), " ", job.duration)), /*#__PURE__*/React.createElement("div", {
    className: "job-detail-section"
  }, /*#__PURE__*/React.createElement("h3", null, "Description"), /*#__PURE__*/React.createElement("p", {
    className: "job-detail-description"
  }, job.description)), job.skills && job.skills.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "job-detail-section"
  }, /*#__PURE__*/React.createElement("h3", null, "Required Skills"), /*#__PURE__*/React.createElement("div", {
    className: "job-skills"
  }, job.skills.map(skill => /*#__PURE__*/React.createElement("span", {
    key: skill,
    className: "skill-tag"
  }, skill)))), /*#__PURE__*/React.createElement("div", {
    className: "job-detail-actions"
  }, !isOwner && job.status === "open" && /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary btn-large",
    disabled: hasApplied,
    onClick: () => !hasApplied && setShowApplyForm(!showApplyForm)
  }, hasApplied ? "Applied ✓" : showApplyForm ? "Cancel" : "Apply Now"), isOwner && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary",
    onClick: () => {
      setShowApps(!showApps);
      if (!showApps) loadApplications();
    }
  }, showApps ? "Hide" : "View", " Applications"), isInProgress && /*#__PURE__*/React.createElement("button", {
    className: "btn btn-success",
    onClick: handleReleaseEscrow
  }, "\u2713 Release Payment (Complete Job)")), !isOwner && /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary",
    onClick: () => startChat(job.client_id || job.client_uid || job.posted_by)
  }, "Message Client")), showApplyForm && /*#__PURE__*/React.createElement("div", {
    className: "apply-form-container"
  }, /*#__PURE__*/React.createElement("h3", null, "Submit Application"), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleApply
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Cover Letter / Proposal"), /*#__PURE__*/React.createElement("textarea", {
    value: applyData.cover_letter,
    onChange: e => setApplyData({
      ...applyData,
      cover_letter: e.target.value
    }),
    placeholder: "Explain why you're a great fit for this job...",
    rows: 6,
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Proposed Budget (Pi)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.01",
    value: applyData.proposed_budget,
    onChange: e => setApplyData({
      ...applyData,
      proposed_budget: e.target.value
    }),
    placeholder: job.budget?.toString()
  })), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary",
    disabled: applying
  }, applying ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "spinner"
  }), " Submitting...") : "Submit Application"))), showApps && isOwner && /*#__PURE__*/React.createElement("div", {
    className: "applications-section"
  }, /*#__PURE__*/React.createElement("h3", null, "Applications (", applications.length, ")"), applications.length === 0 ? /*#__PURE__*/React.createElement("p", null, "No applications yet.") : applications.map(app => /*#__PURE__*/React.createElement("div", {
    key: app.id || app._id,
    className: "application-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "application-header"
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      cursor: 'pointer',
      color: '#7c3aed'
    },
    onClick: () => onNavigate(`/portfolio/${app.freelancer_uid || app.user_id}`)
  }, app.freelancer_username || app.freelancer_uid || "Freelancer"), /*#__PURE__*/React.createElement("span", {
    className: "app-status",
    style: {
      backgroundColor: getStatusColor(app.status)
    }
  }, app.status)), /*#__PURE__*/React.createElement("p", {
    className: "application-letter"
  }, app.cover_letter || app.message), /*#__PURE__*/React.createElement("p", {
    className: "application-budget"
  }, "Proposed: ", formatBudget(app.bid_amount || app.proposed_budget)), app.status === "pending" && /*#__PURE__*/React.createElement("div", {
    className: "application-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-success",
    onClick: () => handleHire(app),
    disabled: hiringId === app.id,
    title: "Hire this freelancer with Pi escrow payment"
  }, hiringId === app.id ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "spinner"
  }), " Processing...") : "🔒 Hire & Pay (Escrow)"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-danger",
    onClick: () => handleStatusUpdate(app.id || app._id, "rejected")
  }, "Reject"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary",
    onClick: () => startChat(app.freelancer_uid || app.user_id)
  }, "Chat")), app.status === "accepted" && /*#__PURE__*/React.createElement("div", {
    className: "application-actions"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#10b981',
      fontWeight: 'bold'
    }
  }, "\u2713 Hired"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary",
    onClick: () => startChat(app.freelancer_uid || app.user_id)
  }, "Chat"))))), showReviewForm && /*#__PURE__*/React.createElement("div", {
    className: "apply-form-container",
    style: {
      marginTop: '24px',
      background: '#f0fdf4',
      border: '1px solid #10b981'
    }
  }, /*#__PURE__*/React.createElement("h3", null, "\u2B50 Leave a Review"), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmitReview
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Rating"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px',
      fontSize: '28px'
    }
  }, [1, 2, 3, 4, 5].map(star => /*#__PURE__*/React.createElement("span", {
    key: star,
    style: {
      cursor: 'pointer',
      color: star <= reviewData.rating ? '#f59e0b' : '#d1d5db'
    },
    onClick: () => setReviewData({
      ...reviewData,
      rating: star
    })
  }, "\u2605")))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Comment"), /*#__PURE__*/React.createElement("textarea", {
    value: reviewData.comment,
    onChange: e => setReviewData({
      ...reviewData,
      comment: e.target.value
    }),
    placeholder: "How was working with this freelancer?",
    rows: 3
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary",
    disabled: submittingReview
  }, submittingReview ? "Submitting..." : "Submit Review"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-secondary",
    onClick: () => setShowReviewForm(false)
  }, "Skip"))))));
}

/* === components/CreateJob.js === */
// CreateJob.js - Create Job Form

function CreateJob({
  user,
  onNavigate
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    budget: "",
    duration: "",
    connects_required: 2,
    skills: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const categories = ["Development", "Design", "Writing", "Marketing", "Data", "Support", "Other"];
  const durations = ["Less than 1 week", "1-2 weeks", "2-4 weeks", "1-3 months", "3-6 months", "More than 6 months", "Ongoing"];
  const handleChange = e => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!user?.uid) {
      onNavigate("/");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        ...formData,
        budget: parseFloat(formData.budget),
        connects_required: parseInt(formData.connects_required),
        skills: formData.skills.split(",").map(s => s.trim()).filter(Boolean),
        posted_by_name: user.name || user.username || user.uid || 'User'
      };
      const data = await createJob(payload);
      setSuccess("Job posted successfully!");
      setTimeout(() => {
        onNavigate(`/jobs/${data.id || data.job_id || data._id}`);
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "page-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-header"
  }, /*#__PURE__*/React.createElement("h1", null, "Post a New Job")), /*#__PURE__*/React.createElement("div", {
    className: "form-card"
  }, success && /*#__PURE__*/React.createElement("div", {
    className: "success-message"
  }, success), error && /*#__PURE__*/React.createElement("div", {
    className: "error-message"
  }, error), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "title"
  }, "Job Title *"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    id: "title",
    name: "title",
    value: formData.title,
    onChange: handleChange,
    placeholder: "e.g., React Developer for E-commerce Website",
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "description"
  }, "Job Description *"), /*#__PURE__*/React.createElement("textarea", {
    id: "description",
    name: "description",
    value: formData.description,
    onChange: handleChange,
    placeholder: "Describe the project, requirements, deliverables...",
    rows: 8,
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "category"
  }, "Category *"), /*#__PURE__*/React.createElement("select", {
    id: "category",
    name: "category",
    value: formData.category,
    onChange: handleChange,
    required: true
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Select Category"), categories.map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  }, c)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "budget"
  }, "Budget (Pi) *"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    id: "budget",
    name: "budget",
    step: "0.01",
    min: "0.01",
    value: formData.budget,
    onChange: handleChange,
    placeholder: "0.00",
    required: true
  }))), /*#__PURE__*/React.createElement("div", {
    className: "form-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "duration"
  }, "Duration"), /*#__PURE__*/React.createElement("select", {
    id: "duration",
    name: "duration",
    value: formData.duration,
    onChange: handleChange
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Select Duration"), durations.map(d => /*#__PURE__*/React.createElement("option", {
    key: d,
    value: d
  }, d)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "connects_required"
  }, "Connects Required"), /*#__PURE__*/React.createElement("select", {
    id: "connects_required",
    name: "connects_required",
    value: formData.connects_required,
    onChange: handleChange
  }, /*#__PURE__*/React.createElement("option", {
    value: 1
  }, "1 Connect"), /*#__PURE__*/React.createElement("option", {
    value: 2
  }, "2 Connects"), /*#__PURE__*/React.createElement("option", {
    value: 3
  }, "3 Connects"), /*#__PURE__*/React.createElement("option", {
    value: 5
  }, "5 Connects"), /*#__PURE__*/React.createElement("option", {
    value: 10
  }, "10 Connects")))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "skills"
  }, "Skills (comma-separated)"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    id: "skills",
    name: "skills",
    value: formData.skills,
    onChange: handleChange,
    placeholder: "e.g., React, Node.js, CSS, UI Design"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary btn-large",
    disabled: submitting
  }, submitting ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "spinner"
  }), " Posting...") : "Post Job"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-secondary",
    onClick: () => onNavigate("/jobs")
  }, "Cancel")))));
}

/* === components/MyJobs.js === */
// MyJobs.js - My Jobs Dashboard

function MyJobs({
  user,
  onNavigate
}) {
  const [postedJobs, setPostedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("posted");
  useEffect(() => {
    fetchMyJobs();
  }, []);
  const fetchMyJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const [jobsData, appsData] = await Promise.all([fetchJobs("limit=100"), fetchMyApplications()]);
      setPostedJobs((jobsData.jobs || []).filter(j => j.posted_by === user?.uid));
      setAppliedJobs(appsData.applications || appsData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async jobId => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    try {
      await deleteJob(jobId);
      setPostedJobs(prev => prev.filter(j => (j.id || j._id) !== jobId));
      alert("Job deleted successfully");
    } catch (err) {
      alert(err.message);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "page-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-header"
  }, /*#__PURE__*/React.createElement("h1", null, "My Jobs Dashboard"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: () => onNavigate("/create-job")
  }, "+ Post a Job")), /*#__PURE__*/React.createElement("div", {
    className: "tabs"
  }, /*#__PURE__*/React.createElement("button", {
    className: `tab-btn ${activeTab === "posted" ? "active" : ""}`,
    onClick: () => setActiveTab("posted")
  }, "Posted Jobs (", postedJobs.length, ")"), /*#__PURE__*/React.createElement("button", {
    className: `tab-btn ${activeTab === "applied" ? "active" : ""}`,
    onClick: () => setActiveTab("applied")
  }, "My Applications (", appliedJobs.length, ")")), error && /*#__PURE__*/React.createElement("div", {
    className: "error-message"
  }, error, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: fetchMyJobs
  }, "Retry")), loading ? /*#__PURE__*/React.createElement("div", {
    className: "loading-container"
  }, /*#__PURE__*/React.createElement("span", {
    className: "spinner large"
  }), /*#__PURE__*/React.createElement("p", null, "Loading...")) : activeTab === "posted" ? postedJobs.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement("p", null, "You haven't posted any jobs yet."), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: () => onNavigate("/create-job")
  }, "Post Your First Job")) : /*#__PURE__*/React.createElement("div", {
    className: "jobs-list"
  }, postedJobs.map(job => /*#__PURE__*/React.createElement("div", {
    key: job.id || job._id,
    className: "job-list-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "job-list-info"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "job-list-title",
    onClick: () => onNavigate(`/jobs/${job.id || job._id}`)
  }, job.title), /*#__PURE__*/React.createElement("div", {
    className: "job-list-meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "job-status-badge",
    style: {
      backgroundColor: getStatusColor(job.status)
    }
  }, job.status || "Open"), /*#__PURE__*/React.createElement("span", null, formatBudget(job.budget)), /*#__PURE__*/React.createElement("span", null, job.category), /*#__PURE__*/React.createElement("span", null, timeAgo(job.created_at)))), /*#__PURE__*/React.createElement("div", {
    className: "job-list-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary",
    onClick: () => onNavigate(`/jobs/${job.id || job._id}`)
  }, "View"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-danger",
    onClick: () => handleDelete(job.id || job._id)
  }, "Delete"))))) : appliedJobs.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement("p", null, "You haven't applied to any jobs yet."), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: () => onNavigate("/jobs")
  }, "Browse Jobs")) : /*#__PURE__*/React.createElement("div", {
    className: "applications-list"
  }, appliedJobs.map(app => /*#__PURE__*/React.createElement("div", {
    key: app.id || app._id,
    className: "application-list-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "application-info"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "job-list-title",
    onClick: () => onNavigate(`/jobs/${app.job_id}`)
  }, app.job_title || "Untitled Job"), /*#__PURE__*/React.createElement("div", {
    className: "application-meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "app-status-badge",
    style: {
      backgroundColor: getStatusColor(app.status)
    }
  }, app.status || "Pending"), /*#__PURE__*/React.createElement("span", null, "Proposed: ", formatBudget(app.bid_amount)), /*#__PURE__*/React.createElement("span", null, timeAgo(app.created_at))), app.cover_letter && /*#__PURE__*/React.createElement("p", {
    className: "application-preview"
  }, truncate(app.cover_letter, 120))), /*#__PURE__*/React.createElement("div", {
    className: "application-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary",
    onClick: () => onNavigate(`/jobs/${app.job_id}`)
  }, "View Job"))))));
}

/* === components/Chat.js === */
// Chat.js - Chat Component (Conversations List)

function Chat({
  user,
  onNavigate
}) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, []);
  const loadConversations = async () => {
    if (!user?.uid) return;
    try {
      const data = await fetchConversations();
      setConversations(data.conversations || data || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const filteredConversations = conversations.filter(conv => {
    const name = conv.participant_name || conv.name || "";
    const lastMsg = conv.last_message || "";
    return name.toLowerCase().includes(search.toLowerCase()) || lastMsg.toLowerCase().includes(search.toLowerCase());
  });
  if (loading) {
    return /*#__PURE__*/React.createElement("div", {
      className: "loading-container"
    }, /*#__PURE__*/React.createElement("span", {
      className: "spinner large"
    }), /*#__PURE__*/React.createElement("p", null, "Loading conversations..."));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "page-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-header"
  }, /*#__PURE__*/React.createElement("h1", null, "Messages")), /*#__PURE__*/React.createElement("div", {
    className: "chat-search"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Search conversations...",
    value: search,
    onChange: e => setSearch(e.target.value),
    className: "search-input"
  })), error && /*#__PURE__*/React.createElement("div", {
    className: "error-message"
  }, error, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: loadConversations
  }, "Retry")), filteredConversations.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement("p", null, "No conversations yet."), /*#__PURE__*/React.createElement("p", null, "Start messaging from a job listing or application.")) : /*#__PURE__*/React.createElement("div", {
    className: "conversations-list"
  }, filteredConversations.map(conv => /*#__PURE__*/React.createElement("div", {
    key: conv.id || conv.conversation_id || conv._id,
    className: `conversation-card ${conv.unread_count > 0 ? "unread" : ""}`,
    onClick: () => onNavigate(`/chat/${conv.id || conv.conversation_id || conv._id}`)
  }, /*#__PURE__*/React.createElement("div", {
    className: "conv-avatar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "avatar-letter"
  }, (conv.participant_name || conv.name || "U").charAt(0).toUpperCase())), /*#__PURE__*/React.createElement("div", {
    className: "conv-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "conv-header"
  }, /*#__PURE__*/React.createElement("strong", {
    className: "conv-name"
  }, conv.participant_name || conv.name || "Unknown"), /*#__PURE__*/React.createElement("span", {
    className: "conv-time"
  }, timeAgo(conv.last_message_at || conv.updated_at))), /*#__PURE__*/React.createElement("p", {
    className: "conv-preview"
  }, conv.last_message ? truncate(conv.last_message, 80) : "No messages yet"), conv.unread_count > 0 && /*#__PURE__*/React.createElement("span", {
    className: "conv-unread-badge"
  }, conv.unread_count))))));
}

/* === components/ChatRoom.js === */
// ChatRoom.js - Single Chat Room (with Socket.io real-time support + polling fallback)

function ChatRoom({
  user,
  conversationId,
  onNavigate
}) {
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
        const sock = io(API_BASE, {
          auth: {
            token
          },
          transports: ['websocket', 'polling']
        });
        socketRef.current = sock;
        sock.on('connect', () => {
          sock.emit('join_room', conversationId);
        });
        sock.on('new_message', msg => {
          setMessages(prev => {
            // Avoid duplicate if our own message already arrived via sendMessage response
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        });
        sock.on('typing', ({
          userId
        }) => {
          if (userId !== user?.uid) setTyping(true);
        });
        sock.on('stop_typing', ({
          userId
        }) => {
          if (userId !== user?.uid) setTyping(false);
        });
        return () => {
          sock.disconnect();
        };
      } catch (e) {/* Socket.io not available — fall through to polling */}
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
      const convData = await fetchConversations().catch(() => ({
        conversations: []
      }));
      const convs = convData.conversations || convData || [];
      const conv = convs.find(c => (c.id || c.conversation_id || c._id) === conversationId);
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
  const handleSendMessage = async e => {
    e.preventDefault();
    if (!input.trim() || !user?.uid) return;
    setSending(true);
    const tempId = Date.now();
    const tempMessage = {
      id: tempId,
      content: input.trim(),
      sender_uid: user.uid,
      created_at: new Date().toISOString(),
      pending: true
    };
    setMessages(prev => [...prev, tempMessage]);
    setInput("");
    try {
      const data = await sendMessage(conversationId, tempMessage.content);
      setMessages(prev => prev.map(m => m.id === tempId ? {
        ...data,
        pending: false
      } : m));
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === tempId ? {
        ...m,
        failed: true,
        pending: false
      } : m));
    } finally {
      setSending(false);
    }
  };
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  };
  const participantName = conversation?.participant_name || conversation?.name || "Chat";
  if (loading) {
    return /*#__PURE__*/React.createElement("div", {
      className: "chat-room"
    }, /*#__PURE__*/React.createElement("div", {
      className: "chat-header"
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn-back",
      onClick: () => onNavigate("/chat")
    }, "\u2190 Back")), /*#__PURE__*/React.createElement(SkeletonMessages, {
      count: 5
    }));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "chat-room"
  }, /*#__PURE__*/React.createElement("div", {
    className: "chat-header"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-back",
    onClick: () => onNavigate("/chat")
  }, "\u2190 Back"), /*#__PURE__*/React.createElement("div", {
    className: "chat-participant"
  }, /*#__PURE__*/React.createElement("div", {
    className: "conv-avatar small"
  }, /*#__PURE__*/React.createElement("span", {
    className: "avatar-letter"
  }, participantName.charAt(0).toUpperCase())), /*#__PURE__*/React.createElement("strong", null, participantName))), error && /*#__PURE__*/React.createElement("div", {
    className: "chat-error"
  }, error, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: loadConversationData
  }, "Retry")), /*#__PURE__*/React.createElement("div", {
    className: "messages-container"
  }, messages.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty-messages"
  }, /*#__PURE__*/React.createElement("p", null, "No messages yet."), /*#__PURE__*/React.createElement("p", null, "Say hello to start the conversation!")) : messages.map(msg => {
    const isMine = msg.sender_uid === user?.uid;
    return /*#__PURE__*/React.createElement("div", {
      key: msg.id || msg._id || msg.created_at,
      className: `message-bubble ${isMine ? "sent" : "received"} ${msg.pending ? "pending" : ""} ${msg.failed ? "failed" : ""}`
    }, /*#__PURE__*/React.createElement("p", {
      className: "message-content"
    }, msg.content), /*#__PURE__*/React.createElement("span", {
      className: "message-time"
    }, msg.pending ? "Sending..." : msg.failed ? "Failed" : timeAgo(msg.created_at)));
  }), /*#__PURE__*/React.createElement("div", {
    ref: messagesEndRef
  })), typing && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 16px',
      color: 'rgba(255,255,255,0.4)',
      fontSize: '12px',
      fontStyle: 'italic'
    }
  }, "typing..."), /*#__PURE__*/React.createElement("form", {
    className: "chat-input-form",
    onSubmit: handleSendMessage
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: input,
    onChange: e => {
      setInput(e.target.value);
      if (socketRef.current) {
        socketRef.current.emit('typing', {
          roomId: conversationId,
          userId: user?.uid
        });
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          socketRef.current && socketRef.current.emit('stop_typing', {
            roomId: conversationId,
            userId: user?.uid
          });
        }, 1500);
      }
    },
    placeholder: "Type a message...",
    className: "chat-input",
    disabled: sending
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary",
    disabled: sending || !input.trim()
  }, sending ? "..." : "Send")));
}

/* === components/Escrow.js === */
// Escrow.js - Escrow Management

function Escrow({
  user,
  onNavigate
}) {
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    job_id: "",
    freelancer_uid: "",
    amount: ""
  });
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    fetchEscrowsData();
  }, []);
  const fetchEscrowsData = async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchEscrows();
      setEscrows(data.escrows || data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleCreate = async e => {
    e.preventDefault();
    if (!user?.uid) return;
    setCreating(true);
    try {
      await createEscrow({
        job_id: formData.job_id,
        freelancer_id: formData.freelancer_uid,
        amount: parseFloat(formData.amount)
      });
      alert("Escrow created successfully!");
      setShowCreateForm(false);
      setFormData({
        job_id: "",
        freelancer_uid: "",
        amount: ""
      });
      fetchEscrowsData();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };
  const handleRelease = async escrowId => {
    if (!confirm("Release funds to freelancer? This action cannot be undone.")) return;
    try {
      await releaseEscrow(escrowId);
      alert("Funds released successfully!");
      fetchEscrowsData();
    } catch (err) {
      alert(err.message);
    }
  };
  const handleRefund = async escrowId => {
    if (!confirm("Refund the escrow amount? This action cannot be undone.")) return;
    try {
      await refundEscrow(escrowId);
      alert("Escrow refunded successfully!");
      fetchEscrowsData();
    } catch (err) {
      alert(err.message);
    }
  };
  const getStatusBadge = status => {
    switch ((status || "").toLowerCase()) {
      case "funded":
        return {
          text: "Funded",
          color: "#f39c12"
        };
      case "released":
        return {
          text: "Released",
          color: "#27ae60"
        };
      case "refunded":
        return {
          text: "Refunded",
          color: "#95a5a6"
        };
      case "disputed":
        return {
          text: "Disputed",
          color: "#e74c3c"
        };
      default:
        return {
          text: status || "Pending",
          color: "#7f8c8d"
        };
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "page-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-header"
  }, /*#__PURE__*/React.createElement("h1", null, "Escrow Management"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: () => setShowCreateForm(!showCreateForm)
  }, showCreateForm ? "Cancel" : "+ New Escrow")), showCreateForm && /*#__PURE__*/React.createElement("div", {
    className: "form-card"
  }, /*#__PURE__*/React.createElement("h3", null, "Create New Escrow"), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleCreate
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Job ID"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: formData.job_id,
    onChange: e => setFormData({
      ...formData,
      job_id: e.target.value
    }),
    placeholder: "Enter job ID",
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Freelancer UID"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: formData.freelancer_uid,
    onChange: e => setFormData({
      ...formData,
      freelancer_uid: e.target.value
    }),
    placeholder: "Enter freelancer's Pi UID",
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Amount (Pi)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.01",
    min: "0",
    value: formData.amount,
    onChange: e => setFormData({
      ...formData,
      amount: e.target.value
    }),
    placeholder: "0.00",
    required: true
  })), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary",
    disabled: creating
  }, creating ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "spinner"
  }), " Creating...") : "Create Escrow"))), error && /*#__PURE__*/React.createElement("div", {
    className: "error-message"
  }, error, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: fetchEscrowsData
  }, "Retry")), loading ? /*#__PURE__*/React.createElement("div", {
    className: "loading-container"
  }, /*#__PURE__*/React.createElement("span", {
    className: "spinner large"
  }), /*#__PURE__*/React.createElement("p", null, "Loading escrows...")) : escrows.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement("p", null, "No escrow transactions yet."), /*#__PURE__*/React.createElement("p", null, "Create an escrow to securely pay freelancers for completed work.")) : /*#__PURE__*/React.createElement("div", {
    className: "escrow-list"
  }, escrows.map(esc => {
    const status = getStatusBadge(esc.status);
    return /*#__PURE__*/React.createElement("div", {
      key: esc.id || esc._id,
      className: "escrow-card"
    }, /*#__PURE__*/React.createElement("div", {
      className: "escrow-header"
    }, /*#__PURE__*/React.createElement("strong", null, "Escrow #", esc.id || esc._id), /*#__PURE__*/React.createElement("span", {
      className: "escrow-status",
      style: {
        backgroundColor: status.color
      }
    }, status.text)), /*#__PURE__*/React.createElement("div", {
      className: "escrow-details"
    }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "Job:"), " ", esc.job_title || esc.job_id), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "Freelancer:"), " ", esc.freelancer_name || esc.freelancer_uid), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "Amount:"), " ", formatBudget(esc.amount)), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "Created:"), " ", formatDate(esc.created_at))), esc.status === "funded" && /*#__PURE__*/React.createElement("div", {
      className: "escrow-actions"
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn btn-success",
      onClick: () => handleRelease(esc.id || esc._id)
    }, "Release"), /*#__PURE__*/React.createElement("button", {
      className: "btn btn-danger",
      onClick: () => handleRefund(esc.id || esc._id)
    }, "Refund")));
  })));
}

/* === components/Profile.js === */
// Profile.js - User Profile

function Profile({
  user,
  onUpdateUser
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    skills: "",
    hourly_rate: "",
    title: "",
    location: "",
    website: ""
  });
  useEffect(() => {
    fetchProfile();
  }, []);
  const fetchProfile = async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchUserProfile();
      const userData = data.user || data;
      setProfile(userData);
      setFormData({
        display_name: userData.display_name || userData.username || "",
        bio: userData.bio || "",
        skills: (userData.skills || []).join(", "),
        hourly_rate: userData.hourly_rate || "",
        title: userData.title || "",
        location: userData.location || "",
        website: userData.website || ""
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async e => {
    e.preventDefault();
    if (!user?.uid) return;
    setSaving(true);
    try {
      const data = await updateUserProfile({
        username: formData.display_name,
        bio: formData.bio,
        skills: formData.skills.split(",").map(s => s.trim()).filter(Boolean),
        title: formData.title,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        location: formData.location,
        website: formData.website
      });
      setProfile(data);

      // Update stored user
      const stored = JSON.parse(localStorage.getItem("workpro_user") || "{}");
      stored.username = formData.display_name || stored.username;
      localStorage.setItem("workpro_user", JSON.stringify(stored));
      onUpdateUser(stored);
      setEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return /*#__PURE__*/React.createElement(SkeletonProfile, null);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "page-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-header"
  }, /*#__PURE__*/React.createElement("h1", null, "My Profile"), !editing && /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: () => setEditing(true)
  }, "Edit Profile")), error && /*#__PURE__*/React.createElement("div", {
    className: "error-message"
  }, error, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: fetchProfile
  }, "Retry")), editing ? /*#__PURE__*/React.createElement("div", {
    className: "form-card"
  }, /*#__PURE__*/React.createElement("h3", null, "Edit Profile"), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSave
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Display Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: formData.display_name,
    onChange: e => setFormData({
      ...formData,
      display_name: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Professional Title"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: formData.title,
    onChange: e => setFormData({
      ...formData,
      title: e.target.value
    }),
    placeholder: "e.g., Full Stack Developer"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Bio"), /*#__PURE__*/React.createElement("textarea", {
    value: formData.bio,
    onChange: e => setFormData({
      ...formData,
      bio: e.target.value
    }),
    rows: 4,
    placeholder: "Tell us about yourself..."
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Skills (comma-separated)"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: formData.skills,
    onChange: e => setFormData({
      ...formData,
      skills: e.target.value
    }),
    placeholder: "e.g., React, Node.js, Python"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Hourly Rate (Pi)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.01",
    value: formData.hourly_rate,
    onChange: e => setFormData({
      ...formData,
      hourly_rate: e.target.value
    }),
    placeholder: "0.00"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Location"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: formData.location,
    onChange: e => setFormData({
      ...formData,
      location: e.target.value
    }),
    placeholder: "City, Country"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Website"), /*#__PURE__*/React.createElement("input", {
    type: "url",
    value: formData.website,
    onChange: e => setFormData({
      ...formData,
      website: e.target.value
    }),
    placeholder: "https://..."
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary",
    disabled: saving
  }, saving ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "spinner"
  }), " Saving...") : "Save Changes"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-secondary",
    onClick: () => setEditing(false)
  }, "Cancel")))) : /*#__PURE__*/React.createElement("div", {
    className: "profile-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "profile-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "profile-avatar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "avatar-letter"
  }, (profile?.username || user?.username || "U").charAt(0).toUpperCase())), /*#__PURE__*/React.createElement("div", {
    className: "profile-info"
  }, /*#__PURE__*/React.createElement("h2", null, profile?.display_name || profile?.username || user?.username || "Pi User"), profile?.title && /*#__PURE__*/React.createElement("p", {
    className: "profile-title"
  }, profile.title), /*#__PURE__*/React.createElement("p", {
    className: "profile-username"
  }, "@", user?.username || "piuser"))), profile?.bio && /*#__PURE__*/React.createElement("div", {
    className: "profile-section"
  }, /*#__PURE__*/React.createElement("h3", null, "About"), /*#__PURE__*/React.createElement("p", null, profile.bio)), (profile?.skills || []).length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "profile-section"
  }, /*#__PURE__*/React.createElement("h3", null, "Skills"), /*#__PURE__*/React.createElement("div", {
    className: "job-skills"
  }, profile.skills.map(skill => /*#__PURE__*/React.createElement("span", {
    key: skill,
    className: "skill-tag"
  }, skill)))), /*#__PURE__*/React.createElement("div", {
    className: "profile-stats"
  }, profile?.hourly_rate > 0 && /*#__PURE__*/React.createElement("div", {
    className: "stat-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "stat-value"
  }, "\uD835\uDF0B", profile.hourly_rate, "/hr"), /*#__PURE__*/React.createElement("span", {
    className: "stat-label"
  }, "Hourly Rate")), /*#__PURE__*/React.createElement("div", {
    className: "stat-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "stat-value"
  }, profile?.balance_connects || user?.balance_connects || 0), /*#__PURE__*/React.createElement("span", {
    className: "stat-label"
  }, "Connects")), /*#__PURE__*/React.createElement("div", {
    className: "stat-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "stat-value"
  }, profile?.jobs_posted || 0), /*#__PURE__*/React.createElement("span", {
    className: "stat-label"
  }, "Jobs Posted")), /*#__PURE__*/React.createElement("div", {
    className: "stat-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "stat-value"
  }, profile?.jobs_completed || 0), /*#__PURE__*/React.createElement("span", {
    className: "stat-label"
  }, "Jobs Completed")), /*#__PURE__*/React.createElement("div", {
    className: "stat-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "stat-value"
  }, profile?.rating ? profile.rating.toFixed(1) : "N/A"), /*#__PURE__*/React.createElement("span", {
    className: "stat-label"
  }, "Rating"))), (profile?.location || profile?.website) && /*#__PURE__*/React.createElement("div", {
    className: "profile-section"
  }, /*#__PURE__*/React.createElement("h3", null, "Contact Info"), profile?.location && /*#__PURE__*/React.createElement("p", null, "\uD83D\uDCCD ", profile.location), profile?.website && /*#__PURE__*/React.createElement("p", null, "\uD83C\uDF10", " ", /*#__PURE__*/React.createElement("a", {
    href: profile.website,
    target: "_blank",
    rel: "noopener noreferrer"
  }, profile.website))), /*#__PURE__*/React.createElement("div", {
    className: "profile-section"
  }, /*#__PURE__*/React.createElement("h3", null, "Pi Account"), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "UID:"), " ", user?.uid), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "Member since:"), " ", formatDate(profile?.created_at || new Date())))));
}

/* === components/Portfolio.js === */
// Portfolio.js - Public freelancer portfolio page

function Portfolio({
  user,
  profileUserId,
  onNavigate
}) {
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [portfolio, setPortfolio] = useState(null);
  const [portfolioItems, setPortfolioItems] = useState([]);

  // Determine whose portfolio to show
  const targetId = profileUserId || user?.uid;
  useEffect(() => {
    if (targetId) loadAll();
  }, [targetId]);
  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [profileData, reviewsData, portfolioData] = await Promise.all([apiFetch(`/api/users/${targetId}`), fetchUserReviews(targetId), apiFetch(`/api/users/${targetId}/portfolio`).catch(() => ({}))]);
      setProfile(profileData);
      setReviews(reviewsData.reviews || reviewsData.ratings || []);
      setPortfolio(portfolioData.portfolio || null);
      setPortfolioItems(portfolioData.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return /*#__PURE__*/React.createElement("div", {
      className: "loading-container"
    }, /*#__PURE__*/React.createElement("span", {
      className: "spinner large"
    }), /*#__PURE__*/React.createElement("p", null, "Loading portfolio..."));
  }
  if (error || !profile) {
    return /*#__PURE__*/React.createElement("div", {
      className: "error-container"
    }, /*#__PURE__*/React.createElement("h2", null, "Profile not found"), /*#__PURE__*/React.createElement("p", null, error || "This user does not exist."), /*#__PURE__*/React.createElement("button", {
      className: "btn btn-primary",
      onClick: () => onNavigate("/jobs")
    }, "Browse Jobs"));
  }
  const skills = profile.skills ? (typeof profile.skills === "string" ? profile.skills.split(",") : profile.skills).filter(Boolean) : [];
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : null;
  const isOwnProfile = user?.uid === targetId;
  const renderStars = rating => {
    const r = Math.round(rating);
    return Array.from({
      length: 5
    }, (_, i) => /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        color: i < r ? "#f59e0b" : "#d1d5db",
        fontSize: "18px"
      }
    }, "\u2605"));
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "page-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "profile-card",
    style: {
      background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
      color: "white",
      borderRadius: "16px",
      padding: "32px",
      marginBottom: "24px",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "24px",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "80px",
      height: "80px",
      borderRadius: "50%",
      background: "rgba(255,255,255,0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "36px",
      fontWeight: "bold",
      flexShrink: 0
    }
  }, (profile.username || "?")[0].toUpperCase()), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: "28px"
    }
  }, profile.username || "Anonymous"), portfolio?.headline && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "4px 0 0",
      opacity: 0.9,
      fontSize: "16px"
    }
  }, portfolio.headline), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "16px",
      marginTop: "8px",
      flexWrap: "wrap"
    }
  }, avgRating && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "4px"
    }
  }, renderStars(avgRating), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "4px"
    }
  }, avgRating, " (", reviews.length, " reviews)")), profile.total_jobs_completed > 0 && /*#__PURE__*/React.createElement("span", null, "\u2713 ", profile.total_jobs_completed, " jobs completed"))), isOwnProfile && /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary",
    onClick: () => onNavigate("/profile"),
    style: {
      background: "rgba(255,255,255,0.2)",
      color: "white",
      border: "1px solid rgba(255,255,255,0.4)"
    }
  }, "Edit Profile"), !isOwnProfile && /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary",
    onClick: () => onNavigate(`/chat`),
    style: {
      background: "rgba(255,255,255,0.2)",
      color: "white",
      border: "1px solid rgba(255,255,255,0.4)"
    }
  }, "\uD83D\uDCAC Message"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 2fr",
      gap: "24px",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "16px"
    }
  }, profile.bio && /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: "20px"
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 12px",
      color: "#374151"
    }
  }, "About"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: "#6b7280",
      lineHeight: "1.6"
    }
  }, profile.bio)), skills.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: "20px"
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 12px",
      color: "#374151"
    }
  }, "Skills"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px"
    }
  }, skills.map(s => /*#__PURE__*/React.createElement("span", {
    key: s,
    className: "skill-tag"
  }, s.trim())))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: "20px"
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 12px",
      color: "#374151"
    }
  }, "Stats"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "8px"
    }
  }, [{
    label: "Jobs Completed",
    value: profile.total_jobs_completed || 0
  }, {
    label: "Jobs Posted",
    value: profile.total_jobs_posted || 0
  }, {
    label: "Rating",
    value: avgRating ? `⭐ ${avgRating}` : "No reviews yet"
  }, {
    label: "Member Since",
    value: formatDate(profile.created_at)
  }].map(({
    label,
    value
  }) => /*#__PURE__*/React.createElement("div", {
    key: label,
    style: {
      display: "flex",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#6b7280"
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: "600",
      color: "#374151"
    }
  }, value))))), portfolio && (portfolio.website || portfolio.github || portfolio.linkedin) && /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: "20px"
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 12px",
      color: "#374151"
    }
  }, "Links"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "8px"
    }
  }, portfolio.website && /*#__PURE__*/React.createElement("a", {
    href: portfolio.website,
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      color: "#7c3aed"
    }
  }, "\uD83C\uDF10 Website"), portfolio.github && /*#__PURE__*/React.createElement("a", {
    href: portfolio.github,
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      color: "#7c3aed"
    }
  }, "\uD83D\uDCBB GitHub"), portfolio.linkedin && /*#__PURE__*/React.createElement("a", {
    href: portfolio.linkedin,
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      color: "#7c3aed"
    }
  }, "\uD83D\uDCBC LinkedIn")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "16px"
    }
  }, portfolio?.summary && /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: "20px"
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 12px",
      color: "#374151"
    }
  }, "Summary"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: "#6b7280",
      lineHeight: "1.6"
    }
  }, portfolio.summary), portfolio.experience_years > 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "8px 0 0",
      color: "#7c3aed",
      fontWeight: "600"
    }
  }, portfolio.experience_years, " years of experience")), portfolioItems.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: "20px"
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 16px",
      color: "#374151"
    }
  }, "Portfolio Projects"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
      gap: "12px"
    }
  }, portfolioItems.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.id,
    style: {
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      padding: "12px",
      background: "#fafafa"
    }
  }, item.image_url && /*#__PURE__*/React.createElement("img", {
    src: item.image_url,
    alt: item.title,
    style: {
      width: "100%",
      height: "120px",
      objectFit: "cover",
      borderRadius: "6px",
      marginBottom: "8px"
    },
    onError: e => {
      e.target.style.display = "none";
    }
  }), /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: "0 0 4px",
      fontSize: "14px"
    }
  }, item.title), item.description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 8px",
      fontSize: "13px",
      color: "#6b7280"
    }
  }, item.description.slice(0, 80), item.description.length > 80 ? "..." : ""), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "12px",
      color: "#7c3aed",
      background: "#ede9fe",
      padding: "2px 8px",
      borderRadius: "4px"
    }
  }, item.category))))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: "20px"
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 16px",
      color: "#374151"
    }
  }, "Reviews ", reviews.length > 0 && `(${reviews.length})`), reviews.length === 0 ? /*#__PURE__*/React.createElement("p", {
    style: {
      color: "#9ca3af"
    }
  }, "No reviews yet.") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "12px"
    }
  }, reviews.slice(0, 10).map(r => /*#__PURE__*/React.createElement("div", {
    key: r.id,
    style: {
      padding: "12px",
      borderRadius: "8px",
      background: "#f9fafb",
      border: "1px solid #f3f4f6"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "4px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: "600",
      fontSize: "14px"
    }
  }, r.from_username || "Anonymous"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex"
    }
  }, renderStars(r.rating))), r.comment && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: "#6b7280",
      fontSize: "14px"
    }
  }, r.comment), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "12px",
      color: "#9ca3af"
    }
  }, formatDate(r.created_at)))))))));
}

/* === components/Connects.js === */
// Connects.js - Buy Connects

function Connects({
  user,
  onUpdateUser
}) {
  const [balance, setBalance] = useState(user?.balance_connects || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [purchasing, setPurchasing] = useState(false);
  const packages = [{
    quantity: 10,
    price: 1,
    label: "Starter",
    popular: false
  }, {
    quantity: 50,
    price: 4,
    label: "Pro",
    popular: true
  }, {
    quantity: 100,
    price: 7,
    label: "Business",
    popular: false
  }, {
    quantity: 500,
    price: 30,
    label: "Enterprise",
    popular: false
  }];
  useEffect(() => {
    fetchBalance();
  }, []);
  const fetchBalance = async () => {
    if (!user?.uid) return;
    try {
      const data = await fetchConnectsBalance();
      setBalance(data.balance ?? data.balance_connects ?? 0);
    } catch (e) {
      /* silent fail */
    }
  };
  const handleBuy = async (quantity, price) => {
    if (!user?.uid) return;
    setPurchasing(quantity);
    setError("");
    try {
      if (typeof Pi === 'undefined' || !Pi.createPayment) {
        throw new Error("Pi SDK not loaded. Please open in Pi Browser.");
      }
      const paymentData = {
        amount: price,
        memo: `Buy ${quantity} WorkPro Connects`,
        metadata: {
          type: "connects",
          quantity,
          user_id: user.uid
        }
      };
      const payment = await Pi.createPayment(paymentData, {
        onReadyForServerApproval: async paymentId => {
          try {
            await apiFetch("/api/connects/buy", {
              method: "POST",
              body: JSON.stringify({
                quantity,
                payment_id: paymentId,
                amount: price,
                status: "pending"
              })
            });
          } catch (e) {
            console.error("Approval error:", e);
          }
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          try {
            const data = await apiFetch("/api/connects/buy", {
              method: "POST",
              body: JSON.stringify({
                quantity,
                payment_id: paymentId,
                txid,
                status: "completed"
              })
            });
            const newBalance = data.balance ?? data.balance_connects ?? balance + quantity;
            setBalance(newBalance);

            // Must set workpro_connects BEFORE workpro_user — the localStorage interceptor
            // in index.html reverts workpro_user.balance_connects to the stored workpro_connects
            // value if they differ. Setting it first prevents that revert.
            localStorage.setItem("workpro_connects", String(newBalance));
            const stored = JSON.parse(localStorage.getItem("workpro_user") || "{}");
            stored.balance_connects = newBalance;
            localStorage.setItem("workpro_user", JSON.stringify(stored));
            onUpdateUser(stored);
            alert(`Successfully purchased ${quantity} connects!`);
          } catch (e) {
            console.error("Completion error:", e);
            setError("Payment processing failed. Contact support.");
          }
        },
        onCancel: () => {
          setPurchasing(false);
          setError("Payment cancelled.");
        },
        onError: err => {
          setPurchasing(false);
          setError(`Payment error: ${err.message || "Unknown error"}`);
        }
      });
    } catch (err) {
      console.error("Buy error:", err);
      setError(err.message || "Failed to process payment.");
    } finally {
      setPurchasing(false);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "page-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-header"
  }, /*#__PURE__*/React.createElement("h1", null, "Buy Connects")), /*#__PURE__*/React.createElement("div", {
    className: "connects-balance-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "balance-display"
  }, /*#__PURE__*/React.createElement("span", {
    className: "balance-icon"
  }, "\uD83D\uDD0C"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "balance-number"
  }, balance), /*#__PURE__*/React.createElement("span", {
    className: "balance-label"
  }, "Available Connects")))), error && /*#__PURE__*/React.createElement("div", {
    className: "error-message"
  }, error), /*#__PURE__*/React.createElement("p", {
    className: "connects-info"
  }, "Connects are used to apply for jobs. Each job application costs the number of connects specified in the job listing."), /*#__PURE__*/React.createElement("div", {
    className: "packages-grid"
  }, packages.map(pkg => /*#__PURE__*/React.createElement("div", {
    key: pkg.quantity,
    className: `package-card ${pkg.popular ? "popular" : ""}`
  }, pkg.popular && /*#__PURE__*/React.createElement("div", {
    className: "popular-badge"
  }, "Most Popular"), /*#__PURE__*/React.createElement("h3", null, pkg.label), /*#__PURE__*/React.createElement("div", {
    className: "package-quantity"
  }, pkg.quantity, " ", /*#__PURE__*/React.createElement("span", null, "connects")), /*#__PURE__*/React.createElement("div", {
    className: "package-price"
  }, "\uD835\uDF0B", pkg.price, " ", /*#__PURE__*/React.createElement("span", null, "Pi")), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary btn-large",
    onClick: () => handleBuy(pkg.quantity, pkg.price),
    disabled: purchasing === pkg.quantity
  }, purchasing === pkg.quantity ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "spinner"
  }), " Processing...") : "Buy Now")))), /*#__PURE__*/React.createElement("div", {
    className: "connects-faq"
  }, /*#__PURE__*/React.createElement("h3", null, "Frequently Asked Questions"), /*#__PURE__*/React.createElement("details", null, /*#__PURE__*/React.createElement("summary", null, "What are Connects?"), /*#__PURE__*/React.createElement("p", null, "Connects are Work Pro's internal currency used to apply for jobs. Each job application consumes the number of connects specified by the client.")), /*#__PURE__*/React.createElement("details", null, /*#__PURE__*/React.createElement("summary", null, "How do I earn free Connects?"), /*#__PURE__*/React.createElement("p", null, "You receive a small amount of free connects daily. You can also earn connects by completing jobs and receiving positive reviews.")), /*#__PURE__*/React.createElement("details", null, /*#__PURE__*/React.createElement("summary", null, "Do Connects expire?"), /*#__PURE__*/React.createElement("p", null, "No, purchased connects never expire. Free connects may reset monthly.")), /*#__PURE__*/React.createElement("details", null, /*#__PURE__*/React.createElement("summary", null, "Can I get a refund?"), /*#__PURE__*/React.createElement("p", null, "Connect purchases are non-refundable. Please plan your usage accordingly."))));
}

/* === components/Applications.js === */
// Applications.js - View Applications

function Applications({
  user,
  onNavigate
}) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("received");
  const [receivedApps, setReceivedApps] = useState([]);
  useEffect(() => {
    fetchApplicationsData();
  }, []);
  const fetchApplicationsData = async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError("");
    try {
      // My sent applications
      const myData = await fetchMyApplications();
      setApplications(myData.applications || myData || []);

      // Received applications (for jobs I posted)
      const jobsData = await fetchJobs("limit=100");
      const jobs = (jobsData.jobs || []).filter(j => j.posted_by === user.uid);
      const allReceived = [];
      await Promise.all(jobs.map(async job => {
        try {
          const appsData = await fetchApplications(job.id || job._id);
          const apps = appsData.applications || appsData || [];
          apps.forEach(app => {
            app.job_title = job.title;
            allReceived.push(app);
          });
        } catch (e) {/* skip failed job */}
      }));
      setReceivedApps(allReceived);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleStatusUpdate = async (appId, status) => {
    try {
      await updateApplicationStatus(appId, status);
      alert(`Application ${status}!`);
      fetchApplicationsData();
    } catch (err) {
      alert(err.message);
    }
  };
  const startChat = async (freelancerId, jobId) => {
    try {
      const data = await createConversation({
        participant_uid: freelancerId,
        job_id: jobId
      });
      onNavigate(`/chat/${data.id || data.conversation_id || data.room_id}`);
    } catch (e) {
      console.error("Failed to start chat:", e);
    }
  };
  const createEscrow = app => {
    onNavigate("/escrow");
  };
  const allApps = activeTab === "received" ? receivedApps : applications;
  return /*#__PURE__*/React.createElement("div", {
    className: "page-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-header"
  }, /*#__PURE__*/React.createElement("h1", null, "Applications")), /*#__PURE__*/React.createElement("div", {
    className: "tabs"
  }, /*#__PURE__*/React.createElement("button", {
    className: `tab-btn ${activeTab === "received" ? "active" : ""}`,
    onClick: () => setActiveTab("received")
  }, "Received (", receivedApps.length, ")"), /*#__PURE__*/React.createElement("button", {
    className: `tab-btn ${activeTab === "sent" ? "active" : ""}`,
    onClick: () => setActiveTab("sent")
  }, "Sent (", applications.length, ")")), error && /*#__PURE__*/React.createElement("div", {
    className: "error-message"
  }, error, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: fetchApplicationsData
  }, "Retry")), loading ? /*#__PURE__*/React.createElement("div", {
    className: "loading-container"
  }, /*#__PURE__*/React.createElement("span", {
    className: "spinner large"
  }), /*#__PURE__*/React.createElement("p", null, "Loading applications...")) : allApps.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement("p", null, activeTab === "received" ? "No applications received yet." : "You haven't applied to any jobs yet."), activeTab === "sent" && /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: () => onNavigate("/jobs")
  }, "Browse Jobs")) : /*#__PURE__*/React.createElement("div", {
    className: "applications-list"
  }, allApps.map(app => /*#__PURE__*/React.createElement("div", {
    key: app.id || app._id,
    className: "application-card-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "application-header"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "job-list-title clickable",
    onClick: () => onNavigate(`/jobs/${app.job_id}`)
  }, app.job_title || "Untitled Job"), /*#__PURE__*/React.createElement("span", {
    className: "app-status-badge",
    style: {
      backgroundColor: getStatusColor(app.status)
    }
  }, app.status || "Pending")), /*#__PURE__*/React.createElement("div", {
    className: "application-body"
  }, activeTab === "received" && /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "From:"), " ", app.freelancer_username || app.freelancer_uid), activeTab === "sent" && /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "To:"), " ", app.client_username || app.client_uid || "Job Poster"), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "Proposed Budget:"), " ", formatBudget(app.bid_amount)), app.cover_letter && /*#__PURE__*/React.createElement("div", {
    className: "application-cover"
  }, /*#__PURE__*/React.createElement("strong", null, "Cover Letter:"), /*#__PURE__*/React.createElement("p", null, app.cover_letter)), /*#__PURE__*/React.createElement("p", {
    className: "application-date"
  }, "Applied ", timeAgo(app.created_at))), /*#__PURE__*/React.createElement("div", {
    className: "application-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary",
    onClick: () => onNavigate(`/jobs/${app.job_id}`)
  }, "View Job"), activeTab === "received" && app.status === "pending" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-success",
    onClick: () => handleStatusUpdate(app.id || app._id, "accepted")
  }, "Accept"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-danger",
    onClick: () => handleStatusUpdate(app.id || app._id, "rejected")
  }, "Reject"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary",
    onClick: () => startChat(app.freelancer_uid, app.job_id)
  }, "Chat")), activeTab === "received" && app.status === "accepted" && /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: () => createEscrow(app)
  }, "Create Escrow"), activeTab === "sent" && /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary",
    onClick: () => onNavigate(`/chat/${app.conversation_id || ""}`)
  }, "Chat"))))));
}

/* === components/Reviews.js === */
// Reviews.js - Reviews Component

function Reviews({
  user,
  onNavigate
}) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    reviewee_uid: "",
    job_id: "",
    rating: 5,
    comment: ""
  });
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    fetchReviews();
  }, []);
  const fetchReviews = async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchUserReviews(user.uid);
      setReviews(data.reviews || data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!user?.uid) return;
    setSubmitting(true);
    try {
      await submitReview({
        to_user_id: formData.reviewee_uid,
        job_id: formData.job_id,
        rating: parseInt(formData.rating),
        comment: formData.comment,
        reviewer_name: user.username
      });
      alert("Review submitted successfully!");
      setShowForm(false);
      setFormData({
        reviewee_uid: "",
        job_id: "",
        rating: 5,
        comment: ""
      });
      fetchReviews();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  const renderStars = rating => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(/*#__PURE__*/React.createElement("span", {
        key: i,
        className: `star ${i <= rating ? "filled" : ""}`
      }, "\u2605"));
    }
    return stars;
  };
  const averageRating = reviews.length ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length : 0;
  return /*#__PURE__*/React.createElement("div", {
    className: "page-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-header"
  }, /*#__PURE__*/React.createElement("h1", null, "Reviews & Ratings"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: () => setShowForm(!showForm)
  }, showForm ? "Cancel" : "+ Write Review")), /*#__PURE__*/React.createElement("div", {
    className: "reviews-summary"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rating-big"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rating-number"
  }, averageRating.toFixed(1)), /*#__PURE__*/React.createElement("div", {
    className: "rating-stars"
  }, renderStars(Math.round(averageRating))), /*#__PURE__*/React.createElement("span", {
    className: "rating-count"
  }, reviews.length, " reviews"))), showForm && /*#__PURE__*/React.createElement("div", {
    className: "form-card"
  }, /*#__PURE__*/React.createElement("h3", null, "Write a Review"), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "User UID (who you're reviewing)"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: formData.reviewee_uid,
    onChange: e => setFormData({
      ...formData,
      reviewee_uid: e.target.value
    }),
    placeholder: "Enter user's Pi UID",
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Job ID"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: formData.job_id,
    onChange: e => setFormData({
      ...formData,
      job_id: e.target.value
    }),
    placeholder: "Enter job ID",
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Rating"), /*#__PURE__*/React.createElement("div", {
    className: "star-rating-input"
  }, [1, 2, 3, 4, 5].map(star => /*#__PURE__*/React.createElement("button", {
    key: star,
    type: "button",
    className: `star-btn ${star <= formData.rating ? "filled" : ""}`,
    onClick: () => setFormData({
      ...formData,
      rating: star
    })
  }, "\u2605")))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Comment"), /*#__PURE__*/React.createElement("textarea", {
    value: formData.comment,
    onChange: e => setFormData({
      ...formData,
      comment: e.target.value
    }),
    rows: 4,
    placeholder: "Share your experience...",
    required: true
  })), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary",
    disabled: submitting
  }, submitting ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "spinner"
  }), " Submitting...") : "Submit Review"))), error && /*#__PURE__*/React.createElement("div", {
    className: "error-message"
  }, error, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: fetchReviews
  }, "Retry")), loading ? /*#__PURE__*/React.createElement("div", {
    className: "loading-container"
  }, /*#__PURE__*/React.createElement("span", {
    className: "spinner large"
  }), /*#__PURE__*/React.createElement("p", null, "Loading reviews...")) : reviews.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement("p", null, "No reviews yet."), /*#__PURE__*/React.createElement("p", null, "Complete jobs and leave reviews to build your reputation.")) : /*#__PURE__*/React.createElement("div", {
    className: "reviews-list"
  }, reviews.map(review => /*#__PURE__*/React.createElement("div", {
    key: review.id || review._id,
    className: "review-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "review-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "reviewer-info"
  }, /*#__PURE__*/React.createElement("div", {
    className: "conv-avatar small"
  }, /*#__PURE__*/React.createElement("span", {
    className: "avatar-letter"
  }, (review.reviewer_name || review.reviewer_uid || "U").charAt(0).toUpperCase())), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, review.reviewer_name || review.reviewer_uid), /*#__PURE__*/React.createElement("div", {
    className: "review-stars"
  }, renderStars(review.rating)))), /*#__PURE__*/React.createElement("span", {
    className: "review-date"
  }, timeAgo(review.created_at))), review.comment && /*#__PURE__*/React.createElement("p", {
    className: "review-comment"
  }, review.comment), review.job_title && /*#__PURE__*/React.createElement("p", {
    className: "review-job"
  }, "Job: ", review.job_title)))));
}

/* === App.js === */
// App.js - Main App with Client-Side Routing
// Portfolio component inlined to avoid separate file caching issues

// ─── Error Boundary ──────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return React.createElement('div', {
        style: {
          padding: '32px',
          textAlign: 'center',
          color: '#e5e5e5'
        }
      }, React.createElement('h2', null, 'Something went wrong'), React.createElement('p', {
        style: {
          color: 'rgba(255,255,255,0.5)',
          marginBottom: '16px'
        }
      }, this.state.error && this.state.error.message), React.createElement('button', {
        style: {
          background: '#10b981',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 20px',
          cursor: 'pointer'
        },
        onClick: () => {
          this.setState({
            hasError: false,
            error: null
          });
          window.location.hash = '#/';
        }
      }, 'Go Home'));
    }
    return this.props.children;
  }
}
function Portfolio({
  user,
  onNavigate
}) {
  const [isOwn, setIsOwn] = useState(true);
  const [targetUserId, setTargetUserId] = useState('');
  const [portfolio, setPortfolio] = useState(null);
  const [items, setItems] = useState([]);
  const [owner, setOwner] = useState(null);
  const [stats, setStats] = useState({
    jobs_posted: 0,
    jobs_completed: 0,
    rating: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [formData, setFormData] = useState({
    headline: '',
    summary: '',
    experience_years: 0,
    website: '',
    github: '',
    linkedin: ''
  });
  const [itemForm, setItemForm] = useState({
    title: '',
    description: '',
    image_url: '',
    category: 'Development',
    tags: ''
  });
  const categories = ['Development', 'Design', 'Writing', 'Marketing', 'Data', 'Video', 'Music', 'Other'];
  useEffect(() => {
    const hash = window.location.hash || '#/portfolio';
    const parts = hash.replace('#/', '/').split('/').filter(Boolean);
    const uid = parts.length > 1 && parts[0] === 'portfolio' ? parts[1] : '';
    if (uid) {
      setTargetUserId(uid);
      setIsOwn(uid === user?.uid);
    } else {
      setTargetUserId(user?.uid || '');
      setIsOwn(true);
    }
  }, [user]);
  const fetchPortfolio = useCallback(async () => {
    if (!targetUserId) return;
    setLoading(true);
    setError('');
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      const res = await fetch(API_BASE + '/api/users/' + targetUserId + '/portfolio', {
        headers
      });
      if (!res.ok) throw new Error('Failed to fetch portfolio');
      const data = await res.json();
      setPortfolio(data.portfolio || {});
      setItems(data.items || []);
      setOwner(data.owner || null);
      setStats(data.stats || {
        jobs_posted: 0,
        jobs_completed: 0,
        rating: 0
      });
      if (data.portfolio) {
        setFormData({
          headline: data.portfolio.headline || '',
          summary: data.portfolio.summary || '',
          experience_years: data.portfolio.experience_years || 0,
          website: data.portfolio.website || '',
          github: data.portfolio.github || '',
          linkedin: data.portfolio.linkedin || ''
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [targetUserId, user]);
  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);
  const handleSaveMeta = async e => {
    e.preventDefault();
    if (!user?.uid) return;
    setSaving(true);
    try {
      await apiFetch('/api/users/me/portfolio', {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      setEditing(false);
      fetchPortfolio();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };
  const handleAddItem = async e => {
    e.preventDefault();
    if (!user?.uid) return;
    setSaving(true);
    try {
      const tagsArray = itemForm.tags.split(',').map(t => t.trim()).filter(Boolean);
      await apiFetch('/api/users/me/portfolio/items', {
        method: 'POST',
        body: JSON.stringify({
          title: itemForm.title,
          description: itemForm.description,
          image_url: itemForm.image_url,
          category: itemForm.category,
          tags: tagsArray
        })
      });
      setShowAddItem(false);
      setItemForm({
        title: '',
        description: '',
        image_url: '',
        category: 'Development',
        tags: ''
      });
      fetchPortfolio();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteItem = async itemId => {
    if (!confirm('Remove this item from portfolio?')) return;
    try {
      await apiFetch('/api/users/me/portfolio/items/' + itemId, {
        method: 'DELETE'
      });
      fetchPortfolio();
    } catch (err) {
      alert(err.message);
    }
  };
  const getRatingStars = rating => {
    const r = parseFloat(rating) || 0;
    if (r <= 0 || isNaN(r)) return 'Not rated';
    const stars = Math.round(r);
    return '\u2605'.repeat(stars) + '\u2606'.repeat(5 - stars);
  };
  if (loading) {
    return /*#__PURE__*/React.createElement("div", {
      className: "loading-container"
    }, /*#__PURE__*/React.createElement("span", {
      className: "spinner large"
    }), /*#__PURE__*/React.createElement("p", null, "Loading portfolio..."));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "page-container portfolio-page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "portfolio-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "portfolio-avatar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "avatar-letter"
  }, (owner?.username || user?.username || 'U').charAt(0).toUpperCase())), /*#__PURE__*/React.createElement("div", {
    className: "portfolio-intro"
  }, /*#__PURE__*/React.createElement("h1", null, owner?.username || user?.username || 'Pi User'), portfolio?.headline && /*#__PURE__*/React.createElement("p", {
    className: "portfolio-headline"
  }, portfolio.headline), /*#__PURE__*/React.createElement("div", {
    className: "portfolio-stats-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "stat-badge"
  }, stats.jobs_completed || 0, " completed"), /*#__PURE__*/React.createElement("span", {
    className: "stat-badge"
  }, stats.rating ? stats.rating.toFixed(1) : 'N/A', " ", getRatingStars(stats.rating)), portfolio?.experience_years > 0 && /*#__PURE__*/React.createElement("span", {
    className: "stat-badge"
  }, portfolio.experience_years, "+ years exp"))), isOwn && /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: () => setEditing(!editing)
  }, editing ? 'Cancel' : 'Edit Portfolio')), error && /*#__PURE__*/React.createElement("div", {
    className: "error-message"
  }, error, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: fetchPortfolio
  }, "Retry")), editing && /*#__PURE__*/React.createElement("div", {
    className: "form-card portfolio-edit-card"
  }, /*#__PURE__*/React.createElement("h3", null, "Edit Portfolio"), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSaveMeta
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Professional Headline"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: formData.headline,
    onChange: e => setFormData({
      ...formData,
      headline: e.target.value
    }),
    placeholder: "e.g. Full Stack Developer specializing in React & Node.js"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Summary"), /*#__PURE__*/React.createElement("textarea", {
    value: formData.summary,
    onChange: e => setFormData({
      ...formData,
      summary: e.target.value
    }),
    rows: 4,
    placeholder: "Describe your expertise, approach, and what clients can expect..."
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Experience (years)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    value: formData.experience_years,
    onChange: e => setFormData({
      ...formData,
      experience_years: parseInt(e.target.value) || 0
    })
  }))), /*#__PURE__*/React.createElement("div", {
    className: "form-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Website"), /*#__PURE__*/React.createElement("input", {
    type: "url",
    value: formData.website,
    onChange: e => setFormData({
      ...formData,
      website: e.target.value
    }),
    placeholder: "https://..."
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "GitHub"), /*#__PURE__*/React.createElement("input", {
    type: "url",
    value: formData.github,
    onChange: e => setFormData({
      ...formData,
      github: e.target.value
    }),
    placeholder: "https://github.com/..."
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "LinkedIn"), /*#__PURE__*/React.createElement("input", {
    type: "url",
    value: formData.linkedin,
    onChange: e => setFormData({
      ...formData,
      linkedin: e.target.value
    }),
    placeholder: "https://linkedin.com/in/..."
  }))), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary",
    disabled: saving
  }, saving ? 'Saving...' : 'Save Changes')))), portfolio?.summary && !editing && /*#__PURE__*/React.createElement("div", {
    className: "portfolio-section"
  }, /*#__PURE__*/React.createElement("h2", null, "About"), /*#__PURE__*/React.createElement("p", {
    className: "portfolio-summary"
  }, portfolio.summary)), (portfolio?.website || portfolio?.github || portfolio?.linkedin) && !editing && /*#__PURE__*/React.createElement("div", {
    className: "portfolio-links"
  }, portfolio.website && /*#__PURE__*/React.createElement("a", {
    href: portfolio.website,
    target: "_blank",
    rel: "noopener noreferrer",
    className: "portfolio-link"
  }, "Website"), portfolio.github && /*#__PURE__*/React.createElement("a", {
    href: portfolio.github,
    target: "_blank",
    rel: "noopener noreferrer",
    className: "portfolio-link"
  }, "GitHub"), portfolio.linkedin && /*#__PURE__*/React.createElement("a", {
    href: portfolio.linkedin,
    target: "_blank",
    rel: "noopener noreferrer",
    className: "portfolio-link"
  }, "LinkedIn")), /*#__PURE__*/React.createElement("div", {
    className: "portfolio-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "portfolio-section-header"
  }, /*#__PURE__*/React.createElement("h2", null, "Work Samples (", items.length, ")"), isOwn && /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: () => setShowAddItem(!showAddItem)
  }, showAddItem ? 'Cancel' : '+ Add Work')), showAddItem && /*#__PURE__*/React.createElement("div", {
    className: "form-card portfolio-item-form"
  }, /*#__PURE__*/React.createElement("h3", null, "Add New Work"), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleAddItem
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Title *"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: itemForm.title,
    onChange: e => setItemForm({
      ...itemForm,
      title: e.target.value
    }),
    placeholder: "Project title",
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Description"), /*#__PURE__*/React.createElement("textarea", {
    value: itemForm.description,
    onChange: e => setItemForm({
      ...itemForm,
      description: e.target.value
    }),
    rows: 3,
    placeholder: "What you built, technologies used, results..."
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Image URL"), /*#__PURE__*/React.createElement("input", {
    type: "url",
    value: itemForm.image_url,
    onChange: e => setItemForm({
      ...itemForm,
      image_url: e.target.value
    }),
    placeholder: "https://... (screenshot or demo image)"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Category"), /*#__PURE__*/React.createElement("select", {
    value: itemForm.category,
    onChange: e => setItemForm({
      ...itemForm,
      category: e.target.value
    })
  }, categories.map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  }, c)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Tags (comma separated)"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: itemForm.tags,
    onChange: e => setItemForm({
      ...itemForm,
      tags: e.target.value
    }),
    placeholder: "React, Node.js, API"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary",
    disabled: saving
  }, saving ? 'Adding...' : 'Add Work')))), items.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement("p", null, "No work samples yet."), isOwn && /*#__PURE__*/React.createElement("p", null, "Add projects to showcase your skills to potential clients.")) : /*#__PURE__*/React.createElement("div", {
    className: "portfolio-items-grid"
  }, items.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.id,
    className: "portfolio-item-card"
  }, item.image_url && /*#__PURE__*/React.createElement("div", {
    className: "portfolio-item-image"
  }, /*#__PURE__*/React.createElement("img", {
    src: item.image_url,
    alt: item.title,
    loading: "lazy"
  })), /*#__PURE__*/React.createElement("div", {
    className: "portfolio-item-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "portfolio-item-header"
  }, /*#__PURE__*/React.createElement("span", {
    className: "portfolio-item-category"
  }, item.category), isOwn && /*#__PURE__*/React.createElement("button", {
    className: "btn btn-danger btn-sm",
    onClick: () => handleDeleteItem(item.id),
    title: "Remove"
  }, "x")), /*#__PURE__*/React.createElement("h3", {
    className: "portfolio-item-title"
  }, item.title), item.description && /*#__PURE__*/React.createElement("p", {
    className: "portfolio-item-desc"
  }, item.description), item.tags && /*#__PURE__*/React.createElement("div", {
    className: "portfolio-item-tags"
  }, item.tags.split(',').map((tag, i) => tag.trim() && /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "skill-tag"
  }, tag.trim())))))))));
}

// Simple hash-based router
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState("/");

  // Parse route from hash
  const parseRoute = useCallback(() => {
    const hash = window.location.hash || "#/";
    const path = hash.replace("#/", "/") || "/";
    setCurrentPath(path);
  }, []);

  // Check for stored user on mount
  useEffect(() => {
    const stored = localStorage.getItem("workpro_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.uid) {
          setUser(parsed);
          // Restore token for getHeaders() if it was stored in workpro_user but not as workpro_token
          if (parsed.token && !localStorage.getItem("workpro_token")) {
            localStorage.setItem("workpro_token", parsed.token);
          }
        }
      } catch (e) {
        console.error("Error parsing stored user:", e);
        localStorage.removeItem("workpro_user");
      }
    }
    setLoading(false);
    parseRoute();
  }, [parseRoute]);

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => parseRoute();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [parseRoute]);
  const handleLogin = userData => {
    setUser(userData);
    navigateTo("/");
  };
  const handleLogout = () => {
    localStorage.removeItem("workpro_user");
    localStorage.removeItem("workpro_token");
    setUser(null);
    navigateTo("/");
  };
  const handleUpdateUser = userData => {
    setUser(userData);
  };
  const navigateTo = path => {
    window.location.hash = path;
  };

  // Extract route params
  const getRouteParams = () => {
    const parts = currentPath.split("/").filter(Boolean);
    return parts;
  };

  // Render the appropriate component based on route
  const renderRoute = () => {
    const parts = getRouteParams();
    const route = parts.length === 0 ? "/" : "/" + parts[0];

    // Allow public portfolio viewing without auth
    if (route === '/portfolio') {
      return /*#__PURE__*/React.createElement(Portfolio, {
        user: user,
        profileUserId: parts[1] || null,
        onNavigate: navigateTo
      });
    }
    if (!user) {
      return /*#__PURE__*/React.createElement(Auth, {
        onLogin: handleLogin
      });
    }
    switch (route) {
      case "/":
        return /*#__PURE__*/React.createElement(Home, {
          user: user,
          onNavigate: navigateTo
        });
      case "/jobs":
        if (parts.length > 1) {
          // /jobs/:id
          return /*#__PURE__*/React.createElement(JobDetail, {
            user: user,
            jobId: parts[1],
            onNavigate: navigateTo
          });
        }
        return /*#__PURE__*/React.createElement(JobList, {
          user: user,
          onNavigate: navigateTo
        });
      case "/create-job":
        return /*#__PURE__*/React.createElement(CreateJob, {
          user: user,
          onNavigate: navigateTo
        });
      case "/my-jobs":
        return /*#__PURE__*/React.createElement(MyJobs, {
          user: user,
          onNavigate: navigateTo
        });
      case "/chat":
        if (parts.length > 1) {
          // /chat/:id
          return /*#__PURE__*/React.createElement(ChatRoom, {
            user: user,
            conversationId: parts[1],
            onNavigate: navigateTo
          });
        }
        return /*#__PURE__*/React.createElement(Chat, {
          user: user,
          onNavigate: navigateTo
        });
      case "/escrow":
        return /*#__PURE__*/React.createElement(Escrow, {
          user: user,
          onNavigate: navigateTo
        });
      case "/profile":
        return /*#__PURE__*/React.createElement(Profile, {
          user: user,
          onUpdateUser: handleUpdateUser
        });
      case "/connects":
        return /*#__PURE__*/React.createElement(Connects, {
          user: user,
          onUpdateUser: handleUpdateUser
        });
      case "/applications":
        return /*#__PURE__*/React.createElement(Applications, {
          user: user,
          onNavigate: navigateTo
        });
      case "/reviews":
        return /*#__PURE__*/React.createElement(Reviews, {
          user: user,
          onNavigate: navigateTo
        });
      case "/admin":
        if (typeof Admin !== 'undefined') {
          return /*#__PURE__*/React.createElement(Admin, {
            user: user,
            onNavigate: navigateTo
          });
        }
        return /*#__PURE__*/React.createElement("div", {
          className: "page-container"
        }, /*#__PURE__*/React.createElement("div", {
          className: "error-container"
        }, /*#__PURE__*/React.createElement("h1", null, "Coming Soon"), /*#__PURE__*/React.createElement("p", null, "Admin panel is not yet implemented."), /*#__PURE__*/React.createElement("button", {
          className: "btn btn-primary",
          onClick: () => navigateTo("/")
        }, "Go Home")));
      default:
        return /*#__PURE__*/React.createElement("div", {
          className: "page-container"
        }, /*#__PURE__*/React.createElement("div", {
          className: "error-container"
        }, /*#__PURE__*/React.createElement("h1", null, "404"), /*#__PURE__*/React.createElement("p", null, "Page not found."), /*#__PURE__*/React.createElement("button", {
          className: "btn btn-primary",
          onClick: () => navigateTo("/")
        }, "Go Home")));
    }
  };
  if (loading) {
    return /*#__PURE__*/React.createElement("div", {
      className: "loading-screen"
    }, /*#__PURE__*/React.createElement("span", {
      className: "spinner large"
    }), /*#__PURE__*/React.createElement("p", null, "Loading Work Pro..."));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "app"
  }, user && /*#__PURE__*/React.createElement(Navbar, {
    user: user,
    onLogout: handleLogout,
    onNavigate: navigateTo,
    currentPath: currentPath
  }), /*#__PURE__*/React.createElement("main", {
    className: "main-content"
  }, /*#__PURE__*/React.createElement(ErrorBoundary, null, renderRoute())));
}

/* === Mount === */
try {
  var rootEl = document.getElementById('root');
  if (rootEl && typeof App !== 'undefined') {
    if (ReactDOM.createRoot) {
      ReactDOM.createRoot(rootEl).render(React.createElement(App));
    } else {
      ReactDOM.render(React.createElement(App), rootEl);
    }
    console.log('[WorkPro] App mounted (CDN React build)');
  }
} catch(e) {
  console.error('[WorkPro] Mount failed:', e);
}

})(window.React, window.ReactDOM);
