// Applications.js - View Applications
const { useState, useEffect } = React;

function Applications({ user, onNavigate }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("received");
  const [receivedApps, setReceivedApps] = useState([]);

  useEffect(() => {
    fetchApplicationsData();
  }, []);

  const fetchApplicationsData = async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError("");
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": user.uid,
      };

      // My sent applications
      const myRes = await fetch(
        "https://workpro-api.onrender.com/api/applications/my",
        { headers }
      );
      if (myRes.ok) {
        const data = await myRes.json();
        setApplications(data.applications || data || []);
      }

      // Received applications (for jobs I posted)
      const jobsRes = await fetch(
        `https://workpro-api.onrender.com/api/jobs?client_uid=${user.uid}`,
        { headers }
      );
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        const jobs = jobsData.jobs || jobsData || [];
        const allReceived = [];
        for (const job of jobs) {
          const appsRes = await fetch(
            `https://workpro-api.onrender.com/api/applications/job/${job.id || job._id}`,
            { headers }
          );
          if (appsRes.ok) {
            const appsData = await appsRes.json();
            const apps = appsData.applications || appsData || [];
            apps.forEach((app) => {
              app.job_title = job.title;
              allReceived.push(app);
            });
          }
        }
        setReceivedApps(allReceived);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      fetchApplicationsData();
    } catch (err) {
      alert(err.message);
    }
  };

  const startChat = async (freelancerId, jobId) => {
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

  const createEscrow = (app) => {
    onNavigate("/escrow");
  };

  const allApps = activeTab === "received" ? receivedApps : applications;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Applications</h1>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "received" ? "active" : ""}`}
          onClick={() => setActiveTab("received")}
        >
          Received ({receivedApps.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "sent" ? "active" : ""}`}
          onClick={() => setActiveTab("sent")}
        >
          Sent ({applications.length})
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button className="btn btn-primary" onClick={fetchApplicationsData}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <span className="spinner large"></span>
          <p>Loading applications...</p>
        </div>
      ) : allApps.length === 0 ? (
        <div className="empty-state">
          <p>
            {activeTab === "received"
              ? "No applications received yet."
              : "You haven't applied to any jobs yet."}
          </p>
          {activeTab === "sent" && (
            <button
              className="btn btn-primary"
              onClick={() => onNavigate("/jobs")}
            >
              Browse Jobs
            </button>
          )}
        </div>
      ) : (
        <div className="applications-list">
          {allApps.map((app) => (
            <div
              key={app.id || app._id}
              className="application-card-full"
            >
              <div className="application-header">
                <h3
                  className="job-list-title clickable"
                  onClick={() => onNavigate(`/jobs/${app.job_id}`)}
                >
                  {app.job_title || "Untitled Job"}
                </h3>
                <span
                  className="app-status-badge"
                  style={{ backgroundColor: getStatusColor(app.status) }}
                >
                  {app.status || "Pending"}
                </span>
              </div>

              <div className="application-body">
                {activeTab === "received" && (
                  <p>
                    <strong>From:</strong>{" "}
                    {app.freelancer_username || app.freelancer_uid}
                  </p>
                )}
                {activeTab === "sent" && (
                  <p>
                    <strong>To:</strong>{" "}
                    {app.client_username || app.client_uid || "Job Poster"}
                  </p>
                )}
                <p>
                  <strong>Proposed Budget:</strong>{" "}
                  {formatBudget(app.proposed_budget)}
                </p>
                {app.cover_letter && (
                  <div className="application-cover">
                    <strong>Cover Letter:</strong>
                    <p>{app.cover_letter}</p>
                  </div>
                )}
                <p className="application-date">
                  Applied {timeAgo(app.created_at)}
                </p>
              </div>

              <div className="application-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => onNavigate(`/jobs/${app.job_id}`)}
                >
                  View Job
                </button>

                {activeTab === "received" && app.status === "pending" && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() =>
                        handleStatusUpdate(app.id || app._id, "accepted")
                      }
                    >
                      Accept
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() =>
                        handleStatusUpdate(app.id || app._id, "rejected")
                      }
                    >
                      Reject
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() =>
                        startChat(app.freelancer_uid, app.job_id)
                      }
                    >
                      Chat
                    </button>
                  </>
                )}

                {activeTab === "received" && app.status === "accepted" && (
                  <button
                    className="btn btn-primary"
                    onClick={() => createEscrow(app)}
                  >
                    Create Escrow
                  </button>
                )}

                {activeTab === "sent" && (
                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      onNavigate(`/chat/${app.conversation_id || ""}`)
                    }
                  >
                    Chat
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
