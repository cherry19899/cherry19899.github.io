// API helper functions
const API_BASE = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE)
  ? import.meta.env.VITE_API_BASE
  : "https://workpro-api.onrender.com";

function getHeaders() {
  const token = localStorage.getItem("workpro_token") || "";
  const headers = { "Content-Type": "application/json" };
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
      const body = { uid, username: u.username || "" };
      const piTok = window._wp_pendingAccessToken || null;
      if (piTok) body.accessToken = piTok;
      const r = await fetch(`${API_BASE}/api/me`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) return false;
      const d = await r.json();
      if (d && d.token) {
        localStorage.setItem("workpro_token", d.token);
        return true;
      }
    } catch (_) {}
    return false;
  })().finally(() => { _refreshPromise = null; });
  return _refreshPromise;
}

async function apiFetch(path, options = {}, _retry = true) {
  const url = `${API_BASE}${path}`;
  const headers = getHeaders();
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
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
    body: JSON.stringify(data),
  });
}

function updateJob(id, data) {
  return apiFetch(`/api/jobs/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

function deleteJob(id) {
  return apiFetch(`/api/jobs/${id}`, { method: "DELETE" });
}

// Applications
async function checkApplication(jobId) {
  try {
    return await apiFetch(`/api/jobs/${jobId}/check-applied`);
  } catch (e) {
    return { applied: false, status: null };
  }
}

async function applyToJob(data) {
  const response = await fetch(`${API_BASE}/api/applications`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
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
    body: JSON.stringify({ status }),
  });
}

// Escrow
function createEscrow(data) {
  return apiFetch("/api/escrow", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

function fetchEscrows() {
  return apiFetch("/api/escrow");
}

function releaseEscrow(escrowId) {
  return apiFetch(`/api/escrow/${escrowId}/release`, { method: "POST" });
}

function refundEscrow(escrowId) {
  return apiFetch(`/api/escrow/${escrowId}/refund`, { method: "POST" });
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
    body: JSON.stringify({ content }),
  });
}

function createConversation(data) {
  return apiFetch("/api/chat/conversations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Connects
function buyConnects(quantity, payment_id, txid, status) {
  return apiFetch("/api/connects/buy", {
    method: "POST",
    body: JSON.stringify({ quantity, payment_id, txid, status }),
  });
}

function fetchConnectsBalance() {
  return apiFetch("/api/connects/balance");
}

// Reviews
function submitReview(data) {
  return apiFetch("/api/reviews", {
    method: "POST",
    body: JSON.stringify(data),
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
    body: JSON.stringify(data),
  });
}

function getUnreadCount() {
  return apiFetch("/api/chat/unread");
}
