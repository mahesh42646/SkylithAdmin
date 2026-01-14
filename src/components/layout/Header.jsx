'use client';

import { useState, useEffect } from 'react';
import { FaBell, FaSearch, FaBars, FaSignOutAlt, FaUser, FaCog, FaChevronDown } from 'react-icons/fa';
import { getCurrentUser, logout, ROLES } from '@/utils/auth';
import { useRouter } from 'next/navigation';
import UserAvatar from '../common/UserAvatar';

export default function Header({ onMenuToggle }) {
  const [user, setUser] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const router = useRouter();

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getRoleBadge = (role) => {
    const badges = {
      [ROLES.ADMIN]: { label: 'Admin', color: 'danger' },
      [ROLES.MANAGEMENT]: { label: 'Management', color: 'warning' },
      [ROLES.TEAM_MEMBER]: { label: 'Team Member', color: 'primary' }
    };
    return badges[role] || badges[ROLES.TEAM_MEMBER];
  };

  const roleBadge = user ? getRoleBadge(user.role) : null;

  return (
    <header
      className="d-flex align-items-center justify-content-between px-3 py-2"
      style={{
        height: '70px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1001
      }}
    >
      <div className="d-flex align-items-center">
        <button
          className="btn btn-link d-md-none me-2"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <FaBars size={20} />
        </button>
        <h4 className="mb-0 text-purple fw-bold">Admin Dashboard</h4>
      </div>

      <div className="d-none d-md-flex align-items-center flex-grow-1 mx-4">
        <div className="position-relative flex-grow-1" style={{ maxWidth: '500px' }}>
          <FaSearch
            className="position-absolute"
            style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }}
          />
          <input
            type="text"
            className="form-control ps-5"
            placeholder="Search..."
            style={{ backgroundColor: '#F3F4F6', border: 'none' }}
          />
        </div>
      </div>

      <div className="d-flex align-items-center gap-3">
        <div className="position-relative">
          <button
            className="btn btn-link position-relative"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            aria-label="Notifications"
          >
            <FaBell size={20} />
            {unreadCount > 0 && (
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                style={{ fontSize: '0.65rem' }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className="card position-absolute end-0 mt-2"
              style={{
                width: '320px',
                maxHeight: '400px',
                overflowY: 'auto',
                zIndex: 1002,
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
              }}
            >
              <div className="card-header bg-white">
                <h6 className="mb-0">Notifications</h6>
              </div>
              <div className="list-group list-group-flush">
                <div className="list-group-item">
                  <div className="d-flex w-100 justify-content-between">
                    <h6 className="mb-1 small">New user registered</h6>
                    <small className="text-muted">2h ago</small>
                  </div>
                  <p className="mb-0 small text-muted">A new team member has joined</p>
                </div>
                <div className="list-group-item">
                  <div className="d-flex w-100 justify-content-between">
                    <h6 className="mb-1 small">Project deadline approaching</h6>
                    <small className="text-muted">5h ago</small>
                  </div>
                  <p className="mb-0 small text-muted">Website Redesign due in 2 days</p>
                </div>
                <div className="list-group-item">
                  <div className="d-flex w-100 justify-content-between">
                    <h6 className="mb-1 small">Task completed</h6>
                    <small className="text-muted">1d ago</small>
                  </div>
                  <p className="mb-0 small text-muted">Design homepage layout completed</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="position-relative">
          <button
            className="btn btn-link d-flex align-items-center gap-2 p-2 rounded"
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            style={{
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              border: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F3F4F6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <UserAvatar user={user} size={36} />
            <div className="d-none d-lg-flex flex-column align-items-start">
              <span className="fw-semibold" style={{ fontSize: '0.875rem', lineHeight: '1.2' }}>
                {user?.name || 'User'}
              </span>
              {roleBadge && (
                <span className={`badge bg-${roleBadge.color}`} style={{ fontSize: '0.65rem', marginTop: '2px' }}>
                  {roleBadge.label}
                </span>
              )}
            </div>
            <FaChevronDown 
              size={12} 
              className="d-none d-lg-inline"
              style={{ 
                color: '#6B7280',
                transition: 'transform 0.2s ease',
                transform: showProfile ? 'rotate(180deg)' : 'rotate(0deg)'
              }}
            />
          </button>

          {showProfile && (
            <div
              className="position-absolute end-0 mt-2"
              style={{
                width: '320px',
                zIndex: 1002,
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                borderRadius: '0.75rem',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                overflow: 'hidden'
              }}
            >
              {/* Header Section with Red Bar */}
              <div style={{
                backgroundColor: '#FFFFFF',
                padding: '1.25rem',
                borderBottom: '1px solid #F3F4F6',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  backgroundColor: user?.role === 'admin' ? '#EF4444' : user?.role === 'management' ? '#F59E0B' : '#8B5CF6'
                }} />
                <div className="d-flex align-items-center gap-3">
                  <UserAvatar user={user} size={56} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h6 className="mb-1 fw-bold" style={{ 
                      fontSize: '1rem',
                      color: '#1F2937',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {user?.name || 'User'}
                    </h6>
                    <p className="mb-1 small text-muted" style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '0.8125rem'
                    }}>
                      {user?.email || ''}
                    </p>
                    {roleBadge && (
                      <span className={`badge bg-${roleBadge.color}`} style={{ fontSize: '0.75rem' }}>
                        {roleBadge.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Items */}
              <div style={{ padding: '0.5rem' }}>
                <button
                  className="btn btn-link w-100 text-start d-flex align-items-center gap-3 p-3 rounded"
                  onClick={() => {
                    router.push('/settings');
                    setShowProfile(false);
                  }}
                  style={{
                    textDecoration: 'none',
                    color: '#374151',
                    border: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                    e.currentTarget.style.color = '#5B21B6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#374151';
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '0.5rem',
                    backgroundColor: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#8B5CF6',
                    flexShrink: 0
                  }}>
                    <FaUser size={16} />
                  </div>
                  <div>
                    <div className="fw-semibold" style={{ fontSize: '0.875rem' }}>Profile Settings</div>
                    <div className="text-muted small" style={{ fontSize: '0.75rem' }}>Manage your account</div>
                  </div>
                </button>

                <button
                  className="btn btn-link w-100 text-start d-flex align-items-center gap-3 p-3 rounded"
                  onClick={handleLogout}
                  style={{
                    textDecoration: 'none',
                    color: '#DC2626',
                    border: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FEF2F2';
                    e.currentTarget.style.color = '#B91C1C';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#DC2626';
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '0.5rem',
                    backgroundColor: '#FEE2E2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#DC2626',
                    flexShrink: 0
                  }}>
                    <FaSignOutAlt size={16} />
                  </div>
                  <div>
                    <div className="fw-semibold" style={{ fontSize: '0.875rem' }}>Logout</div>
                    <div className="text-muted small" style={{ fontSize: '0.75rem' }}>Sign out of your account</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {(showNotifications || showProfile) && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ zIndex: 1001 }}
          onClick={() => {
            setShowNotifications(false);
            setShowProfile(false);
          }}
        />
      )}
    </header>
  );
}

