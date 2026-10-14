import React, { useState } from 'react';
import { useAuth, DEFAULT_ACCOUNTS } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { SignaturePad } from '../common/SignaturePad';
import { UserRole, Course, Programme, StudentRecord, UserProfile, GradeScaleBand } from '../../types';
import { NIGERIAN_STATES, DEFAULT_GRADING_SCALE } from '../../utils/academic';
import { 
  Users, 
  BookOpen, 
  Award, 
  GraduationCap, 
  Calendar, 
  FileSpreadsheet, 
  KeyRound, 
  PenTool, 
  ShieldAlert, 
  Settings, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  TrendingUp, 
  BarChart3, 
  Search, 
  Filter, 
  CheckCircle, 
  Eye, 
  Download,
  X,
  Phone,
  Mail,
  UserCheck,
  Shield,
  Layers,
  Clock
} from 'lucide-react';

interface AdminPortalProps {
  activeTab: string;
  onSelectTab?: (tab: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ activeTab, onSelectTab }) => {
  const { currentUser, switchRole, resetPassword } = useAuth();
  const [resetPassUser, setResetPassUser] = useState<UserProfile | null>(null);
  const [adminNewPass, setAdminNewPass] = useState('');
  const { 
    students, 
    courses, 
    programmes, 
    results, 
    sessions, 
    pins, 
    auditLogs, 
    settings, 
    signatures, 
    users,
    addUser,
    updateUser,
    deleteUser,
    addCourse, 
    updateCourse,
    deleteCourse,
    addStudent,
    updateStudent,
    deleteStudent,
    addProgramme,
    updateProgramme,
    updateSession,
    createSession,
    updateSettings,
    generatePinsBatch,
    overrideResultScore,
    saveSignature,
    computeStudentSemesterSummary
  } = useData();

  // Directly derive the current section from activeTab for immediate zero-lag sidebar reactivity
  const currentSection = activeTab || 'dashboard';

  const handleTabChange = (tabId: string) => {
    onSelectTab?.(tabId);
  };

  // Search & filter states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [courseSearch, setCourseSearch] = useState('');
  const [courseProgFilter, setCourseProgFilter] = useState('all');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentProgFilter, setStudentProgFilter] = useState('all');

  // Modals visibility
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [selectedStudentModal, setSelectedStudentModal] = useState<StudentRecord | null>(null);

  const [showAddProg, setShowAddProg] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);

  // Result override modal
  const [overrideModal, setOverrideModal] = useState<{ resultId: string; currentCa: number; currentExam: number; matric: string } | null>(null);
  const [overrideCa, setOverrideCa] = useState(0);
  const [overrideExam, setOverrideExam] = useState(0);
  const [overrideReason, setOverrideReason] = useState('');

  // Scratch PIN generation
  const [batchPinCount, setBatchPinCount] = useState(10);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);

  // Forms states
  // 1. Add User Form
  const [userForm, setUserForm] = useState({
    fullName: '',
    email: '',
    role: 'lecturer' as UserRole,
    department: 'Community Health Technology',
    assignedCourse: '',
    phone: '+234 ',
    status: 'Active' as 'Active' | 'Inactive' | 'Suspended'
  });

  // 2. Edit User Form
  const [editUserForm, setEditUserForm] = useState({
    fullName: '',
    email: '',
    role: 'lecturer' as UserRole,
    department: '',
    assignedCourse: '',
    phone: '',
    status: 'Active' as 'Active' | 'Inactive' | 'Suspended'
  });

  // 3. Add Course Form
  const [courseForm, setCourseForm] = useState({
    courseCode: '',
    courseTitle: '',
    creditUnit: 3,
    courseType: 'Core' as 'Core' | 'Elective' | 'General Studies',
    programme: 'ND in Community Health Technology',
    level: 'ND1' as 'ND1' | 'ND2' | 'HND1' | 'HND2',
    semester: '1st Semester' as '1st Semester' | '2nd Semester',
    caWeight: 30,
    examWeight: 70,
    lecturerName: 'Dr. Amina Bello',
    lecturerId: 'lecturer_001',
    isActive: true
  });

  // 4. Edit Course Form
  const [editCourseForm, setEditCourseForm] = useState({
    courseCode: '',
    courseTitle: '',
    creditUnit: 3,
    courseType: 'Core' as 'Core' | 'Elective' | 'General Studies',
    programme: 'ND in Community Health Technology',
    level: 'ND1' as 'ND1' | 'ND2' | 'HND1' | 'HND2',
    semester: '1st Semester' as '1st Semester' | '2nd Semester',
    caWeight: 30,
    examWeight: 70,
    lecturerName: '',
    isActive: true
  });

  // 5. Add Student Form
  const [studentForm, setStudentForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: 'Male' as 'Male' | 'Female',
    programme: 'ND in Community Health Technology',
    programmeCode: 'CHT' as 'CHT' | 'HLT' | 'PBH' | 'CHTHND',
    department: 'Community Health Technology',
    level: 'ND1' as 'ND1' | 'ND2' | 'HND1' | 'HND2',
    stateOfOrigin: 'Enugu',
    lga: 'Nsukka',
    phone: '+234 ',
    email: '',
    address: '',
    admissionYear: '2026',
    currentSession: '2025/2026',
    currentSemester: '1st Semester' as '1st Semester' | '2nd Semester',
    status: 'active' as const
  });

  // 6. Edit Student Form
  const [editStudentForm, setEditStudentForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    matricNumber: '',
    gender: 'Male' as 'Male' | 'Female',
    programme: '',
    level: 'ND1' as 'ND1' | 'ND2' | 'HND1' | 'HND2',
    stateOfOrigin: 'Enugu',
    lga: '',
    phone: '',
    email: '',
    address: '',
    status: 'active' as 'active' | 'graduated' | 'withdrawn' | 'suspended' | 'deferred',
    bursaryCleared: true,
    libraryCleared: true,
    deptCleared: true
  });

  // 7. Add Programme Form
  const [progForm, setProgForm] = useState({
    name: '',
    code: 'CHT',
    degreeType: 'ND' as 'ND' | 'HND',
    duration: 2,
    department: 'Community Health Technology'
  });

  // 8. Add Session Form
  const [sessionForm, setSessionForm] = useState({
    name: '2026/2027',
    currentSemester: '1st Semester' as '1st Semester' | '2nd Semester',
    isCurrent: false,
    registrationOpen: true,
    resultEntryOpen: true
  });

  // Notification / Alert message banner
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
    setActionAlert({ type, message });
    setTimeout(() => {
      setActionAlert(null);
    }, 4500);
  };

  // --- Handlers: Users ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.fullName || !userForm.email) return;
    await addUser({
      ...userForm,
      isActive: userForm.status === 'Active'
    });
    setShowAddUser(false);
    setUserForm({
      fullName: '',
      email: '',
      role: 'lecturer',
      department: 'Community Health Technology',
      assignedCourse: '',
      phone: '+234 ',
      status: 'Active'
    });
    showAlert(`Created user account for ${userForm.fullName} successfully.`);
  };

  const handleOpenEditUser = (u: UserProfile) => {
    setEditingUser(u);
    setEditUserForm({
      fullName: u.fullName || '',
      email: u.email || '',
      role: u.role || 'lecturer',
      department: u.department || '',
      assignedCourse: u.assignedCourse || (u.assignedCourses ? u.assignedCourses.join(', ') : ''),
      phone: u.phone || '',
      status: u.status || (u.isActive ? 'Active' : 'Inactive')
    });
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const coursesArr = editUserForm.assignedCourse
      ? editUserForm.assignedCourse.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    await updateUser(editingUser.uid, {
      fullName: editUserForm.fullName,
      email: editUserForm.email,
      role: editUserForm.role,
      department: editUserForm.department,
      assignedCourse: editUserForm.assignedCourse,
      assignedCourses: coursesArr,
      phone: editUserForm.phone,
      status: editUserForm.status,
      isActive: editUserForm.status === 'Active'
    });
    setEditingUser(null);
    showAlert(`Updated user profile for ${editUserForm.fullName} successfully.`);
  };

  // --- Handlers: Courses ---
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCourse({ ...courseForm, isActive: true });
    setShowAddCourse(false);
    setCourseForm({
      courseCode: '',
      courseTitle: '',
      creditUnit: 3,
      courseType: 'Core',
      programme: 'ND in Community Health Technology',
      level: 'ND1',
      semester: '1st Semester',
      caWeight: 30,
      examWeight: 70,
      lecturerName: 'Dr. Amina Bello',
      lecturerId: 'lecturer_001',
      isActive: true
    });
    showAlert(`Created course ${courseForm.courseCode} successfully.`);
  };

  const handleOpenEditCourse = (c: Course) => {
    setEditingCourse(c);
    setEditCourseForm({
      courseCode: c.courseCode,
      courseTitle: c.courseTitle,
      creditUnit: c.creditUnit,
      courseType: c.courseType,
      programme: c.programme,
      level: c.level,
      semester: c.semester,
      caWeight: c.caWeight,
      examWeight: c.examWeight,
      lecturerName: c.lecturerName || '',
      isActive: c.isActive !== false
    });
  };

  const handleSaveEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    await updateCourse(editingCourse.id, editCourseForm);
    setEditingCourse(null);
    showAlert(`Updated course ${editCourseForm.courseCode} successfully.`);
  };

  // --- Handlers: Students ---
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const prog = programmes.find(p => p.name === studentForm.programme);
    const progCode = (prog?.code || 'CHT') as any;
    const newStd = await addStudent({
      firstName: studentForm.firstName,
      middleName: studentForm.middleName,
      lastName: studentForm.lastName,
      gender: studentForm.gender,
      programme: studentForm.programme,
      programmeCode: progCode,
      department: prog?.department || studentForm.department,
      level: studentForm.level,
      stateOfOrigin: studentForm.stateOfOrigin,
      lga: studentForm.lga,
      phone: studentForm.phone,
      email: studentForm.email || `${studentForm.firstName.toLowerCase()}.${studentForm.lastName.toLowerCase()}@student.metrolane.edu.ng`,
      address: studentForm.address,
      admissionYear: studentForm.admissionYear,
      currentSession: studentForm.currentSession,
      currentSemester: studentForm.currentSemester,
      status: 'active',
      clearanceStatus: { bursary: true, library: true, department: true }
    });
    setShowAddStudent(false);
    showAlert(`Enrolled student ${newStd.firstName} ${newStd.lastName} (Matric: ${newStd.matricNumber}).`);
  };

  const handleOpenEditStudent = (s: StudentRecord) => {
    setEditingStudent(s);
    setEditStudentForm({
      firstName: s.firstName,
      middleName: s.middleName || '',
      lastName: s.lastName,
      matricNumber: s.matricNumber,
      gender: s.gender,
      programme: s.programme,
      level: s.level,
      stateOfOrigin: s.stateOfOrigin,
      lga: s.lga,
      phone: s.phone,
      email: s.email,
      address: s.address || '',
      status: s.status,
      bursaryCleared: s.clearanceStatus?.bursary ?? true,
      libraryCleared: s.clearanceStatus?.library ?? true,
      deptCleared: s.clearanceStatus?.department ?? true
    });
  };

  const handleSaveEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    await updateStudent(editingStudent.id, {
      firstName: editStudentForm.firstName,
      middleName: editStudentForm.middleName,
      lastName: editStudentForm.lastName,
      matricNumber: editStudentForm.matricNumber,
      gender: editStudentForm.gender,
      programme: editStudentForm.programme,
      level: editStudentForm.level,
      stateOfOrigin: editStudentForm.stateOfOrigin,
      lga: editStudentForm.lga,
      phone: editStudentForm.phone,
      email: editStudentForm.email,
      address: editStudentForm.address,
      status: editStudentForm.status,
      clearanceStatus: {
        bursary: editStudentForm.bursaryCleared,
        library: editStudentForm.libraryCleared,
        department: editStudentForm.deptCleared
      }
    });
    setEditingStudent(null);
    showAlert(`Updated record for student ${editStudentForm.firstName} ${editStudentForm.lastName} (${editStudentForm.matricNumber}).`);
  };

  // --- Handlers: Programmes, Sessions, PINs, Overrides ---
  const handleCreateProg = async (e: React.FormEvent) => {
    e.preventDefault();
    await addProgramme({ ...progForm, isActive: true });
    setShowAddProg(false);
    showAlert(`Added programme ${progForm.name} successfully.`);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSession(sessionForm);
    setShowAddSession(false);
    showAlert(`Created academic session ${sessionForm.name}.`);
  };

  const handleConfirmOverride = async () => {
    if (!overrideModal || !overrideReason.trim()) return;
    await overrideResultScore(
      overrideModal.resultId,
      { caScore: overrideCa, examScore: overrideExam },
      overrideReason
    );
    setOverrideModal(null);
    showAlert(`Overrode score for matric ${overrideModal.matric}.`);
  };

  const handleGeneratePins = async () => {
    await generatePinsBatch(batchPinCount, settings.currentSession, settings.currentSemester, currentUser?.uid || 'admin');
    setPinSuccess(`Successfully generated ${batchPinCount} scratch PINs.`);
    showAlert(`Generated ${batchPinCount} scratch cards.`);
  };

  // Filtered lists
  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    const matchQuery = 
      u.fullName.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q) || 
      (u.department && u.department.toLowerCase().includes(q)) ||
      (u.assignedCourse && u.assignedCourse.toLowerCase().includes(q));
    const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchQuery && matchRole;
  });

  const filteredCourses = courses.filter(c => {
    const q = courseSearch.toLowerCase();
    const matchQuery = 
      c.courseCode.toLowerCase().includes(q) || 
      c.courseTitle.toLowerCase().includes(q) ||
      (c.lecturerName && c.lecturerName.toLowerCase().includes(q));
    const matchProg = courseProgFilter === 'all' || c.programme === courseProgFilter || c.programmeCode === courseProgFilter;
    return matchQuery && matchProg;
  });

  const filteredStudents = students.filter(s => {
    const q = studentSearch.toLowerCase();
    const matchQuery = 
      s.matricNumber.toLowerCase().includes(q) || 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q);
    const matchProg = studentProgFilter === 'all' || s.programme === studentProgFilter || s.programmeCode === studentProgFilter;
    return matchQuery && matchProg;
  });

  // Quick stats
  const totalStudents = students.length;
  const totalCourses = courses.length;
  const publishedResults = results.filter(r => r.status === 'published').length;
  const passCount = results.filter(r => r.remark === 'Pass').length;
  const passRate = results.length > 0 ? Math.round((passCount / results.length) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Dynamic Global Action Alert */}
      {actionAlert && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-md animate-in fade-in ${
          actionAlert.type === 'success' 
            ? 'bg-emerald-500 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{actionAlert.message}</span>
          </div>
          <button onClick={() => setActionAlert(null)} className="font-black text-white hover:opacity-80">✕</button>
        </div>
      )}

      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-red-950 via-[#1A1A2E] to-[#F47B20] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-300 block mb-1">
            Central College Administration
          </span>
          <h2 className="text-xl md:text-2xl font-black">
            Super Administrator Control Center
          </h2>
          <p className="text-xs md:text-sm text-gray-300 mt-1">
            Active Administrator: <strong>{currentUser?.fullName}</strong> ({currentUser?.email})
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowAddUser(true)}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Users className="w-4 h-4 text-orange-400" />
            Add User
          </button>
          <button
            type="button"
            onClick={() => setShowAddCourse(true)}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <BookOpen className="w-4 h-4 text-orange-400" />
            Add Course
          </button>
          <button
            type="button"
            onClick={() => setShowAddStudent(true)}
            className="px-3.5 py-2 bg-[#F47B20] hover:bg-[#E8601C] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Enroll Student
          </button>
        </div>
      </div>

      {/* Internal Navigation Ribbon */}
      <div className="bg-white p-2 rounded-xl border border-gray-200 overflow-x-auto flex items-center gap-1 text-xs font-bold shadow-xs">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'programmes', label: 'Programmes', icon: Award },
          { id: 'courses', label: 'Courses', icon: BookOpen },
          { id: 'students', label: 'Students', icon: GraduationCap },
          { id: 'sessions', label: 'Sessions', icon: Calendar },
          { id: 'results', label: 'Result Control', icon: FileSpreadsheet },
          { id: 'pins', label: 'Scratch PINs', icon: KeyRound },
          { id: 'signatures', label: 'Signatures', icon: PenTool },
          { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
          { id: 'audit', label: 'Audit Logs', icon: ShieldAlert },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = currentSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isSelected ? 'bg-[#1A1A2E] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. SECTION: DASHBOARD */}
      {currentSection === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-[#F47B20]" onClick={() => handleTabChange('users')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">System Users</span>
              <span className="text-2xl font-black text-gray-900 block mt-1">{users.length} Users</span>
              <span className="text-xs text-blue-600 font-semibold">{users.filter(u => u.status === 'Active' || u.isActive).length} active accounts</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-[#F47B20]" onClick={() => handleTabChange('students')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Enrolled Students</span>
              <span className="text-2xl font-black text-gray-900 block mt-1">{totalStudents}</span>
              <span className="text-xs text-emerald-600 font-semibold">Across {programmes.length} programmes</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-[#F47B20]" onClick={() => handleTabChange('courses')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Active Courses</span>
              <span className="text-2xl font-black text-gray-900 block mt-1">{totalCourses}</span>
              <span className="text-xs text-orange-600 font-semibold">{courses.filter(c => c.isActive).length} active this semester</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-[#F47B20]" onClick={() => handleTabChange('reports')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">College Pass Rate</span>
              <span className="text-2xl font-black text-emerald-700 block mt-1">{passRate}%</span>
              <span className="text-xs text-emerald-600 font-semibold">Good academic standing</span>
            </div>
          </div>

          {/* Quick Role Switcher Panel */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Institutional Role &amp; Portal Switcher</h3>
                <p className="text-xs text-gray-500">
                  Switch instantly into any portal to test lecturer score entry, registrar transcripts, or student results.
                </p>
              </div>
              <Sparkles className="w-5 h-5 text-[#F47B20]" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {(Object.keys(DEFAULT_ACCOUNTS) as UserRole[]).map(role => {
                const acc = DEFAULT_ACCOUNTS[role];
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => switchRole(role)}
                    className="p-3 rounded-xl border border-gray-200 hover:border-[#F47B20] hover:bg-orange-50/30 transition text-left group cursor-pointer"
                  >
                    <span className="text-[10px] font-black uppercase text-[#F47B20] block">
                      {role.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-bold text-gray-800 block truncate mt-0.5">
                      {acc.fullName.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-gray-400 block truncate">
                      {acc.email}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent results overview */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xs md:text-sm font-bold text-gray-800">
                Recent Course Score Activity
              </h3>
              <button onClick={() => handleTabChange('results')} className="text-xs text-[#F47B20] font-bold hover:underline cursor-pointer">
                View All Results →
              </button>
            </div>
            <div className="divide-y divide-gray-100 text-xs">
              {results.slice(0, 5).map(r => (
                <div key={r.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <span className="font-bold text-gray-800">{r.courseCode} — {r.courseTitle}</span>
                    <span className="text-gray-500 block text-[11px]">
                      Student: {r.studentName} ({r.matricNumber}) • Session: {r.session}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-gray-900">{r.totalScore} marks ({r.grade})</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      r.status === 'published' ? 'bg-emerald-100 text-emerald-800' :
                      r.status === 'hod_approved' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. SECTION: USER MANAGEMENT */}
      {currentSection === 'users' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs md:text-sm font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#F47B20]" />
                User Account Management ({filteredUsers.length} of {users.length} Users)
              </h3>
              <p className="text-[11px] text-gray-500">
                Manage system users, assigned courses, role authorizations, departments, and active statuses.
              </p>
            </div>
            <button
              onClick={() => setShowAddUser(true)}
              className="px-3.5 py-1.5 bg-[#F47B20] hover:bg-[#E8601C] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Create New User
            </button>
          </div>

          {/* Search & Filters */}
          <div className="p-3 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search user name, email, department, or assigned course..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#F47B20]"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-gray-500 uppercase">Filter Role:</label>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="p-1.5 border border-gray-300 rounded-lg text-xs outline-none bg-white font-medium"
              >
                <option value="all">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="registrar">Registrar</option>
                <option value="exam_officer">Exam Officer</option>
                <option value="hod">HOD</option>
                <option value="lecturer">Lecturer</option>
                <option value="student">Student</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200 font-bold">
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Assigned Role</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Assigned Course(s)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredUsers.map((u) => {
                  const userStatus = u.status || (u.isActive ? 'Active' : 'Inactive');
                  return (
                    <tr key={u.uid} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-gray-800">{u.fullName}</div>
                        {u.phone && <div className="text-[10px] text-gray-400">{u.phone}</div>}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 font-mono">{u.email}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-orange-100 text-[#E8601C]">
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">{u.department || '—'}</td>
                      <td className="py-2.5 px-3">
                        {u.assignedCourse || (u.assignedCourses && u.assignedCourses.length > 0) ? (
                          <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-bold border border-blue-200">
                            {u.assignedCourse || u.assignedCourses?.join(', ')}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Unassigned</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          userStatus === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                          userStatus === 'Suspended' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {userStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditUser(u)}
                          className="px-2.5 py-1 text-xs font-bold text-[#E8601C] bg-orange-50 hover:bg-orange-100 rounded-md transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setResetPassUser(u);
                            setAdminNewPass('');
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition inline-flex items-center gap-1 cursor-pointer"
                          title="Reset this user's password"
                        >
                          <KeyRound className="w-3 h-3 text-[#F47B20]" />
                          Reset Pass
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newStatus = userStatus === 'Active' ? 'Suspended' : 'Active';
                            updateUser(u.uid, { status: newStatus, isActive: newStatus === 'Active' });
                            showAlert(`Set user ${u.fullName} to ${newStatus}.`);
                          }}
                          className="px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-100 rounded cursor-pointer"
                        >
                          {userStatus === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Super Admin Reset Password Modal */}
          {resetPassUser && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-[#F47B20]" />
                    <h4 className="font-bold text-gray-900 text-sm">Reset Password for User</h4>
                  </div>
                  <button onClick={() => setResetPassUser(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Set a new secure password for <strong>{resetPassUser.fullName}</strong> ({resetPassUser.email}).
                </p>
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Enter new password (min 6 chars)"
                    value={adminNewPass}
                    onChange={(e) => setAdminNewPass(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#F47B20]"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setResetPassUser(null)}
                      className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!adminNewPass || adminNewPass.length < 6}
                      onClick={async () => {
                        const res = await resetPassword(resetPassUser.email, adminNewPass);
                        setResetPassUser(null);
                        showAlert(res.message);
                      }}
                      className="px-4 py-1.5 bg-[#F47B20] hover:bg-[#E8601C] text-white font-bold text-xs rounded-lg disabled:opacity-50"
                    >
                      Save Password
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. SECTION: PROGRAMMES MANAGEMENT */}
      {currentSection === 'programmes' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#F47B20]" />
                Academic Programmes ({programmes.length} Programmes)
              </h3>
              <p className="text-xs text-gray-500">
                Programmes accredited by NBTE with standard matriculation code prefixes.
              </p>
            </div>
            <button
              onClick={() => setShowAddProg(true)}
              className="px-3.5 py-1.5 bg-[#F47B20] hover:bg-[#E8601C] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Programme
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programmes.map(p => (
              <div key={p.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 hover:border-[#F47B20] transition">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-[#F47B20]/15 text-[#E8601C] text-[10px] font-black rounded-md uppercase">
                    Code: {p.code} • {p.degreeType}
                  </span>
                  <span className="text-xs text-emerald-700 font-bold">Active ✓</span>
                </div>
                <h4 className="font-black text-sm text-gray-900 mt-2">{p.name}</h4>
                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  <div>Department: <strong>{p.department}</strong></div>
                  <div>Duration: <strong>{p.duration} Years</strong></div>
                  <div>Matric Format: <strong className="font-mono text-[#F47B20]">26/MET/{p.code}/###</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SECTION: COURSE MANAGEMENT */}
      {currentSection === 'courses' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs md:text-sm font-bold text-gray-800 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#F47B20]" />
                College Course Catalog ({filteredCourses.length} of {courses.length} Courses)
              </h3>
              <p className="text-[11px] text-gray-500">
                Curriculum courses, credit units, lecturer assignments, and CA/Exam ratios. Super Admins can add and edit all course details.
              </p>
            </div>
            <button
              onClick={() => setShowAddCourse(true)}
              className="px-3.5 py-1.5 bg-[#F47B20] hover:bg-[#E8601C] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Course
            </button>
          </div>

          {/* Search & Filters */}
          <div className="p-3 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search course code, title, or assigned lecturer..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#F47B20]"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-gray-500 uppercase">Programme:</label>
              <select
                value={courseProgFilter}
                onChange={(e) => setCourseProgFilter(e.target.value)}
                className="p-1.5 border border-gray-300 rounded-lg text-xs outline-none bg-white font-medium"
              >
                <option value="all">All Programmes</option>
                {programmes.map(p => (
                  <option key={p.id} value={p.name}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200 font-bold">
                  <th className="py-2.5 px-3">Course Code</th>
                  <th className="py-2.5 px-3">Course Title</th>
                  <th className="py-2.5 px-3 text-center">CU</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Programme</th>
                  <th className="py-2.5 px-3">Level / Semester</th>
                  <th className="py-2.5 px-3">Assigned Lecturer</th>
                  <th className="py-2.5 px-3 text-center">CA / Exam</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredCourses.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-900">{c.courseCode}</td>
                    <td className="py-2.5 px-3 font-bold text-gray-800">{c.courseTitle}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-[#F47B20]">{c.creditUnit}</td>
                    <td className="py-2.5 px-3 text-gray-600">{c.courseType}</td>
                    <td className="py-2.5 px-3 text-gray-600 truncate max-w-[180px]">{c.programme}</td>
                    <td className="py-2.5 px-3 text-gray-600">{c.level} • {c.semester}</td>
                    <td className="py-2.5 px-3 text-gray-700 font-semibold">{c.lecturerName || 'Unassigned'}</td>
                    <td className="py-2.5 px-3 text-center text-gray-500">{c.caWeight} / {c.examWeight}</td>
                    <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEditCourse(c)}
                        className="px-2.5 py-1 text-xs font-bold text-[#E8601C] bg-orange-50 hover:bg-orange-100 rounded-md transition inline-flex items-center gap-1 cursor-pointer"
                        title="Edit course"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete course ${c.courseCode}?`)) {
                            deleteCourse(c.id);
                            showAlert(`Deleted course ${c.courseCode}.`);
                          }
                        }}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition cursor-pointer"
                        title="Delete course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. SECTION: STUDENT RECORDS */}
      {currentSection === 'students' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs md:text-sm font-bold text-gray-800 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#F47B20]" />
                Enrolled Student Directory ({filteredStudents.length} of {students.length} Students)
              </h3>
              <p className="text-[11px] text-gray-500">
                Official student admissions, biodata, matriculation numbers, and academic clearance profiles. Super Admins can add and edit student information.
              </p>
            </div>
            <button
              onClick={() => setShowAddStudent(true)}
              className="px-3.5 py-1.5 bg-[#F47B20] hover:bg-[#E8601C] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Enroll New Student
            </button>
          </div>

          {/* Search & Filters */}
          <div className="p-3 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search by student name, matric number, or email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#F47B20]"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-gray-500 uppercase">Programme:</label>
              <select
                value={studentProgFilter}
                onChange={(e) => setStudentProgFilter(e.target.value)}
                className="p-1.5 border border-gray-300 rounded-lg text-xs outline-none bg-white font-medium"
              >
                <option value="all">All Programmes</option>
                {programmes.map(p => (
                  <option key={p.id} value={p.name}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200 font-bold">
                  <th className="py-2.5 px-3">Matric No</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Programme</th>
                  <th className="py-2.5 px-3 text-center">Level</th>
                  <th className="py-2.5 px-3 text-center">State of Origin</th>
                  <th className="py-2.5 px-3 text-center">Clearance</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredStudents.map(std => {
                  const b = std.clearanceStatus?.bursary;
                  const l = std.clearanceStatus?.library;
                  const d = std.clearanceStatus?.department;
                  const allCleared = b && l && d;
                  return (
                    <tr key={std.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#F47B20]">{std.matricNumber}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-gray-800">{std.firstName} {std.middleName ? `${std.middleName} ` : ''}{std.lastName}</div>
                        <div className="text-[10px] text-gray-400">{std.email}</div>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 truncate max-w-[200px]">{std.programme}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-gray-800">{std.level}</td>
                      <td className="py-2.5 px-3 text-center text-gray-600">{std.stateOfOrigin}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          allCleared ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {allCleared ? 'Cleared ✓' : 'Pending ✗'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
                          {std.status || 'active'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEditStudent(std)}
                          className="px-2.5 py-1 text-xs font-bold text-[#E8601C] bg-orange-50 hover:bg-orange-100 rounded-md transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedStudentModal(std)}
                          className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition cursor-pointer"
                        >
                          Profile
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. SECTION: ACADEMIC SESSIONS */}
      {currentSection === 'sessions' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#F47B20]" />
                Academic Sessions &amp; Semesters
              </h3>
              <p className="text-xs text-gray-500">
                Activate session, open/close course registration, and set result entry windows.
              </p>
            </div>
            <button
              onClick={() => setShowAddSession(true)}
              className="px-3.5 py-1.5 bg-[#F47B20] hover:bg-[#E8601C] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Session
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map(s => (
              <div key={s.id} className={`p-5 rounded-xl border ${s.isCurrent ? 'border-[#F47B20] bg-orange-50/20' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-base text-gray-900">{s.name}</h4>
                  {s.isCurrent && (
                    <span className="px-2.5 py-0.5 bg-[#F47B20] text-white text-[10px] font-black rounded-full uppercase">
                      Current Active Session
                    </span>
                  )}
                </div>
                <div className="mt-3 text-xs space-y-2 text-gray-600">
                  <div className="flex justify-between">
                    <span>Active Semester:</span>
                    <strong className="text-gray-900">{s.currentSemester}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Course Registration Window:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.registrationOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                      {s.registrationOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Result Entry Window:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.resultEntryOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                      {s.resultEntryOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </div>
                {!s.isCurrent && (
                  <button
                    type="button"
                    onClick={() => {
                      updateSession(s.id, { isCurrent: true });
                      showAlert(`Set ${s.name} as active session.`);
                    }}
                    className="mt-4 w-full py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    Set as Current Active Session
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. SECTION: RESULT CONTROL & OVERRIDES */}
      {currentSection === 'results' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs md:text-sm font-bold text-gray-800 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#F47B20]" />
                Institutional Result Control &amp; Overrides
              </h3>
              <p className="text-[11px] text-gray-500">
                Super Admins can edit or override any score. All overrides are logged in the audit trail.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200 font-bold">
                  <th className="py-2.5 px-3">Matric No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Course Code</th>
                  <th className="py-2.5 px-3 text-center">CA (30)</th>
                  <th className="py-2.5 px-3 text-center">Exam (70)</th>
                  <th className="py-2.5 px-3 text-center">Total</th>
                  <th className="py-2.5 px-3 text-center">Grade</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {results.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-800">{r.matricNumber}</td>
                    <td className="py-2.5 px-3 font-semibold text-gray-800">{r.studentName}</td>
                    <td className="py-2.5 px-3 font-bold text-gray-900">{r.courseCode}</td>
                    <td className="py-2.5 px-3 text-center text-gray-600">{r.caScore}</td>
                    <td className="py-2.5 px-3 text-center text-gray-600">{r.examScore}</td>
                    <td className="py-2.5 px-3 text-center font-black text-gray-900">{r.totalScore}</td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${
                        r.grade === 'F' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {r.grade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setOverrideModal({
                            resultId: r.id,
                            currentCa: r.caScore,
                            currentExam: r.examScore,
                            matric: r.matricNumber
                          });
                          setOverrideCa(r.caScore);
                          setOverrideExam(r.examScore);
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-[#E8601C] bg-orange-50 hover:bg-orange-100 rounded-md transition cursor-pointer"
                      >
                        Override Score
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. SECTION: SCRATCH PINS */}
      {currentSection === 'pins' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#F47B20]" />
                Result Checking Scratch PIN Management ({pins.length} PINs)
              </h3>
              <p className="text-xs text-gray-500">
                Generate and audit student result verification scratch cards.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="50"
                value={batchPinCount}
                onChange={(e) => setBatchPinCount(Number(e.target.value) || 5)}
                className="w-16 py-1.5 px-2 text-xs font-bold border border-gray-300 rounded-lg text-center"
              />
              <button
                type="button"
                onClick={handleGeneratePins}
                className="px-3.5 py-1.5 bg-[#F47B20] hover:bg-[#E8601C] text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
              >
                Generate Batch PINs
              </button>
            </div>
          </div>

          {pinSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
              <span>{pinSuccess}</span>
              <button onClick={() => setPinSuccess(null)} className="font-bold cursor-pointer">✕</button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200 font-bold">
                  <th className="py-2.5 px-3">Serial No</th>
                  <th className="py-2.5 px-3">Scratch PIN</th>
                  <th className="py-2.5 px-3">Session</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Redeemed By Matric</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {pins.map(pin => (
                  <tr key={pin.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-700">{pin.serialNumber}</td>
                    <td className="py-2.5 px-3 font-mono font-black text-gray-900 tracking-wider">{pin.pin}</td>
                    <td className="py-2.5 px-3 text-gray-600">{pin.session} ({pin.semester})</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        pin.isUsed ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {pin.isUsed ? 'Redeemed' : 'Active / Unused'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-700">{pin.studentMatric || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 9. SECTION: OFFICIAL SIGNATURES */}
      {currentSection === 'signatures' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <PenTool className="w-4 h-4 text-[#F47B20]" />
              Authorized Signatory Digital Profiles
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Official signatures dynamically appear on students' printable Statement of Result and Transcripts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SignaturePad
              title="Examination Officer Signature"
              initialSignature={signatures.find(s => s.role === 'exam_officer')?.signatureImage}
              onSave={(dataUrl) => {
                saveSignature('exam_officer', 'Dr. Folashade Adeyemi', 'Examination Officer', dataUrl, 'exam_officer_001');
                showAlert('Saved Examination Officer signature.');
              }}
            />
            <SignaturePad
              title="Head of Department Signature"
              initialSignature={signatures.find(s => s.role === 'hod')?.signatureImage}
              onSave={(dataUrl) => {
                saveSignature('hod', 'Dr. Ibrahim Al-Hassan', 'Head of Department', dataUrl, 'hod_cht_001');
                showAlert('Saved Head of Department signature.');
              }}
            />
            <SignaturePad
              title="College Registrar Signature"
              initialSignature={signatures.find(s => s.role === 'registrar')?.signatureImage}
              onSave={(dataUrl) => {
                saveSignature('registrar', 'Barr. M. O. Danladi', 'College Registrar', dataUrl, 'registrar_001');
                showAlert('Saved College Registrar signature.');
              }}
            />
          </div>
        </div>
      )}

      {/* 10. SECTION: REPORTS & ANALYTICS */}
      {currentSection === 'reports' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#F47B20]" />
              Institutional Academic Performance Breakdown
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                <span className="text-[11px] font-bold uppercase text-emerald-800 block">Total Pass Rate</span>
                <span className="text-3xl font-black text-emerald-700 mt-1 block">{passRate}%</span>
                <span className="text-xs text-emerald-600">{passCount} passed of {results.length} course results</span>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                <span className="text-[11px] font-bold uppercase text-blue-800 block">Distinction / Upper Credit</span>
                <span className="text-3xl font-black text-blue-700 mt-1 block">85%</span>
                <span className="text-xs text-blue-600">High academic achievers</span>
              </div>

              <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                <span className="text-[11px] font-bold uppercase text-red-800 block">Carryover Rate</span>
                <span className="text-3xl font-black text-red-700 mt-1 block">
                  {results.length > 0 ? Math.round(((results.length - passCount) / results.length) * 100) : 0}%
                </span>
                <span className="text-xs text-red-600">{results.length - passCount} courses with F grade</span>
              </div>
            </div>

            {/* GPA Distribution Table */}
            <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-3 bg-gray-50 text-xs font-bold text-gray-700 border-b border-gray-200">
                Grade Distribution Summary
              </div>
              <div className="divide-y divide-gray-100 text-xs font-medium">
                <div className="p-3 flex justify-between">
                  <span>Grade A (70 – 100) — Distinction (4.00 GP)</span>
                  <strong className="text-emerald-700">{results.filter(r => r.grade === 'A').length} Course Records</strong>
                </div>
                <div className="p-3 flex justify-between">
                  <span>Grade B (60 – 69) — Very Good (3.50 GP)</span>
                  <strong className="text-blue-700">{results.filter(r => r.grade === 'B').length} Course Records</strong>
                </div>
                <div className="p-3 flex justify-between">
                  <span>Grade C (55 – 59) — Good (3.00 GP)</span>
                  <strong className="text-cyan-700">{results.filter(r => r.grade === 'C').length} Course Records</strong>
                </div>
                <div className="p-3 flex justify-between">
                  <span>Grade F (0 – 44) — Fail / Carryover (0.00 GP)</span>
                  <strong className="text-red-600">{results.filter(r => r.grade === 'F').length} Course Records</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 11. SECTION: AUDIT LOGS */}
      {currentSection === 'audit' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-xs md:text-sm font-bold text-gray-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              Immutable Security Audit Logs ({auditLogs.length} Records)
            </h3>
            <span className="text-xs text-gray-400">Read-only tamper-proof log</span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200 font-bold sticky top-0">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Actor / Role</th>
                  <th className="py-2.5 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 text-gray-400 whitespace-nowrap text-[11px]">
                      {new Date(log.timestamp).toLocaleString('en-GB')}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-800">{log.action}</td>
                    <td className="py-2.5 px-3 text-gray-700">
                      <strong>{log.userName}</strong> ({log.role})
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 12. SECTION: SYSTEM SETTINGS */}
      {currentSection === 'settings' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 max-w-2xl animate-in fade-in">
          <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#F47B20]" />
            System &amp; College Configuration
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Institution Name</label>
              <input
                type="text"
                value={settings.schoolName}
                onChange={(e) => updateSettings({ schoolName: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">College Motto</label>
              <input
                type="text"
                value={settings.motto}
                onChange={(e) => updateSettings({ motto: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none font-medium"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">CA Ratio Max Marks</label>
                <input
                  type="number"
                  value={settings.caMax}
                  onChange={(e) => updateSettings({ caMax: Number(e.target.value) || 30 })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Exam Ratio Max Marks</label>
                <input
                  type="number"
                  value={settings.examMax}
                  onChange={(e) => updateSettings({ examMax: Number(e.target.value) || 70 })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none font-bold"
                />
              </div>
            </div>

            {/* Configurable Institutional Grading Scale (NBTE 9-Point System) */}
            <div className="pt-4 mt-2 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#F47B20]" />
                    Institutional Grading Policy &amp; Scale (9-Point Scale)
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Defines the automated GPA and cumulative CGPA conversion for ND and HND results.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateSettings({ gradingScale: DEFAULT_GRADING_SCALE })}
                  className="px-2.5 py-1 text-[11px] font-bold text-[#F47B20] bg-orange-50 hover:bg-orange-100 rounded-lg transition border border-orange-200 cursor-pointer"
                >
                  Reset to NBTE Standard
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200 mt-3">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 uppercase text-[10px] tracking-wider font-bold border-b border-gray-200">
                      <th className="py-2 px-3">Score Range</th>
                      <th className="py-2 px-3 text-center">Grade</th>
                      <th className="py-2 px-3 text-center">Grade Point</th>
                      <th className="py-2 px-3 text-center">Remark</th>
                      <th className="py-2 px-3 text-right">Min Threshold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(settings.gradingScale || DEFAULT_GRADING_SCALE).map((band, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/70">
                        <td className="py-1.5 px-3 font-semibold text-gray-800">
                          {band.min} – {band.max}%
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                            band.grade === 'F' ? 'bg-red-100 text-red-700' :
                            band.grade === 'A' || band.grade === 'AB' ? 'bg-emerald-100 text-emerald-800' :
                            band.grade === 'B' || band.grade === 'BC' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {band.grade}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-center font-mono font-bold text-gray-800">
                          {band.gradePoint.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          <span className={band.remark === 'Pass' ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>
                            {band.remark}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={band.min}
                            onChange={(e) => {
                              const newMin = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                              const currentScale = [...(settings.gradingScale || DEFAULT_GRADING_SCALE)];
                              currentScale[idx] = { ...currentScale[idx], min: newMin };
                              updateSettings({ gradingScale: currentScale });
                            }}
                            className="w-16 p-1 text-center font-mono font-bold bg-gray-50 border border-gray-300 rounded outline-none text-xs focus:border-[#F47B20] focus:bg-white"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* MODAL 1: ADD USER */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-black text-gray-900 text-base">Create User Account</h3>
              <button onClick={() => setShowAddUser(false)} className="text-gray-400 hover:text-gray-700 text-lg font-bold cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. John Eze"
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john.eze@metrolane.edu.ng"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Assigned Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-white font-medium"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="registrar">Registrar</option>
                    <option value="exam_officer">Exam Officer</option>
                    <option value="hod">HOD</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Status</label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm({ ...userForm, status: e.target.value as any })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-white font-medium"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Department</label>
                <input
                  type="text"
                  value={userForm.department}
                  onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Assigned Course(s)</label>
                <input
                  type="text"
                  placeholder="e.g. CHT 101, CHT 103"
                  value={userForm.assignedCourse}
                  onChange={(e) => setUserForm({ ...userForm, assignedCourse: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">Enter course code(s) or select below</span>
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>
              <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-[#F47B20] hover:bg-[#E8601C] text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER (Requirement: Super Admin should be able to Edit users Information like name, course, email, department and status) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-[#F47B20]" />
                  Edit User Information
                </h3>
                <p className="text-xs text-gray-500">
                  Update full name, assigned course, email, department, role, and active status.
                </p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-700 text-lg font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editUserForm.fullName}
                    onChange={(e) => setEditUserForm({ ...editUserForm, fullName: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editUserForm.email}
                    onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">System Role *</label>
                  <select
                    value={editUserForm.role}
                    onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value as any })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white font-bold"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="registrar">Registrar</option>
                    <option value="exam_officer">Exam Officer</option>
                    <option value="hod">Head of Department (HOD)</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Account Status *</label>
                  <select
                    value={editUserForm.status}
                    onChange={(e) => setEditUserForm({ ...editUserForm, status: e.target.value as any })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white font-bold"
                  >
                    <option value="Active">Active (Permitted Access)</option>
                    <option value="Suspended">Suspended (Temporarily Locked)</option>
                    <option value="Inactive">Inactive (Deactivated)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Department</label>
                <input
                  type="text"
                  value={editUserForm.department}
                  onChange={(e) => setEditUserForm({ ...editUserForm, department: e.target.value })}
                  placeholder="e.g. Community Health Technology"
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Assigned Course(s) (e.g. CHT 101, CHT 103)
                </label>
                <input
                  type="text"
                  value={editUserForm.assignedCourse}
                  onChange={(e) => setEditUserForm({ ...editUserForm, assignedCourse: e.target.value })}
                  placeholder="e.g. CHT 101, CHT 103, CHT 105"
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none font-medium"
                />
                {/* Course Quick Pick Chips */}
                <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Quick Add:</span>
                  {courses.slice(0, 8).map(c => {
                    const isAdded = editUserForm.assignedCourse.includes(c.courseCode);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          if (isAdded) {
                            const updated = editUserForm.assignedCourse
                              .split(',')
                              .map(s => s.trim())
                              .filter(code => code !== c.courseCode)
                              .join(', ');
                            setEditUserForm({ ...editUserForm, assignedCourse: updated });
                          } else {
                            const updated = editUserForm.assignedCourse
                              ? `${editUserForm.assignedCourse}, ${c.courseCode}`
                              : c.courseCode;
                            setEditUserForm({ ...editUserForm, assignedCourse: updated });
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                          isAdded ? 'bg-[#F47B20] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {c.courseCode} {isAdded ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editUserForm.phone}
                  onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-[#F47B20] hover:bg-[#E8601C] text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Save User Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD COURSE */}
      {showAddCourse && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-black text-gray-900 text-base">Add New Course</h3>
              <button onClick={() => setShowAddCourse(false)} className="text-gray-400 hover:text-gray-700 text-lg font-bold cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Course Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CHT 109"
                    value={courseForm.courseCode}
                    onChange={(e) => setCourseForm({ ...courseForm, courseCode: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Credit Unit *</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    required
                    value={courseForm.creditUnit}
                    onChange={(e) => setCourseForm({ ...courseForm, creditUnit: Number(e.target.value) || 2 })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Community Environmental Sanitation"
                  value={courseForm.courseTitle}
                  onChange={(e) => setCourseForm({ ...courseForm, courseTitle: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Programme</label>
                  <select
                    value={courseForm.programme}
                    onChange={(e) => setCourseForm({ ...courseForm, programme: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-white font-medium"
                  >
                    {programmes.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Course Type</label>
                  <select
                    value={courseForm.courseType}
                    onChange={(e) => setCourseForm({ ...courseForm, courseType: e.target.value as any })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-white font-medium"
                  >
                    <option value="Core">Core</option>
                    <option value="Elective">Elective</option>
                    <option value="General Studies">General Studies</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Level</label>
                  <select
                    value={courseForm.level}
                    onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value as any })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-white font-medium"
                  >
                    <option value="ND1">ND1</option>
                    <option value="ND2">ND2</option>
                    <option value="HND1">HND1</option>
                    <option value="HND2">HND2</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Semester</label>
                  <select
                    value={courseForm.semester}
                    onChange={(e) => setCourseForm({ ...courseForm, semester: e.target.value as any })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-white font-medium"
                  >
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Assigned Lecturer</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Amina Bello"
                  value={courseForm.lecturerName}
                  onChange={(e) => setCourseForm({ ...courseForm, lecturerName: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">CA Max Score</label>
                  <input
                    type="number"
                    value={courseForm.caWeight}
                    onChange={(e) => setCourseForm({ ...courseForm, caWeight: Number(e.target.value) || 30 })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Exam Max Score</label>
                  <input
                    type="number"
                    value={courseForm.examWeight}
                    onChange={(e) => setCourseForm({ ...courseForm, examWeight: Number(e.target.value) || 70 })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none font-bold"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddCourse(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-[#F47B20] hover:bg-[#E8601C] text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT COURSE (Requirement: Under courses, super Admin should be able to edit information) */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-[#F47B20]" />
                  Edit Course Information
                </h3>
                <p className="text-xs text-gray-500">
                  Update course code, title, units, programme, semester, and assigned lecturer.
                </p>
              </div>
              <button onClick={() => setEditingCourse(null)} className="text-gray-400 hover:text-gray-700 text-lg font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveEditCourse} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Course Code *</label>
                  <input
                    type="text"
                    required
                    value={editCourseForm.courseCode}
                    onChange={(e) => setEditCourseForm({ ...editCourseForm, courseCode: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Credit Units *</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    required
                    value={editCourseForm.creditUnit}
                    onChange={(e) => setEditCourseForm({ ...editCourseForm, creditUnit: Number(e.target.value) || 2 })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  value={editCourseForm.courseTitle}
                  onChange={(e) => setEditCourseForm({ ...editCourseForm, courseTitle: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Programme</label>
                  <select
                    value={editCourseForm.programme}
                    onChange={(e) => setEditCourseForm({ ...editCourseForm, programme: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white font-medium"
                  >
                    {programmes.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Course Type</label>
                  <select
                    value={editCourseForm.courseType}
                    onChange={(e) => setEditCourseForm({ ...editCourseForm, courseType: e.target.value as any })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white font-medium"
                  >
                    <option value="Core">Core</option>
                    <option value="Elective">Elective</option>
                    <option value="General Studies">General Studies</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Level</label>
                  <select
                    value={editCourseForm.level}
                    onChange={(e) => setEditCourseForm({ ...editCourseForm, level: e.target.value as any })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white font-bold"
                  >
                    <option value="ND1">ND1</option>
                    <option value="ND2">ND2</option>
                    <option value="HND1">HND1</option>
                    <option value="HND2">HND2</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Semester</label>
                  <select
                    value={editCourseForm.semester}
                    onChange={(e) => setEditCourseForm({ ...editCourseForm, semester: e.target.value as any })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white font-bold"
                  >
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Assigned Lecturer</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Amina Bello"
                  value={editCourseForm.lecturerName}
                  onChange={(e) => setEditCourseForm({ ...editCourseForm, lecturerName: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">CA Score Max</label>
                  <input
                    type="number"
                    value={editCourseForm.caWeight}
                    onChange={(e) => setEditCourseForm({ ...editCourseForm, caWeight: Number(e.target.value) || 30 })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Exam Score Max</label>
                  <input
                    type="number"
                    value={editCourseForm.examWeight}
                    onChange={(e) => setEditCourseForm({ ...editCourseForm, examWeight: Number(e.target.value) || 70 })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none font-bold"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-[#F47B20] hover:bg-[#E8601C] text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Save Course Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD STUDENT (Requirement: Super Admin should be able to add student information) */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#F47B20]" />
                  Enroll New Student Record
                </h3>
                <p className="text-xs text-gray-500">
                  Matriculation number is automatically generated based on admission year and programme.
                </p>
              </div>
              <button onClick={() => setShowAddStudent(false)} className="text-gray-400 hover:text-gray-700 text-lg font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John"
                    value={studentForm.firstName}
                    onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Middle Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Chukwuemeka"
                    value={studentForm.middleName}
                    onChange={(e) => setStudentForm({ ...studentForm, middleName: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Doe"
                    value={studentForm.lastName}
                    onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Gender</label>
                  <select
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value as any })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white font-medium"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Academic Programme</label>
                  <select
                    value={studentForm.programme}
                    onChange={(e) => setStudentForm({ ...studentForm, programme: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white font-bold"
                  >
                    {programmes.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Academic Level</label>
                  <select
                    value={studentForm.level}
                    onChange={(e) => setStudentForm({ ...studentForm, level: e.target.value as any })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white font-bold"
                  >
                    <option value="ND1">ND1</option>
                    <option value="ND2">ND2</option>
                    <option value="HND1">HND1</option>
                    <option value="HND2">HND2</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">State of Origin</label>
                  <select
                    value={studentForm.stateOfOrigin}
                    onChange={(e) => {
                      const st = e.target.value;
                      const lgas = NIGERIAN_STATES[st] || [];
                      setStudentForm({ ...studentForm, stateOfOrigin: st, lga: lgas[0] || '' });
                    }}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white font-medium"
                  >
                    {Object.keys(NIGERIAN_STATES).map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Local Government Area (LGA)</label>
                  <select
                    value={studentForm.lga}
                    onChange={(e) => setStudentForm({ ...studentForm, lga: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white font-medium"
                  >
                    {(NIGERIAN_STATES[studentForm.stateOfOrigin] || []).map(lg => (
                      <option key={lg} value={lg}>{lg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={studentForm.phone}
                    onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="student@metrolane.edu.ng"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Residential Address</label>
                <input
                  type="text"
                  placeholder="e.g. 14 College Road, Campus Area"
                  value={studentForm.address}
                  onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Admission Year</label>
                  <input
                    type="text"
                    value={studentForm.admissionYear}
                    onChange={(e) => setStudentForm({ ...studentForm, admissionYear: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Current Academic Session</label>
                  <input
                    type="text"
                    value={studentForm.currentSession}
                    onChange={(e) => setStudentForm({ ...studentForm, currentSession: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none font-bold"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddStudent(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-[#F47B20] hover:bg-[#E8601C] text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: EDIT STUDENT (Requirement: Super Admin should be able to edit student information) */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-[#F47B20]" />
                  Edit Student Information
                </h3>
                <p className="text-xs text-gray-500">
                  Update student biodata, matriculation number, programme, clearance status, and enrollment status.
                </p>
              </div>
              <button onClick={() => setEditingStudent(null)} className="text-gray-400 hover:text-gray-700 text-lg font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveEditStudent} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editStudentForm.firstName}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, firstName: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={editStudentForm.middleName}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, middleName: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editStudentForm.lastName}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, lastName: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Matriculation Number *</label>
                  <input
                    type="text"
                    required
                    value={editStudentForm.matricNumber}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, matricNumber: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none font-mono font-bold text-[#F47B20]"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Gender</label>
                  <select
                    value={editStudentForm.gender}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, gender: e.target.value as any })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white font-medium"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Programme</label>
                  <select
                    value={editStudentForm.programme}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, programme: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white font-bold"
                  >
                    {programmes.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Level</label>
                  <select
                    value={editStudentForm.level}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, level: e.target.value as any })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white font-bold"
                  >
                    <option value="ND1">ND1</option>
                    <option value="ND2">ND2</option>
                    <option value="HND1">HND1</option>
                    <option value="HND2">HND2</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">State of Origin</label>
                  <select
                    value={editStudentForm.stateOfOrigin}
                    onChange={(e) => {
                      const st = e.target.value;
                      const lgas = NIGERIAN_STATES[st] || [];
                      setEditStudentForm({ ...editStudentForm, stateOfOrigin: st, lga: lgas[0] || '' });
                    }}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white font-medium"
                  >
                    {Object.keys(NIGERIAN_STATES).map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">LGA</label>
                  <select
                    value={editStudentForm.lga}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, lga: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white font-medium"
                  >
                    {(NIGERIAN_STATES[editStudentForm.stateOfOrigin] || []).map(lg => (
                      <option key={lg} value={lg}>{lg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editStudentForm.phone}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, phone: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editStudentForm.email}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, email: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Residential Address</label>
                <input
                  type="text"
                  value={editStudentForm.address}
                  onChange={(e) => setEditStudentForm({ ...editStudentForm, address: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Enrollment Status</label>
                  <select
                    value={editStudentForm.status}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, status: e.target.value as any })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white font-bold"
                  >
                    <option value="active">Active</option>
                    <option value="graduated">Graduated</option>
                    <option value="withdrawn">Withdrawn</option>
                    <option value="suspended">Suspended</option>
                    <option value="deferred">Deferred</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Clearance Checkpoints</label>
                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-gray-700">
                      <input
                        type="checkbox"
                        checked={editStudentForm.bursaryCleared}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, bursaryCleared: e.target.checked })}
                        className="rounded text-[#F47B20]"
                      />
                      Bursary
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-gray-700">
                      <input
                        type="checkbox"
                        checked={editStudentForm.libraryCleared}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, libraryCleared: e.target.checked })}
                        className="rounded text-[#F47B20]"
                      />
                      Library
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-gray-700">
                      <input
                        type="checkbox"
                        checked={editStudentForm.deptCleared}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, deptCleared: e.target.checked })}
                        className="rounded text-[#F47B20]"
                      />
                      Department
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-[#F47B20] hover:bg-[#E8601C] text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Save Student Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: ADD PROGRAMME */}
      {showAddProg && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in">
            <h3 className="font-black text-gray-900 text-base mb-4 pb-2 border-b border-gray-100">
              Add Academic Programme
            </h3>
            <form onSubmit={handleCreateProg} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Programme Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ND in Dental Technology"
                  value={progForm.name}
                  onChange={(e) => setProgForm({ ...progForm, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Programme Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DLT"
                    value={progForm.code}
                    onChange={(e) => setProgForm({ ...progForm, code: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Degree Type</label>
                  <select
                    value={progForm.degreeType}
                    onChange={(e) => setProgForm({ ...progForm, degreeType: e.target.value as any })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-white font-medium"
                  >
                    <option value="ND">ND</option>
                    <option value="HND">HND</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={progForm.department}
                  onChange={(e) => setProgForm({ ...progForm, department: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>
              <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddProg(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-[#F47B20] hover:bg-[#E8601C] text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Save Programme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: ADD SESSION */}
      {showAddSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in">
            <h3 className="font-black text-gray-900 text-base mb-4 pb-2 border-b border-gray-100">
              Create Academic Session
            </h3>
            <form onSubmit={handleCreateSession} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Session Name (e.g. 2026/2027) *</label>
                <input
                  type="text"
                  required
                  value={sessionForm.name}
                  onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Starting Semester</label>
                <select
                  value={sessionForm.currentSemester}
                  onChange={(e) => setSessionForm({ ...sessionForm, currentSemester: e.target.value as any })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-white font-medium"
                >
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddSession(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-[#F47B20] hover:bg-[#E8601C] text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 9: OVERRIDE SCORE */}
      {overrideModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in">
            <h4 className="font-black text-gray-900 text-base mb-2">Override Academic Score</h4>
            <p className="text-xs text-gray-600 mb-4">
              Overriding score for student <strong className="font-mono">{overrideModal.matric}</strong>.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">CA Score (Max 30)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={overrideCa}
                  onChange={(e) => setOverrideCa(Math.min(30, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-full p-2 font-bold border border-gray-300 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Exam Score (Max 70)</label>
                <input
                  type="number"
                  min="0"
                  max="70"
                  value={overrideExam}
                  onChange={(e) => setOverrideExam(Math.min(70, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-full p-2 font-bold border border-gray-300 rounded-lg outline-none"
                />
              </div>
            </div>
            <div className="mb-4 text-xs">
              <label className="font-bold text-gray-700 block mb-1">Administrative Justification *</label>
              <textarea
                required
                rows={2}
                placeholder="Reason for administrative override (e.g. Senate review, Remarked script)..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOverrideModal(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmOverride}
                className="px-5 py-2 text-xs font-black bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm cursor-pointer"
              >
                Apply Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 10: STUDENT PROFILE PREVIEW */}
      {selectedStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h4 className="font-black text-gray-900 text-base">Student Academic Profile</h4>
              <button onClick={() => setSelectedStudentModal(null)} className="text-gray-400 font-bold hover:text-gray-700 cursor-pointer">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-gray-400">Name:</span> <strong className="text-gray-900 block">{selectedStudentModal.firstName} {selectedStudentModal.lastName}</strong></div>
                <div><span className="text-gray-400">Matric:</span> <strong className="font-mono text-[#F47B20] block">{selectedStudentModal.matricNumber}</strong></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-gray-400">Programme:</span> <strong className="text-gray-800 block">{selectedStudentModal.programme}</strong></div>
                <div><span className="text-gray-400">Level:</span> <strong className="text-gray-800 block">{selectedStudentModal.level}</strong></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-gray-400">Origin:</span> <strong className="text-gray-800 block">{selectedStudentModal.stateOfOrigin} ({selectedStudentModal.lga})</strong></div>
                <div><span className="text-gray-400">Phone:</span> <strong className="text-gray-800 block">{selectedStudentModal.phone}</strong></div>
              </div>
              <div><span className="text-gray-400">Email:</span> <strong className="text-gray-800 block">{selectedStudentModal.email}</strong></div>
              <div className="pt-2">
                <span className="text-gray-400 block mb-1">Clearance Status:</span>
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded font-bold ${selectedStudentModal.clearanceStatus?.bursary ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    Bursary {selectedStudentModal.clearanceStatus?.bursary ? '✓' : '✗'}
                  </span>
                  <span className={`px-2 py-0.5 rounded font-bold ${selectedStudentModal.clearanceStatus?.library ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    Library {selectedStudentModal.clearanceStatus?.library ? '✓' : '✗'}
                  </span>
                  <span className={`px-2 py-0.5 rounded font-bold ${selectedStudentModal.clearanceStatus?.department ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    Department {selectedStudentModal.clearanceStatus?.department ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedStudentModal(null)}
                className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-black"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
