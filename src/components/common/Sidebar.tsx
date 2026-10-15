import React from 'react';
import { UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  FileSpreadsheet, 
  KeyRound, 
  PenTool, 
  BarChart3, 
  ShieldAlert, 
  Settings, 
  FileText, 
  CheckSquare, 
  Send, 
  Award,
  ClipboardList,
  CheckCircle,
  Clock,
  UserCheck,
  UserPlus,
  Calculator,
  TrendingUp,
  Printer,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  currentRole: UserRole;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const getNavItems = (): NavItem[] => {
    switch (currentRole) {
      case 'super_admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'programmes', label: 'Programmes', icon: Award },
          { id: 'courses', label: 'Course Management', icon: BookOpen },
          { id: 'students', label: 'Student Records', icon: GraduationCap },
          { id: 'sessions', label: 'Academic Sessions', icon: Calendar },
          { id: 'results', label: 'Result Control & Overrides', icon: FileSpreadsheet },
          { id: 'pins', label: 'Scratch PINs', icon: KeyRound },
          { id: 'signatures', label: 'Official Signatures', icon: PenTool },
          { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
          { id: 'audit', label: 'Security Audit Logs', icon: ShieldAlert },
          { id: 'settings', label: 'System Settings', icon: Settings },
        ];
      case 'registrar':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'students', label: 'Student Admissions & Records', icon: GraduationCap },
          { id: 'transcripts', label: 'Transcripts & Result Slips', icon: FileText },
          { id: 'clearance', label: 'Student Clearance', icon: UserCheck },
          { id: 'results_view', label: 'Published Results', icon: FileSpreadsheet },
          { id: 'signatures', label: 'Registrar Signature', icon: PenTool },
        ];
      case 'exam_officer':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'result_approval', label: 'Result Vetting & Approval', icon: CheckSquare },
          { id: 'broadsheet', label: 'Broadsheet Generator', icon: FileSpreadsheet },
          { id: 'pins', label: 'Scratch PIN Management', icon: KeyRound },
          { id: 'carryovers', label: 'Carryover Tracking', icon: Clock },
          { id: 'signatures', label: 'Exam Officer Signature', icon: PenTool },
        ];
      case 'hod':
        return [
          { id: 'dashboard', label: 'Department Overview', icon: LayoutDashboard },
          { id: 'dept_results', label: 'Score Vetting & Approval', icon: CheckSquare },
          { id: 'course_assignments', label: 'Course Assignments', icon: BookOpen },
          { id: 'dept_students', label: 'Departmental Students', icon: GraduationCap },
          { id: 'signatures', label: 'HOD Signature', icon: PenTool },
        ];
      case 'lecturer':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'student_registration', label: 'Student Registration', icon: UserPlus },
          { id: 'student_management', label: 'Student Management', icon: Users },
          { id: 'course_management', label: 'Course Management', icon: BookOpen },
          { id: 'course_registration', label: 'Course Registration', icon: ClipboardList },
          { id: 'result_entry', label: 'Result Entry', icon: FileSpreadsheet },
          { id: 'result_computation', label: 'Result Computation', icon: Calculator },
          { id: 'student_results', label: 'Student Results', icon: GraduationCap },
          { id: 'gpa_cgpa_management', label: 'GPA & CGPA Management', icon: TrendingUp },
          { id: 'academic_sessions', label: 'Academic Sessions', icon: Calendar },
          { id: 'reports_analytics', label: 'Reports & Analytics', icon: BarChart3 },
          { id: 'print_results', label: 'Print Results', icon: Printer },
          { id: 'settings', label: 'Profile & Settings', icon: Settings },
        ];
      case 'student':
        return [
          { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
          { id: 'check_result', label: 'Check Result (PIN)', icon: KeyRound },
          { id: 'course_registration', label: 'Course Registration', icon: ClipboardList },
          { id: 'result_slips', label: 'Result Slips & Transcripts', icon: FileText },
          { id: 'academic_profile', label: 'Student Profile', icon: GraduationCap },
        ];
      default:
        return [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }];
    }
  };

  const { logout } = useAuth();
  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 w-64 bg-white border-r border-gray-200 z-50 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-gray-200 lg:hidden">
          <span className="font-bold text-gray-800 text-sm">Navigation Menu</span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-lg">✕</button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 mb-2 text-[10px] font-black uppercase text-gray-400 tracking-wider">
            {currentRole === 'lecturer' ? 'ICT Staff Navigation' : `${currentRole.replace('_', ' ')} Navigation`}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            // Also treat legacy 'score_entry' as matching 'result_entry'
            const isActive = activeTab === item.id || (item.id === 'result_entry' && activeTab === 'score_entry');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-[#F47B20] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-white text-[#F47B20]' : 'bg-[#F47B20] text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom System Info and Logout */}
        <div className="p-3 border-t border-gray-100 bg-gray-50 text-[11px] text-gray-500">
          <button
            type="button"
            onClick={async () => {
              await logout();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition cursor-pointer mb-2"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span>Logout</span>
          </button>
          <div className="font-bold text-gray-800">Metrolane RMS v2.4</div>
          <div className="text-[10px] text-gray-400">Database: Cloud Firestore</div>
        </div>
      </aside>
    </>
  );
};
