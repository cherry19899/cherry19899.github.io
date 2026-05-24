// Escrow.js - Escrow Management
const { useState, useEffect } = React;

function Escrow({ user, onNavigate }) {
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    job_id: "",
    freelancer_uid: "",
    amount: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchEscrowsData();
  }, []);

  const fetchEscrowsData = async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError("");
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": user.uid,
      };
      const res = await fetch(
        "https://workpro-api.onrender.com/api/escrows/me",
        { headers }
      );
      if (!res.ok) throw new Error("Failed to fetch escrows");
      const data = await res.json();
      setEscrows(data.escrows || data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    setCreating(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": user.uid,
      };
      const res = await fetch(
        "https://workpro-api.onrender.com/api/escrows",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            job_id: formData.job_id,
            freelancer_id: formData.freelancer_uid,
            amount: parseFloat(formData.amount),
          }),
        }
      );
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to create escrow");
      }
      alert("Escrow created successfully!");
      setShowCreateForm(false);
      setFormData({ job_id: "", freelancer_uid: "", amount: "" });
      fetchEscrowsData();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRelease = async (escrowId) => {
    if (!confirm("Release funds to freelancer? This action cannot be undone.")) return;
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": user.uid,
      };
      const res = await fetch(
        `https://workpro-api.onrender.com/api/escrows/${escrowId}/release`,
        { method: "POST", headers }
      );
      if (!res.ok) throw new Error("Release failed");
      alert("Funds released successfully!");
      fetchEscrowsData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRefund = async (escrowId) => {
    if (!confirm("Refund the escrow amount? This action cannot be undone.")) return;
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": user.uid,
      };
      const res = await fetch(
        `https://workpro-api.onrender.com/api/escrows/${escrowId}/cancel`,
        { method: "POST", headers }
      );
      if (!res.ok) throw new Error("Refund failed");
      alert("Escrow refunded successfully!");
      fetchEscrowsData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch ((status || "").toLowerCase()) {
      case "funded":
        return { text: "Funded", color: "#f39c12" };
      case "released":
        return { text: "Released", color: "#27ae60" };
      case "refunded":
        return { text: "Refunded", color: "#95a5a6" };
      case "disputed":
        return { text: "Disputed", color: "#e74c3c" };
      default:
        return { text: status || "Pending", color: "#7f8c8d" };
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Escrow Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? "Cancel" : "+ New Escrow"}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="form-card">
          <h3>Create New Escrow</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Job ID</label>
              <input
                type="text"
                value={formData.job_id}
                onChange={(e) =>
                  setFormData({ ...formData, job_id: e.target.value })
                }
                placeholder="Enter job ID"
                required
              />
            </div>
            <div className="form-group">
              <label>Freelancer UID</label>
              <input
                type="text"
                value={formData.freelancer_uid}
                onChange={(e) =>
                  setFormData({ ...formData, freelancer_uid: e.target.value })
                }
                placeholder="Enter freelancer's Pi UID"
                required
              />
            </div>
            <div className="form-group">
              <label>Amount (Pi)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="0.00"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating}
            >
              {creating ? (
                <>
                  <span className="spinner"></span> Creating...
                </>
              ) : (
                "Create Escrow"
              )}
            </button>
          </form>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
          <button className="btn btn-primary" onClick={fetchEscrowsData}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <span className="spinner large"></span>
          <p>Loading escrows...</p>
        </div>
      ) : escrows.length === 0 ? (
        <div className="empty-state">
          <p>No escrow transactions yet.</p>
          <p>
            Create an escrow to securely pay freelancers for completed work.
          </p>
        </div>
      ) : (
        <div className="escrow-list">
          {escrows.map((esc) => {
            const status = getStatusBadge(esc.status);
            return (
              <div key={esc.id || esc._id} className="escrow-card">
                <div className="escrow-header">
                  <strong>Escrow #{esc.id || esc._id}</strong>
                  <span
                    className="escrow-status"
                    style={{ backgroundColor: status.color }}
                  >
                    {status.text}
                  </span>
                </div>
                <div className="escrow-details">
                  <p>
                    <strong>Job:</strong> {esc.job_title || esc.job_id}
                  </p>
                  <p>
                    <strong>Freelancer:</strong>{" "}
                    {esc.freelancer_name || esc.freelancer_uid}
                  </p>
                  <p>
                    <strong>Amount:</strong> {formatBudget(esc.amount)}
                  </p>
                  <p>
                    <strong>Created:</strong> {formatDate(esc.created_at)}
                  </p>
                </div>
                {esc.status === "funded" && (
                  <div className="escrow-actions">
                    <button
                      className="btn btn-success"
                      onClick={() => handleRelease(esc.id || esc._id)}
                    >
                      Release
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleRefund(esc.id || esc._id)}
                    >
                      Refund
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
