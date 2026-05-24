// Portfolio.js - minimal placeholder
const { useState } = React;

function Portfolio({ user }) {
  return (
    <div className="page-container">
      <h1>Portfolio</h1>
      <p>User: {user?.username || 'Guest'}</p>
    </div>
  );
}
