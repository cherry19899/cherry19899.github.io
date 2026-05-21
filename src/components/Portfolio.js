// Portfolio.js - Freelancer Portfolio Showcase
const { useState, useEffect, useCallback } = React;

function Portfolio({ user, onNavigate }) {
  const [isOwn, setIsOwn] = useState(true);
  const [targetUserId, setTargetUserId] = useState(user?.uid || '');
  const [portfolio, setPortfolio] = useState(null);
  const [items, setItems] = useState([]);
  const [owner, setOwner] = useState(null);
  const [stats, setStats] = useState({ jobs_posted: 0, jobs_completed: 0, rating: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    headline: '',
    summary: '',
    experience_years: 0,
    website: '',
    github: '',
    linkedin: ''
  });
  
  const [itemForm, setItemForm] = useState({
    title: '',
    description: '',
    image_url: '',
    category: 'Development',
    tags: ''
  });

  const categories = ['Development', 'Design', 'Writing', 'Marketing', 'Data', 'Video', 'Music', 'Other'];

  // Parse route params
  useEffect(() => {
    const hash = window.location.hash || '#/portfolio';
    const parts = hash.replace('#/', '/').split('/').filter(Boolean);
    if (parts.length > 1 && parts[0] === 'portfolio') {
      const uid = parts[1];
      setTargetUserId(uid);
      setIsOwn(uid === user?.uid);
    } else {
      setTargetUserId(user?.uid || '');
      setIsOwn(true);
    }
  }, [user]);

  const fetchPortfolio = useCallback(async () => {
    if (!targetUserId) return;
    setLoading(true);
    setError('');
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-user-id': user?.uid || ''
      };
      const res = await fetch(
        `https://workpro-api.onrender.com/api/users/${targetUserId}/portfolio`,
        { headers }
      );
      if (!res.ok) throw new Error('Failed to fetch portfolio');
      const data = await res.json();
      setPortfolio(data.portfolio || {});
      setItems(data.items || []);
      setOwner(data.owner || null);
      setStats(data.stats || { jobs_posted: 0, jobs_completed: 0, rating: 0 });
      if (data.portfolio) {
        setFormData({
          headline: data.portfolio.headline || '',
          summary: data.portfolio.summary || '',
          experience_years: data.portfolio.experience_years || 0,
          website: data.portfolio.website || '',
          github: data.portfolio.github || '',
          linkedin: data.portfolio.linkedin || ''
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [targetUserId, user]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handleSaveMeta = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    setSaving(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-user-id': user.uid
      };
      const res = await fetch(
        'https://workpro-api.onrender.com/api/users/me/portfolio',
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(formData)
        }
      );
      if (!res.ok) throw new Error('Failed to save');
      setEditing(false);
      fetchPortfolio();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    setSaving(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-user-id': user.uid
      };
      const tagsArray = itemForm.tags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await fetch(
        'https://workpro-api.onrender.com/api/users/me/portfolio/items',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: itemForm.title,
            description: itemForm.description,
            image_url: itemForm.image_url,
            category: itemForm.category,
            tags: tagsArray
          })
        }
      );
      if (!res.ok) throw new Error('Failed to add item');
      setShowAddItem(false);
      setItemForm({ title: '', description: '', image_url: '', category: 'Development', tags: '' });
      fetchPortfolio();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Remove this item from portfolio?')) return;
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-user-id': user.uid
      };
      const res = await fetch(
        `https://workpro-api.onrender.com/api/users/me/portfolio/items/${itemId}`,
        { method: 'DELETE', headers }
      );
      if (!res.ok) throw new Error('Failed to delete');
      fetchPortfolio();
    } catch (err) {
      alert(err.message);
    }
  };

  const getRatingStars = (rating) => {
    const r = parseFloat(rating) || 0;
    if (r <= 0 || isNaN(r)) return 'Not rated';
    const stars = Math.round(r);
    return '\u2605'.repeat(stars) + '\u2606'.repeat(5 - stars);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <span className="spinner large"></span>
        <p>Loading portfolio...</p>
      </div>
    );
  }

  return (
    <div className="page-container portfolio-page">
      {/* Header Section */}
      <div className="portfolio-header">
        <div className="portfolio-avatar">
          <span className="avatar-letter">
            {(owner?.username || user?.username || 'U').charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="portfolio-intro">
          <h1>{owner?.username || owner?.name || user?.username || 'Pi User'}</h1>
          {portfolio?.headline && <p className="portfolio-headline">{portfolio.headline}</p>}
          <div className="portfolio-stats-row">
            <span className="stat-badge">{stats.jobs_completed || 0} completed</span>
            <span className="stat-badge">{stats.rating ? stats.rating.toFixed(1) : 'N/A'} {getRatingStars(stats.rating)}</span>
            {portfolio?.experience_years > 0 && (
              <span className="stat-badge">{portfolio.experience_years}+ years exp</span>
            )}
          </div>
        </div>
        {isOwn && (
          <button className="btn btn-primary" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit Portfolio'}
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button className="btn btn-primary" onClick={fetchPortfolio}>Retry</button>
        </div>
      )}

      {/* Edit Form */}
      {editing && (
        <div className="form-card portfolio-edit-card">
          <h3>Edit Portfolio</h3>
          <form onSubmit={handleSaveMeta}>
            <div className="form-group">
              <label>Professional Headline</label>
              <input
                type="text"
                value={formData.headline}
                onChange={(e) => setFormData({...formData, headline: e.target.value})}
                placeholder="e.g. Full Stack Developer specializing in React & Node.js"
              />
            </div>
            <div className="form-group">
              <label>Summary</label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({...formData, summary: e.target.value})}
                rows={4}
                placeholder="Describe your expertise, approach, and what clients can expect..."
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Experience (years)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({...formData, experience_years: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              <div className="form-group">
                <label>GitHub</label>
                <input
                  type="url"
                  value={formData.github}
                  onChange={(e) => setFormData({...formData, github: e.target.value})}
                  placeholder="https://github.com/..."
                />
              </div>
              <div className="form-group">
                <label>LinkedIn</label>
                <input
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({...formData, linkedin: e.target.value})}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Section */}
      {portfolio?.summary && !editing && (
        <div className="portfolio-section">
          <h2>About</h2>
          <p className="portfolio-summary">{portfolio.summary}</p>
        </div>
      )}

      {/* Links */}
      {(portfolio?.website || portfolio?.github || portfolio?.linkedin) && !editing && (
        <div className="portfolio-links">
          {portfolio.website && (
            <a href={portfolio.website} target="_blank" rel="noopener noreferrer" className="portfolio-link">
              &#127760; Website
            </a>
          )}
          {portfolio.github && (
            <a href={portfolio.github} target="_blank" rel="noopener noreferrer" className="portfolio-link">
              &#128187; GitHub
            </a>
          )}
          {portfolio.linkedin && (
            <a href={portfolio.linkedin} target="_blank" rel="noopener noreferrer" className="portfolio-link">
              &#128188; LinkedIn
            </a>
          )}
        </div>
      )}

      {/* Items Section */}
      <div className="portfolio-section">
        <div className="portfolio-section-header">
          <h2>Work Samples ({items.length})</h2>
          {isOwn && (
            <button className="btn btn-primary" onClick={() => setShowAddItem(!showAddItem)}>
              {showAddItem ? 'Cancel' : '+ Add Work'}
            </button>
          )}
        </div>

        {/* Add Item Form */}
        {showAddItem && (
          <div className="form-card portfolio-item-form">
            <h3>Add New Work</h3>
            <form onSubmit={handleAddItem}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={itemForm.title}
                  onChange={(e) => setItemForm({...itemForm, title: e.target.value})}
                  placeholder="Project title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                  rows={3}
                  placeholder="What you built, technologies used, results..."
                />
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={itemForm.image_url}
                  onChange={(e) => setItemForm({...itemForm, image_url: e.target.value})}
                  placeholder="https://... (screenshot or demo image)"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({...itemForm, category: e.target.value})}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Tags (comma separated)</label>
                  <input
                    type="text"
                    value={itemForm.tags}
                    onChange={(e) => setItemForm({...itemForm, tags: e.target.value})}
                    placeholder="React, Node.js, API"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Adding...' : 'Add Work'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Items Grid */}
        {items.length === 0 ? (
          <div className="empty-state">
            <p>No work samples yet.</p>
            {isOwn && <p>Add projects to showcase your skills to potential clients.</p>}
          </div>
        ) : (
          <div className="portfolio-items-grid">
            {items.map((item) => (
              <div key={item.id} className="portfolio-item-card">
                {item.image_url && (
                  <div className="portfolio-item-image">
                    <img src={item.image_url} alt={item.title} loading="lazy" />
                  </div>
                )}
                <div className="portfolio-item-body">
                  <div className="portfolio-item-header">
                    <span className="portfolio-item-category">{item.category}</span>
                    {isOwn && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteItem(item.id)}
                        title="Remove"
                      >
                        &#10005;
                      </button>
                    )}
                  </div>
                  <h3 className="portfolio-item-title">{item.title}</h3>
                  {item.description && (
                    <p className="portfolio-item-desc">{item.description}</p>
                  )}
                  {item.tags && (
                    <div className="portfolio-item-tags">
                      {item.tags.split(',').map((tag, i) => (
                        tag.trim() && <span key={i} className="skill-tag">{tag.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
