// Home.js - Landing / Job Listing Page
const { useState, useEffect } = React;

function Home({ user, onNavigate }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

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

  useEffect(() => {
    fetchJobsData();
  }, []);

  const fetchJobsData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchJobs("limit=8");
      setJobs(data.jobs || data || []);
    } catch (err) {
      setError(err.message);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = !search ||
      (job.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (job.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || job.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Find Work. Hire Talent. Pay in Pi.</h1>
          <p>
            The leading freelance marketplace on the Pi Network.
            Connect, collaborate, and get paid securely.
          </p>
          <div className="hero-actions">
            <button
              className="btn btn-primary"
              onClick={() => onNavigate("/jobs")}
            >
              Find Jobs
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => onNavigate("/create-job")}
            >
              Post a Job
            </button>
          </div>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search jobs by keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="category-select"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSearch("");
              setCategory("");
            }}
          >
            Clear
          </button>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="jobs-section">
        <h2>Latest Jobs</h2>
        {loading ? (
          <div className="loading-container">
            <span className="spinner large"></span>
            <p>Loading jobs...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            <button className="btn btn-primary" onClick={fetchJobsData}>
              Retry
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="empty-state">
            <p>No jobs found matching your criteria.</p>
            <button className="btn btn-primary" onClick={() => onNavigate("/create-job")}>
              Be the first to post a job!
            </button>
          </div>
        ) : (
          <div className="jobs-grid">
            {filteredJobs.map((job) => (
              <div
                key={job.id || job._id}
                className="job-card"
                onClick={() => onNavigate(`/jobs/${job.id || job._id}`)}
              >
                <div className="job-card-header">
                  <span
                    className="job-status-badge"
                    style={{
                      backgroundColor: getStatusColor(job.status),
                    }}
                  >
                    {job.status || "Open"}
                  </span>
                  <span className="job-date">{timeAgo(job.created_at)}</span>
                </div>
                <h3 className="job-title">{job.title}</h3>
                <p className="job-description">{truncate(job.description, 150)}</p>
                <div className="job-client" onClick={(e) => { e.stopPropagation(); onNavigate(`/portfolio/${job.client_id || job.client_uid || job.user_id || job.uid}`); }}>
                  <span className="client-label">Posted by:</span>
                  <span className="client-name">{job.client_username || job.client_name || job.client_id || job.client_uid || job.user_id || 'Unknown'}</span>
                </div>
                <div className="job-meta">
                  <span className="job-budget">{formatBudget(job.budget)}</span>
                  <span className="job-category">{job.category}</span>
                  <span className="job-connects">{job.connects_required || 1} connects</span>
                </div>
                <div className="job-skills">
                  {(job.skills || []).slice(0, 4).map((skill) => (
                    <span key={skill} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="section-footer">
          <button className="btn btn-secondary" onClick={() => onNavigate("/jobs")}>
            View All Jobs
          </button>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Sign In with Pi</h3>
            <p>Connect your Pi Network account securely in seconds.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Post or Find Jobs</h3>
            <p>Create job listings or browse opportunities that match your skills.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Apply & Collaborate</h3>
            <p>Send proposals, chat with clients, and agree on terms.</p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <h3>Secure Payment</h3>
            <p>Work is secured via escrow and released when complete.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Work Pro. Powered by Pi Network.</p>
      </footer>
    </div>
  );
}
