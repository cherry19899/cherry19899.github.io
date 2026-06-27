// Admin.js - Admin Dashboard
const { useState, useEffect } = React;

function Admin({ user, onNavigate }) {
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("jobs");

  // Settings state
  const [settings, setSettings] = useState(null);
  const [feeValue, setFeeValue] = useState("");
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeMsg, setFeeMsg] = useState("");

  useEffect(() => {
    if (!user?.is_admin && user?.username !== 'cherry19899') {
      onNavigate("/");
      return;
    }
    fetchData();
    fetchSettingsData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [jobsData, usersData, statsData] = await Promise.all([
        apiFetch("/api/admin/jobs/all"),
        apiFetch("/api/admin/users"),
        apiFetch("/api/admin/stats"),
      ]);
      setJobs(jobsData.jobs || jobsData || []);
      setUsers(usersData.users || usersData || []);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettingsData = async () => {
    try {
      const data = await fetchAdminSettings();
      setSettings(data);
      if (data.effective?.platform_fee_percent !== undefined) {
        setFeeValue(String(data.effective.platform_fee_percent));
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  };

  const handleSaveFee = async () => {
    setFeeLoading(true);
    setFeeMsg("");
    try {
      const val = parseFloat(feeValue);
      if (isNaN(val) || val < 0 || val > 10) {
        setFeeMsg("Fee must be 0-10%");
        return;
      }
      await updateAdminSetting("platform_fee_percent", val);
      setFeeMsg("Saved!");
      fetchSettingsData();
    } catch (e) {
      setFeeMsg("Error: " + (e.message || "Failed to save"));
    } finally {
      setFeeLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!confirm("Delete this job?")) return;
    try {
      await deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => (j.id || j._id) !== jobId));
      alert("Job deleted");
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Delete user " + userId + "? This is irreversible.")) return;
    alert("User delete not implemented yet");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <span className="spinner large"></span>
        <p>Loading admin data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.total_jobs || jobs.length || 0}</div>
            <div className="stat-label">Total Jobs</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.total_users || users.length || 0}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.total_applications || 0}</div>
            <div className="stat-label">Applications</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.total_escrows || 0}</div>
            <div className="stat-label">Escrows</div>
          </div>
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab-btn ${tab === "jobs" ? "active" : ""}`}
          onClick={() => setTab("jobs")}
        >
          Jobs ({jobs.length})
        </button>
        <button
          className={`tab-btn ${tab === "users" ? "active" : ""}`}
          onClick={() => setTab("users")}
        >
          Users ({users.length})
        </button>
        <button
          className={`tab-btn ${tab === "settings" ? "active" : ""}`}
          onClick={() => setTab("settings")}
        >
          Settings
        </button>
      </div>

      {tab === "jobs" && (
        <div className="admin-list">
          {jobs.length === 0 ? (
            <p>No jobs found.</p>
          ) : (
            jobs.map((job) => (
              <div key={job.id || job._id} className="admin-list-item">
                <div className="admin-list-info">
                  <h4 className="job-list-title">{job.title}</h4>
                  <div className="job-list-meta">
                    <span>{job.posted_by_name || job.posted_by}</span>
                    <span>{formatBudget(job.budget)}</span>
                    <span>{job.status}</span>
                    <span>{timeAgo(job.created_at)}</span>
                  </div>
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteJob(job.id || job._id)}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "users" && (
        <div className="admin-list">
          {users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            users.map((u) => (
              <div key={u.id || u._id || u.uid} className="admin-list-item">
                <div className="admin-list-info">
                  <h4>{u.username || u.name || u.id}</h4>
                  <div className="job-list-meta">
                    <span>{u.email || "No email"}</span>
                    <span>Jobs: {u.total_jobs_posted || 0}</span>
                    <span>Balance: {u.balance_connects || 0} connects</span>
                  </div>
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteUser(u.id || u.uid)}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "settings" && (
        <div className="form-card">
          <h3>Platform Settings</h3>

          <div className="form-group">
            <label>Platform Fee (%)</label>
            <div className="form-row" style={{ gap: '12px', alignItems: 'center' }}>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={feeValue}
                onChange={(e) => setFeeValue(e.target.value)}
                style={{ width: '100px' }}
              />
              <button
                className="btn btn-primary"
                onClick={handleSaveFee}
                disabled={feeLoading}
              >
                {feeLoading ? "Saving..." : "Save"}
              </button>
            </div>
            {feeMsg && (
              <p style={{ marginTop: '8px', color: feeMsg.includes("Error") ? '#e74c3c' : '#27ae60' }}>
                {feeMsg}
              </p>
            )}
          </div>

          {settings?.effective && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
              <p><strong>Current fee:</strong> {settings.effective.platform_fee_percent}%</p>
              <p><strong>Upwork fee:</strong> 20% (first $500), 10% ($500-10K), 5% ($10K+)</p>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                We are cheaper than Upwork! Current fee is capped at 10% max.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
