// App.js - Main App with Client-Side Routing
const { useState, useEffect, useCallback } = React;

// Simple hash-based router
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState("/");

  // Parse route from hash
  const parseRoute = useCallback(() => {
    const hash = window.location.hash || "#/";
    const path = hash.replace("#/", "/") || "/";
    setCurrentPath(path);
  }, []);

  // Check for stored user on mount
  useEffect(() => {
    const stored = localStorage.getItem("workpro_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.uid) {
          setUser(parsed);
        }
      } catch (e) {
        console.error("Error parsing stored user:", e);
        localStorage.removeItem("workpro_user");
      }
    }
    setLoading(false);
    parseRoute();
  }, [parseRoute]);

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => parseRoute();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [parseRoute]);

  const handleLogin = (userData) => {
    setUser(userData);
    navigateTo("/");
  };

  const handleLogout = () => {
    localStorage.removeItem("workpro_user");
    setUser(null);
    navigateTo("/");
  };

  const handleUpdateUser = (userData) => {
    setUser(userData);
  };

  const navigateTo = (path) => {
    window.location.hash = path;
  };

  // Extract route params
  const getRouteParams = () => {
    const parts = currentPath.split("/").filter(Boolean);
    return parts;
  };

  // Render the appropriate component based on route
  const renderRoute = () => {
    const parts = getRouteParams();
    const route = parts.length === 0 ? "/" : "/" + parts[0];

    if (!user) {
      return <Auth onLogin={handleLogin} />;
    }

    switch (route) {
      case "/":
        return <Home user={user} onNavigate={navigateTo} />;

      case "/jobs":
        if (parts.length > 1) {
          // /jobs/:id
          return (
            <JobDetail
              user={user}
              jobId={parts[1]}
              onNavigate={navigateTo}
            />
          );
        }
        return <JobList user={user} onNavigate={navigateTo} />;

      case "/create-job":
        return <CreateJob user={user} onNavigate={navigateTo} />;

      case "/my-jobs":
        return <MyJobs user={user} onNavigate={navigateTo} />;

      case "/chat":
        if (parts.length > 1) {
          // /chat/:id
          return (
            <ChatRoom
              user={user}
              conversationId={parts[1]}
              onNavigate={navigateTo}
            />
          );
        }
        return <Chat user={user} onNavigate={navigateTo} />;

      case "/escrow":
        return <Escrow user={user} onNavigate={navigateTo} />;

      case "/profile":
        return <Profile user={user} onUpdateUser={handleUpdateUser} />;

      case "/connects":
        return <Connects user={user} onUpdateUser={handleUpdateUser} />;

      case "/portfolio":
        return <Portfolio user={user} onNavigate={navigateTo} />;

      case "/applications":
        return <Applications user={user} onNavigate={navigateTo} />;

      case "/reviews":
        return <Reviews user={user} onNavigate={navigateTo} />;

      default:
        return (
          <div className="page-container">
            <div className="error-container">
              <h1>404</h1>
              <p>Page not found.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigateTo("/")}
              >
                Go Home
              </button>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="spinner large"></span>
        <p>Loading Work Pro...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {user && (
        <Navbar
          user={user}
          onLogout={handleLogout}
          onNavigate={navigateTo}
          currentPath={currentPath}
        />
      )}
      <main className="main-content">{renderRoute()}</main>
    </div>
  );
}
