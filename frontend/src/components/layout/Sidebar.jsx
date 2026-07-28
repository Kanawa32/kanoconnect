import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Truck, Users, 
  BarChart3, MapPin, Settings, X, LogOut,
  Warehouse, CreditCard, Bell, Zap, UserCheck, Banknote, DollarSign
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['customer', 'rider', 'dispatcher', 'admin', 'super_admin'] },
  { path: '/shipments', label: 'Orders', icon: Package, roles: ['customer', 'rider', 'dispatcher', 'admin', 'super_admin'] },
  { path: '/orders/available', label: 'Available Orders', icon: Zap, roles: ['rider'] },
  { path: '/shipments/create', label: 'New Order', icon: Package, roles: ['customer'] },
  { path: '/fleet/vehicles', label: 'Vehicles', icon: Truck, roles: ['admin', 'super_admin', 'dispatcher'] },
  { path: '/fleet/fleets', label: 'Fleets', icon: Warehouse, roles: ['admin', 'super_admin', 'dispatcher'] },
  { path: '/users', label: 'Users', icon: Users, roles: ['admin', 'super_admin', 'dispatcher'] },
  { path: '/drivers', label: 'Drivers', icon: UserCheck, roles: ['admin', 'super_admin'] },
  { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'super_admin', 'dispatcher'] },
  { path: '/payments/settings', label: 'Payment Settings', icon: Banknote, roles: ['admin', 'super_admin'] },
  { path: '/pricing', label: 'Pricing', icon: DollarSign, roles: ['admin', 'super_admin'] },
  { path: '/track', label: 'Tracking', icon: MapPin, roles: ['customer', 'rider', 'dispatcher', 'admin', 'super_admin'] },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:fixed top-0 left-0 z-50 h-full w-64
        bg-gradient-sidebar
        transform transition-all duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="relative flex items-center justify-between h-16 px-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-extrabold text-white tracking-tight">K</span>
              <span className="text-2xl font-extrabold text-accent-500">.</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight tracking-tight">Kano<span className="text-accent-500">Connect</span></h1>
              <p className="text-[10px] text-white/40 tracking-[3px] font-semibold uppercase">LOGISTICS</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="relative p-3 space-y-0.5 mt-2">
          {filteredNav.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => 
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4 px-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 flex items-center justify-center shadow-lg shadow-accent-500/20">
              <span className="text-white font-bold text-sm">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-white/50 capitalize font-medium">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-white/50 rounded-lg hover:bg-white/10 hover:text-white transition-all duration-200 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
