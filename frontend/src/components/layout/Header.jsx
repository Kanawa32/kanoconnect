import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function Header({ onMenuClick }) {
  const { user } = useAuthStore();

  return (
    <header className="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 shadow-sm">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-surface-100 text-surface-600 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="hidden lg:flex items-center gap-2">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">K</span>
        </div>
        <span className="text-sm font-semibold text-surface-500 tracking-[2px] uppercase">KanoConnect</span>
      </div>

      <div className="hidden md:flex items-center flex-1 max-w-md ml-4">
        <div className="relative w-full group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 group-focus-within:text-accent-500 transition-colors" />
          <input
            type="text"
            placeholder="Search orders, tracking numbers..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-lg text-sm 
                       placeholder-surface-400
                       focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 focus:bg-white
                       transition-all duration-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2.5 rounded-lg hover:bg-surface-100 text-surface-500 hover:text-surface-700 transition-all duration-200">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-accent-500 rounded-full ring-2 ring-white" />
        </button>

        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-surface-200">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center shadow-md shadow-primary-500/20">
            <span className="text-white font-bold text-xs">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-surface-800">{user?.firstName}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
