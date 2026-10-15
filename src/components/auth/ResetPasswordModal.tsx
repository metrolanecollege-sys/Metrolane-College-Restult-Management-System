import React, { useState } from 'react';
import { useAuth, DEFAULT_ACCOUNTS } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { MetrolaneLogo } from '../common/MetrolaneLogo';
import { 
  KeyRound, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight,
  ShieldCheck,
  Send
} from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialIdentifier?: string;
  isLoggedInMode?: boolean;
  onPasswordResetSuccess?: (emailOrMatric: string, newPass: string) => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  initialIdentifier = '',
  isLoggedInMode = false,
  onPasswordResetSuccess
}) => {
  const { currentUser, resetPassword, changePassword } = useAuth();
  const { students, users } = useData();

  const [identifier, setIdentifier] = useState(initialIdentifier || currentUser?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resetMethod, setResetMethod] = useState<'instant' | 'email_link'>('instant');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validation
    const cleanId = identifier.trim();
    if (!cleanId && !isLoggedInMode) {
      setErrorMsg('Please enter your registered College email address or Matriculation number.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('The new password and confirmation password do not match.');
      return;
    }

    setLoading(true);

    try {
      if (isLoggedInMode) {
        const result = await changePassword(newPassword, currentPassword);
        setLoading(false);
        if (result.success) {
          setSuccessMsg(result.message);
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          setErrorMsg(result.message);
        }
      } else {
        const result = await resetPassword(cleanId, newPassword);
        setLoading(false);
        if (result.success) {
          setSuccessMsg(result.message);
          if (onPasswordResetSuccess) {
            onPasswordResetSuccess(cleanId, newPassword);
          }
        } else {
          setErrorMsg(result.message);
        }
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'An unexpected error occurred while resetting the password.');
    }
  };

  const calculateStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 25;
    if (pass.length >= 10) score += 25;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const strength = calculateStrength(newPassword);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden relative animate-in zoom-in-95 duration-150">
        {/* Top Header Ribbon */}
        <div className="bg-gradient-to-r from-[#FF7924] via-[#F35B08] to-[#D84300] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-base text-white tracking-tight">
                {isLoggedInMode ? 'Change Account Password' : 'Reset Account Password'}
              </h3>
              <p className="text-[11px] text-white/90">
                Metrolane College Result Management System
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {successMsg ? (
            <div className="text-center py-4 space-y-4 animate-in fade-in">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-black text-gray-900 text-lg">Password Reset Complete</h4>
                <p className="text-xs text-gray-600 mt-1.5 max-w-sm mx-auto leading-relaxed">
                  {successMsg}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-[#F47B20] hover:bg-[#E8601C] text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
                >
                  {isLoggedInMode ? 'Done' : 'Proceed to Sign In'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                {isLoggedInMode
                  ? 'Update your password to keep your academic results and records secure.'
                  : 'Enter your registered College email or Matriculation number to instantly reset your password.'}
              </p>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="flex-1">{errorMsg}</span>
                </div>
              )}

              {/* Identifier Input (Email or Matric) */}
              {!isLoggedInMode && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    College Email or Matriculation Number *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. ict.staff@metrolane.edu.ng or 26/MET/CHT/001"
                      className="w-full pl-3 pr-3 py-2 bg-[#E7EEFC] border border-[#CBD5E1] focus:border-[#FF6B0A] focus:bg-white text-xs text-gray-800 rounded-lg outline-none font-medium transition"
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    All users (ICT Staff, HODs, Admins, and Students) can reset passwords.
                  </span>
                </div>
              )}

              {/* Current Password (if in logged in mode) */}
              {isLoggedInMode && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password (if known)"
                      className="w-full pl-3 pr-10 py-2 bg-[#E7EEFC] border border-[#CBD5E1] focus:border-[#FF6B0A] focus:bg-white text-xs text-gray-800 rounded-lg outline-none font-medium transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-3 pr-10 py-2 bg-[#E7EEFC] border border-[#CBD5E1] focus:border-[#FF6B0A] focus:bg-white text-xs text-gray-800 rounded-lg outline-none font-medium transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Password Strength Bar */}
                {newPassword.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          strength <= 25 ? 'bg-red-500 w-1/4' :
                          strength <= 50 ? 'bg-amber-500 w-2/4' :
                          strength <= 75 ? 'bg-blue-500 w-3/4' :
                          'bg-emerald-500 w-full'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500">
                      Strength: {strength <= 25 ? 'Weak' : strength <= 50 ? 'Fair' : strength <= 75 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-3 pr-10 py-2 bg-[#E7EEFC] border border-[#CBD5E1] focus:border-[#FF6B0A] focus:bg-white text-xs text-gray-800 rounded-lg outline-none font-medium transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Security Hint */}
              <div className="p-3 bg-orange-50/70 border border-orange-100 rounded-xl flex items-start gap-2 text-[11px] text-orange-950">
                <ShieldCheck className="w-4 h-4 text-[#F47B20] shrink-0 mt-0.5" />
                <span>
                  After resetting, your new password takes effect immediately across all College portal sessions.
                </span>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#FF6B0A] hover:bg-[#E8601C] text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
