
import React, { useState } from 'react';
import UsersPage from './UsersPage';
import GeneralSettingsPage from './GeneralSettingsPage';
import { UserGroupIcon, Cog6ToothIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

type SettingsTab = 'general' | 'users';

const SettingsPage: React.FC = () => {
    const { isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState<SettingsTab>('users');

    // Strict access control: even if the page state is set to 'settings', we check the role
    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in">
                <div className="p-4 bg-rose-100 rounded-full mb-4 text-rose-600">
                    <ShieldExclamationIcon className="w-16 h-16" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">Доступ обмежено</h1>
                <p className="text-slate-500 mt-2 max-w-md">У вас немає прав адміністратора для перегляду та зміни системних налаштувань.</p>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'users':
                return <UsersPage />;
            case 'general':
                return <GeneralSettingsPage />;
            default:
                return null;
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-extrabold text-slate-800 mb-8">Налаштування системи</h1>
            
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-72 flex-shrink-0">
                    <nav className="space-y-2">
                         <button
                            onClick={() => setActiveTab('users')}
                            className={`w-full flex items-center px-5 py-4 text-sm font-bold rounded-2xl transition-all duration-300 ${
                                activeTab === 'users'
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-white/60 text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-md'
                            }`}
                        >
                            <UserGroupIcon className="w-6 h-6 mr-3 flex-shrink-0" />
                            Користувачі та Ролі
                        </button>
                        
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`w-full flex items-center px-5 py-4 text-sm font-bold rounded-2xl transition-all duration-300 ${
                                activeTab === 'general'
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-white/60 text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-md'
                            }`}
                        >
                            <Cog6ToothIcon className="w-6 h-6 mr-3 flex-shrink-0" />
                            Загальні налаштування
                        </button>
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0 bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-indigo-100/20 p-6 sm:p-8">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
