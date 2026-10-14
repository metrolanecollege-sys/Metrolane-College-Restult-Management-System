import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { SignaturePad } from '../common/SignaturePad';
import { 
  CheckSquare, 
  FileSpreadsheet, 
  KeyRound, 
  Clock, 
  Globe, 
  Download, 
  Printer, 
  Search,
  CheckCircle2,
  AlertTriangle,
  PenTool,
  Sparkles,
  TrendingUp,
  Award
} from 'lucide-react';

interface ExamOfficerPortalProps {
  activeTab: string;
  onSelectTab?: (tab: string) => void;
}

export const ExamOfficerPortal: React.FC<ExamOfficerPortalProps> = ({ activeTab, onSelectTab }) => {
  const { currentUser } = useAuth();
  const { 
    results, 
    courses, 
    students, 
    programmes, 
    approveResultScore, 
    publishCourseResults, 
    pins, 
    generatePinsBatch, 
    signatures, 
    saveSignature, 
    settings,
    computeStudentSemesterSummary
  } = useData();

  const currentSection = activeTab || 'dashboard';

  const handleTabChange = (tabId: string) => {
    onSelectTab?.(tabId);
  };

  const [selectedProgramme, setSelectedProgramme] = useState<string>('all');
  const [pinBatchCount, setPinBatchCount] = useState<number>(10);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);

  const examOfficerSig = signatures.find(s => s.role === 'exam_officer');

  // Broadsheet computation
  const filteredStudents = selectedProgramme === 'all'
    ? students
    : students.filter(s => s.programmeCode === selectedProgramme || s.programme === selectedProgramme);

  const pendingPublishResults = results.filter(r => r.status === 'exam_officer_approved');
  const publishedResults = results.filter(r => r.status === 'published');
  const awaitingExamOfficer = results.filter(r => r.status === 'hod_approved');

  // Carryovers list
  const carryoverResults = results.filter(r => r.grade === 'F' || r.isCarryover);

  const handleApproveScore = async (resultId: string) => {
    await approveResultScore(resultId, 'exam_officer', currentUser?.fullName || 'Dr. Folashade Adeyemi');
  };

  const handleBatchApproveCourse = async (courseId: string) => {
    const list = awaitingExamOfficer.filter(r => r.courseId === courseId);
    for (const r of list) {
      await approveResultScore(r.id, 'exam_officer', currentUser?.fullName || 'Dr. Folashade Adeyemi');
    }
  };

  const handlePublishAllApproved = async () => {
    const courseIds = Array.from(new Set(pendingPublishResults.map(r => r.courseId)));
    for (const cId of courseIds) {
      await publishCourseResults(cId, settings.currentSession, settings.currentSemester);
    }
  };

  const handleGeneratePins = async () => {
    await generatePinsBatch(pinBatchCount, settings.currentSession, settings.currentSemester, currentUser?.uid || 'exam_officer_001');
    setPinSuccess(`Successfully generated ${pinBatchCount} authentic student result scratch PINs.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-[#1A1A2E] to-blue-800 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 block mb-1">
            Directorate of Academic Affairs &amp; Examinations
          </span>
          <h2 className="text-xl md:text-2xl font-black">
            Examination Officer Operations &amp; Broadsheets
          </h2>
          <p className="text-xs md:text-sm text-gray-300 mt-1">
            Exam Officer: <strong>{currentUser?.fullName}</strong> • Central Result Publication Directorate
          </p>
        </div>

        <div className="flex gap-3 text-center">
          <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-gray-300 font-bold uppercase block">Ready to Publish</span>
            <span className="text-xl font-black text-amber-300">{pendingPublishResults.length}</span>
          </div>
          <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-gray-300 font-bold uppercase block">Live Published</span>
            <span className="text-xl font-black text-emerald-400">{publishedResults.length}</span>
          </div>
        </div>
      </div>

      {/* Internal Navigation Ribbon */}
      <div className="bg-white p-2 rounded-xl border border-gray-200 overflow-x-auto flex items-center gap-1 text-xs font-bold shadow-xs">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
          { id: 'result_approval', label: 'Vetting & Approval', icon: CheckSquare },
          { id: 'broadsheet', label: 'Broadsheet Generator', icon: FileSpreadsheet },
          { id: 'pins', label: 'Scratch PINs', icon: KeyRound },
          { id: 'carryovers', label: 'Carryover Tracking', icon: Clock },
          { id: 'signatures', label: 'Exam Officer Signature', icon: PenTool },
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = currentSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isSelected ? 'bg-blue-900 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
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
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-blue-600" onClick={() => handleTabChange('result_approval')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Awaiting Final Vetting</span>
              <span className="text-2xl font-black text-amber-600 block mt-1">{awaitingExamOfficer.length}</span>
              <span className="text-xs text-gray-500">Endorsed by HOD</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-blue-600" onClick={() => handleTabChange('result_approval')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Ready for Student Portal</span>
              <span className="text-2xl font-black text-blue-700 block mt-1">{pendingPublishResults.length}</span>
              <span className="text-xs text-blue-600 font-semibold">Approved by Exam Directorate</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-blue-600" onClick={() => handleTabChange('broadsheet')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Published Broadsheet</span>
              <span className="text-2xl font-black text-emerald-700 block mt-1">{publishedResults.length}</span>
              <span className="text-xs text-emerald-600 font-semibold">Active results online</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-blue-600" onClick={() => handleTabChange('pins')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Available Scratch PINs</span>
              <span className="text-2xl font-black text-[#F47B20] block mt-1">{pins.filter(p => !p.isUsed).length}</span>
              <span className="text-xs text-gray-500">{pins.length} total generated</span>
            </div>
          </div>

          {/* Quick Publish Banner */}
          {pendingPublishResults.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-blue-900 text-sm">Release Approved Scores to Students</h4>
                <p className="text-xs text-blue-700">
                  {pendingPublishResults.length} course results are endorsed and ready for publication to the student portal.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePublishAllApproved}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                Publish All Scores Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. SECTION: RESULT VETTING & APPROVAL */}
      {currentSection === 'result_approval' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Action Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="text-xs font-bold text-gray-900">Student Portal Publishing Engine</h4>
                <p className="text-[11px] text-gray-500">
                  Approved scores are released to students with authorized scratch PINs.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePublishAllApproved}
                disabled={pendingPublishResults.length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Globe className="w-3.5 h-3.5" />
                Publish Approved Scores ({pendingPublishResults.length})
              </button>
            </div>
          </div>

          {/* Pending Approval Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xs md:text-sm font-bold text-gray-800 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                Scores Awaiting Institutional Approval ({awaitingExamOfficer.length} Records)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200 font-bold">
                    <th className="py-2.5 px-3">Course</th>
                    <th className="py-2.5 px-3">Matric No</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3 text-center">CA (30)</th>
                    <th className="py-2.5 px-3 text-center">Exam (70)</th>
                    <th className="py-2.5 px-3 text-center">Total</th>
                    <th className="py-2.5 px-3 text-center">Grade</th>
                    <th className="py-2.5 px-3 text-center">HOD Endorsement</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {awaitingExamOfficer.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-400">
                        No scores currently awaiting Examination Officer approval.
                      </td>
                    </tr>
                  ) : (
                    awaitingExamOfficer.map(r => (
                      <tr key={r.id} className="hover:bg-blue-50/20">
                        <td className="py-2.5 px-3 font-bold text-gray-900">{r.courseCode}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-gray-800">{r.matricNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-gray-800">{r.studentName}</td>
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
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            HOD Endorsed ✓
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleApproveScore(r.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md transition"
                          >
                            Approve
                          </button>
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

      {/* 3. SECTION: BROADSHEET GENERATOR */}
      {currentSection === 'broadsheet' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs md:text-sm font-bold text-gray-800">
                Institutional Broadsheet ({settings.currentSession} • {settings.currentSemester})
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-gray-500 uppercase">Programme:</label>
              <select
                value={selectedProgramme}
                onChange={(e) => setSelectedProgramme(e.target.value)}
                className="text-xs font-semibold bg-white border border-gray-300 rounded-lg px-2.5 py-1 outline-none"
              >
                <option value="all">All Programmes</option>
                {programmes.map(p => (
                  <option key={p.id} value={p.code}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200 font-bold">
                  <th className="py-3 px-3">Matric No</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Programme</th>
                  <th className="py-3 px-3 text-center">Registered CU</th>
                  <th className="py-3 px-3 text-center">Quality Points</th>
                  <th className="py-3 px-3 text-center bg-amber-50 text-amber-900">Previous CGPA</th>
                  <th className="py-3 px-3 text-center">Semester GPA</th>
                  <th className="py-3 px-3 text-center bg-purple-50 text-purple-900">Current CGPA</th>
                  <th className="py-3 px-3 text-center">Standing</th>
                  <th className="py-3 px-3 text-center">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredStudents.map((std) => {
                  const summary = computeStudentSemesterSummary(std.id, settings.currentSession, settings.currentSemester);
                  return (
                    <tr key={std.id} className="hover:bg-blue-50/20 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-gray-900">{std.matricNumber}</td>
                      <td className="py-2.5 px-3 font-semibold text-gray-800">{std.firstName} {std.lastName}</td>
                      <td className="py-2.5 px-3 text-gray-600">{std.programme}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-gray-800">{summary.totalCreditUnits}</td>
                      <td className="py-2.5 px-3 text-center text-gray-700">{summary.totalQualityPoints.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center font-black text-amber-900 bg-amber-50/30">
                        {summary.previousCgpaText || (summary.previousCgpa ? summary.previousCgpa.toFixed(2) : 'N/A')}
                      </td>
                      <td className="py-2.5 px-3 text-center font-black text-blue-600 text-sm">
                        {summary.gpa.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-black text-[#5B4FC4] text-sm bg-purple-50/30">
                        {summary.cgpa.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          summary.remark === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                        }`}>
                          {summary.remark === 'Pass' ? 'Good Standing' : summary.remark}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-gray-700">
                        {summary.classification}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SECTION: SCRATCH PIN MANAGEMENT */}
      {currentSection === 'pins' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#F47B20]" />
                Result Checking Scratch PIN Management ({pins.length} PINs)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Generate batch scratch PINs for students to check their official semester results.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="50"
                value={pinBatchCount}
                onChange={(e) => setPinBatchCount(Number(e.target.value) || 5)}
                className="w-18 py-1.5 px-2 text-xs font-bold border border-gray-300 rounded-lg text-center"
              />
              <button
                type="button"
                onClick={handleGeneratePins}
                className="px-4 py-1.5 bg-[#F47B20] hover:bg-[#E8601C] text-white text-xs font-bold rounded-lg shadow-xs transition"
              >
                Generate Batch PINs
              </button>
            </div>
          </div>

          {pinSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
              <span>{pinSuccess}</span>
              <button onClick={() => setPinSuccess(null)} className="font-bold">✕</button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider border-b border-gray-200 font-bold">
                  <th className="py-2 px-3">Serial No</th>
                  <th className="py-2 px-3">Scratch PIN</th>
                  <th className="py-2 px-3">Session</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3">Redeemed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pins.map(pin => (
                  <tr key={pin.id}>
                    <td className="py-2 px-3 font-mono text-gray-500 font-bold">{pin.serialNumber}</td>
                    <td className="py-2 px-3 font-mono font-bold text-gray-800 tracking-wider">{pin.pin}</td>
                    <td className="py-2 px-3 text-gray-600">{pin.session} ({pin.semester})</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        pin.isUsed ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {pin.isUsed ? 'Used' : 'Active / Unused'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-600 font-mono">
                      {pin.studentMatric || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. SECTION: CARRYOVER TRACKING */}
      {currentSection === 'carryovers' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs md:text-sm font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-600" />
                Carryover Courses &amp; Academic Probation Register
              </h3>
              <p className="text-[11px] text-gray-500">
                Students with scores below 45 marks (F grade) must re-register courses in the following session.
              </p>
            </div>
            <span className="text-xs font-bold text-red-600">
              {carryoverResults.length} Carryover Courses Recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200 font-bold">
                  <th className="py-2.5 px-3">Matric No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Failed Course</th>
                  <th className="py-2.5 px-3 text-center">Credit Unit</th>
                  <th className="py-2.5 px-3 text-center">Score (100)</th>
                  <th className="py-2.5 px-3 text-center">Grade</th>
                  <th className="py-2.5 px-3 text-center">Academic Standing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {carryoverResults.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      Excellent performance: No students currently on carryover or probation.
                    </td>
                  </tr>
                ) : (
                  carryoverResults.map(r => (
                    <tr key={r.id} className="hover:bg-red-50/20">
                      <td className="py-2.5 px-3 font-mono font-bold text-red-700">{r.matricNumber}</td>
                      <td className="py-2.5 px-3 font-bold text-gray-800">{r.studentName}</td>
                      <td className="py-2.5 px-3 font-bold text-gray-900">{r.courseCode} — {r.courseTitle}</td>
                      <td className="py-2.5 px-3 text-center font-bold">{r.creditUnit}</td>
                      <td className="py-2.5 px-3 text-center font-black text-red-600">{r.totalScore}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-red-100 text-red-700 font-bold">
                          {r.grade}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                          Carryover Req.
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. SECTION: EXAM OFFICER SIGNATURE */}
      {currentSection === 'signatures' && (
        <div className="space-y-4 animate-in fade-in">
          <SignaturePad
            title="Examination Officer Official Digital Signature"
            initialSignature={examOfficerSig?.signatureImage}
            onSave={(dataUrl) => {
              saveSignature('exam_officer', currentUser?.fullName || 'Dr. Folashade Adeyemi', 'Examination Officer', dataUrl, currentUser?.uid || 'exam_officer_001');
            }}
          />
        </div>
      )}
    </div>
  );
};
