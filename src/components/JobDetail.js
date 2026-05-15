// JobDetail.js - Single Job Detail + Apply
const { useState, useEffect } = React;

function JobDetail({ user, jobId, onNavigate }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyData, setApplyData] = useState({
    cover_letter: "",
    proposed_budget: "",
  });
  const [applying, setApplying] = useState(false);
  const [applications, setApplications] = useState([]);
  const [showApps, setShowApps] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetchJobDetail();
  }, [jobId]);

  const fetchJobDetail = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": user?.uid || "",
      };
      const res = await fetch(
        `https://workpro-api.onrender.com/api/jobs/${jobId}`,
        { headers }
      );
      if (!res.ok) throw new Error("Failed to fetch job details");
      const data = await res.json();
      setJob(data);
      setIsOwner(data.client_id === user?.uid || data.client_uid === user?.uid);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": user?.uid || "",
      };
      const res = await fetch(
        `https://workpro-api.onrender.com/api/applications/job/${jobId}`,
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || data || []);
      }
    } catch (e) {
      console.error("Failed to load applications:", e);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!user?.uid) {
      onNavigate("/");
      return;
    }
    setApplying(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": user.uid,
      };
      const res = await fetch(
        "https://workpro-api.onrender.com/api/applications",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            job_id: jobId,
            cover_letter: applyData.cover_letter,
            proposed_budget: parseFloat(applyData.proposed_budget) || job.budget,
          }),
        }
      );
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Application failed");
      }
      alert("Application submitted successfully!");
      setShowApplyForm(false);
      setApplyData({ cover_letter: "", proposed_budget: "" });
    } catch (err) {
      alert(err.message);
    } finally {
      setApplying(false);
    }
  };

  const handleStatusUpdate = async (appId, status) => {
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": user.uid,
      };
      const res = await fetch(
        `https://workpro-api.onrender.com/api/applications/${appId}/status`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) throw new Error("Update failed");
      alert(`Application ${status}!`);
      fetchApplications();
    } catch (err) {
      alert(err.message);
    }
  };

  const startChat = async (freelancerId) => {
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": user.uid,
      };
      const res = await fetch(
        "https://workpro-api.onrender.com/api/chat/conversations",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            participant_uid: freelancerId,
            job_id: jobId,
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        onNavigate(`/chat/${data.id || data.conversation_id}`);
      }
    } catch (e) {
      console.error("Failed to start chat:", e);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <span className="spinner large"></span>
        <p>Loading job details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error || "Job not found"}</p>
        <button className="btn btn-primary" onClick={() => onNavigate("/jobs")}>
          Back to Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="job-detail">
        <div className="job-detail-header">
          <button className="btn-back" onClick={() => onNavigate("/jobs")}>
            &#8592; Back
          </button>
          <span
            className="job-status-badge large"
            style={{ backgroundColor: getStatusColor(job.status) }}
          >
            {job.status || "Open"}
          </span>
        </div>

        <h1 className="job-detail-title">{job.title}</h1>

        <div className="job-detail-meta">
          <span className="meta-item">
            <strong>Budget:</strong> {formatBudget(job.budget)}
          </span>
          <span className="meta-item">
            <strong>Category:</strong> {job.category}
          </span>
          <span className="meta-item">
            <strong>Connects Required:</strong> {job.connects_required || 1}
          </span>
          <span className="meta-item">
            <strong>Posted:</strong> {formatDate(job.created_at)}
          </span>
          {job.duration && (
            <span className="meta-item">
              <strong>Duration:</strong> {job.duration}
            </span>
          )}
        </div>

        <div className="job-detail-section">
          <h3>Description</h3>
          <p className="job-detail-description">{job.description}</p>
        </div>

        {job.skills && job.skills.length > 0 && (
          <div className="job-detail-section">
            <h3>Required Skills</h3>
            <div className="job-skills">
              {job.skills.map((skill) => (
                <span key={skill} className="skill-tag">{skill}</span>
              ))}
            </div>
          </div>
        )}

        <div className="job-detail-actions">
          {!isOwner && job.status === "open" && (
            <button
              className="btn btn-primary btn-large"
              onClick={() => setShowApplyForm(!showApplyForm)}
            >
              {showApplyForm ? "Cancel" : "Apply Now"}
            </button>
          )}
          {isOwner && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowApps(!showApps);
                  if (!showApps) fetchApplications();
                }}
              >
                {showApps ? "Hide" : "View"} Applications
              </button>
              <button
                className="btn btn-primary"
                onClick={() => onNavigate("/create-job")}
              >
                Edit Job
              </button>
            </>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => startChat(job.client_id || job.client_uid)}
          >
            Message
          </button>
        </div>

        {/* Apply Form */}
        {showApplyForm && (
          <div className="apply-form-container">
            <h3>Submit Application</h3>
            <form onSubmit={handleApply}>
              <div className="form-group">
                <label>Cover Letter / Proposal</label>
                <textarea
                  value={applyData.cover_letter}
                  onChange={(e) =>
                    setApplyData({ ...applyData, cover_letter: e.target.value })
                  }
                  placeholder="Explain why you're a great fit for this job..."
                  rows={6}
                  required
                />
              </div>
              <div className="form-group">
                <label>Proposed Budget (Pi)</label>
                <input
                  type="number"
                  step="0.01"
                  value={applyData.proposed_budget}
                  onChange={(e) =>
                    setApplyData({
                      ...applyData,
                      proposed_budget: e.target.value,
                    })
                  }
                  placeholder={job.budget?.toString()}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={applying}
              >
                {applying ? (
                  <>
                    <span className="spinner"></span> Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </button>
            </form>
          </div>
        )}

        {/* Applications List for Owner */}
        {showApps && isOwner && (
          <div className="applications-section">
            <h3>Applications ({applications.length})</h3>
            {applications.length === 0 ? (
              <p>No applications yet.</p>
            ) : (
              applications.map((app) => (
                <div key={app.id || app._id} className="application-card">
                  <div className="application-header">
                    <strong>
                      {app.freelancer_username || app.freelancer_uid}
                    </strong>
                    <span
                      className="app-status"
                      style={{
                        backgroundColor: getStatusColor(app.status),
                      }}
                    >
                      {app.status}
                    </span>
                  </div>
                  <p className="application-letter">
                    {app.cover_letter}
                  </p>
                  <p className="application-budget">
                    Proposed: {formatBudget(app.proposed_budget)}
                  </p>
                  {app.status === "pending" && (
                    <div className="application-actions">
                      <button
                        className="btn btn-success"
                        onClick={() =>
                          handleStatusUpdate(
                            app.id || app._id,
                            "accepted"
                          )
                        }
                      >
                        Accept
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() =>
                          handleStatusUpdate(
                            app.id || app._id,
                            "rejected"
                          )
                        }
                      >
                        Reject
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => startChat(app.freelancer_uid)}
                      >
                        Chat
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
