export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_REPORTS: 'view_reports',
  
  // User Management
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  
  // Team Management
  VIEW_TEAM: 'view_team',
  MANAGE_TEAM: 'manage_team',
  
  // Projects
  VIEW_PROJECTS: 'view_projects',
  CREATE_PROJECTS: 'create_projects',
  EDIT_PROJECTS: 'edit_projects',
  DELETE_PROJECTS: 'delete_projects',
  
  // Tasks
  VIEW_TASKS: 'view_tasks',
  CREATE_TASKS: 'create_tasks',
  EDIT_TASKS: 'edit_tasks',
  DELETE_TASKS: 'delete_tasks',
  ASSIGN_TASKS: 'assign_tasks',
  
  // Settings
  VIEW_SETTINGS: 'view_settings',
  EDIT_SETTINGS: 'edit_settings',
  SYSTEM_SETTINGS: 'system_settings',
  
  // Audit
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  
  // Calendar
  VIEW_CALENDAR: 'view_calendar',
  MANAGE_CALENDAR: 'manage_calendar',
  
  // Tickets/Contact
  VIEW_TICKETS: 'view_tickets',
  MANAGE_TICKETS: 'manage_tickets',
  RAISE_TICKET: 'raise_ticket',
  
  // Attendance
  VIEW_ATTENDANCE: 'view_attendance',
  MANAGE_ATTENDANCE: 'manage_attendance',
  MARK_ATTENDANCE: 'mark_attendance',

  // Leave
  VIEW_LEAVES: 'view_leaves',
  MANAGE_LEAVES: 'manage_leaves'
};

// Role-based default permissions
export const ROLE_PERMISSIONS = {
  admin: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.VIEW_TEAM,
    PERMISSIONS.MANAGE_TEAM,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.CREATE_PROJECTS,
    PERMISSIONS.EDIT_PROJECTS,
    PERMISSIONS.DELETE_PROJECTS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.CREATE_TASKS,
    PERMISSIONS.EDIT_TASKS,
    PERMISSIONS.DELETE_TASKS,
    PERMISSIONS.ASSIGN_TASKS,
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.EDIT_SETTINGS,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_CALENDAR,
    PERMISSIONS.MANAGE_CALENDAR,
    PERMISSIONS.VIEW_TICKETS,
    PERMISSIONS.MANAGE_TICKETS,
    PERMISSIONS.RAISE_TICKET,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.MANAGE_ATTENDANCE,
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.VIEW_LEAVES,
    PERMISSIONS.MANAGE_LEAVES
  ],
  management: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_TEAM,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.CREATE_PROJECTS,
    PERMISSIONS.EDIT_PROJECTS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.CREATE_TASKS,
    PERMISSIONS.EDIT_TASKS,
    PERMISSIONS.ASSIGN_TASKS,
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.VIEW_CALENDAR,
    PERMISSIONS.VIEW_TICKETS,
    PERMISSIONS.MANAGE_TICKETS,
    PERMISSIONS.RAISE_TICKET,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.MANAGE_ATTENDANCE,
    PERMISSIONS.VIEW_LEAVES,
    PERMISSIONS.MANAGE_LEAVES
  ],
  team_member: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.VIEW_CALENDAR,
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.VIEW_TICKETS,
    PERMISSIONS.RAISE_TICKET,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.VIEW_LEAVES
  ]
};

// Permission groups for UI
export const PERMISSION_GROUPS = [
  {
    label: 'Dashboard',
    permissions: [
      { key: PERMISSIONS.VIEW_DASHBOARD, label: 'View Dashboard' },
      { key: PERMISSIONS.VIEW_ANALYTICS, label: 'View Analytics' },
      { key: PERMISSIONS.VIEW_REPORTS, label: 'View Reports' }
    ]
  },
  {
    label: 'User Management',
    permissions: [
      { key: PERMISSIONS.VIEW_USERS, label: 'View Users' },
      { key: PERMISSIONS.CREATE_USERS, label: 'Create Users' },
      { key: PERMISSIONS.EDIT_USERS, label: 'Edit Users' },
      { key: PERMISSIONS.DELETE_USERS, label: 'Delete Users' }
    ]
  },
  {
    label: 'Team Management',
    permissions: [
      { key: PERMISSIONS.VIEW_TEAM, label: 'View Team' },
      { key: PERMISSIONS.MANAGE_TEAM, label: 'Manage Team' }
    ]
  },
  {
    label: 'Projects',
    permissions: [
      { key: PERMISSIONS.VIEW_PROJECTS, label: 'View Projects' },
      { key: PERMISSIONS.CREATE_PROJECTS, label: 'Create Projects' },
      { key: PERMISSIONS.EDIT_PROJECTS, label: 'Edit Projects' },
      { key: PERMISSIONS.DELETE_PROJECTS, label: 'Delete Projects' }
    ]
  },
  {
    label: 'Tasks',
    permissions: [
      { key: PERMISSIONS.VIEW_TASKS, label: 'View Tasks' },
      { key: PERMISSIONS.CREATE_TASKS, label: 'Create Tasks' },
      { key: PERMISSIONS.EDIT_TASKS, label: 'Edit Tasks' },
      { key: PERMISSIONS.DELETE_TASKS, label: 'Delete Tasks' },
      { key: PERMISSIONS.ASSIGN_TASKS, label: 'Assign Tasks' }
    ]
  },
  {
    label: 'Settings',
    permissions: [
      { key: PERMISSIONS.VIEW_SETTINGS, label: 'View Settings' },
      { key: PERMISSIONS.EDIT_SETTINGS, label: 'Edit Settings' },
      { key: PERMISSIONS.SYSTEM_SETTINGS, label: 'System Settings' }
    ]
  },
  {
    label: 'Other',
    permissions: [
      { key: PERMISSIONS.VIEW_AUDIT_LOGS, label: 'View Audit Logs' },
      { key: PERMISSIONS.VIEW_CALENDAR, label: 'View Calendar' },
      { key: PERMISSIONS.MANAGE_CALENDAR, label: 'Manage Calendar' },
      { key: PERMISSIONS.VIEW_TICKETS, label: 'View Tickets' },
      { key: PERMISSIONS.MANAGE_TICKETS, label: 'Manage Tickets' },
      { key: PERMISSIONS.RAISE_TICKET, label: 'Raise Ticket (Mobile)' }
    ]
  },
  {
    label: 'Attendance',
    permissions: [
      { key: PERMISSIONS.VIEW_ATTENDANCE, label: 'View Attendance' },
      { key: PERMISSIONS.MANAGE_ATTENDANCE, label: 'Manage Attendance' },
      { key: PERMISSIONS.MARK_ATTENDANCE, label: 'Mark Attendance' }
    ]
  },
  {
    label: 'Leave',
    permissions: [
      { key: PERMISSIONS.VIEW_LEAVES, label: 'View Leaves' },
      { key: PERMISSIONS.MANAGE_LEAVES, label: 'Approve/Reject Leaves' }
    ]
  }
];

// Get default permissions for a role
export const getDefaultPermissions = (role) => {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.team_member;
};

// Check if user has permission
export const hasPermission = (user, permission) => {
  if (!user) return false;
  
  // Admin always has all permissions
  if (user.role === 'admin') return true;
  
  // Check custom permissions if set
  if (user.permissions && Array.isArray(user.permissions)) {
    return user.permissions.includes(permission);
  }
  
  // Fall back to role-based permissions
  const rolePerms = ROLE_PERMISSIONS[user.role] || [];
  return rolePerms.includes(permission);
};

// Check if user has any of the permissions
export const hasAnyPermission = (user, permissions) => {
  if (!user) return false;
  return permissions.some(perm => hasPermission(user, perm));
};

// Check if user has all of the permissions
export const hasAllPermissions = (user, permissions) => {
  if (!user) return false;
  return permissions.every(perm => hasPermission(user, perm));
};

