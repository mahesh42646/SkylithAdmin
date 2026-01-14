import { getDefaultPermissions } from './permissions';
import api from './api';

export const ROLES = {
  ADMIN: 'admin',
  MANAGEMENT: 'management',
  TEAM_MEMBER: 'team_member'
};

export const login = async (email, password) => {
  try {
    const response = await api.login(email, password);
    
    if (response.success && response.token) {
      // Store user with token
      const userData = {
        ...response.data,
        token: response.token
      };
      setCurrentUser(userData);
      return { success: true, user: response.data, token: response.token };
    }
    
    return { success: false, message: response.message || 'Login failed' };
  } catch (error) {
    return { success: false, message: error.message || 'An error occurred during login' };
  }
};

export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setCurrentUser = (user) => {
  if (typeof window === 'undefined') return;
  // Store user with token if available
  const userData = {
    ...user,
    token: user.token || getCurrentUser()?.token || null
  };
  localStorage.setItem('currentUser', JSON.stringify(userData));
};

export const logout = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('currentUser');
};

export const refreshUserData = async () => {
  try {
    const response = await api.getMe();
    if (response.success && response.data) {
      const currentUser = getCurrentUser();
      setCurrentUser({
        ...response.data,
        token: currentUser?.token || null
      });
      return { success: true, user: response.data };
    }
    return { success: false };
  } catch (error) {
    console.error('Error refreshing user data:', error);
    return { success: false, error };
  }
};

export const isAuthenticated = () => {
  return getCurrentUser() !== null;
};

export const hasRole = (requiredRole) => {
  const user = getCurrentUser();
  if (!user) return false;
  return user.role === requiredRole;
};

export const hasAnyRole = (roles) => {
  const user = getCurrentUser();
  if (!user) return false;
  return roles.includes(user.role);
};

export const canAccess = (requiredRole) => {
  const user = getCurrentUser();
  if (!user) return false;
  
  if (requiredRole === ROLES.ADMIN) {
    return user.role === ROLES.ADMIN;
  }
  if (requiredRole === ROLES.MANAGEMENT) {
    return user.role === ROLES.ADMIN || user.role === ROLES.MANAGEMENT;
  }
  return true;
};

