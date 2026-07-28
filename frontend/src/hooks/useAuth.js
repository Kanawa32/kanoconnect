import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, login, logout, register } = useAuthStore();

  const hasRole = (roles) => {
    if (!user) return false;
    if (typeof roles === 'string') return user.role === roles;
    return roles.includes(user.role);
  };

  const isAdmin = () => hasRole(['admin', 'super_admin']);
  const isDispatcher = () => hasRole(['dispatcher', 'admin', 'super_admin']);
  const isRider = () => user?.role === 'rider';
  const isCustomer = () => user?.role === 'customer';

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    hasRole,
    isAdmin,
    isDispatcher,
    isRider,
    isCustomer,
  };
};
