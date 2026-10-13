import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { SignaturePad } from '../common/SignaturePad';
import { 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  FileSpreadsheet, 
  PenTool, 
  GraduationCap, 
  Users, 
  AlertTriangle,
  Award,
  TrendingUp,
  BookOpen
} from 'lucide-react';

interface HodPortalProps {
  activeTab: string;
  onSelectTab?: (tab: string) => void;
}

export const HodPortal: React.FC<HodPortalProps> = ({ activeTab, onSelectTab }) => {
  const { currentUser } = useAuth();
  const { 
    courses, 
    results, 
    students, 
    approveResultScore, 
    rejectResultScore, 
    signatures, 
    saveSignature, 
    settings 
  } = useData();

  const currentSection = activeTab || 'dashboard';

  const handleTabChange = (tabId: string) => {
    onSelectTab?.(tabId);
  };

  const [activeCourseFilter, setActiveCourseFilter] = useState<string>('all');
  const [rejectModal, setRejectModal] = useState<{ resultId: string; courseCode: string; matric: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNote, setApprovalNote] = useState('');

  const hodSignature = signatures.find(s => s.role === 'hod');

  // Results submitted for HOD review
  const submittedResults = results.filter(r => 
    r.status === 'submitted' || r.status === 'hod_approved'
  );

  const filteredResults = activeCourseFilter === 'all'
    ? submittedResults
    : submittedResults.filter(r => r.courseId === activeCourseFilter);

  const pendingCount = submittedResults.filter(r => r.status === 'submitted').length;
  const approvedCount = submittedResults.filter(r => r.status === 'hod_approved').length;

  const handleApprove = async (resultId: string) => {
    await approveResultScore(resultId, 'hod', currentUser?.fullName || 'Dr. Ibrahim Al-Hassan', approvalNote);
    setApprovalNote('');
  };

  const handleBatchApprove = async (courseId: string) => {
    const courseResults = results.filter(r => r.courseId === courseId && r.status === 'submitted');
    for (const r of courseResults) {
      await approveResultScore(r.id, 'hod', currentUser?.fullName || 'Dr. Ibrahim Al-Hassan', 'Approved batch');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModal || !rejectionReason.trim()) return;
    await rejectResultScore(rejectModal.resultId, 'hod', currentUser?.fullName || 'Dr. Ibrahim Al-Hassan', rejectionReason);
    setRejectModal(null);
    setRejectionReason('');
  };

  // Group by courses
  const groupedCourses = Array.from(new Set(submittedResults.map(r => r.courseId))).map(cId => {
    return courses.find(c => c.id === cId);
  }).filter(Boolean);

  // Departmental courses
  const deptCourses = courses.filter(c => c.programmeCode === 'CHT' || c.programme.includes('Community Health'));
  // Departmental students
  const deptStudents = students.filter(s => s.programmeCode === 'CHT' || s.department.includes('Community Health'));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-[#1A1A2E] to-purple-800 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 block mb-1">
            Department of Community Health Technology
          </span>
          <h2 className="text-xl md:text-2xl font-black">
            Head of Department (HOD) Result Vetting
          </h2>
          <p className="text-xs md:text-sm text-gray-300 mt-1">
            HOD: <strong>{currentUser?.fullName}</strong> • Academic Review &amp; Authentication
          </p>
        </div>

        <div className="flex gap-3 text-center">
          <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-gray-300 font-bold uppercase block">Pending Vetting</span>
            <span className="text-xl font-black text-amber-400">{pendingCount}</span>
          </div>
          <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-gray-300 font-bold uppercase block">HOD Endorsed</span>
            <span className="text-xl font-black text-emerald-400">{approvedCount}</span>
          </div>
        </div>
      </div>

      {/* Internal Navigation Ribbon */}
      <div className="bg-white p-2 rounded-xl border border-gray-200 overflow-x-auto flex items-center gap-1 text-xs font-bold shadow-xs">
        {[
          { id: 'dashboard', label: 'Department Overview', icon: TrendingUp },
          { id: 'dept_results', label: 'Score Vetting & Approval', icon: CheckCircle },
          { id: 'course_assignments', label: 'Course Allocations', icon: BookOpen },
          { id: 'dept_students', label: 'Departmental Students', icon: GraduationCap },
          { id: 'signatures', label: 'HOD Signature', icon: PenTool },
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = currentSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isSelected ? 'bg-purple-900 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
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
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-purple-600" onClick={() => handleTabChange('dept_results')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Scores Awaiting Vetting</span>
              <span className="text-2xl font-black text-amber-600 block mt-1">{pendingCount}</span>
              <span className="text-xs text-gray-500">Submitted by Lecturers</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-purple-600" onClick={() => handleTabChange('dept_results')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">HOD Endorsed</span>
              <span className="text-2xl font-black text-emerald-700 block mt-1">{approvedCount}</span>
              <span className="text-xs text-emerald-600 font-semibold">Sent to Exam Officer</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-purple-600" onClick={() => handleTabChange('course_assignments')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Departmental Courses</span>
              <span className="text-2xl font-black text-purple-700 block mt-1">{deptCourses.length}</span>
              <span className="text-xs text-gray-500">Community Health Tech</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-purple-600" onClick={() => handleTabChange('dept_students')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Departmental Students</span>
              <span className="text-2xl font-black text-gray-900 block mt-1">{deptStudents.length}</span>
              <span className="text-xs text-emerald-600 font-semibold">ND1 &amp; ND2 Batches</span>
            </div>
          </div>

          {/* Quick Review Banner */}
          {pendingCount > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-purple-900 text-sm">Pending Lecturer Submissions</h4>
                <p className="text-xs text-purple-700">
                  {pendingCount} student results are waiting for departmental score verification and endorsement.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('dept_results')}
                className="px-4 py-2 bg-[#5B4FC4] hover:bg-[#4d42a6] text-white text-xs font-bold rounded-lg shadow-xs transition"
              >
                Review Scores Now →
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. SECTION: SCORE VETTING & APPROVAL */}
      {currentSection === 'dept_results' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Tabs / Filter Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200">
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              <button
                onClick={() => setActiveCourseFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  activeCourseFilter === 'all' ? 'bg-[#5B4FC4] text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All Courses ({submittedResults.length})
              </button>
              {groupedCourses.map(c => (
                <button
                  key={c?.id}
                  onClick={() => setActiveCourseFilter(c?.id || 'all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    activeCourseFilter === c?.id ? 'bg-[#5B4FC4] text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {c?.courseCode}
                </button>
              ))}
            </div>

            {groupedCourses.length > 0 && (
              <button
                type="button"
                onClick={() => handleBatchApprove(groupedCourses[0]?.id || '')}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Endorse All Pending in Course
              </button>
            )}
          </div>

          {/* Results Vetting Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xs md:text-sm font-bold text-gray-800 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#5B4FC4]" />
                Departmental Score Submissions
              </h3>
              <span className="text-xs text-gray-500">
                Session: {settings.currentSession} • {settings.currentSemester}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100/80 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200 font-bold">
                    <th className="py-3 px-3">Course</th>
                    <th className="py-3 px-3">Matric No</th>
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-3 text-center">CA (30)</th>
                    <th className="py-3 px-3 text-center">Exam (70)</th>
                    <th className="py-3 px-3 text-center">Total (100)</th>
                    <th className="py-3 px-3 text-center">Grade</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-400">
                        No submitted results pending review for the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map((r) => (
                      <tr key={r.id} className="hover:bg-purple-50/20 transition">
                        <td className="py-2.5 px-3 font-bold text-gray-800">{r.courseCode}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-gray-700">{r.matricNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-gray-800">{r.studentName || 'Student'}</td>
                        <td className="py-2.5 px-3 text-center text-gray-600">{r.caScore}</td>
                        <td className="py-2.5 px-3 text-center text-gray-600">{r.examScore}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-gray-900">{r.totalScore}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                            r.grade === 'F' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {r.grade}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            r.status === 'hod_approved' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {r.status === 'hod_approved' ? 'HOD Approved' : 'Awaiting HOD'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-1">
                          {r.status === 'submitted' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(r.id)}
                                className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectModal({ resultId: r.id, courseCode: r.courseCode, matric: r.matricNumber })}
                                className="px-2.5 py-1 text-xs font-bold bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition"
                              >
                                Return
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-bold inline-flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Endorsed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. SECTION: COURSE ALLOCATIONS */}
      {currentSection === 'course_assignments' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#5B4FC4]" />
                Departmental Course Allocations &amp; Lecturers
              </h3>
              <p className="text-xs text-gray-500">
                Course offerings in Community Health Technology and assigned academic staff.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deptCourses.map(c => (
              <div key={c.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:border-[#5B4FC4] transition">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-md">
                    {c.courseCode} • {c.creditUnit} Credit Units
                  </span>
                  <span className="text-[11px] text-gray-500 font-semibold">{c.level}</span>
                </div>
                <h4 className="font-bold text-sm text-gray-900 mt-2">{c.courseTitle}</h4>
                <div className="mt-2 text-xs text-gray-600">
                  Assigned Lecturer: <strong className="text-gray-900">{c.lecturerName || 'Dr. Amina Bello'}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SECTION: DEPARTMENTAL STUDENTS */}
      {currentSection === 'dept_students' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs md:text-sm font-bold text-gray-800 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#5B4FC4]" />
                Community Health Technology Student Register ({deptStudents.length} Students)
              </h3>
              <p className="text-[11px] text-gray-500">
                Students registered in this department for {settings.currentSession}.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200 font-bold">
                  <th className="py-2.5 px-3">Matric No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3 text-center">Level</th>
                  <th className="py-2.5 px-3">Origin</th>
                  <th className="py-2.5 px-3 text-center">Clearance Status</th>
                  <th className="py-2.5 px-3 text-center">Academic Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {deptStudents.map(std => (
                  <tr key={std.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#F47B20]">{std.matricNumber}</td>
                    <td className="py-2.5 px-3 font-bold text-gray-800">{std.firstName} {std.lastName}</td>
                    <td className="py-2.5 px-3 text-center font-bold">{std.level}</td>
                    <td className="py-2.5 px-3 text-gray-600">{std.stateOfOrigin}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Cleared ✓
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                        {std.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. SECTION: HOD SIGNATURE */}
      {currentSection === 'signatures' && (
        <div className="space-y-4 animate-in fade-in">
          <SignaturePad
            title="Head of Department Official Signature"
            initialSignature={hodSignature?.signatureImage}
            onSave={(dataUrl) => {
              saveSignature('hod', currentUser?.fullName || 'Dr. Ibrahim Al-Hassan', 'Head of Department', dataUrl, currentUser?.uid || 'hod_cht_001');
            }}
          />
        </div>
      )}

      {/* Reject/Return Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl animate-in fade-in">
            <h4 className="font-bold text-gray-900 text-base mb-2">Return Score to Lecturer</h4>
            <p className="text-xs text-gray-600 mb-4">
              Return {rejectModal.courseCode} score for student <strong>{rejectModal.matric}</strong> for correction.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="State reason (e.g. CA score exceeding 30, student omitted, discrepancy in exam score)..."
              rows={3}
              className="w-full text-xs p-3 border border-gray-300 rounded-lg outline-none focus:border-[#5B4FC4]"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Return Score
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
