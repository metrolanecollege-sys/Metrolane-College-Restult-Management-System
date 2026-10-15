import React, { useState } from 'react';
import { MetrolaneLogo } from '../common/MetrolaneLogo';
import { UserRole } from '../../types';
import { useAuth, DEFAULT_ACCOUNTS } from '../../context/AuthContext';
import { ResetPasswordModal } from './ResetPasswordModal';
import { Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  portalRole?: UserRole;
  onSelectPortalRole?: (role: UserRole) => void;
}

export const LoginPage: React.FC<LoginPageProps> = () => {
  const { login, loading, error, clearError } = useAuth();
  
  const [emailOrMatric, setEmailOrMatric] = useState('ict.staff@metrolane.edu.ng');
  const [password, setPassword] = useState('IctStaff@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetSuccessNotice, setResetSuccessNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrMatric || !password) return;
    clearError();
    await login(emailOrMatric, password);
  };

  const handlePasswordResetSuccess = (cleanId: string, newPass: string) => {
    setEmailOrMatric(cleanId);
    setPassword(newPass);
    setResetSuccessNotice('Password successfully updated! You can now sign in.');
    setShowResetModal(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FFFFFF] font-sans antialiased m-0 p-0 overflow-x-hidden">
      {/* 1. LEFT SECTION — ORANGE BRANDING PANEL (50% width, 100vh) */}
      <div
        className="w-full lg:w-1/2 min-h-[320px] lg:h-screen text-white relative flex flex-col justify-start lg:pl-[50px] lg:pt-[50px] p-6 sm:p-10 select-none overflow-hidden shrink-0"
        style={{
          background: 'linear-gradient(155deg, #FF7924 0%, #F35B08 55%, #D84300 100%)'
        }}
      >
        {/* University Branding: 50px left, 50px top */}
        <div className="flex items-center gap-3">
          <div className="w-[40px] h-[40px] rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-xs shrink-0">
            <MetrolaneLogo size={32} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-bold text-white tracking-wide uppercase">
              METROLANE
            </span>
            <span className="text-[11px] font-normal text-white/95">
              College of Health Sciences and Technology
            </span>
          </div>
        </div>

        {/* Main Heading: approx 113px top */}
        <div className="mt-8 lg:mt-[63px]">
          <h1 className="text-[34px] font-bold text-[#FFFFFF] leading-[40px] tracking-normal">
            ICT Result<br />
            Management System
          </h1>

          {/* Description */}
          <p className="mt-3.5 text-[13px] text-white leading-[21px] max-w-[410px] font-normal opacity-95">
            Secure workspace for authorized ICT staff to register students, manage courses, enter academic results, compute GPA and CGPA, and maintain accurate student academic records.
          </p>
        </div>

        {/* Remaining orange section is kept completely empty, exactly as shown in screenshot */}
      </div>

      {/* 2. RIGHT SECTION — LOGIN AREA (50% width, 100vh, pure white background) */}
      <div className="w-full lg:w-1/2 min-h-screen bg-[#FFFFFF] flex flex-col justify-start lg:h-screen lg:overflow-y-auto px-4 py-8 lg:p-0">
        {/* Login Card: approx 403px wide, 106px left boundary, approx 98px top */}
        <div className="w-full max-w-[403px] lg:ml-[106px] lg:mt-[98px] mx-auto bg-white rounded-[15px] border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-[28px] shrink-0">
          {/* Login Card Header */}
          <div className="flex items-center gap-2.5">
            <div className="w-[43px] h-[40px] rounded-lg bg-white shadow-xs border border-gray-100 flex items-center justify-center shrink-0">
              <MetrolaneLogo size={28} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] font-semibold text-[#FF6B0A] tracking-wide uppercase">
                METROLANE
              </span>
              <span className="text-[11px] font-normal text-[#64748B]">
                College of Health Sciences and Technology
              </span>
            </div>
          </div>

          {/* Welcome Heading */}
          <h2 className="text-[27px] font-semibold text-[#07152F] mt-[15px] leading-tight">
            Welcome Back
          </h2>

          {/* Supporting Text */}
          <p className="text-[13px] text-[#64748B] mt-1 leading-[21px]">
            Sign in to continue to the ICT Result<br />
            Management System.
          </p>

          {/* Password Reset Success Notice */}
          {resetSuccessNotice && (
            <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 flex items-center justify-between">
              <span>{resetSuccessNotice}</span>
              <button
                type="button"
                onClick={() => setResetSuccessNotice(null)}
                className="text-emerald-600 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-700 flex items-start gap-1.5">
              <span className="font-bold">Error:</span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-[21px]">
            {/* Email Address Field */}
            <div>
              <label className="block text-[13px] font-medium text-[#07152F] mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={emailOrMatric}
                  onChange={(e) => {
                    setEmailOrMatric(e.target.value);
                    if (error) clearError();
                  }}
                  placeholder="ict.staff@metrolane.edu.ng or username"
                  required
                  className="w-full h-[36px] px-[11px] bg-[#E7EEFC] border border-[#CBD5E1] focus:border-[#FF6B0A] focus:bg-white text-[12px] text-[#07152F] rounded-[7px] outline-none font-normal transition placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[13px] font-medium text-[#07152F] mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) clearError();
                  }}
                  placeholder="••••••••••••"
                  required
                  className="w-full h-[36px] pl-[11px] pr-[36px] bg-[#E7EEFC] border border-[#CBD5E1] focus:border-[#FF6B0A] focus:bg-white text-[12px] text-[#07152F] rounded-[7px] outline-none font-normal transition placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-[11px] top-[10px] text-gray-500 hover:text-gray-700 transition cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-[15px] h-[15px]" />
                  ) : (
                    <Eye className="w-[15px] h-[15px]" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer text-[#475569] text-[12px] select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-[14px] h-[14px] rounded border-gray-300 text-[#FF6B0A] focus:ring-[#FF6B0A] cursor-pointer"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="text-[12px] text-[#FF620A] hover:underline font-normal cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[36px] bg-[#FF6B0A] hover:bg-[#E8601C] active:scale-[0.99] text-white font-semibold text-[12px] rounded-[7px] border-none shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </div>
          </form>

          {/* Sign Up Section */}
          <div className="mt-[19px] text-center text-[12px] text-[#64748B]">
            <span>Don't have an account? </span>
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="text-[#FF620A] hover:underline font-normal cursor-pointer"
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Security Notice Below Login Card */}
        <div className="w-full max-w-[460px] lg:ml-[106px] mx-auto mt-auto pb-8 pt-6">
          <div className="w-full h-[1px] bg-[#F1F5F9] mb-[20px]" />
          <p className="text-[11px] text-[#94A3B8] leading-[15px]">
            Authorized ICT staff access only. Student accounts are not permitted on this portal.
          </p>
        </div>
      </div>

      {/* Reset Password Modal (Accessible by ALL Users) */}
      <ResetPasswordModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        initialIdentifier={emailOrMatric}
        isLoggedInMode={false}
        onPasswordResetSuccess={handlePasswordResetSuccess}
      />
    </div>
  );
};
