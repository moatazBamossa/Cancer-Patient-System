import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, UserCog, Stethoscope, Activity,
  Pill, FlaskConical, ImageIcon, Building2, Calendar,
  ShieldCheck, UserCircle, LogOut, ChevronLeft, ChevronRight,
  Moon, Sun, Bell, Menu, X, Heart, Microscope, FileBarChart,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { cn, getInitials } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';

const navigation = [
  { name: 'dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'patients', path: '/patients', icon: Users },
  { name: 'diagnoses', path: '/diagnoses', icon: Stethoscope },
  { name: 'cancerTypes', path: '/cancer-types', icon: Microscope },
  { name: 'treatmentPlans', path: '/treatment-plans', icon: FileBarChart },
  { name: 'vitals', path: '/vitals', icon: Activity },
  { name: 'medications', path: '/medications', icon: Pill },
  { name: 'labTests', path: '/lab-tests', icon: FlaskConical },
  { name: 'imaging', path: '/imaging', icon: ImageIcon },
  { name: 'doctors', path: '/doctors', icon: Heart },
  { name: 'clinics', path: '/clinics', icon: Building2 },
  { name: 'visits', path: '/visits', icon: Calendar },
  { name: 'roles', path: '/roles', icon: ShieldCheck },
];

export function AppLayout() {
  const { t, i18n } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, role, logout } = useAuthStore();
  const { isDark, toggle: toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const isRtl = i18n.language === 'ar';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{ background: 'var(--accent-gradient)' }}>
          <Activity size={20} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="text-sm font-bold text-white">
                {isRtl ? 'مركز السرطان' : 'Cancer Center'}
              </h1>
              <p className="text-[10px] text-slate-400">
                {isRtl ? 'نظام الإدارة' : 'Management System'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn('sidebar-link', isActive && 'active', collapsed && 'justify-center px-2')
            }
          >
            <item.icon size={20} className="flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {t(`common.${item.name}`)}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t p-3 space-y-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <NavLink
          to="/profile"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            cn('sidebar-link', isActive && 'active', collapsed && 'justify-center px-2')
          }
        >
          <UserCircle size={20} className="flex-shrink-0" />
          {!collapsed && <span>{t('common.profile')}</span>}
        </NavLink>
        <button
          onClick={handleLogout}
          className={cn(
            'sidebar-link w-full hover:!bg-red-500/10 hover:!text-red-400',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!collapsed && <span>{t('common.logout')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col flex-shrink-0 border-r relative"
        style={{ background: 'var(--sidebar-bg)', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "absolute top-8 w-6 h-6 rounded-full flex items-center justify-center text-white z-10",
            isRtl ? "-left-3" : "-right-3"
          )}
          style={{ background: 'var(--accent-primary)' }}
        >
          {collapsed ? (isRtl ? <ChevronLeft size={14} /> : <ChevronRight size={14} />) : (isRtl ? <ChevronRight size={14} /> : <ChevronLeft size={14} />)}
        </button>
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-y-0 left-0 w-[260px] z-50 lg:hidden"
              style={{ background: 'var(--sidebar-bg)' }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-4 sm:px-6 h-16 border-b flex-shrink-0"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Menu size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-tertiary)' }}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              className="p-2 rounded-lg relative transition-colors"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-tertiary)' }}
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>

            <div
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl cursor-pointer"
              style={{ background: 'var(--bg-tertiary)' }}
              onClick={() => navigate('/profile')}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                   style={{ background: 'var(--accent-gradient)' }}>
                {user ? getInitials(user.full_name) : 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {user?.full_name}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {role?.name}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
