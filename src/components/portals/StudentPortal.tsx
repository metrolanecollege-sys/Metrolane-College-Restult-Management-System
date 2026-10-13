import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ResultSlip } from '../documents/ResultSlip';
import { StudentRecord } from '../../types';
import { 
  GraduationCap, 
  KeyRound, 
  ClipboardList, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Printer, 
  Check, 
  Clock,
  Sparkles,
  BookOpen,
  TrendingUp,
  UserCheck
} from 'lucide-react';

interface StudentPortalProps {
  activeTab: string;
  onSelectTab?: (tab: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ activeTab, onSelectTab }) => {
  const { currentUser } = useAuth();
  const { 
    students, 
    courses, 
    courseRegistrations, 
    registerStudentCourses, 
    dropStudentCourse, 
    results, 
    pins, 
    verifyAndRedeemPin, 
    settings, 
    signatures, 
    computeStudentSemesterSummary 
  } = useData();

  // Find student profile strictly linked to this authenticated user
  const currentStudent = students.find(
    s => s.uid === currentUser?.uid || 
         (s.email && currentUser?.email && s.email.toLowerCase() === currentUser.email.toLowerCase()) ||
         (s.matricNumber && (currentUser as any)?.matricNumber && s.matricNumber.toLowerCase() === String((currentUser as any).matricNumber).toLowerCase())
  ) || students[0];

  // Tab navigation inside Student portal directly linked to activeTab
  const currentView = activeTab || 'dashboard';

  const handleTabChange = (tabId: string) => {
    onSelectTab?.(tabId);
  };

  // PIN Result checking form
  const [scratchPin, setScratchPin] = useState('');
  const [pinSerial, setPinSerial] = useState('');
  const [selectedSession, setSelectedSession] = useState(settings.currentSession);
  const [selectedSemester, setSelectedSemester] = useState<'1st Semester' | '2nd Semester'>(settings.currentSemester);
  const [pinVerificationResult, setPinVerificationResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isResultUnlocked, setIsResultUnlocked] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);

  // Course registration selection
  const myRegistrations = courseRegistrations.filter(
    r => r.studentId === currentStudent?.id && r.session === settings.currentSession
  );
  const availableCourses = courses.filter(
    c => c.programme === currentStudent?.programme || c.programmeCode === currentStudent?.programmeCode
  );
  const [selectedCourseIdsToRegister, setSelectedCourseIdsToRegister] = useState<string[]>([]);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Student results
  const studentResults = results.filter(
    r => r.studentId === currentStudent?.id && r.session === selectedSession && r.semester === selectedSemester && r.status === 'published'
  );

  const studentSummary = computeStudentSemesterSummary(currentStudent?.id || '', selectedSession, selectedSemester);

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scratchPin.trim()) return;

    const res = await verifyAndRedeemPin(
      scratchPin, 
      currentStudent.id, 
      currentStudent.matricNumber, 
      selectedSession, 
      selectedSemester
    );
    setPinVerificationResult(res);
    if (res.success) {
      setIsResultUnlocked(true);
    }
  };

  const handleCourseSelectionToggle = (courseId: string) => {
    setSelectedCourseIdsToRegister(prev => 
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  const handleConfirmRegistration = async () => {
    if (selectedCourseIdsToRegister.length === 0) return;
    await registerStudentCourses(
      currentStudent.id,
      currentStudent.matricNumber,
      selectedCourseIdsToRegister,
      settings.currentSession,
      settings.currentSemester,
      currentStudent.level
    );
    setSelectedCourseIdsToRegister([]);
    setRegSuccess(`Successfully enrolled in ${selectedCourseIdsToRegister.length} courses for ${settings.currentSession}.`);
  };

  // Find a sample unused PIN for instant testing convenience
  const sampleUnusedPin = pins.find(p => !p.isUsed) || pins[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1A1A2E] via-[#2A2A4E] to-[#F47B20] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-xs font-semibold text-[#F9A825] mb-2 border border-white/20">
            <GraduationCap className="w-3.5 h-3.5" />
            Metrolane Student Academic Portal
          </div>
          <h2 className="text-xl md:text-2xl font-black">
            Welcome, {currentStudent?.firstName} {currentStudent?.lastName}
          </h2>
          <p className="text-xs md:text-sm text-gray-200 mt-1">
            Matric No: <strong className="font-mono text-[#F9A825]">{currentStudent?.matricNumber}</strong> • {currentStudent?.programme}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleTabChange('check_result')}
            className="px-4 py-2 bg-white text-gray-900 hover:bg-gray-100 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#F47B20]" />
            Check Result (Scratch PIN)
          </button>
        </div>
      </div>

      {/* Internal Navigation Ribbon */}
      <div className="bg-white p-2 rounded-xl border border-gray-200 overflow-x-auto flex items-center gap-1 text-xs font-bold shadow-xs">
        {[
          { id: 'dashboard', label: 'My Dashboard', icon: TrendingUp },
          { id: 'check_result', label: 'Check Result (PIN)', icon: KeyRound },
          { id: 'course_registration', label: 'Course Registration', icon: ClipboardList },
          { id: 'result_slips', label: 'Result Slips & Transcripts', icon: FileText },
          { id: 'academic_profile', label: 'Student Profile', icon: GraduationCap },
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isSelected ? 'bg-[#F47B20] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. SECTION: DASHBOARD */}
      {currentView === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-[#F47B20]" onClick={() => handleTabChange('academic_profile')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Current Level / Session</span>
              <span className="text-base font-black text-gray-900 block mt-1">{currentStudent?.level}</span>
              <span className="text-xs text-gray-500">{settings.currentSession} ({settings.currentSemester})</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-[#F47B20]" onClick={() => handleTabChange('check_result')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Cumulative CGPA</span>
              <span className="text-2xl font-black text-[#5B4FC4] block mt-1">{studentSummary.cgpa.toFixed(2)}</span>
              <span className="text-xs text-emerald-700 font-bold uppercase">{studentSummary.classification}</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Academic Standing</span>
              <span className="text-base font-black text-emerald-700 block mt-1">
                {studentSummary.remark === 'Pass' ? 'Good Standing' : studentSummary.remark}
              </span>
              <span className="text-xs text-gray-500">Normal progression</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-[#F47B20]" onClick={() => handleTabChange('course_registration')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Registered Courses</span>
              <span className="text-2xl font-black text-gray-900 block mt-1">{myRegistrations.length}</span>
              <span className="text-xs text-gray-500">{myRegistrations.reduce((a, b) => a + b.creditUnit, 0)} Total Credit Units</span>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#F47B20]" />
                  Check Semester Results
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Have your 16-character scratch PIN ready to view your Continuous Assessment and Examination scores.
                </p>
              </div>
              <button
                onClick={() => handleTabChange('check_result')}
                className="mt-4 px-4 py-2 bg-[#F47B20] hover:bg-[#E8601C] text-white font-bold text-xs rounded-xl shadow-xs transition self-start"
              >
                Go to Result Checker →
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Statement of Result Slip
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Download or print your official Statement of Result with College seal and 3 digital signatures.
                </p>
              </div>
              <button
                onClick={() => setShowSlipModal(true)}
                className="mt-4 px-4 py-2 bg-[#1A1A2E] hover:bg-[#2D2D44] text-white font-bold text-xs rounded-xl shadow-xs transition self-start"
              >
                Print Statement of Result →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SECTION: CHECK RESULT (SCRATCH PIN) */}
      {currentView === 'check_result' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-orange-100 text-[#F47B20] rounded-full flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-gray-900">Online Result Checking Portal</h3>
              <p className="text-xs text-gray-500 mt-1">
                Enter your valid 16-character Scratch PIN to view and download your Statement of Result.
              </p>
            </div>

            {/* Quick Demo Fill Helper */}
            {sampleUnusedPin && (
              <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-900 block">Sample Scratch PIN for Testing:</span>
                  <span className="font-mono font-black text-[#E8601C] text-sm">{sampleUnusedPin.pin}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setScratchPin(sampleUnusedPin.pin);
                    setPinSerial(sampleUnusedPin.serialNumber);
                  }}
                  className="px-3 py-1.5 bg-[#F47B20] hover:bg-[#E8601C] text-white font-bold rounded-lg transition"
                >
                  Auto Fill PIN
                </button>
              </div>
            )}

            {pinVerificationResult && (
              <div className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                pinVerificationResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {pinVerificationResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                <span>{pinVerificationResult.message}</span>
              </div>
            )}

            <form onSubmit={handleVerifyPin} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  16-Digit Result Scratch PIN *
                </label>
                <input
                  type="text"
                  required
                  placeholder="MET-XXXX-XXXX-XXXX"
                  value={scratchPin}
                  onChange={(e) => setScratchPin(e.target.value)}
                  className="w-full font-mono font-bold text-sm p-3 bg-[#EEEDF7] rounded-lg border border-transparent focus:border-[#5B4FC4] focus:bg-white outline-none tracking-widest text-center"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Academic Session</label>
                  <select
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg outline-none"
                  >
                    <option value="2025/2026">2025/2026</option>
                    <option value="2024/2025">2024/2025</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Semester</label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value as any)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg outline-none"
                  >
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#F47B20] hover:bg-[#E8601C] text-white font-black text-sm rounded-lg shadow-md transition cursor-pointer"
              >
                Authenticate &amp; View Result
              </button>
            </form>
          </div>

          {/* Results Table Revealed if PIN verified */}
          {(isResultUnlocked || studentResults.length > 0) && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                <div>
                  <h3 className="font-black text-gray-900 text-base">
                    Semester Result Slip ({selectedSession} • {selectedSemester})
                  </h3>
                  <p className="text-xs text-gray-500">
                    Matric No: <strong className="font-mono">{currentStudent?.matricNumber}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSlipModal(true)}
                  className="px-4 py-2 bg-[#1A1A2E] hover:bg-[#2D2D44] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 self-start"
                >
                  <Printer className="w-3.5 h-3.5 text-[#F47B20]" />
                  Print Official Statement of Result
                </button>
              </div>

              {/* Scores table */}
              <div className="my-4 overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200 font-bold">
                      <th className="py-2.5 px-3">Course Code</th>
                      <th className="py-2.5 px-3">Course Title</th>
                      <th className="py-2.5 px-3 text-center">Credit Unit</th>
                      <th className="py-2.5 px-3 text-center">CA (30)</th>
                      <th className="py-2.5 px-3 text-center">Exam (70)</th>
                      <th className="py-2.5 px-3 text-center">Total (100)</th>
                      <th className="py-2.5 px-3 text-center">Grade</th>
                      <th className="py-2.5 px-3 text-center">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {studentResults.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="py-2.5 px-3 font-bold text-gray-900">{r.courseCode}</td>
                        <td className="py-2.5 px-3 text-gray-700">{r.courseTitle}</td>
                        <td className="py-2.5 px-3 text-center font-bold">{r.creditUnit}</td>
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
                        <td className="py-2.5 px-3 text-center font-bold">
                          <span className={r.remark === 'Pass' ? 'text-emerald-700' : 'text-red-600'}>
                            {r.remark}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Performance Cards */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div>
                  <span className="text-gray-500 uppercase text-[10px] font-bold block">Credit Units</span>
                  <span className="text-lg font-black text-gray-900">{studentSummary.totalCreditUnits}</span>
                </div>
                <div>
                  <span className="text-gray-500 uppercase text-[10px] font-bold block">Quality Points</span>
                  <span className="text-lg font-black text-gray-900">{studentSummary.totalQualityPoints.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500 uppercase text-[10px] font-bold block">Semester GPA</span>
                  <span className="text-lg font-black text-[#E8601C]">{studentSummary.gpa.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500 uppercase text-[10px] font-bold block">Cumulative CGPA</span>
                  <span className="text-lg font-black text-[#5B4FC4]">{studentSummary.cgpa.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. SECTION: COURSE REGISTRATION */}
      {currentView === 'course_registration' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Course Registration Portal</h3>
              <p className="text-xs text-gray-500">
                Enroll in required core and general studies courses for {settings.currentSession} ({settings.currentSemester}).
              </p>
            </div>
            {selectedCourseIdsToRegister.length > 0 && (
              <button
                type="button"
                onClick={handleConfirmRegistration}
                className="px-4 py-2 bg-[#F47B20] hover:bg-[#E8601C] text-white font-bold text-xs rounded-lg shadow-sm transition"
              >
                Register Selected ({selectedCourseIdsToRegister.length})
              </button>
            )}
          </div>

          {regSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
              <span>{regSuccess}</span>
              <button onClick={() => setRegSuccess(null)} className="font-bold">✕</button>
            </div>
          )}

          {/* Available courses list */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-700">
              Departmental Curriculum Courses
            </div>
            <div className="divide-y divide-gray-100 text-xs">
              {availableCourses.map(c => {
                const isAlreadyRegistered = myRegistrations.some(r => r.courseId === c.id);
                const isSelected = selectedCourseIdsToRegister.includes(c.id);

                return (
                  <div key={c.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        disabled={isAlreadyRegistered}
                        checked={isAlreadyRegistered || isSelected}
                        onChange={() => handleCourseSelectionToggle(c.id)}
                        className="rounded border-gray-300 text-[#F47B20] focus:ring-[#F47B20]"
                      />
                      <div>
                        <span className="font-bold text-gray-900 block">{c.courseCode} — {c.courseTitle}</span>
                        <span className="text-gray-500 text-[11px]">
                          {c.creditUnit} Credit Units • {c.courseType} • Lecturer: {c.lecturerName || 'Assigned'}
                        </span>
                      </div>
                    </div>

                    <div>
                      {isAlreadyRegistered ? (
                        <span className="text-emerald-700 font-bold text-[11px] px-2 py-0.5 bg-emerald-50 rounded-md">
                          Enrolled ✓
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">Available</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. SECTION: RESULT SLIPS & TRANSCRIPTS */}
      {currentView === 'result_slips' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#F47B20]" />
                Official Statement of Result Document
              </h3>
              <p className="text-xs text-gray-500">
                Official institutional printout featuring watermarked seal and signatures of Exam Officer, HOD, and Registrar.
              </p>
            </div>
            <button
              onClick={() => setShowSlipModal(true)}
              className="px-4 py-2 bg-[#F47B20] hover:bg-[#E8601C] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Preview &amp; Print PDF
            </button>
          </div>

          <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center">
            <GraduationCap className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <h4 className="font-bold text-gray-800 text-sm">Statement of Result Available</h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-4">
              Your academic scores for session {settings.currentSession} have been computed with Semester GPA: <strong>{studentSummary.gpa.toFixed(2)}</strong> and CGPA: <strong>{studentSummary.cgpa.toFixed(2)}</strong> ({studentSummary.classification}).
            </p>
            <button
              onClick={() => setShowSlipModal(true)}
              className="px-5 py-2.5 bg-[#1A1A2E] hover:bg-[#2D2D44] text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-[#F47B20]" />
              Download Statement of Result
            </button>
          </div>
        </div>
      )}

      {/* 5. SECTION: ACADEMIC PROFILE */}
      {currentView === 'academic_profile' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6 animate-in fade-in">
          <div>
            <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#F47B20]" />
              Student Academic Profile &amp; Bio-Data
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-400 font-semibold block uppercase text-[10px]">Full Name:</span>
              <span className="font-bold text-gray-800">{currentStudent?.firstName} {currentStudent?.middleName || ''} {currentStudent?.lastName}</span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold block uppercase text-[10px]">Matriculation No:</span>
              <span className="font-mono font-bold text-[#F47B20]">{currentStudent?.matricNumber}</span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold block uppercase text-[10px]">Programme:</span>
              <span className="font-semibold text-gray-800">{currentStudent?.programme}</span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold block uppercase text-[10px]">Department:</span>
              <span className="font-semibold text-gray-800">{currentStudent?.department}</span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold block uppercase text-[10px]">State of Origin / LGA:</span>
              <span className="font-semibold text-gray-800">{currentStudent?.stateOfOrigin} ({currentStudent?.lga})</span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold block uppercase text-[10px]">Gender:</span>
              <span className="font-semibold text-gray-800">{currentStudent?.gender}</span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold block uppercase text-[10px]">Clearance Status:</span>
              <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Fully Cleared
              </span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold block uppercase text-[10px]">College Email:</span>
              <span className="font-medium text-gray-700">{currentStudent?.email}</span>
            </div>
          </div>
        </div>
      )}

      {/* Result Slip Modal Preview */}
      {showSlipModal && (
        <ResultSlip
          student={currentStudent}
          results={studentResults.length > 0 ? studentResults : results.filter(r => r.studentId === currentStudent.id)}
          summary={studentSummary}
          signatures={signatures}
          session={selectedSession}
          semester={selectedSemester}
          onClose={() => setShowSlipModal(false)}
        />
      )}
    </div>
  );
};
