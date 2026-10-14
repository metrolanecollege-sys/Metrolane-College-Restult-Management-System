import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { SignaturePad } from '../common/SignaturePad';
import { ResultSlip } from '../documents/ResultSlip';
import { StudentRecord } from '../../types';
import { NIGERIAN_STATES } from '../../utils/academic';
import { 
  GraduationCap, 
  FileText, 
  UserCheck, 
  Plus, 
  Search, 
  CheckCircle2, 
  Printer, 
  Download,
  Eye,
  Award,
  TrendingUp,
  FileSpreadsheet,
  PenTool,
  CheckCircle
} from 'lucide-react';

interface RegistrarPortalProps {
  activeTab: string;
  onSelectTab?: (tab: string) => void;
}

export const RegistrarPortal: React.FC<RegistrarPortalProps> = ({ activeTab, onSelectTab }) => {
  const { currentUser } = useAuth();
  const { 
    students, 
    addStudent, 
    updateStudent, 
    programmes, 
    signatures, 
    saveSignature, 
    results, 
    settings, 
    computeStudentSemesterSummary 
  } = useData();

  const currentSection = activeTab || 'dashboard';

  const handleTabChange = (tabId: string) => {
    onSelectTab?.(tabId);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgFilter, setSelectedProgFilter] = useState('all');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedStudentForSlip, setSelectedStudentForSlip] = useState<StudentRecord | null>(null);

  const registrarSig = signatures.find(s => s.role === 'registrar');

  // Form for registering new student
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: 'Male' as 'Male' | 'Female',
    stateOfOrigin: 'Enugu',
    lga: 'Nsukka',
    phone: '',
    email: '',
    programme: 'ND in Community Health Technology',
    programmeCode: 'CHT' as 'CHT' | 'HLT' | 'PBH' | 'CHTHND',
    department: 'Community Health Technology',
    level: 'ND1' as 'ND1' | 'ND2' | 'HND1' | 'HND2',
    previousCgpa: '3.40',
    previousCreditUnits: '36',
    admissionYear: '2026',
    currentSession: '2025/2026',
    currentSemester: '1st Semester' as '1st Semester' | '2nd Semester',
    address: ''
  });

  const availableLgas = NIGERIAN_STATES[formData.stateOfOrigin] || [];

  const handleStateChange = (state: string) => {
    setFormData(prev => ({
      ...prev,
      stateOfOrigin: state,
      lga: NIGERIAN_STATES[state]?.[0] || ''
    }));
  };

  const handleProgrammeChange = (progName: string) => {
    const prog = programmes.find(p => p.name === progName);
    setFormData(prev => ({
      ...prev,
      programme: progName,
      programmeCode: (prog?.code || 'CHT') as any,
      department: prog?.department || 'Health Sciences'
    }));
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const isYear2 = formData.level === 'ND2' || formData.level === 'HND2';
    const parsedPrevCgpa = parseFloat(formData.previousCgpa) || undefined;
    const parsedPrevUnits = parseInt(formData.previousCreditUnits, 10) || undefined;
    await addStudent({
      ...formData,
      year: isYear2 ? 2 : 1,
      previousCgpa: isYear2 ? parsedPrevCgpa : undefined,
      previousCreditUnits: isYear2 ? parsedPrevUnits : undefined,
      previousQualityPoints: (isYear2 && parsedPrevCgpa && parsedPrevUnits) ? parseFloat((parsedPrevCgpa * parsedPrevUnits).toFixed(2)) : undefined,
      status: 'active',
      clearanceStatus: { bursary: true, library: true, department: true }
    });
    setShowAddStudentModal(false);
  };

  const handleToggleClearance = async (studentId: string, item: 'bursary' | 'library' | 'department') => {
    const std = students.find(s => s.id === studentId);
    if (!std) return;
    const current = std.clearanceStatus || { bursary: false, library: false, department: false };
    await updateStudent(studentId, {
      clearanceStatus: {
        ...current,
        [item]: !current[item]
      }
    });
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.matricNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProg = selectedProgFilter === 'all' || s.programmeCode === selectedProgFilter;
    return matchesSearch && matchesProg;
  });

  const clearedCount = students.filter(s => s.clearanceStatus?.bursary && s.clearanceStatus?.library && s.clearanceStatus?.department).length;
  const publishedResults = results.filter(r => r.status === 'published');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#1A1A2E] to-emerald-700 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block mb-1">
            Registry Division &amp; Academic Records
          </span>
          <h2 className="text-xl md:text-2xl font-black">
            College Registrar Portal
          </h2>
          <p className="text-xs md:text-sm text-gray-300 mt-1">
            Registrar: <strong>{currentUser?.fullName}</strong> • Admissions, Clearance &amp; Official Transcripts
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddStudentModal(true)}
          className="px-4 py-2.5 bg-[#F47B20] hover:bg-[#E8601C] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Enroll New Student (Auto Matric)
        </button>
      </div>

      {/* Internal Navigation Ribbon */}
      <div className="bg-white p-2 rounded-xl border border-gray-200 overflow-x-auto flex items-center gap-1 text-xs font-bold shadow-xs">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
          { id: 'students', label: 'Admissions & Records', icon: GraduationCap },
          { id: 'transcripts', label: 'Transcripts & Result Slips', icon: FileText },
          { id: 'clearance', label: 'Student Clearance', icon: UserCheck },
          { id: 'results_view', label: 'Published Results', icon: FileSpreadsheet },
          { id: 'signatures', label: 'Registrar Signature', icon: PenTool },
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = currentSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isSelected ? 'bg-emerald-900 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
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
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-emerald-600" onClick={() => handleTabChange('students')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Total Admitted Students</span>
              <span className="text-2xl font-black text-gray-900 block mt-1">{students.length}</span>
              <span className="text-xs text-emerald-600 font-semibold">Active Matriculations</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-emerald-600" onClick={() => handleTabChange('clearance')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Cleared for Results</span>
              <span className="text-2xl font-black text-emerald-700 block mt-1">{clearedCount}</span>
              <span className="text-xs text-emerald-600 font-semibold">{Math.round((clearedCount / (students.length || 1)) * 100)}% Clearance completion</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-emerald-600" onClick={() => handleTabChange('results_view')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Published Results</span>
              <span className="text-2xl font-black text-[#F47B20] block mt-1">{publishedResults.length}</span>
              <span className="text-xs text-gray-500">Live for verification</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-emerald-600" onClick={() => handleTabChange('signatures')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Digital Signature</span>
              <span className="text-sm font-black text-gray-900 block mt-2">
                {registrarSig ? 'Configured ✓' : 'Pending Signature'}
              </span>
              <span className="text-xs text-gray-400">Attached to official transcripts</span>
            </div>
          </div>

          {/* Quick admissions table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-sm">Recent Student Registrations</h3>
              <button onClick={() => handleTabChange('students')} className="text-xs font-bold text-emerald-700 hover:underline">
                View All Students →
              </button>
            </div>
            <div className="divide-y divide-gray-100 text-xs">
              {students.slice(0, 4).map(s => (
                <div key={s.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-800">{s.firstName} {s.lastName}</span>
                    <span className="text-gray-500 block text-[11px]">
                      Matric: <strong className="font-mono text-[#F47B20]">{s.matricNumber}</strong> • {s.programme} ({s.level})
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedStudentForSlip(s)}
                    className="px-3 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold rounded-lg transition"
                  >
                    View Result Slip
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. SECTION: ADMISSIONS & RECORDS */}
      {currentSection === 'students' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search by student name or matric number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-emerald-600"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-gray-500 uppercase">Filter Programme:</label>
              <select
                value={selectedProgFilter}
                onChange={(e) => setSelectedProgFilter(e.target.value)}
                className="text-xs font-semibold bg-white border border-gray-300 rounded-lg px-3 py-1.5 outline-none"
              >
                <option value="all">All Programmes</option>
                {programmes.map(p => (
                  <option key={p.id} value={p.code}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100/80 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200 font-bold">
                    <th className="py-3 px-3">Matric No</th>
                    <th className="py-3 px-3">Full Name</th>
                    <th className="py-3 px-3">Programme / Dept</th>
                    <th className="py-3 px-3 text-center">Level</th>
                    <th className="py-3 px-3 text-center">Origin</th>
                    <th className="py-3 px-3 text-center">Clearance Status</th>
                    <th className="py-3 px-3 text-right">Official Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredStudents.map((std) => (
                    <tr key={std.id} className="hover:bg-emerald-50/20 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#F47B20]">{std.matricNumber}</td>
                      <td className="py-2.5 px-3 font-bold text-gray-800">{std.firstName} {std.lastName}</td>
                      <td className="py-2.5 px-3 text-gray-600">{std.programme}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-gray-800">{std.level}</td>
                      <td className="py-2.5 px-3 text-center text-gray-500">{std.stateOfOrigin}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Cleared ✓
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForSlip(std)}
                          className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-md transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Statement of Result
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. SECTION: TRANSCRIPTS & RESULT SLIPS */}
      {currentSection === 'transcripts' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                Official Statement of Result &amp; Transcript Generator
              </h3>
              <p className="text-xs text-gray-500">
                Generate authenticated result slips with official watermark and all 3 digital signatures.
              </p>
            </div>
          </div>

          <div className="divide-y divide-gray-100 text-xs">
            {students.map(std => {
              const summary = computeStudentSemesterSummary(std.id, settings.currentSession, settings.currentSemester);
              return (
                <div key={std.id} className="py-3.5 flex items-center justify-between hover:bg-gray-50 px-2 rounded-lg">
                  <div>
                    <span className="font-bold text-gray-900 text-sm block">{std.firstName} {std.lastName}</span>
                    <span className="text-gray-500 text-[11px]">
                      Matric: <strong className="font-mono text-[#F47B20]">{std.matricNumber}</strong> • {std.programme} • CGPA: <strong className="text-blue-700">{summary.cgpa.toFixed(2)}</strong> ({summary.classification})
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedStudentForSlip(std)}
                    className="px-4 py-2 bg-[#1A1A2E] hover:bg-[#2D2D44] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#F47B20]" />
                    Generate &amp; Print Slip
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. SECTION: CLEARANCE MANAGEMENT */}
      {currentSection === 'clearance' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-xs md:text-sm font-bold text-gray-800 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              Student Clearance Management
            </h3>
            <p className="text-[11px] text-gray-500">
              Click individual clearance tags to toggle Bursary, Library, or Departmental clearance status.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200 font-bold">
                  <th className="py-3 px-3">Matric No</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Programme</th>
                  <th className="py-3 px-3 text-center">Bursary Clearance</th>
                  <th className="py-3 px-3 text-center">Library Clearance</th>
                  <th className="py-3 px-3 text-center">Department Clearance</th>
                  <th className="py-3 px-3 text-center">Final Result Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {students.map(std => {
                  const b = std.clearanceStatus?.bursary;
                  const l = std.clearanceStatus?.library;
                  const d = std.clearanceStatus?.department;
                  const allCleared = b && l && d;

                  return (
                    <tr key={std.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#F47B20]">{std.matricNumber}</td>
                      <td className="py-2.5 px-3 font-bold text-gray-800">{std.firstName} {std.lastName}</td>
                      <td className="py-2.5 px-3 text-gray-600">{std.programme}</td>
                      
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleClearance(std.id, 'bursary')}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                            b ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {b ? 'Cleared ✓' : 'Owing ✗'}
                        </button>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleClearance(std.id, 'library')}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                            l ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {l ? 'Cleared ✓' : 'Pending ✗'}
                        </button>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleClearance(std.id, 'department')}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                            d ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {d ? 'Cleared ✓' : 'Pending ✗'}
                        </button>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          allCleared ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {allCleared ? 'Eligible' : 'Hold Results'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. SECTION: PUBLISHED RESULTS */}
      {currentSection === 'results_view' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-xs md:text-sm font-bold text-gray-800 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Verified Published Results Database
            </h3>
            <p className="text-[11px] text-gray-500">
              Exam Director and Senate endorsed results visible on student scratch cards.
            </p>
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
                  <th className="py-2.5 px-3 text-center">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {publishedResults.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-800">{r.matricNumber}</td>
                    <td className="py-2.5 px-3 font-semibold text-gray-800">{r.studentName}</td>
                    <td className="py-2.5 px-3 font-bold text-gray-900">{r.courseCode}</td>
                    <td className="py-2.5 px-3 text-center text-gray-600">{r.caScore}</td>
                    <td className="py-2.5 px-3 text-center text-gray-600">{r.examScore}</td>
                    <td className="py-2.5 px-3 text-center font-black text-gray-900">{r.totalScore}</td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                        r.grade === 'F' ? 'bg-red-100 text-red-700' :
                        r.grade === 'A' || r.grade === 'AB' ? 'bg-emerald-100 text-emerald-800' :
                        r.grade === 'B' || r.grade === 'BC' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {r.grade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-700">{r.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. SECTION: REGISTRAR SIGNATURE */}
      {currentSection === 'signatures' && (
        <div className="space-y-4 animate-in fade-in">
          <SignaturePad
            title="College Registrar Official Digital Signature"
            initialSignature={registrarSig?.signatureImage}
            onSave={(dataUrl) => {
              saveSignature('registrar', currentUser?.fullName || 'Barr. M. O. Danladi', 'College Registrar', dataUrl, currentUser?.uid || 'registrar_001');
            }}
          />
        </div>
      )}

      {/* Enroll New Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-black text-gray-900 text-base">Enroll New Student</h3>
                <p className="text-xs text-gray-500">
                  Matric number is auto-generated following format: <span className="font-mono text-[#F47B20]">26/MET/[CODE]/###</span>
                </p>
              </div>
              <button onClick={() => setShowAddStudentModal(false)} className="text-gray-400 hover:text-gray-700 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={formData.middleName}
                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">State of Origin</label>
                  <select
                    value={formData.stateOfOrigin}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-white"
                  >
                    {Object.keys(NIGERIAN_STATES).map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">LGA</label>
                  <select
                    value={formData.lga}
                    onChange={(e) => setFormData({ ...formData, lga: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-white"
                  >
                    {availableLgas.map(lga => (
                      <option key={lga} value={lga}>{lga}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Programme *</label>
                  <select
                    value={formData.programme}
                    onChange={(e) => handleProgrammeChange(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-white"
                  >
                    {programmes.map(p => (
                      <option key={p.id} value={p.name}>{p.name} ({p.degreeType})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Academic Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-white font-bold"
                  >
                    <option value="ND1">ND1 (Year 1)</option>
                    <option value="ND2">ND2 (Year 2)</option>
                    <option value="HND1">HND1 (Year 1)</option>
                    <option value="HND2">HND2 (Year 2)</option>
                  </select>
                </div>
              </div>

              {(formData.level === 'ND2' || formData.level === 'HND2') && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider">
                    Year 2 Student: Previous Year 1 Academic Record
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Previous CGPA (Year 1)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="4.00"
                        value={formData.previousCgpa}
                        onChange={(e) => setFormData({ ...formData, previousCgpa: e.target.value })}
                        className="w-full p-2 border border-amber-300 rounded-lg outline-none bg-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Completed Year 1 Units</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={formData.previousCreditUnits}
                        onChange={(e) => setFormData({ ...formData, previousCreditUnits: e.target.value })}
                        className="w-full p-2 border border-amber-300 rounded-lg outline-none bg-white font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-[#F47B20] hover:bg-[#E8601C] text-white rounded-lg shadow-sm"
                >
                  Confirm &amp; Generate Matric Number
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Result Slip Modal Preview */}
      {selectedStudentForSlip && (
        <ResultSlip
          student={selectedStudentForSlip}
          results={results.filter(r => r.studentId === selectedStudentForSlip.id && r.status === 'published')}
          summary={computeStudentSemesterSummary(selectedStudentForSlip.id, settings.currentSession, settings.currentSemester)}
          signatures={signatures}
          session={settings.currentSession}
          semester={settings.currentSemester}
          onClose={() => setSelectedStudentForSlip(null)}
        />
      )}
    </div>
  );
};
