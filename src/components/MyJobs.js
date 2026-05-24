// MyJobs.js - My Jobs Dashboard
const { useState, useEffect } = React;

function MyJobs({ user, onNavigate }) {
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
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": user?.uid || "",
      };

      // Fetch posted jobs — filter client-side since backend has no client_uid filter
      const postedRes = await fetch(
        `https://workpro-api.onrender.com/api/jobs?limit=100`,
        { headers }
      );
      if (postedRes.ok) {
        const data = await postedRes.json();
        const allJobs = data.jobs || data || [];
        setPostedJobs(allJobs.filter(j => j.posted_by === user?.uid));
      }

      // Fetch applied jobs
      const appliedRes = await fetch(
        "https://workpro-api.onrender.com/api/applications/me",
        { headers }
      );
      if (appliedRes.ok) {
        const data = await appliedRes.json();
        setAppliedJobs(data.applications || data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": user.uid,
      };
      const res = await fetch(
        `https://workpro-api.onrender.com/api/jobs/${jobId}`,
        { method: "DELETE", headers }
      );
      if (res.ok) {
        setPostedJobs((prev) => prev.filter((j) => (j.id || j._id) !== jobId));
        alert("Job deleted successfully");
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Jobs Dashboard</h1>
        <button
          className="btn btn-primary"
          onClick={() => onNavigate("/create-job")}
        >
          + Post a Job
        </button>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "posted" ? "active" : ""}`}
          onClick={() => setActiveTab("posted")}
        >
          Posted Jobs ({postedJobs.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "applied" ? "active" : ""}`}
          onClick={() => setActiveTab("applied")}
        >
          My Applications ({appliedJobs.length})
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button className="btn btn-primary" onClick={fetchMyJobs}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <span className="spinner large"></span>
          <p>Loading...</p>
        </div>
      ) : activeTab === "posted" ? (
        postedJobs.length === 0 ? (
          <div className="empty-state">
            <p>You haven&apos;t posted any jobs yet.</p>
            <button
              className="btn btn-primary"
              onClick={() => onNavigate("/create-job")}
            >
              Post Your First Job
            </button>
          </div>
        ) : (
          <div className="jobs-list">
            {postedJobs.map((job) => (
              <div key={job.id || job._id} className="job-list-item">
                <div className="job-list-info">
                  <h3
                    className="job-list-title"
                    onClick={() => onNavigate(`/jobs/${job.id || job._id}`)}
                  >
                    {job.title}
                  </h3>
                  <div className="job-list-meta">
                    <span
                      className="job-status-badge"
                      style={{ backgroundColor: getStatusColor(job.status) }}
                    >
                      {job.status || "Open"}
                    </span>
                    <span>{formatBudget(job.budget)}</span>
                    <span>{job.category}</span>
                    <span>{timeAgo(job.created_at)}</span>
                  </div>
                </div>
                <div className="job-list-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => onNavigate(`/jobs/${job.id || job._id}`)}
                  >
                    View
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(job.id || job._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        appliedJobs.length === 0 ? (
          <div className="empty-state">
            <p>You haven&apos;t applied to any jobs yet.</p>
            <button
              className="btn btn-primary"
              onClick={() => onNavigate("/jobs")}
            >
              Browse Jobs
            </button>
          </div>
        ) : (
          <div className="applications-list">
            {appliedJobs.map((app) => (
              <div key={app.id || app._id} className="application-list-item">
                <div className="application-info">
                  <h3
                    className="job-list-title"
                    onClick={() =>
                      onNavigate(`/jobs/${app.job_id}`)
                    }
                  >
                    {app.job_title || "Untitled Job"}
                  </h3>
                  <div className="application-meta">
                    <span
                      className="app-status-badge"
                      style={{
                        backgroundColor: getStatusColor(app.status),
                      }}
                    >
                      {app.status || "Pending"}
                    </span>
                    <span>
                      Proposed: {formatBudget(app.proposed_budget)}
                    </span>
                    <span>{timeAgo(app.created_at)}</span>
                  </div>
                  {app.cover_letter && (
                    <p className="application-preview">
                      {truncate(app.cover_letter, 120)}
                    </p>
                  )}
                </div>
                <div className="application-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => onNavigate(`/jobs/${app.job_id}`)}
                  >
                    View Job
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
