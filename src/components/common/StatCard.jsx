'use client';

export default function StatCard({ icon: Icon, title, value, change, changeType = 'positive', color = 'primary' }) {
  const changeColor = changeType === 'positive' ? 'text-success' : 'text-danger';
  const iconBg = {
    primary: 'bg-purple-light',
    success: 'bg-success bg-opacity-10',
    warning: 'bg-warning bg-opacity-10',
    danger: 'bg-danger bg-opacity-10',
    info: 'bg-info bg-opacity-10'
  };

  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className={`rounded p-3 ${iconBg[color]}`}>
            <Icon size={24} className={`text-${color === 'primary' ? 'purple' : color}`} />
          </div>
          {change && (
            <span className={`small ${changeColor}`}>
              {changeType === 'positive' ? '↑' : '↓'} {change}
            </span>
          )}
        </div>
        <h6 className="text-muted mb-2 small text-uppercase">{title}</h6>
        <h3 className="mb-0 fw-bold">{value}</h3>
      </div>
    </div>
  );
}

