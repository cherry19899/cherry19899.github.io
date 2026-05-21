/* Portfolio.js - Pure JS version for inline/dynamic loading */
(function() {
  'use strict';

  var React = window.React;
  var useState = React.useState;
  var useEffect = React.useEffect;
  var useCallback = React.useCallback;
  var createElement = React.createElement;

  function Portfolio(props) {
    var user = props.user;
    var onNavigate = props.onNavigate;

    var _useState = useState(true);
    var isOwn = _useState[0];
    var setIsOwn = _useState[1];

    var _useState2 = useState(user && user.uid || '');
    var targetUserId = _useState2[0];
    var setTargetUserId = _useState2[1];

    var _useState3 = useState(null);
    var portfolio = _useState3[0];
    var setPortfolio = _useState3[1];

    var _useState4 = useState([]);
    var items = _useState4[0];
    var setItems = _useState4[1];

    var _useState5 = useState({ jobs_posted: 0, jobs_completed: 0, rating: 0 });
    var stats = _useState5[0];
    var setStats = _useState5[1];

    var _useState6 = useState(true);
    var loading = _useState6[0];
    var setLoading = _useState6[1];

    var _useState7 = useState('');
    var error = _useState7[0];
    var setError = _useState7[1];

    var _useState8 = useState(false);
    var editing = _useState8[0];
    var setEditing = _useState8[1];

    var _useState9 = useState(false);
    var saving = _useState9[0];
    var setSaving = _useState9[1];

    var _useState10 = useState(false);
    var showAddItem = _useState10[0];
    var setShowAddItem = _useState10[1];

    var _useState11 = useState({ headline: '', summary: '', experience_years: 0, website: '', github: '', linkedin: '' });
    var formData = _useState11[0];
    var setFormData = _useState11[1];

    var _useState12 = useState({ title: '', description: '', image_url: '', category: 'Development', tags: '' });
    var itemForm = _useState12[0];
    var setItemForm = _useState12[1];

    var categories = ['Development', 'Design', 'Writing', 'Marketing', 'Data', 'Video', 'Music', 'Other'];

    useEffect(function() {
      var hash = window.location.hash || '#/portfolio';
      var parts = hash.replace('#/', '/').split('/').filter(Boolean);
      if (parts.length > 1 && parts[0] === 'portfolio') {
        var uid = parts[1];
        setTargetUserId(uid);
        setIsOwn(uid === (user && user.uid));
      } else {
        setTargetUserId(user && user.uid || '');
        setIsOwn(true);
      }
    }, [user]);

    var fetchPortfolio = useCallback(function() {
      if (!targetUserId) return;
      setLoading(true);
      setError('');
      var headers = {
        'Content-Type': 'application/json',
        'x-user-id': (user && user.uid) || ''
      };
      fetch('https://workpro-api.onrender.com/api/users/' + targetUserId + '/portfolio', { headers: headers })
        .then(function(r) { if (!r.ok) throw new Error('Failed to fetch portfolio'); return r.json(); })
        .then(function(data) {
          setPortfolio(data.portfolio || {});
          setItems(data.items || []);
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
        })
        .catch(function(err) { setError(err.message); })
        .finally(function() { setLoading(false); });
    }, [targetUserId, user]);

    useEffect(function() {
      fetchPortfolio();
    }, [fetchPortfolio]);

    var handleSaveMeta = function(e) {
      e.preventDefault();
      if (!user || !user.uid) return;
      setSaving(true);
      var headers = {
        'Content-Type': 'application/json',
        'x-user-id': user.uid
      };
      fetch('https://workpro-api.onrender.com/api/users/me/portfolio', {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(formData)
      })
        .then(function(r) { if (!r.ok) throw new Error('Failed to save'); return r.json(); })
        .then(function() {
          setEditing(false);
          fetchPortfolio();
        })
        .catch(function(err) { alert(err.message); })
        .finally(function() { setSaving(false); });
    };

    var handleAddItem = function(e) {
      e.preventDefault();
      if (!user || !user.uid) return;
      setSaving(true);
      var tagsArray = itemForm.tags.split(',').map(function(t) { return t.trim(); }).filter(Boolean);
      var headers = {
        'Content-Type': 'application/json',
        'x-user-id': user.uid
      };
      fetch('https://workpro-api.onrender.com/api/users/me/portfolio/items', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          title: itemForm.title,
          description: itemForm.description,
          image_url: itemForm.image_url,
          category: itemForm.category,
          tags: tagsArray
        })
      })
        .then(function(r) { if (!r.ok) throw new Error('Failed to add item'); return r.json(); })
        .then(function() {
          setShowAddItem(false);
          setItemForm({ title: '', description: '', image_url: '', category: 'Development', tags: '' });
          fetchPortfolio();
        })
        .catch(function(err) { alert(err.message); })
        .finally(function() { setSaving(false); });
    };

    var handleDeleteItem = function(itemId) {
      if (!confirm('Remove this item from portfolio?')) return;
      var headers = {
        'Content-Type': 'application/json',
        'x-user-id': user.uid
      };
      fetch('https://workpro-api.onrender.com/api/users/me/portfolio/items/' + itemId, {
        method: 'DELETE',
        headers: headers
      })
        .then(function(r) { if (!r.ok) throw new Error('Failed to delete'); return r.json(); })
        .then(function() { fetchPortfolio(); })
        .catch(function(err) { alert(err.message); });
    };

    var getRatingStars = function(rating) {
      var r = parseFloat(rating) || 0;
      return '\u2605'.repeat(Math.round(r)) + '\u2606'.repeat(5 - Math.round(r));
    };

    if (loading) {
      return createElement('div', { className: 'loading-container' },
        createElement('span', { className: 'spinner large' }),
        createElement('p', null, 'Loading portfolio...')
      );
    }

    // Header
    var headerChildren = [];
    headerChildren.push(createElement('div', { key: 'avatar', className: 'portfolio-avatar' },
      createElement('span', { className: 'avatar-letter' },
        ((user && user.username) || 'U').charAt(0).toUpperCase()
      )
    ));

    var introChildren = [];
    introChildren.push(createElement('h1', { key: 'name' }, user && user.username || 'Pi User'));
    if (portfolio && portfolio.headline) {
      introChildren.push(createElement('p', { key: 'headline', className: 'portfolio-headline' }, portfolio.headline));
    }
    var statsRow = createElement('div', { key: 'stats', className: 'portfolio-stats-row' },
      createElement('span', { className: 'stat-badge' }, (stats.jobs_completed || 0) + ' completed'),
      createElement('span', { className: 'stat-badge' }, (stats.rating ? stats.rating.toFixed(1) : 'N/A') + ' ' + getRatingStars(stats.rating)),
      portfolio && portfolio.experience_years > 0 ? createElement('span', { className: 'stat-badge' }, portfolio.experience_years + '+ years exp') : null
    );
    introChildren.push(statsRow);
    headerChildren.push(createElement('div', { key: 'intro', className: 'portfolio-intro' }, introChildren));

    if (isOwn) {
      headerChildren.push(createElement('button', {
        key: 'edit-btn',
        className: 'btn btn-primary',
        onClick: function() { setEditing(!editing); }
      }, editing ? 'Cancel' : 'Edit Portfolio'));
    }

    var pageChildren = [];
    pageChildren.push(createElement('div', { key: 'header', className: 'portfolio-header' }, headerChildren));

    if (error) {
      pageChildren.push(createElement('div', { key: 'error', className: 'error-message' },
        error,
        createElement('button', { className: 'btn btn-primary', onClick: fetchPortfolio }, 'Retry')
      ));
    }

    // Edit Form
    if (editing) {
      var formChildren = [];
      formChildren.push(createElement('h3', { key: 'title' }, 'Edit Portfolio'));

      var fields = [
        { label: 'Professional Headline', type: 'text', key: 'headline', placeholder: 'e.g. Full Stack Developer specializing in React & Node.js' },
        { label: 'Summary', type: 'textarea', key: 'summary', rows: 4, placeholder: 'Describe your expertise, approach, and what clients can expect...' },
        { label: 'Experience (years)', type: 'number', key: 'experience_years', min: 0 },
        { label: 'Website', type: 'url', key: 'website', placeholder: 'https://...' },
        { label: 'GitHub', type: 'url', key: 'github', placeholder: 'https://github.com/...' },
        { label: 'LinkedIn', type: 'url', key: 'linkedin', placeholder: 'https://linkedin.com/in/...' }
      ];

      fields.forEach(function(f) {
        var inputProps = {
          type: f.type,
          value: formData[f.key],
          onChange: function(e) {
            var val = e.target.value;
            if (f.type === 'number') val = parseInt(val) || 0;
            var newForm = {};
            for (var k in formData) newForm[k] = formData[k];
            newForm[f.key] = val;
            setFormData(newForm);
          },
          placeholder: f.placeholder || ''
        };
        if (f.min !== undefined) inputProps.min = f.min;
        if (f.rows) inputProps.rows = f.rows;

        var fieldEl = createElement('div', { key: f.key, className: 'form-group' },
          createElement('label', null, f.label),
          f.type === 'textarea'
            ? createElement('textarea', inputProps)
            : createElement('input', inputProps)
        );
        formChildren.push(fieldEl);
      });

      formChildren.push(createElement('div', { key: 'actions', className: 'form-actions' },
        createElement('button', { type: 'submit', className: 'btn btn-primary', disabled: saving }, saving ? 'Saving...' : 'Save Changes')
      ));

      pageChildren.push(createElement('div', { key: 'edit-form', className: 'form-card portfolio-edit-card' },
        createElement('form', { onSubmit: handleSaveMeta }, formChildren)
      ));
    }

    // Summary
    if (portfolio && portfolio.summary && !editing) {
      pageChildren.push(createElement('div', { key: 'summary', className: 'portfolio-section' },
        createElement('h2', null, 'About'),
        createElement('p', { className: 'portfolio-summary' }, portfolio.summary)
      ));
    }

    // Links
    if ((portfolio && (portfolio.website || portfolio.github || portfolio.linkedin)) && !editing) {
      var links = [];
      if (portfolio.website) links.push(createElement('a', { key: 'web', href: portfolio.website, target: '_blank', rel: 'noopener noreferrer', className: 'portfolio-link' }, '\ud83c\udf10 Website'));
      if (portfolio.github) links.push(createElement('a', { key: 'gh', href: portfolio.github, target: '_blank', rel: 'noopener noreferrer', className: 'portfolio-link' }, '\ud83d\udcbb GitHub'));
      if (portfolio.linkedin) links.push(createElement('a', { key: 'li', href: portfolio.linkedin, target: '_blank', rel: 'noopener noreferrer', className: 'portfolio-link' }, '\ud83d\udcbc LinkedIn'));
      pageChildren.push(createElement('div', { key: 'links', className: 'portfolio-links' }, links));
    }

    // Items Section
    var itemsSectionChildren = [];
    itemsSectionChildren.push(createElement('div', { key: 'header', className: 'portfolio-section-header' },
      createElement('h2', null, 'Work Samples (' + items.length + ')'),
      isOwn ? createElement('button', {
        className: 'btn btn-primary',
        onClick: function() { setShowAddItem(!showAddItem); }
      }, showAddItem ? 'Cancel' : '+ Add Work') : null
    ));

    // Add Item Form
    if (showAddItem) {
      var addFormChildren = [];
      addFormChildren.push(createElement('h3', { key: 'title' }, 'Add New Work'));
      addFormChildren.push(createElement('div', { key: 'title-f', className: 'form-group' },
        createElement('label', null, 'Title *'),
        createElement('input', {
          type: 'text',
          value: itemForm.title,
          onChange: function(e) { setItemForm({ title: e.target.value, description: itemForm.description, image_url: itemForm.image_url, category: itemForm.category, tags: itemForm.tags }); },
          placeholder: 'Project title',
          required: true
        })
      ));
      addFormChildren.push(createElement('div', { key: 'desc-f', className: 'form-group' },
        createElement('label', null, 'Description'),
        createElement('textarea', {
          value: itemForm.description,
          onChange: function(e) { setItemForm({ title: itemForm.title, description: e.target.value, image_url: itemForm.image_url, category: itemForm.category, tags: itemForm.tags }); },
          rows: 3,
          placeholder: 'What you built, technologies used, results...'
        })
      ));
      addFormChildren.push(createElement('div', { key: 'img-f', className: 'form-group' },
        createElement('label', null, 'Image URL'),
        createElement('input', {
          type: 'url',
          value: itemForm.image_url,
          onChange: function(e) { setItemForm({ title: itemForm.title, description: itemForm.description, image_url: e.target.value, category: itemForm.category, tags: itemForm.tags }); },
          placeholder: 'https://... (screenshot or demo image)'
        })
      ));

      var categoryOptions = categories.map(function(c) {
        return createElement('option', { key: c, value: c }, c);
      });
      addFormChildren.push(createElement('div', { key: 'cat-f', className: 'form-row' },
        createElement('div', { className: 'form-group' },
          createElement('label', null, 'Category'),
          createElement('select', {
            value: itemForm.category,
            onChange: function(e) { setItemForm({ title: itemForm.title, description: itemForm.description, image_url: itemForm.image_url, category: e.target.value, tags: itemForm.tags }); }
          }, categoryOptions)
        ),
        createElement('div', { className: 'form-group' },
          createElement('label', null, 'Tags (comma separated)'),
          createElement('input', {
            type: 'text',
            value: itemForm.tags,
            onChange: function(e) { setItemForm({ title: itemForm.title, description: itemForm.description, image_url: itemForm.image_url, category: itemForm.category, tags: e.target.value }); },
            placeholder: 'React, Node.js, API'
          })
        )
      ));

      addFormChildren.push(createElement('div', { key: 'actions', className: 'form-actions' },
        createElement('button', { type: 'submit', className: 'btn btn-primary', disabled: saving }, saving ? 'Adding...' : 'Add Work')
      ));

      itemsSectionChildren.push(createElement('div', { key: 'add-form', className: 'form-card portfolio-item-form' },
        createElement('form', { onSubmit: handleAddItem }, addFormChildren)
      ));
    }

    // Items Grid
    if (items.length === 0) {
      itemsSectionChildren.push(createElement('div', { key: 'empty', className: 'empty-state' },
        createElement('p', null, 'No work samples yet.'),
        isOwn ? createElement('p', null, 'Add projects to showcase your skills to potential clients.') : null
      ));
    } else {
      var itemCards = items.map(function(item) {
        var cardChildren = [];
        if (item.image_url) {
          cardChildren.push(createElement('div', { key: 'img', className: 'portfolio-item-image' },
            createElement('img', { src: item.image_url, alt: item.title, loading: 'lazy' })
          ));
        }
        var bodyChildren = [];
        bodyChildren.push(createElement('div', { key: 'header', className: 'portfolio-item-header' },
          createElement('span', { className: 'portfolio-item-category' }, item.category),
          isOwn ? createElement('button', {
            className: 'btn btn-danger btn-sm',
            onClick: function() { handleDeleteItem(item.id); },
            title: 'Remove'
          }, '\u2715') : null
        ));
        bodyChildren.push(createElement('h3', { key: 'title', className: 'portfolio-item-title' }, item.title));
        if (item.description) {
          bodyChildren.push(createElement('p', { key: 'desc', className: 'portfolio-item-desc' }, item.description));
        }
        if (item.tags) {
          var tags = item.tags.split(',').map(function(tag, i) {
            tag = tag.trim();
            if (!tag) return null;
            return createElement('span', { key: i, className: 'skill-tag' }, tag);
          }).filter(Boolean);
          bodyChildren.push(createElement('div', { key: 'tags', className: 'portfolio-item-tags' }, tags));
        }
        cardChildren.push(createElement('div', { key: 'body', className: 'portfolio-item-body' }, bodyChildren));
        return createElement('div', { key: item.id, className: 'portfolio-item-card' }, cardChildren);
      });
      itemsSectionChildren.push(createElement('div', { key: 'grid', className: 'portfolio-items-grid' }, itemCards));
    }

    pageChildren.push(createElement('div', { key: 'items', className: 'portfolio-section' }, itemsSectionChildren));

    return createElement('div', { className: 'page-container portfolio-page' }, pageChildren);
  }

  // Expose globally
  if (typeof window !== 'undefined') {
    window.Portfolio = Portfolio;
    console.log('[Portfolio] Component loaded and registered');
  }
})();
