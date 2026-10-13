import React, { useState } from 'react';
import { MetrolaneLogo } from './MetrolaneLogo';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserRole } from '../../types';
import { ResetPasswordModal } from '../auth/ResetPasswordModal';
import { 
  Bell, 
  User, 
  LogOut, 
  Shield, 
  Calendar, 
  Menu,
  KeyRound
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, activeTab, onSelectTab }) => {
  const { currentUser, logout } = useAuth();
  const { settings, results } = useData();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Dynamic notifications based on system state
  const pendingForHod = results.filter(r => r.status === 'submitted').length;
  const pendingForExamOfficer = results.filter(r => r.status === 'hod_approved').length;
  const publishedCount = results.filter(r => r.status === 'published').length;

  const getRoleBadgeColor = (role?: UserRole) => {
    switch (role) {
      case 'super_admin': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'registrar': return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
      case 'exam_officer': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'hod': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'lecturer': return 'bg-[#F47B20]/15 text-[#E8601C] border-[#F47B20]/30';
      case 'student': return 'bg-cyan-500/10 text-cyan-700 border-cyan-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleDisplayName = (role?: UserRole) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'registrar': return 'Registrar';
      case 'exam_officer': return 'Exam Officer';
      case 'hod': return 'Head of Dept (HOD)';
      case 'lecturer': return 'Lecturer';
      case 'student': return 'Student';
      default: return 'User';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Mobile Toggle & Metrolane Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <MetrolaneLogo size={36} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm md:text-base text-[#1A1A2E] tracking-tight uppercase">
                  METROLANE
                </span>
                <span className="text-[10px] hidden sm:inline px-1.5 py-0.5 bg-[#F47B20]/15 text-[#E8601C] font-black rounded-sm uppercase">
                  RMS
                </span>
              </div>
              <p className="text-[10px] md:text-[11px] text-[#757575] font-medium hidden sm:block">
                College of Health, Science &amp; Technology
              </p>
            </div>
          </div>
        </div>

        {/* Center: Current Academic Calendar Banner */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200/60 rounded-full text-xs">
          <Calendar className="w-3.5 h-3.5 text-[#E8601C]" />
          <span className="text-gray-700 font-medium">Session:</span>
          <strong className="text-gray-900 font-bold">{settings.currentSession}</strong>
          <span className="text-gray-300">•</span>
          <strong className="text-[#E8601C] font-bold">{settings.currentSemester}</strong>
        </div>

        {/* Right: Actions, Locked User Role Badge, Password Reset & Profile */}
        <div className="flex items-center gap-3">
          {/* Authenticated User Role Badge (Locked to authenticated user) */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border ${getRoleBadgeColor(currentUser?.role)}`}
            title={`Logged in as ${getRoleDisplayName(currentUser?.role)}`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{getRoleDisplayName(currentUser?.role)}</span>
          </div>

          {/* Reset Password Button */}
          <button
            type="button"
            onClick={() => setShowResetPassword(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:text-[#E8601C] hover:bg-orange-50 border border-gray-200 rounded-lg transition cursor-pointer"
            title="Reset / Change Account Password"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#F47B20]" />
            <span className="hidden sm:inline">Reset Password</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {(pendingForHod > 0 || pendingForExamOfficer > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F47B20] rounded-full ring-2 ring-white" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="text-xs font-bold text-gray-800 pb-2 border-b border-gray-100 flex items-center justify-between">
                  <span>System Notifications</span>
                  <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="divide-y divide-gray-100 text-xs">
                  <div className="py-2">
                    <p className="font-semibold text-gray-800">Results Vetting</p>
                    <p className="text-gray-500 text-[11px]">
                      {pendingForHod} results awaiting HOD vetting, {pendingForExamOfficer} awaiting Exam Officer approval.
                    </p>
                  </div>
                  <div className="py-2">
                    <p className="font-semibold text-gray-800">Results Published</p>
                    <p className="text-gray-500 text-[11px]">
                      {publishedCount} course scores published for student checking.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <div className="hidden sm:block text-right">
              <span className="text-xs font-bold text-gray-800 block truncate max-w-[140px]">
                {currentUser?.fullName?.split(' ')[0] || 'User'}
              </span>
              <span className="text-[10px] text-gray-500 block truncate max-w-[140px]">
                {currentUser?.email}
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={showResetPassword}
        onClose={() => setShowResetPassword(false)}
        isLoggedInMode={true}
      />
    </header>
  );
};

