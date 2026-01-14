'use client';

import { useState, useEffect } from 'react';
import { FaTimes, FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaBan } from 'react-icons/fa';

const Notification = ({ message, type = 'error', onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
      case 'warning':
        return <FaExclamationTriangle />;
      case 'info':
        return <FaInfoCircle />;
      case 'success':
        return <FaCheckCircle />;
      case 'permission':
        return <FaBan />;
      default:
        return <FaInfoCircle />;
    }
  };

  const getStyles = () => {
    const baseStyles = {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      minWidth: '350px',
      maxWidth: '500px',
      padding: '1rem 1.25rem',
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      transition: 'all 0.3s ease',
      transform: isVisible ? 'translateX(0)' : 'translateX(400px)',
      opacity: isVisible ? 1 : 0,
      pointerEvents: isVisible ? 'auto' : 'none'
    };

    switch (type) {
      case 'error':
        return {
          ...baseStyles,
          backgroundColor: '#FEF2F2',
          borderLeft: '4px solid #EF4444',
          color: '#991B1B'
        };
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: '#FFFBEB',
          borderLeft: '4px solid #F59E0B',
          color: '#92400E'
        };
      case 'info':
        return {
          ...baseStyles,
          backgroundColor: '#EFF6FF',
          borderLeft: '4px solid #3B82F6',
          color: '#1E40AF'
        };
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: '#F0FDF4',
          borderLeft: '4px solid #10B981',
          color: '#065F46'
        };
      case 'permission':
        return {
          ...baseStyles,
          backgroundColor: '#FEF3C7',
          borderLeft: '4px solid #F59E0B',
          color: '#92400E',
          border: '1px solid #FCD34D'
        };
      default:
        return baseStyles;
    }
  };

  const iconColor = {
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    success: '#10B981',
    permission: '#F59E0B'
  }[type] || '#6B7280';

  return (
    <div style={getStyles()}>
      <div style={{ 
        fontSize: '1.25rem', 
        color: iconColor,
        flexShrink: 0,
        marginTop: '2px'
      }}>
        {getIcon()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontWeight: 600, 
          marginBottom: '0.25rem',
          fontSize: '0.9375rem'
        }}>
          {type === 'permission' ? 'Access Denied' : type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : type === 'success' ? 'Success' : 'Information'}
        </div>
        <div style={{ 
          fontSize: '0.875rem', 
          lineHeight: '1.5',
          color: type === 'permission' ? '#78350F' : 'inherit'
        }}>
          {message}
        </div>
      </div>
      <button
        onClick={handleClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.7,
          transition: 'opacity 0.2s',
          flexShrink: 0
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
        aria-label="Close notification"
      >
        <FaTimes size={14} />
      </button>
    </div>
  );
};

export default Notification;

