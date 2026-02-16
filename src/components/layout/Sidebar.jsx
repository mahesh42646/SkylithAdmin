'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaHome,
  FaUsers,
  FaUserFriends,
  FaProjectDiagram,
  FaChartBar,
  FaCog,
  FaClipboardList,
  FaFileAlt,
  FaCalendar,
  FaUser,
  FaHistory,
  FaChevronLeft,
  FaChevronRight,
  FaUserShield,
  FaTicketAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUmbrellaBeach
} from 'react-icons/fa';
import { getCurrentUser, ROLES } from '@/utils/auth';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';

// Menu items with permission requirements
const allMenuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: FaHome, permission: PERMISSIONS.VIEW_DASHBOARD },
  { path: '/users', label: 'Employee Management', icon: FaUsers, permission: PERMISSIONS.VIEW_USERS },
  { path: '/projects', label: 'Projects', icon: FaProjectDiagram, permission: PERMISSIONS.VIEW_PROJECTS },
  { path: '/analytics', label: 'Analytics & Reports', icon: FaChartBar, permission: PERMISSIONS.VIEW_ANALYTICS },
  { path: '/tasks', label: 'Tasks', icon: FaClipboardList, permission: PERMISSIONS.VIEW_TASKS },
  { path: '/calendar', label: 'Calendar', icon: FaCalendar, permission: PERMISSIONS.VIEW_CALENDAR },
  { path: '/leaves', label: 'Leave Management', icon: FaUmbrellaBeach, permission: PERMISSIONS.VIEW_LEAVES },
  { path: '/attendance', label: 'Attendance', icon: FaClock, permission: PERMISSIONS.VIEW_ATTENDANCE },
  { path: '/tickets', label: 'Tickets', icon: FaTicketAlt, permission: PERMISSIONS.VIEW_TICKETS },
  { path: '/settings', label: 'Settings', icon: FaCog, permission: PERMISSIONS.VIEW_SETTINGS }
];

export default function Sidebar({ isOpen, onToggle }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  
  // Load user data only on client side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    const handleResize = () => {
      if (window.innerWidth < 992) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter menu items based on user permissions
  // Show all items during SSR/hydration, then filter after mount
  const items = (mounted && user) ? allMenuItems.filter(item => {
    // Dashboard is always accessible if user is logged in
    if (item.path === '/dashboard') return true;
    // Check permission for other items
    return hasPermission(user, item.permission);
  }) : allMenuItems;

  const isActive = (path) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname?.startsWith(path);
  };

  return (
    <>
      <div
        className={`sidebar ${collapsed ? 'collapsed' : ''} ${!isOpen ? 'mobile-hidden' : ''}`}
        style={{
          width: collapsed ? '80px' : '260px',
          minHeight: '100vh',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E5E7EB',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 1000,
          transition: 'width 0.3s ease, transform 0.3s ease',
          paddingTop: '70px',
          ...(mounted && typeof window !== 'undefined' && window.innerWidth < 992 && {
            transform: `translateX(${isOpen ? '0' : '-100%'})`
          })
        }}
      >
        <div className="d-flex flex-column h-100">
          <div className="px-3 mb-3 d-none d-lg-block">
            <button
              className="btn btn-sm btn-outline-secondary w-100"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
            </button>
          </div>

          <nav className="flex-grow-1 px-2">
            {items.map((item) => {
              const Icon = item.icon;
              const active = mounted ? isActive(item.path) : false;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`sidebar-item d-flex align-items-center mb-2 px-3 py-2 rounded text-decoration-none ${
                    active ? 'active' : ''
                  }`}
                  style={{
                    backgroundColor: active ? '#DDD6FE' : 'transparent',
                    color: active ? '#5B21B6' : '#1F2937',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 992) {
                      onToggle();
                    }
                  }}
                  suppressHydrationWarning
                >
                  <Icon className="me-3" size={20} />
                  {!collapsed && <span className="fw-medium">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {mounted && isOpen && typeof window !== 'undefined' && window.innerWidth < 992 && (
        <div
          className="sidebar-overlay"
          onClick={onToggle}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 999
          }}
        />
      )}
    </>
  );
}

