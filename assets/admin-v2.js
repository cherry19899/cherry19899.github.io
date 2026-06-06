// Admin-v2 — Fixed user management for WorkPro
// Bugs fixed: Promise.all variables, /api/jobs endpoint, P=F removed
(function() {
  if (typeof React === 'undefined') { console.error('[Admin] React not available'); return; }
  var useState = React.useState, useEffect = React.useEffect;
  var API = 'https://workpro-api.onrender.com';
  var UID = 'cherry19899';

  function Admin(props) {
    var user = props.user, onNavigate = props.onNavigate;
    var _jobs = useState([]), jobs = _jobs[0], setJobs = _jobs[1];
    var _users = useState([]), users = _users[0], setUsers = _users[1];
    var _filtered = useState([]), filtered = _filtered[0], setFiltered = _filtered[1];
    var _query = useState(''), query = _query[0], setQuery = _query[1];
    var _stats = useState(null), stats = _stats[0], setStats = _stats[1];
    var _loading = useState(true), loading = _loading[0], setLoading = _loading[1];
    var _error = useState(''), error = _error[0], setError = _error[1];
    var _tab = useState('users'), tab = _tab[0], setTab = _tab[1];
    var _blocking = useState(null), blocking = _blocking[0], setBlocking = _blocking[1];

    console.log('[Admin] Component mounted, tab:', tab);

    // Fetch data on mount
    useEffect(function() {
      console.log('[Admin] useEffect calling fetchData()');
      fetchData();
    }, []);

    // Filter users when query changes
    useEffect(function() {
      if (!query.trim()) { setFiltered(users); return; }
      var q = query.toLowerCase();
      setFiltered(users.filter(function(u) {
        return (u.username || u.id || '').toLowerCase().indexOf(q) !== -1;
      }));
    }, [query, users]);

    function fetchData() {
      console.log('[Admin] fetchData() started');
      setLoading(true);
      setError('');
      var headers = { 'Content-Type': 'application/json', 'x-user-id': UID };

      Promise.all([
        fetch(API + '/api/jobs', { headers: headers }),
        fetch(API + '/api/admin/users', { headers: headers }),
        fetch(API + '/api/admin/stats', { headers: headers })
      ]).then(function(results) {
        console.log('[Admin] All responses received');
        var jobsRes = results[0], usersRes = results[1], statsRes = results[2];

        // Log each response status
        console.log('[Admin] fetch /api/jobs status:', jobsRes.status);
        console.log('[Admin] fetch /api/admin/users status:', usersRes.status);
        console.log('[Admin] fetch /api/admin/stats status:', statsRes.status);

        var p1 = jobsRes.ok ? jobsRes.json().then(function(d) {
          var list = d.jobs || d || [];
          console.log('[Admin] jobs loaded:', list.length);
          setJobs(list);
        }) : Promise.resolve();

        var p2 = usersRes.ok ? usersRes.json().then(function(d) {
          var list = d.users || d || [];
          console.log('[Admin] users loaded:', list.length);
          setUsers(list);
          setFiltered(list);
        }) : Promise.resolve();

        var p3 = statsRes.ok ? statsRes.json().then(function(d) {
          console.log('[Admin] stats loaded:', JSON.stringify(d));
          setStats(d);
        }) : Promise.resolve();

        return Promise.all([p1, p2, p3]);
      }).catch(function(err) {
        console.error('[Admin] fetch error:', err.message);
        setError(err.message);
      }).finally(function() {
        console.log('[Admin] fetchData() complete');
        setLoading(false);
      });
    }

    function handleBlock(targetUser) {
      var targetId = targetUser.id || targetUser.username;
      if (targetId === 'cherry19899') { alert('Cannot block the owner account'); return; }
      console.log('[Admin] Block/Unblock user:', targetId);
      setBlocking(targetId);
      var headers = { 'Content-Type': 'application/json', 'x-user-id': UID };
      var isBlocked = targetUser.status === 'blocked' || targetUser.is_blocked;
      var action = isBlocked ? 'unblock' : 'block';
      fetch(API + '/api/admin/users/' + encodeURIComponent(targetId) + '/' + action, {
        method: 'POST', headers: headers
      }).then(function(r) { return r.json(); }).then(function(data) {
        console.log('[Admin] Block result:', data);
        if (data.error) { alert(data.error); return; }
        // Update local state
        setUsers(function(prev) {
          return prev.map(function(u) {
            if ((u.id || u.username) === targetId) {
              var copy = Object.assign({}, u);
              copy.status = isBlocked ? 'active' : 'blocked';
              copy.is_blocked = isBlocked ? 0 : 1;
              return copy;
            }
            return u;
          });
        });
      }).catch(function(err) {
        console.error('[Admin] Block error:', err.message);
        alert('Error: ' + err.message);
      }).finally(function() {
        setBlocking(null);
      });
    }

    function handleDeleteJob(jobId) {
      if (!confirm('Delete this job?')) return;
      console.log('[Admin] Delete job:', jobId);
      var headers = { 'Content-Type': 'application/json', 'x-user-id': UID };
      fetch(API + '/api/jobs/' + jobId, { method: 'DELETE', headers: headers })
        .then(function(res) {
          if (res.ok) {
            setJobs(function(prev) { return prev.filter(function(j) { return (j.id || j._id) !== jobId; }); });
            alert('Job deleted');
          } else throw new Error('HTTP ' + res.status);
        }).catch(function(err) { alert('Delete failed: ' + err.message); });
    }

    function formatBudget(b) { return (!b && b !== 0) ? 'N/A' : b + ' Pi'; }
    function timeAgo(d) {
      if (!d) return '';
      var diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
      if (diff < 60) return 'just now';
      if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
      if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
      return Math.floor(diff / 86400) + 'd ago';
    }

    // Loading state
    if (loading) {
      return React.createElement('div', { className: 'loading-container' },
        React.createElement('span', { className: 'spinner large' }),
        React.createElement('p', null, 'Loading admin data...')
      );
    }

    // Error state
    if (error) {
      return React.createElement('div', { className: 'error-container' },
        React.createElement('h2', null, 'Error'),
        React.createElement('p', null, error),
        React.createElement('button', { className: 'btn btn-primary', onClick: fetchData }, 'Retry')
      );
    }

    console.log('[Admin] Rendering, users:', users.length, 'jobs:', jobs.length);

    // Stats
    var statsEl = stats ? React.createElement('div', { className: 'stats-grid' },
      React.createElement('div', { className: 'stat-card' },
        React.createElement('div', { className: 'stat-number' }, stats.total_jobs || jobs.length || 0),
        React.createElement('div', { className: 'stat-label' }, 'Total Jobs')
      ),
      React.createElement('div', { className: 'stat-card' },
        React.createElement('div', { className: 'stat-number' }, stats.total_users || users.length || 0),
        React.createElement('div', { className: 'stat-label' }, 'Total Users')
      ),
      React.createElement('div', { className: 'stat-card' },
        React.createElement('div', { className: 'stat-number' }, stats.total_applications || 0),
        React.createElement('div', { className: 'stat-label' }, 'Applications')
      ),
      React.createElement('div', { className: 'stat-card' },
        React.createElement('div', { className: 'stat-number' }, stats.total_escrows || 0),
        React.createElement('div', { className: 'stat-label' }, 'Escrows')
      )
    ) : null;

    // Tabs
    var tabsEl = React.createElement('div', { className: 'tabs' },
      React.createElement('button', {
        className: 'tab-btn ' + (tab === 'jobs' ? 'active' : ''),
        onClick: function() { setTab('jobs'); }
      }, 'Jobs (' + jobs.length + ')'),
      React.createElement('button', {
        className: 'tab-btn ' + (tab === 'users' ? 'active' : ''),
        onClick: function() { setTab('users'); }
      }, 'Users (' + users.length + ')')
    );

    // Jobs tab
    var jobsTabEl;
    if (tab === 'jobs') {
      if (jobs.length === 0) {
        jobsTabEl = React.createElement('div', { className: 'admin-list' },
          React.createElement('p', null, 'No jobs found.')
        );
      } else {
        jobsTabEl = React.createElement('div', { className: 'admin-list' },
          jobs.map(function(job) {
            return React.createElement('div', { key: job.id || job._id, className: 'admin-list-item' },
              React.createElement('div', { className: 'admin-list-info' },
                React.createElement('h4', { className: 'job-list-title' }, job.title),
                React.createElement('div', { className: 'job-list-meta' },
                  React.createElement('span', null, job.posted_by_name || job.posted_by),
                  React.createElement('span', null, formatBudget(job.budget)),
                  React.createElement('span', null, job.status),
                  React.createElement('span', null, timeAgo(job.created_at))
                )
              ),
              React.createElement('div', { className: 'admin-list-actions' },
                React.createElement('button', { className: 'btn btn-secondary', onClick: function() { onNavigate('/jobs/' + (job.id || job._id)); } }, 'View'),
                React.createElement('button', { className: 'btn btn-danger', onClick: function() { handleDeleteJob(job.id || job._id); } }, 'Delete')
              )
            );
          })
        );
      }
    }

    // Users tab
    var usersTabEl;
    if (tab === 'users') {
      var searchInput = React.createElement('div', { style: { padding: '12px 0', borderBottom: '1px solid #e5e7eb' } },
        React.createElement('input', {
          type: 'text',
          placeholder: 'Search users by username...',
          value: query,
          onChange: function(e) { setQuery(e.target.value); },
          style: { width: '100%', maxWidth: '400px', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '0.95rem', outline: 'none' }
        })
      );

      if (filtered.length === 0) {
        usersTabEl = React.createElement('div', { className: 'admin-list' },
          searchInput,
          React.createElement('p', { style: { marginTop: '16px' } },
            query ? 'No users match "' + query + '"' : 'No users found.'
          )
        );
      } else {
        usersTabEl = React.createElement('div', { className: 'admin-list' },
          searchInput,
          filtered.map(function(u) {
            var isBlocked = u.status === 'blocked' || u.is_blocked;
            var userId = u.id || u.username;
            var badgeStyle = {
              marginLeft: '10px', padding: '2px 10px', borderRadius: '12px',
              fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
              background: isBlocked ? '#fee2e2' : '#d1fae5',
              color: isBlocked ? '#dc2626' : '#059669'
            };
            return React.createElement('div', { key: userId, className: 'admin-list-item', style: { opacity: isBlocked ? 0.7 : 1 } },
              React.createElement('div', { className: 'admin-list-info' },
                React.createElement('h4', null,
                  (u.username || u.id),
                  React.createElement('span', { style: badgeStyle }, isBlocked ? 'BLOCKED' : 'ACTIVE')
                ),
                React.createElement('div', { className: 'job-list-meta' },
                  React.createElement('span', null, 'Role: ' + (u.role || 'user')),
                  React.createElement('span', null, u.kyc_verified ? 'KYC ✓' : 'No KYC'),
                  React.createElement('span', null, 'Pi: ' + (u.balance_pi || 0)),
                  React.createElement('span', null, 'Connects: ' + (u.balance_connects || 0)),
                  React.createElement('span', null, timeAgo(u.created_at))
                )
              ),
              React.createElement('div', { className: 'admin-list-actions' },
                React.createElement('button', { className: 'btn btn-secondary', onClick: function() { onNavigate('/portfolio/' + u.id); } }, 'Portfolio'),
                React.createElement('button', {
                  className: isBlocked ? 'btn btn-success' : 'btn btn-danger',
                  onClick: function() { handleBlock(u); },
                  disabled: blocking === userId,
                  style: { minWidth: '80px' }
                }, blocking === userId ? '...' : (isBlocked ? 'Unblock' : 'Block'))
              )
            );
          })
        );
      }
    }

    return React.createElement('div', { className: 'page-container' },
      React.createElement('div', { className: 'page-header' },
        React.createElement('h1', null, 'Admin Dashboard')
      ),
      statsEl,
      tabsEl,
      tab === 'jobs' ? jobsTabEl : usersTabEl
    );
  }

  window.Admin = Admin;
  console.log('[Admin] v2 defined on window.Admin');
})();
