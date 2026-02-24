import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Settings, LogOut, Menu, X } from 'lucide-react';
import FoxLogo from '../FoxLogo';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ];

    const sidebarContent = (
        <>
            <div className="flex items-center gap-2.5 border-b border-gray-200 px-5 py-4">
                <FoxLogo className="h-7 w-7" />
                <span className="text-lg font-semibold text-gray-900">PR Ranker</span>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-3">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
                                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`
                            }
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div className="border-t border-gray-200 p-4">
                <div className="flex items-center gap-3 px-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                        {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{user?.username}</span>
                        <span className="text-xs text-gray-500">Free Plan</span>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                    <LogOut className="h-4 w-4" />
                    Sign out
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile toggle button */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="fixed top-3 left-3 z-50 md:hidden inline-flex items-center justify-center p-2 rounded-md bg-white shadow border border-gray-200 text-gray-700"
            >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/30 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar - mobile: slide-in overlay, desktop: sticky */}
            <div className={`
                fixed inset-y-0 left-0 z-40 w-64 h-screen flex flex-col border-r border-gray-200 bg-gray-50
                transform transition-transform duration-200 ease-in-out
                md:sticky md:top-0 md:translate-x-0 md:transform-none md:shrink-0
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {sidebarContent}
            </div>
        </>
    );
};

export default Sidebar;
