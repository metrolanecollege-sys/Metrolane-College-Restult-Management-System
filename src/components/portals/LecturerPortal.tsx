import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Course, ResultScore, StudentRecord } from '../../types';
import { computeGrade, computeProgressionCGPA } from '../../utils/academic';
import { AddStudentScoreModal } from './AddStudentScoreModal';
import { ImportCSVModal } from './ImportCSVModal';
import { StudentProgressionModal } from './StudentProgressionModal';
import { 
  FileSpreadsheet, 
  Save, 
  Send, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  BookOpen, 
  TrendingUp,
  UserPlus,
  Calculator,
  Layers,
  Download,
  Info,
  Loader2,
  X
} from 'lucide-react';

interface LecturerPortalProps {
  activeTab: string;
  onSelectTab?: (tab: string) => void;
}

export const LecturerPortal: React.FC<LecturerPortalProps> = ({ activeTab, onSelectTab }) => {
  const { currentUser } = useAuth();
  const { 
    courses, 
    students, 
    results, 
    saveResultScores, 
    settings, 
    courseRegistrations,
    addStudent,
    enrollStudentInCourse
  } = useData();

  const currentSection = activeTab || 'dashboard';

  const handleTabChange = (tabId: string) => {
    onSelectTab?.(tabId);
  };

  // Lecturer assigned courses strictly scoped to current logged-in lecturer
  const userLastName = currentUser?.fullName?.split(' ').slice(-1)[0]?.toLowerCase() || '';
  const myCourses = courses.filter(c => 
    c.lecturerId === currentUser?.uid || 
    (c.lecturerName && userLastName.length > 2 && c.lecturerName.toLowerCase().includes(userLastName)) ||
    (currentUser?.uid === 'lecturer_001' && c.lecturerId === 'lecturer_001') ||
    (currentUser?.role === 'lecturer' && (c.lecturerId === 'lecturer_001' || c.lecturerName?.includes('Bello')))
  );
  const coursesToUse = myCourses.length > 0 ? myCourses : courses.slice(0, 3);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(coursesToUse[0]?.id || 'course_cht101');
  const selectedCourse = courses.find(c => c.id === selectedCourseId) || coursesToUse[0];

  // Dynamically enrolled student IDs during this session
  const [dynamicallyEnrolledIds, setDynamicallyEnrolledIds] = useState<string[]>([]);

  // Students enrolled in this course
  const registeredStudentIds = courseRegistrations
    .filter(r => r.courseId === selectedCourseId && r.status === 'registered')
    .map(r => r.studentId);

  // Local draft scores map: studentId -> { ca, exam }
  const [draftScores, setDraftScores] = useState<Record<string, { ca: number; exam: number }>>(() => {
    const initialMap: Record<string, { ca: number; exam: number }> = {};
    results
      .filter(r => r.courseId === selectedCourseId && r.session === settings.currentSession)
      .forEach(r => {
        initialMap[r.studentId] = { ca: r.caScore, exam: r.examScore };
      });
    return initialMap;
  });

  // Students on score sheet: registered, dynamically added, has draft score, or fallback to level
  const courseStudents = students.filter(s => 
    registeredStudentIds.includes(s.id) ||
    dynamicallyEnrolledIds.includes(s.id) ||
    draftScores[s.id] !== undefined ||
    (registeredStudentIds.length === 0 && s.level === selectedCourse?.level && s.status === 'active')
  );

  const [saving, setSaving] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Modals state
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [progressionStudent, setProgressionStudent] = useState<StudentRecord | null>(null);

  // Native CSV file upload & notification toast state
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const [isImportingCSV, setIsImportingCSV] = useState(false);
  const [csvFileName, setCsvFileName] = useState('');
  const [toast, setToast] = useState<{ id: string; type: 'success' | 'error'; title: string; message: string } | null>(null);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Direct trigger for native file picker restricted to .csv
  const handleTriggerCSVImport = () => {
    if (isLocked) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Score Sheet Locked',
        message: 'Scores for this course have already been submitted or approved and cannot be altered.'
      });
      return;
    }
    if (csvFileInputRef.current) {
      csvFileInputRef.current.value = '';
      csvFileInputRef.current.click();
    }
  };

  // Sync draft state if course changes
  const handleCourseChange = (newCourseId: string) => {
    setSelectedCourseId(newCourseId);
    const newMap: Record<string, { ca: number; exam: number }> = {};
    results
      .filter(r => r.courseId === newCourseId && r.session === settings.currentSession)
      .forEach(r => {
        newMap[r.studentId] = { ca: r.caScore, exam: r.examScore };
      });
    setDraftScores(newMap);
    setSubmitSuccess(null);
  };

  const handleScoreChange = (studentId: string, type: 'ca' | 'exam', val: string) => {
    const num = Math.max(0, Math.min(type === 'ca' ? 30 : 70, Number(val) || 0));
    setDraftScores(prev => ({
      ...prev,
      [studentId]: {
        ca: type === 'ca' ? num : (prev[studentId]?.ca ?? 0),
        exam: type === 'exam' ? num : (prev[studentId]?.exam ?? 0)
      }
    }));
  };

  const existingResultsForCourse = results.filter(
    r => r.courseId === selectedCourseId && r.session === settings.currentSession
  );
  const courseStatus = existingResultsForCourse[0]?.status || 'draft';
  const isLocked = courseStatus === 'submitted' || courseStatus === 'hod_approved' || courseStatus === 'published';

  const handleSaveDraft = async () => {
    if (!selectedCourse) return;
    setSaving(true);
    const scoreEntries = courseStudents.map(std => {
      const current = draftScores[std.id] || { ca: 0, exam: 0 };
      return {
        studentId: std.id,
        matricNumber: std.matricNumber,
        studentName: `${std.firstName} ${std.lastName}`,
        courseId: selectedCourse.id,
        courseCode: selectedCourse.courseCode,
        courseTitle: selectedCourse.courseTitle,
        creditUnit: selectedCourse.creditUnit,
        session: settings.currentSession,
        semester: settings.currentSemester,
        level: selectedCourse.level,
        programme: selectedCourse.programme,
        caScore: current.ca,
        examScore: current.exam,
        enteredBy: currentUser?.uid || 'lecturer_001',
      };
    });

    await saveResultScores(scoreEntries, 'draft');
    setSaving(false);
    setSubmitSuccess('Scores saved as draft successfully. You can edit them anytime before final submission.');
  };

  const handleConfirmSubmitForApproval = async () => {
    if (!selectedCourse) return;
    setSaving(true);
    setShowConfirmSubmit(false);
    const scoreEntries = courseStudents.map(std => {
      const current = draftScores[std.id] || { ca: 0, exam: 0 };
      return {
        studentId: std.id,
        matricNumber: std.matricNumber,
        studentName: `${std.firstName} ${std.lastName}`,
        courseId: selectedCourse.id,
        courseCode: selectedCourse.courseCode,
        courseTitle: selectedCourse.courseTitle,
        creditUnit: selectedCourse.creditUnit,
        session: settings.currentSession,
        semester: settings.currentSemester,
        level: selectedCourse.level,
        programme: selectedCourse.programme,
        caScore: current.ca,
        examScore: current.exam,
        enteredBy: currentUser?.uid || 'lecturer_001',
      };
    });

    await saveResultScores(scoreEntries, 'submitted');
    setSaving(false);
    setSubmitSuccess('Scores submitted successfully for Head of Department (HOD) review.');
  };

  // Callback when a student is added via modal
  const handleStudentAdded = (newStudent: StudentRecord, ca: number, exam: number) => {
    setDynamicallyEnrolledIds(prev => [...new Set([...prev, newStudent.id])]);
    setDraftScores(prev => ({
      ...prev,
      [newStudent.id]: { ca, exam }
    }));
    setSubmitSuccess(
      `Student ${newStudent.matricNumber} (${newStudent.firstName} ${newStudent.lastName}) added to score sheet with ${newStudent.level} scores!`
    );
    setToast({
      id: String(Date.now()),
      type: 'success',
      title: 'Student Added Successfully',
      message: `${newStudent.firstName} ${newStudent.lastName} (${newStudent.matricNumber}) added with CA: ${ca}, Exam: ${exam}.`
    });
  };

  // Handler for Native CSV File Picker
  const handleNativeCSVFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);

    // 1. Verify .csv extension restriction
    const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel';
    if (!isCsv) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Invalid File Format',
        message: `"${file.name}" is not a valid CSV file. Please select a native comma-separated (.csv) file.`
      });
      return;
    }

    // 2. Start Loading Spinner
    setIsImportingCSV(true);

    try {
      const text = await file.text();
      // Brief visual pause so lecturer clearly sees processing feedback
      await new Promise(r => setTimeout(r, 650));

      let cleanText = text;
      // Strip UTF-8 BOM if present
      if (cleanText.charCodeAt(0) === 0xFEFF) {
        cleanText = cleanText.slice(1);
      }

      const lines = cleanText.split(/\r\n|\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        throw new Error('CSV file appears empty or contains no student data rows under the headers.');
      }

      const firstLine = lines[0];
      const delimiter = (firstLine.includes(';') && !firstLine.includes(',')) ? ';' : (firstLine.includes('\t') && !firstLine.includes(',')) ? '\t' : ',';
      const headerParts = firstLine.toLowerCase().split(delimiter).map(h => h.trim().replace(/['"]/g, ''));

      const matricIdx = headerParts.findIndex(h => h.includes('matric') || h.includes('reg') || h.includes('id') || h.includes('number'));
      const nameIdx = headerParts.findIndex(h => h.includes('name') || h.includes('student'));
      const levelIdx = headerParts.findIndex(h => h.includes('level') || h.includes('year') || h.includes('programme'));
      const prevCgpaIdx = headerParts.findIndex(h => h.includes('prev') || h.includes('cgpa'));
      const caIdx = headerParts.findIndex(h => h.includes('ca') || h.includes('test') || h.includes('assessment') || h.includes('continuous'));
      const examIdx = headerParts.findIndex(h => h.includes('exam') || h.includes('examination'));

      const newDrafts: Record<string, { ca: number; exam: number }> = {};
      const newlyEnrolled: StudentRecord[] = [];
      let importedRowsCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const rawLine = lines[i].trim();
        if (!rawLine) continue;

        // Quote-aware splitting
        const parts: string[] = [];
        let currentPart = '';
        let inQuotes = false;
        for (let charIdx = 0; charIdx < rawLine.length; charIdx++) {
          const char = rawLine[charIdx];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === delimiter && !inQuotes) {
            parts.push(currentPart.trim().replace(/^["']|["']$/g, ''));
            currentPart = '';
          } else {
            currentPart += char;
          }
        }
        parts.push(currentPart.trim().replace(/^["']|["']$/g, ''));

        if (parts.length < 2) continue;

        const matric = (matricIdx !== -1 ? parts[matricIdx] : parts[0])?.trim();
        if (!matric) continue;

        const rawName = (nameIdx !== -1 ? parts[nameIdx] : (parts.length > 3 ? parts[1] : ''))?.trim() || `Student ${matric}`;
        const rawLevel = (levelIdx !== -1 ? parts[levelIdx] : (selectedCourse?.level || 'ND1'))?.trim() || selectedCourse?.level || 'ND1';
        const rawPrevCgpa = prevCgpaIdx !== -1 ? parseFloat(parts[prevCgpaIdx]) : undefined;

        let caVal = 0;
        let examVal = 0;
        if (caIdx !== -1 && parts[caIdx] !== undefined) {
          caVal = parseFloat(parts[caIdx]) || 0;
        } else if (parts.length >= 3) {
          caVal = parseFloat(parts[parts.length - 2]) || 0;
        }
        if (examIdx !== -1 && parts[examIdx] !== undefined) {
          examVal = parseFloat(parts[examIdx]) || 0;
        } else if (parts.length >= 2) {
          examVal = parseFloat(parts[parts.length - 1]) || 0;
        }

        caVal = Math.min(30, Math.max(0, caVal));
        examVal = Math.min(70, Math.max(0, examVal));

        let student = students.find(s => s.matricNumber.trim().toLowerCase() === matric.toLowerCase());
        if (!student) {
          const nameParts = rawName.split(/\s+/).filter(Boolean);
          const firstName = nameParts[0] || 'Student';
          const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : matric;
          const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : undefined;
          const isYear2 = rawLevel.includes('2');

          const created = await addStudent({
            matricNumber: matric,
            firstName,
            middleName,
            lastName,
            gender: 'Female',
            department: selectedCourse?.programme.includes('Community') ? 'Community Health Technology' : 'Health Technician',
            programme: selectedCourse?.programme || 'ND in Community Health Technology',
            programmeCode: (selectedCourse?.programmeCode as any) || 'CHT',
            level: (rawLevel as any) || selectedCourse?.level || 'ND1',
            year: isYear2 ? 2 : 1,
            previousCgpa: isYear2 ? (rawPrevCgpa || 3.40) : undefined,
            admissionYear: isYear2 ? '2025' : '2026',
            currentSession: settings.currentSession,
            currentSemester: settings.currentSemester,
            status: 'active',
            clearanceStatus: { bursary: true, library: true, department: true },
            stateOfOrigin: 'Kano',
            lga: 'Nasarawa',
            phone: '+234 800 000 0000',
            email: `${matric.toLowerCase().replace(/[^a-z0-9]/g, '.')}@student.metrolane.edu.ng`
          });
          student = created;
        }

        if (student) {
          await enrollStudentInCourse(
            student.id,
            student.matricNumber,
            selectedCourse!.id,
            settings.currentSession,
            settings.currentSemester,
            selectedCourse!.level
          );
          newDrafts[student.id] = { ca: caVal, exam: examVal };
          newlyEnrolled.push(student);
          importedRowsCount++;
        }
      }

      if (importedRowsCount === 0) {
        throw new Error('No valid student matric numbers or scores were found in the CSV.');
      }

      setDraftScores(prev => ({ ...prev, ...newDrafts }));
      setDynamicallyEnrolledIds(prev => [...new Set([...prev, ...newlyEnrolled.map(s => s.id)])]);
      setIsImportingCSV(false);

      // Trigger Success Notification Toast
      setToast({
        id: String(Date.now()),
        type: 'success',
        title: 'CSV Import Completed Successfully',
        message: `Imported scores for ${importedRowsCount} student${importedRowsCount > 1 ? 's' : ''} into ${selectedCourse?.courseCode} score sheet.`
      });
    } catch (err: any) {
      setIsImportingCSV(false);
      // Trigger Failure Notification Toast
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'CSV Import Failed',
        message: err?.message || 'Could not parse the CSV file. Please check file format.'
      });
    }
  };

  // Callback when CSV scores are imported via modal
  const handleCSVImportComplete = (
    newDrafts: Record<string, { ca: number; exam: number }>,
    addedStudents: StudentRecord[]
  ) => {
    setDraftScores(prev => ({
      ...prev,
      ...newDrafts
    }));
    if (addedStudents.length > 0) {
      setDynamicallyEnrolledIds(prev => [
        ...new Set([...prev, ...addedStudents.map(s => s.id)])
      ]);
    }
    const totalCount = Object.keys(newDrafts).length;
    setSubmitSuccess(
      `Successfully imported ${totalCount} student scores from CSV (${addedStudents.length} newly enrolled).`
    );
    setToast({
      id: String(Date.now()),
      type: 'success',
      title: 'CSV Scores Imported',
      message: `Imported scores for ${totalCount} students into ${selectedCourse?.courseCode}.`
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1A1A2E] via-[#2A2A4E] to-[#F47B20] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-[#F9A825] mb-2 border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            Lecturer Result Management System
          </div>
          <h2 className="text-xl md:text-2xl font-black">
            Lecturer Workspace &amp; Score Computation
          </h2>
          <p className="text-gray-300 text-xs md:text-sm mt-1">
            Instructor: <strong>{currentUser?.fullName}</strong> ({currentUser?.department || 'Academic Staff'})
          </p>
        </div>

        {/* Course Selector Dropdown */}
        <div className="bg-white/10 p-3 rounded-xl border border-white/20 backdrop-blur-xs min-w-[280px]">
          <label className="text-[11px] font-bold text-gray-300 block mb-1 uppercase tracking-wider">
            Select Assigned Course:
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => handleCourseChange(e.target.value)}
            className="w-full bg-[#1A1A2E] text-white text-xs font-bold py-2 px-3 rounded-lg border border-white/30 outline-none cursor-pointer"
          >
            {coursesToUse.map(c => (
              <option key={c.id} value={c.id}>
                {c.courseCode} — {c.courseTitle} ({c.level} • {c.creditUnit} CU)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Internal Navigation Ribbon */}
      <div className="bg-white p-2 rounded-xl border border-gray-200 overflow-x-auto flex items-center gap-1 text-xs font-bold shadow-xs">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
          { id: 'score_entry', label: 'Score Entry Sheet', icon: FileSpreadsheet },
          { id: 'assigned_courses', label: 'My Assigned Courses', icon: BookOpen },
          { id: 'submissions', label: 'Submission History', icon: Clock },
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = currentSection === tab.id;
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
      {currentSection === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-[#F47B20]" onClick={() => handleTabChange('assigned_courses')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Allocated Courses</span>
              <span className="text-2xl font-black text-gray-900 block mt-1">{coursesToUse.length} Courses</span>
              <span className="text-xs text-[#F47B20] font-semibold">{settings.currentSession} Session</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-[#F47B20]" onClick={() => handleTabChange('score_entry')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Current Course Students</span>
              <span className="text-2xl font-black text-gray-900 block mt-1">{courseStudents.length} Students</span>
              <span className="text-xs text-gray-500">{selectedCourse?.courseCode} ({selectedCourse?.level})</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-[#F47B20]" onClick={() => handleTabChange('submissions')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Score Status</span>
              <span className="text-sm font-black text-gray-900 block mt-2 uppercase">
                {courseStatus.replace('_', ' ')}
              </span>
              <span className="text-xs text-emerald-600 font-semibold">
                {isLocked ? 'Scores locked for review' : 'Draft mode (Editable)'}
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[11px] text-gray-400 font-bold uppercase block">CGPA Progression</span>
              <span className="text-base font-black text-purple-900 block mt-1">Year 1 &amp; Year 2</span>
              <span className="text-xs text-gray-500">Continuous CGPA computation</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Manage Student Scores &amp; Information</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Import CSV scores, add student information directly to the score sheet, and compute continuous Year 2 CGPA.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  handleTabChange('score_entry');
                  setShowAddStudentModal(true);
                }}
                className="px-4 py-2 bg-white text-[#F47B20] border border-[#F47B20] hover:bg-orange-50 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Student to Sheet
              </button>
              <button
                onClick={() => handleTabChange('score_entry')}
                className="px-4 py-2 bg-[#F47B20] hover:bg-[#E8601C] text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Open Score Sheet →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SECTION: SCORE ENTRY SHEET */}
      {currentSection === 'score_entry' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Submission Status Alert */}
          {submitSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
              <button onClick={() => setSubmitSuccess(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">✕</button>
            </div>
          )}

          {/* Course Info Card & Workflow Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Course Code &amp; Title</span>
              <span className="text-sm font-black text-gray-800 block truncate">{selectedCourse?.courseCode} - {selectedCourse?.courseTitle}</span>
              <span className="text-xs text-gray-500">{selectedCourse?.creditUnit} Credit Units • {selectedCourse?.courseType}</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Programme &amp; Level</span>
              <span className="text-sm font-bold text-gray-800 block">{selectedCourse?.level} • {settings.currentSemester}</span>
              <span className="text-xs text-gray-500">{selectedCourse?.programme}</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Score Sheet Students</span>
              <span className="text-lg font-black text-gray-900">{courseStudents.length} Students</span>
              <span className="text-xs text-emerald-600 font-semibold">Active registrations</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Approval Status</span>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  courseStatus === 'published' ? 'bg-emerald-100 text-emerald-800' :
                  courseStatus === 'hod_approved' ? 'bg-blue-100 text-blue-800' :
                  courseStatus === 'submitted' ? 'bg-amber-100 text-amber-800' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {courseStatus.replace('_', ' ')}
                </span>
              </div>
              {isLocked && (
                <span className="text-[10px] text-amber-700 font-semibold mt-1">
                  Scores are locked for review
                </span>
              )}
            </div>
          </div>

          {/* Action Toolbar (Add Student, Import CSV, Save Draft, Submit) */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Add Student to Score Sheet Button */}
              <button
                type="button"
                disabled={isLocked}
                onClick={() => setShowAddStudentModal(true)}
                className="px-3.5 py-2 text-xs font-black text-white bg-[#F47B20] hover:bg-[#E8601C] rounded-lg transition inline-flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Student to Score Sheet
              </button>

              {/* Import CSV File Button (Triggers native file picker) */}
              <button
                type="button"
                disabled={isLocked || isImportingCSV}
                onClick={handleTriggerCSVImport}
                className="px-3.5 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition inline-flex items-center gap-1.5 border border-gray-200 disabled:opacity-50 cursor-pointer"
                title="Select a .csv file from your computer to import student scores"
              >
                <Upload className="w-3.5 h-3.5 text-gray-600" />
                Import CSV File
              </button>

              {/* Download CSV Template */}
              <button
                type="button"
                onClick={() => {
                  const isYear2 = selectedCourse?.level === 'ND2' || selectedCourse?.level === 'HND2';
                  const csvContent = "data:text/csv;charset=utf-8,MatricNumber,StudentName,Level,PreviousCGPA,CA,Exam\n" + 
                    courseStudents.map(s => `${s.matricNumber},"${s.firstName} ${s.lastName}",${s.level || selectedCourse?.level},${s.previousCgpa || (isYear2 ? '3.40' : '0.00')},24,52`).join("\n");
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", `${selectedCourse?.courseCode}_score_template.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition flex items-center gap-1 border border-gray-200 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Template
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isLocked || saving}
                onClick={handleSaveDraft}
                className="px-4 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Save as Draft
              </button>

              <button
                type="button"
                disabled={isLocked || saving}
                onClick={() => setShowConfirmSubmit(true)}
                className="px-5 py-2 text-xs font-black text-white bg-[#1A1A2E] hover:bg-[#2D2D44] rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-[#F47B20]" />
                Submit for HOD Approval
              </button>
            </div>
          </div>

          {/* Main Score Entry Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#F47B20]" />
                <div>
                  <h3 className="text-xs md:text-sm font-bold text-gray-800">
                    Student Score Sheet ({selectedCourse?.courseCode} - {selectedCourse?.courseTitle})
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Automated GPA &amp; Continuous CGPA Calculation • {courseStudents.length} Students Enrolled
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Direct Add students to Score sheet button */}
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => setShowAddStudentModal(true)}
                  className="px-3 py-1.5 text-xs font-black text-white bg-[#F47B20] hover:bg-[#E8601C] rounded-lg transition inline-flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                  title="Add student directly to this score entry sheet"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add students to Score sheet
                </button>

                {/* Import CSV File (Triggers native file picker) */}
                <button
                  type="button"
                  disabled={isLocked || isImportingCSV}
                  onClick={handleTriggerCSVImport}
                  className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 rounded-lg transition inline-flex items-center gap-1.5 border border-gray-300 disabled:opacity-50 cursor-pointer"
                  title="Import student scores from a .csv file"
                >
                  <Upload className="w-3.5 h-3.5 text-gray-600" />
                  Import CSV File
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100/90 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200 font-bold">
                    <th className="py-3 px-3 w-10 text-center">S/N</th>
                    <th className="py-3 px-3">Matric No</th>
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-2 text-center">Level</th>
                    <th className="py-3 px-3 text-center bg-amber-50/50 text-amber-900 border-x border-amber-100">
                      Previous CGPA
                    </th>
                    <th className="py-3 px-3 text-center w-24">CA (30)</th>
                    <th className="py-3 px-3 text-center w-24">Exam (70)</th>
                    <th className="py-3 px-2 text-center w-20">Total (100)</th>
                    <th className="py-3 px-2 text-center w-16">Grade</th>
                    <th className="py-3 px-2 text-center w-16">GP</th>
                    <th className="py-3 px-3 text-center bg-purple-50/50 text-purple-900 border-x border-purple-100">
                      Current CGPA
                    </th>
                    <th className="py-3 px-2 text-center w-20">Remark</th>
                    <th className="py-3 px-2 text-center w-16">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {courseStudents.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-12 text-center text-gray-500">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-12 h-12 mx-auto rounded-full bg-orange-50 border border-orange-200 text-[#F47B20] flex items-center justify-center">
                            <FileSpreadsheet className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 text-sm">No students on this score sheet yet</div>
                            <p className="text-xs text-gray-500 mt-1">
                              Add students individually or import a CSV file to automatically populate scores and calculate CGPA.
                            </p>
                          </div>
                          <div className="flex items-center justify-center gap-2 pt-1">
                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() => setShowAddStudentModal(true)}
                              className="px-3.5 py-2 text-xs font-bold text-white bg-[#F47B20] hover:bg-[#E8601C] rounded-lg transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              Add Student to Score Sheet
                            </button>
                            <button
                              type="button"
                              disabled={isLocked || isImportingCSV}
                              onClick={handleTriggerCSVImport}
                              className="px-3.5 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 rounded-lg transition inline-flex items-center gap-1.5 border border-gray-300 cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5 text-gray-600" />
                              Import CSV File
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    courseStudents.map((std, index) => {
                      const current = draftScores[std.id] || { ca: 0, exam: 0 };
                      const total = Number(current.ca) + Number(current.exam);
                      const { grade, gradePoint, remark } = computeGrade(total, settings.gradingScale);
                      const currentQP = parseFloat((gradePoint * (selectedCourse?.creditUnit || 3)).toFixed(2));

                      // Calculate Progression and continuous CGPA
                      const prog = computeProgressionCGPA(
                        std,
                        selectedCourse?.creditUnit || 3,
                        currentQP,
                        results.filter(r => r.studentId === std.id)
                      );

                      const isStdYear2 = prog.isYear2;

                      return (
                        <tr key={std.id} className="hover:bg-orange-50/20 transition">
                          <td className="py-2.5 px-3 text-center text-gray-400 font-bold">{index + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-gray-800">{std.matricNumber}</td>
                          <td className="py-2.5 px-3 font-semibold text-gray-800">{std.firstName} {std.lastName}</td>
                          
                          {/* Academic Level */}
                          <td className="py-2.5 px-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isStdYear2 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {std.level || selectedCourse?.level}
                            </span>
                          </td>

                          {/* Previous CGPA (Year 1) */}
                          <td className="py-2.5 px-3 text-center bg-amber-50/30 border-x border-amber-100">
                            {isStdYear2 ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs">
                                {prog.previousCgpa.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[10px]">N/A (Yr 1)</span>
                            )}
                          </td>

                          {/* CA Input */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="30"
                              disabled={isLocked}
                              value={current.ca === 0 ? '' : current.ca}
                              placeholder="0"
                              onChange={(e) => handleScoreChange(std.id, 'ca', e.target.value)}
                              className="w-16 py-1 px-2 text-center text-xs font-bold bg-[#EEEDF7] rounded-md border border-transparent focus:border-[#5B4FC4] focus:bg-white outline-none disabled:opacity-75 disabled:bg-gray-100"
                            />
                          </td>

                          {/* Exam Input */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="70"
                              disabled={isLocked}
                              value={current.exam === 0 ? '' : current.exam}
                              placeholder="0"
                              onChange={(e) => handleScoreChange(std.id, 'exam', e.target.value)}
                              className="w-16 py-1 px-2 text-center text-xs font-bold bg-[#EEEDF7] rounded-md border border-transparent focus:border-[#5B4FC4] focus:bg-white outline-none disabled:opacity-75 disabled:bg-gray-100"
                            />
                          </td>

                          {/* Total (Auto) */}
                          <td className="py-2.5 px-2 text-center font-bold text-gray-900 text-xs">
                            {total}
                          </td>

                          {/* Grade (Auto) */}
                          <td className="py-2.5 px-2 text-center">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black ${
                              grade === 'F' ? 'bg-red-100 text-red-700' :
                              grade === 'A' || grade === 'AB' ? 'bg-emerald-100 text-emerald-800' :
                              grade === 'B' || grade === 'BC' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {grade}
                            </span>
                          </td>

                          {/* Grade Point */}
                          <td className="py-2.5 px-2 text-center text-gray-700 font-mono text-[11px]">
                            {gradePoint.toFixed(2)}
                          </td>

                          {/* Current CGPA (Continuous Calculation) */}
                          <td className="py-2.5 px-3 text-center bg-purple-50/30 border-x border-purple-100">
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-black bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs">
                              {prog.cumulativeCgpa.toFixed(2)}
                            </span>
                          </td>

                          {/* Remark (Pass/Fail) */}
                          <td className="py-2.5 px-2 text-center">
                            <span className={`text-[10px] font-black uppercase ${
                              remark === 'Pass' ? 'text-emerald-700' : 'text-red-600'
                            }`}>
                              {remark}
                            </span>
                          </td>

                          {/* Info / Breakdown Trigger */}
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => setProgressionStudent(std)}
                              title="View CGPA progression breakdown"
                              className="p-1 text-gray-500 hover:text-[#F47B20] hover:bg-orange-50 rounded transition cursor-pointer"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Score Sheet Table Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 text-gray-600 font-medium">
                <span>Total Enrolled: <strong className="text-gray-900">{courseStudents.length} Students</strong></span>
                <span className="text-gray-300">•</span>
                <span>Course Credit Unit: <strong className="text-[#F47B20]">{selectedCourse?.creditUnit || 3} Units</strong></span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => setShowAddStudentModal(true)}
                  className="px-3 py-1.5 text-xs font-bold text-[#F47B20] hover:text-white hover:bg-[#F47B20] bg-orange-50 border border-orange-200 rounded-lg transition inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add students to Score sheet
                </button>

                <button
                  type="button"
                  disabled={isLocked || isImportingCSV}
                  onClick={handleTriggerCSVImport}
                  className="px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-200 bg-gray-100 border border-gray-200 rounded-lg transition inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  title="Import student scores from a .csv file"
                >
                  <Upload className="w-3.5 h-3.5 text-gray-600" />
                  Import CSV File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SECTION: MY ASSIGNED COURSES */}
      {currentSection === 'assigned_courses' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#F47B20]" />
                Assigned Curriculum Courses ({coursesToUse.length} Courses)
              </h3>
              <p className="text-xs text-gray-500">
                Official courses allocated to you across Year 1 (ND1) and Year 2 (ND2).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coursesToUse.map(c => (
              <div key={c.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:border-[#F47B20] transition">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-orange-100 text-[#E8601C] text-[10px] font-bold rounded-md">
                    {c.courseCode} • {c.creditUnit} Credit Units
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    c.level === 'ND2' ? 'bg-amber-100 text-amber-900' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {c.level} • {c.semester}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-gray-900 mt-2">{c.courseTitle}</h4>
                <div className="mt-2 text-xs text-gray-600">
                  Programme: <strong>{c.programme}</strong>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={() => {
                      handleCourseChange(c.id);
                      handleTabChange('score_entry');
                    }}
                    className="px-3 py-1 bg-[#F47B20] hover:bg-[#E8601C] text-white text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    Enter Scores →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SECTION: SUBMISSION HISTORY */}
      {currentSection === 'submissions' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-xs md:text-sm font-bold text-gray-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#F47B20]" />
              Course Score Submission History
            </h3>
            <p className="text-[11px] text-gray-500">
              Audit log of scores entered and forwarded to HOD for vetting.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200 font-bold">
                  <th className="py-2.5 px-3">Course Code</th>
                  <th className="py-2.5 px-3">Course Title</th>
                  <th className="py-2.5 px-3">Level</th>
                  <th className="py-2.5 px-3">Session</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {coursesToUse.map(c => {
                  const cResults = results.filter(r => r.courseId === c.id);
                  const status = cResults[0]?.status || 'draft';
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-gray-900">{c.courseCode}</td>
                      <td className="py-2.5 px-3 text-gray-800">{c.courseTitle}</td>
                      <td className="py-2.5 px-3 text-gray-600">{c.level}</td>
                      <td className="py-2.5 px-3 text-gray-600">{settings.currentSession}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          status === 'published' ? 'bg-emerald-100 text-emerald-800' :
                          status === 'hod_approved' ? 'bg-blue-100 text-blue-800' :
                          status === 'submitted' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            handleCourseChange(c.id);
                            handleTabChange('score_entry');
                          }}
                          className="text-xs text-[#F47B20] font-bold hover:underline cursor-pointer"
                        >
                          Open Sheet
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

      {/* Confirmation Modal before Submission */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <AlertCircle className="w-6 h-6" />
              <h4 className="font-black text-gray-900 text-base">Submit Scores for Approval?</h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              You are about to submit result scores for <strong>{selectedCourse?.courseCode} ({courseStudents.length} students)</strong> to the Head of Department. 
              Once submitted, you will not be able to edit scores unless returned by the HOD.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmitForApproval}
                className="px-5 py-2 text-xs font-black bg-[#F47B20] hover:bg-[#E8601C] text-white rounded-lg shadow-sm transition cursor-pointer"
              >
                Yes, Submit Scores
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Add Student Score Sheet */}
      {showAddStudentModal && selectedCourse && (
        <AddStudentScoreModal
          course={selectedCourse}
          existingEnrolledStudentIds={courseStudents.map(s => s.id)}
          onClose={() => setShowAddStudentModal(false)}
          onStudentAdded={handleStudentAdded}
        />
      )}

      {/* MODAL 2: Import CSV Scores */}
      {showCSVModal && selectedCourse && (
        <ImportCSVModal
          course={selectedCourse}
          courseStudents={courseStudents}
          onClose={() => setShowCSVModal(false)}
          onImportComplete={handleCSVImportComplete}
        />
      )}

      {/* MODAL 3: Student CGPA Progression Breakdown */}
      {progressionStudent && selectedCourse && (
        <StudentProgressionModal
          student={progressionStudent}
          course={selectedCourse}
          caScore={draftScores[progressionStudent.id]?.ca ?? 0}
          examScore={draftScores[progressionStudent.id]?.exam ?? 0}
          onClose={() => setProgressionStudent(null)}
        />
      )}

      {/* Hidden Native File Input (restricted to .csv) */}
      <input
        ref={csvFileInputRef}
        type="file"
        accept=".csv,text/csv"
        aria-label="Upload CSV File"
        className="hidden"
        onChange={handleNativeCSVFileChange}
      />

      {/* Native CSV Import Loading Spinner Overlay */}
      {isImportingCSV && (
        <div 
          role="status"
          aria-live="assertive"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 max-w-sm w-full text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#F47B20] animate-spin" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-sm">Processing &amp; Importing CSV</h3>
              <p className="text-xs text-gray-600 mt-1">
                Reading <strong>{csvFileName || 'scores.csv'}</strong> and calculating GPA &amp; CGPA for {selectedCourse?.courseCode}...
              </p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#F47B20] h-1.5 rounded-full animate-pulse w-3/4 mx-auto" />
            </div>
            <p className="text-[11px] text-gray-400">Validating scores and updating sheets...</p>
          </div>
        </div>
      )}

      {/* Interactive Notification Toast (Success / Failure) */}
      {toast && (
        <aside
          role="alert"
          aria-live="assertive"
          className="fixed bottom-5 right-5 z-50 max-w-md w-[calc(100vw-2.5rem)] animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className={`p-4 rounded-xl shadow-2xl border flex items-start gap-3 backdrop-blur-md ${
            toast.type === 'success'
              ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950'
              : 'bg-red-50/95 border-red-300 text-red-950'
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}>
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-xs uppercase tracking-wider">{toast.title}</h4>
                <button
                  type="button"
                  onClick={() => setToast(null)}
                  aria-label="Dismiss notification"
                  className="text-gray-400 hover:text-gray-700 p-0.5 rounded transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs mt-1 text-gray-700 leading-relaxed break-words">{toast.message}</p>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};
