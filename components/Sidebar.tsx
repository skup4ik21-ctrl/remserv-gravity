import React from 'react';
import { NavLink } from 'react-router-dom';
import { UserRole } from '../types';
import { Bars3Icon, ArrowRightOnRectangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

export interface NavigationItem {
  name: string;
  path: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

interface SidebarProps {
  navigationItems: NavigationItem[];
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  navigationItems,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const { logout, userRole, user } = useAuth();

  const desktopClasses = `hidden md:flex flex-col h-full bg-white/60 backdrop-blur-xl border-r border-white/50 shadow-2xl transition-all duration-500 ease-in-out z-20 ${isCollapsed ? 'w-20' : 'w-72'} print:hidden`;
  const mobileClasses = `fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`;

  const handleItemClick = () => {
    setIsMobileOpen(false);
    // Optional: Auto-collapse on desktop click if desired, usually not needed for router
  };

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <>
      <div className="flex items-center justify-between h-24 flex-shrink-0 px-4">
        <button onClick={() => setIsCollapsed(!collapsed)} className="flex items-center justify-center w-full h-full text-blue-600 hover:text-blue-700 focus:outline-none transition-colors group">
          {!collapsed ? (
            <div className="flex items-center w-full px-2">
              <div className="p-2 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors mr-3"><Bars3Icon className="w-6 h-6 flex-shrink-0" /></div>
              <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">RemServ</span>
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors"><Bars3Icon className="w-6 h-6 flex-shrink-0" /></div>
          )}
        </button>
      </div>

      {!collapsed && user && (
        <div className="px-6 py-4 mx-4 mb-4 bg-white/50 rounded-2xl border border-white/60 shadow-sm">
          <p className="text-sm font-semibold text-slate-800 truncate">{user.email}</p>
          <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider mt-0.5">{userRole === UserRole.Administrator ? 'Admin' : 'Manager'}</p>
        </div>
      )}

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={handleItemClick}
            className={({ isActive }) => `flex items-center py-3.5 transition-all duration-300 rounded-xl group relative overflow-hidden ${collapsed ? 'justify-center px-0' : 'px-5'} ${isActive
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-500 hover:bg-white hover:text-blue-600'
              }`}
            title={collapsed ? item.name : undefined}
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-6 h-6 flex-shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                {!collapsed && <span className="mx-3 font-medium text-sm">{item.name}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6">
        <button onClick={logout} className={`flex items-center w-full py-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ${collapsed ? 'justify-center' : 'px-5'}`}>
          <ArrowRightOnRectangleIcon className="w-6 h-6 flex-shrink-0" />
          {!collapsed && <span className="mx-3 font-medium">Вийти</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {isMobileOpen && <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden" onClick={() => setIsMobileOpen(false)} />}
      <div className={desktopClasses}><SidebarContent collapsed={isCollapsed} /></div>
      <div className={mobileClasses}>
        <div className="absolute top-4 right-4 md:hidden"><button onClick={() => setIsMobileOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><XMarkIcon className="w-6 h-6" /></button></div>
        <SidebarContent collapsed={false} />
      </div>
    </>
  );
};

export default Sidebar;