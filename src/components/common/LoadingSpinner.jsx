'use client';

export default function LoadingSpinner({ size = 'md', fullScreen = false }) {
  const sizeClasses = {
    sm: 'spinner-border-sm',
    md: '',
    lg: 'spinner-border-lg'
  };

  const spinner = (
    <div className={`spinner-border text-primary ${sizeClasses[size]}`} role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        {spinner}
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center justify-content-center p-4">
      {spinner}
    </div>
  );
}

