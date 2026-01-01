import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar, { NavigationItem } from '../Sidebar';
import { UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
    PlusCircleIcon, WrenchScrewdriverIcon, CalendarDaysIcon, UserGroupIcon, TruckIcon, UserIcon, ChartBarIcon, CurrencyDollarIcon, Cog6ToothIcon, TagIcon, ArchiveBoxIcon, Bars3Icon
} from '@heroicons/react/24/outline';

const MainLayout: React.FC = () => {
    const { userRole } = useAuth();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navigationItems: NavigationItem[] = [
        { name: 'Панель', path: '/', icon: PlusCircleIcon, roles: [UserRole.Administrator, UserRole.Manager, UserRole.Owner] },
        { name: 'Замовлення', path: '/orders', icon: WrenchScrewdriverIcon, roles: [UserRole.Administrator, UserRole.Manager, UserRole.Owner] },
        { name: 'Склад', path: '/inventory', icon: ArchiveBoxIcon, roles: [UserRole.Administrator, UserRole.Manager, UserRole.Owner] },
        { name: 'Календар', path: '/calendar', icon: CalendarDaysIcon, roles: [UserRole.Administrator, UserRole.Manager, UserRole.Owner] },
        { name: 'Клієнти', path: '/clients', icon: UserGroupIcon, roles: [UserRole.Administrator, UserRole.Manager, UserRole.Owner] },
        { name: 'Автомобілі', path: '/cars', icon: TruckIcon, roles: [UserRole.Administrator, UserRole.Manager, UserRole.Owner] },
        { name: 'Майстри', path: '/masters', icon: UserIcon, roles: [UserRole.Administrator, UserRole.Manager, UserRole.Owner] },
        { name: 'Прайс', path: '/pricelist', icon: CurrencyDollarIcon, roles: [UserRole.Administrator, UserRole.Manager, UserRole.Owner] },
        { name: 'Цінові групи', path: '/cargroups', icon: TagIcon, roles: [UserRole.Administrator, UserRole.Manager, UserRole.Owner] },
        { name: 'Аналітика', path: '/analytics', icon: ChartBarIcon, roles: [UserRole.Administrator, UserRole.Owner] },
        { name: 'Налаштування', path: '/settings', icon: Cog6ToothIcon, roles: [UserRole.Administrator] },
    ];

    const filteredItems = navigationItems.filter(item => userRole && item.roles?.includes(userRole));

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <Sidebar
                navigationItems={filteredItems}
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
                isMobileOpen={isMobileMenuOpen}
                setIsMobileOpen={setIsMobileMenuOpen}
            />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 relative">
                <div className="md:hidden mb-6 flex justify-between items-center">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
                        <Bars3Icon className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-lg text-blue-600">RemServ</span>
                </div>
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
