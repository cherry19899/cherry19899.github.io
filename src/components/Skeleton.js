// Skeleton.js - Reusable skeleton loader components
function SkeletonBox({ width, height, style }) {
  return (
    <div
      className="skeleton-box"
      style={{ width: width || '100%', height: height || '16px', borderRadius: '6px', ...style }}
    />
  );
}

function SkeletonJobCard() {
  return (
    <div className="job-card skeleton-card">
      <div className="job-card-header">
        <SkeletonBox width="60px" height="22px" />
        <SkeletonBox width="80px" height="14px" />
      </div>
      <SkeletonBox height="22px" style={{ marginTop: '12px', marginBottom: '8px' }} />
      <SkeletonBox height="14px" style={{ marginBottom: '4px' }} />
      <SkeletonBox height="14px" width="80%" style={{ marginBottom: '12px' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <SkeletonBox width="70px" height="20px" />
        <SkeletonBox width="90px" height="20px" />
        <SkeletonBox width="60px" height="20px" />
      </div>
    </div>
  );
}

function SkeletonJobGrid({ count }) {
  return (
    <div className="jobs-grid">
      {Array.from({ length: count || 6 }).map((_, i) => (
        <SkeletonJobCard key={i} />
      ))}
    </div>
  );
}

function SkeletonProfile() {
  return (
    <div className="page-container">
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
        <div className="skeleton-box" style={{ width: '72px', height: '72px', borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <SkeletonBox width="160px" height="22px" style={{ marginBottom: '8px' }} />
          <SkeletonBox width="120px" height="16px" />
        </div>
      </div>
      <SkeletonBox height="16px" style={{ marginBottom: '8px' }} />
      <SkeletonBox height="16px" width="90%" style={{ marginBottom: '8px' }} />
      <SkeletonBox height="16px" width="70%" style={{ marginBottom: '24px' }} />
      <SkeletonBox height="44px" style={{ marginBottom: '12px' }} />
      <SkeletonBox height="44px" style={{ marginBottom: '12px' }} />
      <SkeletonBox height="44px" />
    </div>
  );
}

function SkeletonMessages({ count }) {
  return (
    <div className="messages-container" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Array.from({ length: count || 5 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: i % 2 === 0 ? 'flex-end' : 'flex-start' }}>
          <div className="skeleton-box" style={{ width: `${50 + (i * 23) % 30}%`, height: '44px', borderRadius: '12px' }} />
        </div>
      ))}
    </div>
  );
}
