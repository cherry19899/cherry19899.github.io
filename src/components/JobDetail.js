// JobDetail.js - Single Job Detail + Apply + Hire with Pi Escrow
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
  const [hasApplied, setHasApplied] = useState(false);
  const [applications, setApplications] = useState([]);
  const [showApps, setShowApps] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [hiringId, setHiringId] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchJobDetail();
    if (user?.uid) checkApplied();
  }, [jobId]);

  const checkApplied = async () => {
    try {
      const data = await checkApplication(jobId);
      if (data?.applied) setHasApplied(true);
    } catch (e) {}
  };

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
      setIsOwner(data.client_id === user?.uid || data.client_uid === user?.uid || data.posted_by === user?.uid);
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
        `https://workpro-api.onrender.com/api/jobs/${jobId}/applications`,
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
            job_id: parseInt(jobId),
            message: applyData.cover_letter,
            bid_amount: parseFloat(applyData.proposed_budget) || job.budget,
            username: user.username,
          }),
        }
      );
      if (res.status === 409) {
        setHasApplied(true);
        setShowApplyForm(false);
        return;
      }
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Application failed");
      }
      setHasApplied(true);
      setShowApplyForm(false);
      setApplyData({ cover_letter: "", proposed_budget: "" });
    } catch (err) {
      alert(err.message);
    } finally {
      setApplying(false);
    }
  };

  // Hire freelancer with Pi payment → creates escrow
  const handleHire = async (app) => {
    if (!user?.uid) return;
    const amount = app.bid_amount || app.proposed_budget || job.budget || 1;
    const freelancerId = app.freelancer_uid || app.user_id || app.freelancer_id;
    const freelancerName = app.freelancer_username || freelancerId;

    const confirmed = window.confirm(
      `Hire ${freelancerName} for π${amount}?\n\nThis will initiate a Pi payment. The funds will be held in escrow until the job is completed.`
    );
    if (!confirmed) return;

    setHiringId(app.id);
    try {
      const paymentData = {
        amount: parseFloat(amount),
        memo: `WorkPro Escrow: ${job.title}`,
        metadata: {
          type: "escrow",
          job_id: jobId,
          application_id: app.id,
          freelancer_id: freelancerId,
          client_id: user.uid,
        },
      };

      if (typeof Pi === 'undefined' || !Pi.initialized) {
        alert("Pi SDK not loaded. Please open in Pi Browser.");
        setHiringId(null);
        return;
      }
      await Pi.createPayment(paymentData, {
        onReadyForServerApproval: async (paymentId) => {
          // Approve on backend
          try {
            await fetch("https://workpro-api.onrender.com/api/payments/approve", {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-user-id": user.uid },
              body: JSON.stringify({ payment_id: paymentId, metadata: paymentData.metadata }),
            });
          } catch (e) {
            console.error("Approval error:", e);
          }
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          try {
            // Complete payment + create escrow
            await fetch("https://workpro-api.onrender.com/api/payments/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-user-id": user.uid },
              body: JSON.stringify({ payment_id: paymentId, txid, metadata: paymentData.metadata }),
            });

            // Create hire record (accept app + create escrow)
            const hireRes = await fetch(
              `https://workpro-api.onrender.com/api/applications/${app.id}/hire`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-user-id": user.uid },
                body: JSON.stringify({ payment_id: paymentId, txid, amount }),
              }
            );
            if (hireRes.ok) {
              alert(`${freelancerName} hired! π${amount} locked in escrow.`);
              fetchJobDetail();
              fetchApplications();
            }
          } catch (e) {
            console.error("Hire completion error:", e);
            alert("Payment sent but escrow creation failed. Contact support.");
          }
        },
        onCancel: () => {
          setHiringId(null);
          alert("Payment cancelled.");
        },
        onError: (err) => {
          setHiringId(null);
          alert(`Payment error: ${err.message || "Unknown error"}`);
        },
      });
    } catch (err) {
      alert(err.message || "Failed to initiate payment.");
    } finally {
      setHiringId(null);
    }
  };

  const handleStatusUpdate = async (appId, status) => {
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": user.uid,
      };
      const endpoint = status === "accepted" ? "accept" : "reject";
      const res = await fetch(
        `https://workpro-api.onrender.com/api/applications/${appId}/${endpoint}`,
        { method: "POST", headers }
      );
      if (!res.ok) throw new Error("Update failed");
      alert(`Application ${status}!`);
      fetchApplications();
    } catch (err) {
      alert(err.message);
    }
  };

  // Release escrow (client marks job complete)
  const handleReleaseEscrow = async () => {
    const confirmed = window.confirm(
      "Mark job as complete and release funds to freelancer?"
    );
    if (!confirmed) return;
    try {
      const escrowData = await fetchEscrows();
      const escrow = (escrowData.escrows || []).find(
        (e) => String(e.job_id) === String(jobId) && e.status === "funded"
      );
      if (!escrow) {
        alert("No active escrow found for this job.");
        return;
      }
      const releaseRes = await fetch(
        `https://workpro-api.onrender.com/api/escrow/${escrow.id}/release`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-user-id": user.uid },
        }
      );
      if (!releaseRes.ok) throw new Error("Release failed");
      alert("Funds released! Job marked as complete.");
      setShowReviewForm(true);
      fetchJobDetail();
    } catch (err) {
      alert(err.message);
    }
  };

  // Submit review after job completion
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!job) return;
    setSubmittingReview(true);
    try {
      // Find freelancer from applications
      const hired = applications.find((a) => a.status === "accepted");
      const toUserId = hired?.freelancer_uid || hired?.user_id || hired?.freelancer_id;
      if (!toUserId) {
        alert("Could not determine freelancer to review.");
        return;
      }
      const res = await fetch("https://workpro-api.onrender.com/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.uid },
        body: JSON.stringify({
          to_user_id: toUserId,
          job_id: parseInt(jobId),
          rating: reviewData.rating,
          comment: reviewData.comment,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Review failed");
      }
      alert("Review submitted! Thank you.");
      setShowReviewForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const startChat = async (freelancerId) => {
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": user.uid,
      };
      const res = await fetch(
        "https://workpro-api.onrender.com/api/chat/start",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            user_id: user.uid,
            other_user_id: freelancerId,
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        onNavigate(`/chat/${data.room_id || data.id}`);
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

  const isInProgress = job.status === "in_progress";
  const isCompleted = job.status === "completed";

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
            <strong>Posted by:</strong>{' '}
            <span
              className="client-link"
              onClick={() => onNavigate(`/portfolio/${job.client_id || job.client_uid || job.user_id || job.posted_by}`)}
              style={{ cursor: 'pointer', color: '#7c3aed', textDecoration: 'underline' }}
            >
              {job.client_username || job.client_name || job.posted_by_name || job.client_id || 'Unknown'}
            </span>
          </span>
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
              disabled={hasApplied}
              onClick={() => !hasApplied && setShowApplyForm(!showApplyForm)}
            >
              {hasApplied ? "Applied ✓" : showApplyForm ? "Cancel" : "Apply Now"}
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
              {isInProgress && (
                <button
                  className="btn btn-success"
                  onClick={handleReleaseEscrow}
                >
                  ✓ Release Payment (Complete Job)
                </button>
              )}
            </>
          )}
          {!isOwner && (
            <button
              className="btn btn-secondary"
              onClick={() => startChat(job.client_id || job.client_uid || job.posted_by)}
            >
              Message Client
            </button>
          )}
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
                    <strong
                      style={{ cursor: 'pointer', color: '#7c3aed' }}
                      onClick={() => onNavigate(`/portfolio/${app.freelancer_uid || app.user_id}`)}
                    >
                      {app.freelancer_username || app.freelancer_uid || "Freelancer"}
                    </strong>
                    <span
                      className="app-status"
                      style={{ backgroundColor: getStatusColor(app.status) }}
                    >
                      {app.status}
                    </span>
                  </div>
                  <p className="application-letter">
                    {app.cover_letter || app.message}
                  </p>
                  <p className="application-budget">
                    Proposed: {formatBudget(app.bid_amount || app.proposed_budget)}
                  </p>
                  {app.status === "pending" && (
                    <div className="application-actions">
                      <button
                        className="btn btn-success"
                        onClick={() => handleHire(app)}
                        disabled={hiringId === app.id}
                        title="Hire this freelancer with Pi escrow payment"
                      >
                        {hiringId === app.id ? (
                          <><span className="spinner"></span> Processing...</>
                        ) : (
                          "🔒 Hire & Pay (Escrow)"
                        )}
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleStatusUpdate(app.id || app._id, "rejected")}
                      >
                        Reject
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => startChat(app.freelancer_uid || app.user_id)}
                      >
                        Chat
                      </button>
                    </div>
                  )}
                  {app.status === "accepted" && (
                    <div className="application-actions">
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Hired</span>
                      <button
                        className="btn btn-secondary"
                        onClick={() => startChat(app.freelancer_uid || app.user_id)}
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

        {/* Review Form — shown after escrow release */}
        {showReviewForm && (
          <div className="apply-form-container" style={{ marginTop: '24px', background: '#f0fdf4', border: '1px solid #10b981' }}>
            <h3>⭐ Leave a Review</h3>
            <form onSubmit={handleSubmitReview}>
              <div className="form-group">
                <label>Rating</label>
                <div style={{ display: 'flex', gap: '8px', fontSize: '28px' }}>
                  {[1,2,3,4,5].map((star) => (
                    <span
                      key={star}
                      style={{ cursor: 'pointer', color: star <= reviewData.rating ? '#f59e0b' : '#d1d5db' }}
                      onClick={() => setReviewData({ ...reviewData, rating: star })}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Comment</label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  placeholder="How was working with this freelancer?"
                  rows={3}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" disabled={submittingReview}>
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowReviewForm(false)}>
                  Skip
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
