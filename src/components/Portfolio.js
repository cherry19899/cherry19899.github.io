// Portfolio.js - Public freelancer portfolio page
const { useState, useEffect } = React;

function Portfolio({ user, profileUserId, onNavigate }) {
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
      const [profileRes, reviewsRes, portfolioRes] = await Promise.all([
        fetch(`https://workpro-api.onrender.com/api/users/${targetId}`, {
          headers: { "x-user-id": user?.uid || "" }
        }),
        fetch(`https://workpro-api.onrender.com/api/reviews?user_id=${targetId}`, {
          headers: { "x-user-id": user?.uid || "" }
        }),
        fetch(`https://workpro-api.onrender.com/api/users/${targetId}/portfolio`, {
          headers: { "x-user-id": user?.uid || "" }
        }),
      ]);

      if (profileRes.ok) {
        const d = await profileRes.json();
        setProfile(d);
      }
      if (reviewsRes.ok) {
        const d = await reviewsRes.json();
        setReviews(d.reviews || d.ratings || []);
      }
      if (portfolioRes.ok) {
        const d = await portfolioRes.json();
        setPortfolio(d.portfolio || null);
        setPortfolioItems(d.items || []);
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

  if (error || !profile) {
    return (
      <div className="error-container">
        <h2>Profile not found</h2>
        <p>{error || "This user does not exist."}</p>
        <button className="btn btn-primary" onClick={() => onNavigate("/jobs")}>
          Browse Jobs
        </button>
      </div>
    );
  }

  const skills = profile.skills
    ? (typeof profile.skills === "string" ? profile.skills.split(",") : profile.skills).filter(Boolean)
    : [];

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : null;

  const isOwnProfile = user?.uid === targetId;

  const renderStars = (rating) => {
    const r = Math.round(rating);
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < r ? "#f59e0b" : "#d1d5db", fontSize: "18px" }}>★</span>
    ));
  };

  return (
    <div className="page-container">
      {/* Profile Header */}
      <div
        className="profile-card"
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
          color: "white",
          borderRadius: "16px",
          padding: "32px",
          marginBottom: "24px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
          <div
            style={{
              width: "80px", height: "80px", borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "36px", fontWeight: "bold", flexShrink: 0,
            }}
          >
            {(profile.username || "?")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: "28px" }}>{profile.username || "Anonymous"}</h1>
            {portfolio?.headline && (
              <p style={{ margin: "4px 0 0", opacity: 0.9, fontSize: "16px" }}>{portfolio.headline}</p>
            )}
            <div style={{ display: "flex", gap: "16px", marginTop: "8px", flexWrap: "wrap" }}>
              {avgRating && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {renderStars(avgRating)}
                  <span style={{ marginLeft: "4px" }}>{avgRating} ({reviews.length} reviews)</span>
                </span>
              )}
              {profile.total_jobs_completed > 0 && (
                <span>✓ {profile.total_jobs_completed} jobs completed</span>
              )}
            </div>
          </div>
          {isOwnProfile && (
            <button
              className="btn btn-secondary"
              onClick={() => onNavigate("/profile")}
              style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.4)" }}
            >
              Edit Profile
            </button>
          )}
          {!isOwnProfile && (
            <button
              className="btn btn-secondary"
              onClick={() => onNavigate(`/chat`)}
              style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.4)" }}
            >
              💬 Message
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", flexWrap: "wrap" }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* About */}
          {profile.bio && (
            <div className="card" style={{ padding: "20px" }}>
              <h3 style={{ margin: "0 0 12px", color: "#374151" }}>About</h3>
              <p style={{ margin: 0, color: "#6b7280", lineHeight: "1.6" }}>{profile.bio}</p>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div className="card" style={{ padding: "20px" }}>
              <h3 style={{ margin: "0 0 12px", color: "#374151" }}>Skills</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {skills.map((s) => (
                  <span key={s} className="skill-tag">{s.trim()}</span>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ margin: "0 0 12px", color: "#374151" }}>Stats</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { label: "Jobs Completed", value: profile.total_jobs_completed || 0 },
                { label: "Jobs Posted", value: profile.total_jobs_posted || 0 },
                { label: "Rating", value: avgRating ? `⭐ ${avgRating}` : "No reviews yet" },
                { label: "Member Since", value: formatDate(profile.created_at) },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6b7280" }}>{label}</span>
                  <span style={{ fontWeight: "600", color: "#374151" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          {portfolio && (portfolio.website || portfolio.github || portfolio.linkedin) && (
            <div className="card" style={{ padding: "20px" }}>
              <h3 style={{ margin: "0 0 12px", color: "#374151" }}>Links</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {portfolio.website && (
                  <a href={portfolio.website} target="_blank" rel="noopener noreferrer" style={{ color: "#7c3aed" }}>
                    🌐 Website
                  </a>
                )}
                {portfolio.github && (
                  <a href={portfolio.github} target="_blank" rel="noopener noreferrer" style={{ color: "#7c3aed" }}>
                    💻 GitHub
                  </a>
                )}
                {portfolio.linkedin && (
                  <a href={portfolio.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: "#7c3aed" }}>
                    💼 LinkedIn
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Portfolio Summary */}
          {portfolio?.summary && (
            <div className="card" style={{ padding: "20px" }}>
              <h3 style={{ margin: "0 0 12px", color: "#374151" }}>Summary</h3>
              <p style={{ margin: 0, color: "#6b7280", lineHeight: "1.6" }}>{portfolio.summary}</p>
              {portfolio.experience_years > 0 && (
                <p style={{ margin: "8px 0 0", color: "#7c3aed", fontWeight: "600" }}>
                  {portfolio.experience_years} years of experience
                </p>
              )}
            </div>
          )}

          {/* Portfolio Items */}
          {portfolioItems.length > 0 && (
            <div className="card" style={{ padding: "20px" }}>
              <h3 style={{ margin: "0 0 16px", color: "#374151" }}>Portfolio Projects</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
                {portfolioItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: "1px solid #e5e7eb", borderRadius: "8px",
                      padding: "12px", background: "#fafafa",
                    }}
                  >
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "6px", marginBottom: "8px" }}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    )}
                    <h4 style={{ margin: "0 0 4px", fontSize: "14px" }}>{item.title}</h4>
                    {item.description && (
                      <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#6b7280" }}>
                        {item.description.slice(0, 80)}{item.description.length > 80 ? "..." : ""}
                      </p>
                    )}
                    <span style={{ fontSize: "12px", color: "#7c3aed", background: "#ede9fe", padding: "2px 8px", borderRadius: "4px" }}>
                      {item.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ margin: "0 0 16px", color: "#374151" }}>
              Reviews {reviews.length > 0 && `(${reviews.length})`}
            </h3>
            {reviews.length === 0 ? (
              <p style={{ color: "#9ca3af" }}>No reviews yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {reviews.slice(0, 10).map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: "12px", borderRadius: "8px",
                      background: "#f9fafb", border: "1px solid #f3f4f6",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontWeight: "600", fontSize: "14px" }}>
                        {r.from_username || "Anonymous"}
                      </span>
                      <span style={{ display: "flex" }}>{renderStars(r.rating)}</span>
                    </div>
                    {r.comment && (
                      <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>{r.comment}</p>
                    )}
                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>{formatDate(r.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
