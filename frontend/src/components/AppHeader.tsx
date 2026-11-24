import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, Settings as SettingsIcon, CheckCheck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { NotificationItem } from '../types';

interface AppHeaderProps {
  onToggleMobileMenu: () => void;
  onRefreshNotifications?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      // Ignore
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      // Ignore
    }
  };

  // Derive breadcrumb title
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/analytics') return 'Surveillance Analytics';
    if (path === '/consents') return 'Registered Applications';
    if (path === '/consents/new') return 'New Consent Application';
    if (path.startsWith('/consents/')) return 'Application Detail';
    if (path === '/evidence/new') return 'Submit Privacy Evidence';
    if (path.startsWith('/analyses/')) return 'Discrepancy Analysis';
    if (path === '/alerts') return 'Surveillance Alerts';
    if (path === '/drafts') return 'Complaint & Clarification Drafts';
    if (path === '/evaluation') return 'Benchmark Evaluation';
    if (path === '/settings') return 'Account & Settings';
    return 'ConsentDrift';
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden transition"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-200">
          <span className="text-slate-500 hidden sm:inline">ConsentDrift</span>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <span className="text-white font-bold">{getBreadcrumb()}</span>
        </div>
      </div>

      {/* Right: Context pill + Notifications + User menu */}
      <div className="flex items-center gap-3">
        {/* Context pill */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/70 border border-slate-700/60 text-[11px] font-medium text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Local Engine</span>
        </div>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition relative"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 text-xs">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">No notifications yet.</div>
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      to={n.link || '/alerts'}
                      onClick={() => setShowNotifMenu(false)}
                      className={`block px-4 py-3 hover:bg-slate-850 transition ${
                        !n.is_read ? 'bg-blue-950/20' : ''
                      }`}
                    >
                      <div className="text-slate-200 leading-snug">{n.message}</div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 text-slate-200 transition"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
            <span className="text-xs font-semibold hidden md:inline max-w-[120px] truncate">
              {user?.full_name || 'User'}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-fadeIn text-xs">
              <div className="px-4 py-2.5 border-b border-slate-800">
                <div className="font-bold text-white truncate">{user?.full_name}</div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email}</div>
              </div>

              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Account & Settings</span>
                </Link>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout().then(() => navigate('/login'));
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
