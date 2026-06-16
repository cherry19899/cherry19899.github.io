// Auth.js - Pi Authentication Component
const { useState, useEffect } = React;

function Auth({ onLogin }) {
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
      const authResult = await Pi.authenticate(
        scopes,
        onIncompletePaymentFound
      );

      // Send auth data to backend to register/login
      const response = await fetch(
        "https://workpro-api.onrender.com/api/me",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: authResult.user.uid,
            username: authResult.user.username || "Pi User",
            accessToken: authResult.accessToken,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Backend authentication failed");
      }

      const data = await response.json();
      const userData = {
        uid: authResult.user.uid,
        username: authResult.user.username || "Pi User",
        token: authResult.accessToken,
        balance_connects: data.balance_connects || 0,
        ...data,
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
      body: JSON.stringify({ payment })
    })
      .catch(err => {
        console.error("Failed to handle incomplete payment:", err);
        return Promise.resolve();
      });
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-icon">&#928;</span>
          <h1>Work Pro</h1>
        </div>
        <p className="auth-subtitle">
          The decentralized freelance marketplace powered by Pi Network
        </p>
        <button
          className="pi-auth-btn"
          onClick={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Connecting...
            </>
          ) : (
            <>
              <span className="pi-icon">&#928;</span>
              Sign in with Pi
            </>
          )}
        </button>
        {error && <div className="auth-error">{error}</div>}
        <div className="auth-features">
          <div className="feature-item">
            <span className="feature-icon">&#128188;</span>
            <span>Find work & hire talent</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">&#128273;</span>
            <span>Secure escrow payments</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">&#128172;</span>
            <span>Built-in messaging</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">&#11088;</span>
            <span>Reputation system</span>
          </div>
        </div>
      </div>
    </div>
  );
}
