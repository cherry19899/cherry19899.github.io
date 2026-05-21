// App.js patch - adds Portfolio route support to existing App component
// This script patches the React app to recognize /portfolio route
(function() {
  'use strict';
  
  var originalRender;
  var patchApplied = false;
  
  function patchApp() {
    if (patchApplied) return;
    
    // Wait for React app to mount
    var root = document.getElementById('root');
    if (!root || !root.children.length) return;
    
    // Find App component in React tree
    var reactRoot = root._reactRootContainer || root.__reactContainer;
    if (!reactRoot) return;
    
    // Alternative: intercept hash changes
    patchApplied = true;
  }
  
  // Intercept hash-based routing
  var originalPushState = history.pushState;
  var originalReplaceState = history.replaceState;
  
  function handleRouteChange() {
    var hash = window.location.hash || '#/portfolio';
    if (hash.indexOf('#/portfolio') !== -1) {
      // Check if Portfolio page should render
      setTimeout(function() {
        var root = document.getElementById('root');
        if (!root) return;
        
        // Check if main content is showing (not 404 or default)
        var mainContent = root.querySelector('main, .main-content') || root;
        if (mainContent.textContent.indexOf('404') !== -1 || 
            mainContent.textContent.indexOf('Page not found') !== -1 ||
            mainContent.children.length === 0) {
          // Force render Portfolio
          var user = null;
          try {
            var stored = localStorage.getItem('workpro_user');
            if (stored) user = JSON.parse(stored);
          } catch(e) {}
          
          if (user && typeof window.Portfolio === 'function') {
            var container = document.createElement('div');
            container.id = 'portfolio-container';
            
            // Clear main content
            while (mainContent.firstChild) {
              mainContent.removeChild(mainContent.firstChild);
            }
            
            // Render Portfolio using ReactDOM
            if (window.ReactDOM && window.ReactDOM.createRoot) {
              var portfolioEl = window.React.createElement(window.Portfolio, {
                user: user,
                onNavigate: function(path) { window.location.hash = path; }
              });
              var rootContainer = window.ReactDOM.createRoot(container);
              rootContainer.render(portfolioEl);
              mainContent.appendChild(container);
              console.log('[PortfolioPatch] Rendered Portfolio page');
            }
          }
        }
      }, 100);
    }
  }
  
  // Listen for hash changes
  window.addEventListener('hashchange', handleRouteChange);
  
  // Also intercept initial load
  window.addEventListener('load', function() {
    setTimeout(handleRouteChange, 500);
    setTimeout(handleRouteChange, 1500);
  });
  
  // Override history methods to catch programmatic navigation
  history.pushState = function() {
    originalPushState.apply(this, arguments);
    setTimeout(handleRouteChange, 50);
  };
  history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    setTimeout(handleRouteChange, 50);
  };
  
  // Periodic check (in case React re-renders)
  setInterval(function() {
    var hash = window.location.hash || '';
    if (hash.indexOf('#/portfolio') !== -1) {
      var container = document.getElementById('portfolio-container');
      if (!container) {
        handleRouteChange();
      }
    }
  }, 2000);
  
  console.log('[PortfolioPatch] Route interceptor installed');
})();