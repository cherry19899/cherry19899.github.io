// Profile.js - User Profile
const { useState, useEffect } = React;

function Profile({ user, onUpdateUser }) {
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
    website: "",
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
        website: userData.website || "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    setSaving(true);
    try {
      const data = await updateUserProfile({
        username: formData.display_name,
        bio: formData.bio,
        skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
        title: formData.title,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        location: formData.location,
        website: formData.website,
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
    return (
      <div className="loading-container">
        <span className="spinner large"></span>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Profile</h1>
        {!editing && (
          <button className="btn btn-primary" onClick={() => setEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button className="btn btn-primary" onClick={fetchProfile}>
            Retry
          </button>
        </div>
      )}

      {editing ? (
        <div className="form-card">
          <h3>Edit Profile</h3>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Display Name</label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Professional Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Full Stack Developer"
              />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={4}
                placeholder="Tell us about yourself..."
              />
            </div>
            <div className="form-group">
              <label>Skills (comma-separated)</label>
              <input
                type="text"
                value={formData.skills}
                onChange={(e) =>
                  setFormData({ ...formData, skills: e.target.value })
                }
                placeholder="e.g., React, Node.js, Python"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Hourly Rate (Pi)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, hourly_rate: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="City, Country"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner"></span> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <span className="avatar-letter">
                {(profile?.username || user?.username || "U").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="profile-info">
              <h2>{profile?.display_name || profile?.username || user?.username || "Pi User"}</h2>
              {profile?.title && <p className="profile-title">{profile.title}</p>}
              <p className="profile-username">@{user?.username || "piuser"}</p>
            </div>
          </div>

          {profile?.bio && (
            <div className="profile-section">
              <h3>About</h3>
              <p>{profile.bio}</p>
            </div>
          )}

          {(profile?.skills || []).length > 0 && (
            <div className="profile-section">
              <h3>Skills</h3>
              <div className="job-skills">
                {profile.skills.map((skill) => (
                  <span key={skill} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>
          )}

          <div className="profile-stats">
            {profile?.hourly_rate > 0 && (
              <div className="stat-item">
                <span className="stat-value">&#120587;{profile.hourly_rate}/hr</span>
                <span className="stat-label">Hourly Rate</span>
              </div>
            )}
            <div className="stat-item">
              <span className="stat-value">{profile?.balance_connects || user?.balance_connects || 0}</span>
              <span className="stat-label">Connects</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{profile?.jobs_posted || 0}</span>
              <span className="stat-label">Jobs Posted</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{profile?.jobs_completed || 0}</span>
              <span className="stat-label">Jobs Completed</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {profile?.rating ? profile.rating.toFixed(1) : "N/A"}
              </span>
              <span className="stat-label">Rating</span>
            </div>
          </div>

          {(profile?.location || profile?.website) && (
            <div className="profile-section">
              <h3>Contact Info</h3>
              {profile?.location && <p>&#128205; {profile.location}</p>}
              {profile?.website && (
                <p>
                  &#127760;{" "}
                  <a href={profile.website} target="_blank" rel="noopener noreferrer">
                    {profile.website}
                  </a>
                </p>
              )}
            </div>
          )}

          <div className="profile-section">
            <h3>Pi Account</h3>
            <p>
              <strong>UID:</strong> {user?.uid}
            </p>
            <p>
              <strong>Member since:</strong>{" "}
              {formatDate(profile?.created_at || new Date())}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
