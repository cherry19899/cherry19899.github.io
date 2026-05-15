// API helper functions - All fetch calls include x-user-id header
const API_BASE = "https://workpro-api.onrender.com";

function getHeaders() {
  const user = localStorage.getItem("workpro_user");
  const userId = user ? JSON.parse(user).uid : "";
  return {
    "Content-Type": "application/json",
    "x-user-id": userId,
  };
}

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = getHeaders();
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });
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
function applyToJob(data) {
  return apiFetch("/api/applications", {
    method: "POST",
    body: JSON.stringify(data),
  });
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
function buyConnects(quantity) {
  return apiFetch("/api/connects/buy", {
    method: "POST",
    body: JSON.stringify({ quantity }),
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
