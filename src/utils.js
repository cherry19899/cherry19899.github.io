// Utility functions for Work Pro

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
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
  return { user, setUser };
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
  const setStoredValue = (val) => {
    setValue(val);
    localStorage.setItem(key, JSON.stringify(val));
  };
  return [value, setStoredValue];
}

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}
