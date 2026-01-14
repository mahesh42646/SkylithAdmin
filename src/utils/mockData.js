import { getCurrentUser } from './auth';

export const mockUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    status: 'active',
    avatar: null,
    joinDate: '2023-01-15',
    department: 'IT'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    password: 'password123',
    role: 'management',
    status: 'active',
    avatar: null,
    joinDate: '2023-02-20',
    department: 'Operations'
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike.j@example.com',
    password: 'password123',
    role: 'team_member',
    status: 'active',
    avatar: null,
    joinDate: '2023-03-10',
    department: 'Development'
  },
  {
    id: 4,
    name: 'Sarah Williams',
    email: 'sarah.w@example.com',
    password: 'password123',
    role: 'team_member',
    status: 'active',
    avatar: null,
    joinDate: '2023-04-05',
    department: 'Design'
  },
  {
    id: 5,
    name: 'David Brown',
    email: 'david.b@example.com',
    password: 'password123',
    role: 'management',
    status: 'inactive',
    avatar: null,
    joinDate: '2023-01-20',
    department: 'Sales'
  },
  {
    id: 6,
    name: 'Emily Davis',
    email: 'emily.d@example.com',
    password: 'password123',
    role: 'team_member',
    status: 'active',
    avatar: null,
    joinDate: '2023-05-12',
    department: 'Marketing'
  },
  {
    id: 7,
    name: 'Robert Wilson',
    email: 'robert.w@example.com',
    password: 'password123',
    role: 'team_member',
    status: 'active',
    avatar: null,
    joinDate: '2023-06-01',
    department: 'Development'
  },
  {
    id: 8,
    name: 'Lisa Anderson',
    email: 'lisa.a@example.com',
    password: 'password123',
    role: 'management',
    status: 'active',
    avatar: null,
    joinDate: '2023-02-15',
    department: 'HR'
  }
];

export const mockProjects = [
  {
    id: 1,
    title: 'Website Redesign',
    status: 'in_progress',
    progress: 65,
    teamMembers: [1, 3, 4],
    deadline: '2024-02-15',
    priority: 'high',
    description: 'Complete redesign of company website'
  },
  {
    id: 2,
    title: 'Mobile App Development',
    status: 'in_progress',
    progress: 40,
    teamMembers: [3, 7],
    deadline: '2024-03-20',
    priority: 'high',
    description: 'New mobile application for iOS and Android'
  },
  {
    id: 3,
    title: 'Marketing Campaign',
    status: 'completed',
    progress: 100,
    teamMembers: [6, 8],
    deadline: '2024-01-30',
    priority: 'medium',
    description: 'Q1 marketing campaign launch'
  },
  {
    id: 4,
    title: 'Database Migration',
    status: 'pending',
    progress: 0,
    teamMembers: [1, 3],
    deadline: '2024-04-10',
    priority: 'high',
    description: 'Migrate to new database system'
  },
  {
    id: 5,
    title: 'API Integration',
    status: 'in_progress',
    progress: 80,
    teamMembers: [3, 7],
    deadline: '2024-02-28',
    priority: 'medium',
    description: 'Integrate third-party payment API'
  }
];

export const mockTasks = [
  {
    id: 1,
    title: 'Design homepage layout',
    assignee: 4,
    priority: 'high',
    status: 'completed',
    dueDate: '2024-01-25',
    projectId: 1
  },
  {
    id: 2,
    title: 'Implement user authentication',
    assignee: 3,
    priority: 'high',
    status: 'in_progress',
    dueDate: '2024-02-10',
    projectId: 2
  },
  {
    id: 3,
    title: 'Write marketing copy',
    assignee: 6,
    priority: 'medium',
    status: 'completed',
    dueDate: '2024-01-28',
    projectId: 3
  },
  {
    id: 4,
    title: 'Setup database schema',
    assignee: 1,
    priority: 'high',
    status: 'pending',
    dueDate: '2024-03-01',
    projectId: 4
  },
  {
    id: 5,
    title: 'Test payment integration',
    assignee: 7,
    priority: 'medium',
    status: 'in_progress',
    dueDate: '2024-02-20',
    projectId: 5
  },
  {
    id: 6,
    title: 'Create user dashboard',
    assignee: 3,
    priority: 'high',
    status: 'in_progress',
    dueDate: '2024-02-15',
    projectId: 2
  },
  {
    id: 7,
    title: 'Review design mockups',
    assignee: 4,
    priority: 'low',
    status: 'pending',
    dueDate: '2024-02-05',
    projectId: 1
  }
];

export const mockNotifications = [
  {
    id: 1,
    message: 'New user registered',
    type: 'info',
    time: '2 hours ago',
    read: false
  },
  {
    id: 2,
    message: 'Project deadline approaching',
    type: 'warning',
    time: '5 hours ago',
    read: false
  },
  {
    id: 3,
    message: 'Task completed successfully',
    type: 'success',
    time: '1 day ago',
    read: true
  },
  {
    id: 4,
    message: 'System maintenance scheduled',
    type: 'info',
    time: '2 days ago',
    read: true
  }
];

export const getAnalyticsData = () => {
  return {
    userActivity: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [120, 190, 300, 250, 200, 150, 180]
    },
    projectStatus: {
      labels: ['Completed', 'In Progress', 'Pending'],
      data: [12, 8, 5]
    },
    taskCompletion: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      data: [65, 78, 82, 75, 88, 90]
    },
    revenue: {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      data: [45000, 52000, 48000, 61000]
    }
  };
};

export const getStats = (role) => {
  const baseStats = {
    totalUsers: mockUsers.length,
    activeUsers: mockUsers.filter(u => u.status === 'active').length,
    totalProjects: mockProjects.length,
    activeProjects: mockProjects.filter(p => p.status === 'in_progress').length,
    totalTasks: mockTasks.length,
    completedTasks: mockTasks.filter(t => t.status === 'completed').length,
    revenue: 206000,
    tasksCompleted: mockTasks.filter(t => t.status === 'completed').length
  };

  if (role === 'team_member') {
    const user = getCurrentUser();
    const userTasks = mockTasks.filter(t => t.assignee === user?.id);
    return {
      myTasks: userTasks.length,
      completedTasks: userTasks.filter(t => t.status === 'completed').length,
      inProgressTasks: userTasks.filter(t => t.status === 'in_progress').length,
      pendingTasks: userTasks.filter(t => t.status === 'pending').length
    };
  }

  return baseStats;
};

