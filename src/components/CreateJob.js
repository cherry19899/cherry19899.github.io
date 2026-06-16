// CreateJob.js - Create Job Form
const { useState, useEffect } = React;

function CreateJob({ user, onNavigate }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    budget: "",
    duration: "",
    connects_required: 2,
    skills: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const categories = [
    "Development",
    "Design",
    "Writing",
    "Marketing",
    "Data",
    "Translation",
    "Admin",
    "Other",
  ];

  const durations = [
    "Less than 1 week",
    "1-2 weeks",
    "2-4 weeks",
    "1-3 months",
    "3-6 months",
    "More than 6 months",
    "Ongoing",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid) {
      onNavigate("/");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...formData,
        budget: parseFloat(formData.budget),
        connects_required: parseInt(formData.connects_required),
        skills: formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        posted_by_name: user.name || user.username || user.uid || 'User',
      };

      const data = await createJob(payload);
      setSuccess("Job posted successfully!");
      setTimeout(() => {
        onNavigate(`/jobs/${data.id || data.job_id || data._id}`);
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Post a New Job</h1>
      </div>

      <div className="form-card">
        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Job Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., React Developer for E-commerce Website"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Job Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the project, requirements, deliverables..."
              rows={8}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="budget">Budget (Pi) *</label>
              <input
                type="number"
                id="budget"
                name="budget"
                step="0.01"
                min="0.01"
                value={formData.budget}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="duration">Duration</label>
              <select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
              >
                <option value="">Select Duration</option>
                {durations.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="connects_required">Connects Required</label>
              <select
                id="connects_required"
                name="connects_required"
                value={formData.connects_required}
                onChange={handleChange}
              >
                <option value={1}>1 Connect</option>
                <option value={2}>2 Connects</option>
                <option value={3}>3 Connects</option>
                <option value={5}>5 Connects</option>
                <option value={10}>10 Connects</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="skills">Skills (comma-separated)</label>
            <input
              type="text"
              id="skills"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="e.g., React, Node.js, CSS, UI Design"
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner"></span> Posting...
                </>
              ) : (
                "Post Job"
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigate("/jobs")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
