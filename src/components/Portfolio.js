// Portfolio.js - Portfolio Component (placeholder)
const { useState, useEffect } = React;

function Portfolio({ user, onNavigate }) {
  const [portfolio, setPortfolio] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": user.uid,
      };
      const res = await fetch(
        `https://workpro-api.onrender.com/api/users/${user.uid}/portfolio`,
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data.portfolio || {});
        setItems(data.items || []);
      } else {
        throw new Error("Failed to fetch portfolio");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <span className="spinner large"></span>
        <p>Loading portfolio...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Portfolio</h1>
        <button className="btn btn-primary" onClick={() => onNavigate("/profile")}>
          Edit Profile
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button className="btn btn-primary" onClick={fetchPortfolio}>
            Retry
          </button>
        </div>
      )}

      <div className="portfolio-section">
        <h2>About</h2>
        <p>{portfolio?.summary || "No summary yet."}</p>
      </div>

      <div className="portfolio-section">
        <h2>Work Samples ({items.length})</h2>
        {items.length === 0 ? (
          <p>No portfolio items yet.</p>
        ) : (
          <div className="portfolio-grid">
            {items.map((item) => (
              <div key={item.id || item._id} className="portfolio-card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
