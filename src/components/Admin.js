// Admin.js - Admin Dashboard
const { useState, useEffect } = React;

function Admin({ user, onNavigate }) {
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("jobs");

  useEffect(() => {
    if (!user?.is_admin && user?.username !== 'cherry19899' && user?.uid !== 'cherry19899') {
      onNavigate("/");
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": user?.uid || "",
      };
      
      const [jobsRes, usersRes, statsRes] = await Promise.all([
        fetch("https://workpro-api.onrender.com/api/admin/jobs/all", { headers }),
        fetch("https://workpro-api.onrender.com/api/admin/users", { headers }),
        fetch("https://workpro-api.onrender.com/api/admin/stats", { headers }),
      ]);

      if (jobsRes.ok) {
        const data = await jobsRes.json();
        setJobs(data.jobs || data || []);
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || data || []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!confirm("Delete this job?")) return;
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": user?.uid || "",
      };
      const res = await fetch(`https://workpro-api.onrender.com/api/jobs/${jobId}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setJobs((prev) => prev.filter((j) => (j.id || j._id) !== jobId));
        alert("Job deleted");
      } else {
        const err = await res.text();
        throw new Error(err);
      }
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Delete user " + userId + "? This is irreversible.")) return;
    // No user delete endpoint yet
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
                <div className="admin-list-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => onNavigate(`/jobs/${job.id || job._id}`)}
                  >
                    View
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteJob(job.id || job._id)}
                  >
                    Delete
                  </button>
                </div>
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
              <div key={u.id || u._id} className="admin-list-item">
                <div className="admin-list-info">
                  <h4>{u.username || u.id}</h4>
                  <div className="job-list-meta">
                    <span>{u.role || "user"}</span>
                    <span>{u.kyc_verified ? "KYC" : "No KYC"}</span>
                    <span>Balance: {u.balance_pi || 0} Pi</span>
                  </div>
                </div>
                <div className="admin-list-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => onNavigate(`/portfolio/${u.id}`)}
                  >
                    Portfolio
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
