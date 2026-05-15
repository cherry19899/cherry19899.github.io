// JobList.js - All Jobs Page
const { useState, useEffect } = React;

function JobList({ user, onNavigate }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 12;

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
    fetchJobs();
  }, [category, sortBy, page]);

  const fetchJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (search) params.append("search", search);
      params.append("sort", sortBy);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const userId = user?.uid || "";
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": userId,
      };
      const res = await fetch(
        `https://workpro-api.onrender.com/api/jobs?${params.toString()}`,
        { headers }
      );
      if (!res.ok) throw new Error("Failed to fetch jobs");
      const data = await res.json();
      const fetched = data.jobs || data || [];
      if (page === 1) {
        setJobs(fetched);
      } else {
        setJobs((prev) => [...prev, ...fetched]);
      }
      setHasMore(fetched.length === limit);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const filteredJobs = jobs;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Browse Jobs</h1>
        <button
          className="btn btn-primary"
          onClick={() => onNavigate("/create-job")}
        >
          + Post a Job
        </button>
      </div>

      <div className="filters-bar">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="category-select"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
          className="sort-select"
        >
          <option value="newest">Newest First</option>
          <option value="budget_high">Budget: High to Low</option>
          <option value="budget_low">Budget: Low to High</option>
        </select>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button className="btn btn-primary" onClick={fetchJobs}>Retry</button>
        </div>
      )}

      {loading && page === 1 ? (
        <div className="loading-container">
          <span className="spinner large"></span>
          <p>Loading jobs...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="empty-state">
          <p>No jobs found.</p>
          <button className="btn btn-primary" onClick={() => onNavigate("/create-job")}>
            Post the first job!
          </button>
        </div>
      ) : (
        <>
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
                    style={{ backgroundColor: getStatusColor(job.status) }}
                  >
                    {job.status || "Open"}
                  </span>
                  <span className="job-date">{timeAgo(job.created_at)}</span>
                </div>
                <h3 className="job-title">{job.title}</h3>
                <p className="job-description">{truncate(job.description, 150)}</p>
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
          {hasMore && (
            <div className="load-more">
              <button
                className="btn btn-secondary"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
