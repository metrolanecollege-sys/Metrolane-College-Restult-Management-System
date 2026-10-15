import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Course, StudentRecord } from '../../types';
import { useData } from '../../context/DataContext';
import { computeGrade, computeProgressionCGPA } from '../../utils/academic';
import { 
  UserPlus, 
  X, 
  GraduationCap, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Search,
  BookOpen,
  Hash,
  User,
  Layers
} from 'lucide-react';

interface AddStudentScoreModalProps {
  course: Course;
  existingEnrolledStudentIds: string[];
  onClose: () => void;
  onStudentAdded: (student: StudentRecord, caScore: number, examScore: number) => void;
}

export const AddStudentScoreModal: React.FC<AddStudentScoreModalProps> = ({
  course,
  existingEnrolledStudentIds,
  onClose,
  onStudentAdded
}) => {
  const { students, addStudent, enrollStudentInCourse, settings } = useData();

  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [searchQuery, setSearchQuery] = useState('');

  // Primary required fields: Matric Number, Full Name, Level
  const [matricNumber, setMatricNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [level, setLevel] = useState<'ND1' | 'ND2' | 'HND1' | 'HND2'>(
    (course.level as any) || 'ND1'
  );

  // Additional context fields
  const [gender, setGender] = useState<'Male' | 'Female'>('Female');
  const [programme] = useState(course.programme);
  const [department] = useState(
    course.programme.includes('Community') ? 'Community Health Technology' :
    course.programme.includes('Health') ? 'Health Technician' : 'Public Health'
  );

  // Year 2 / Previous CGPA calculation fields
  const isYear2 = level === 'ND2' || level === 'HND2';
  const [previousCgpa, setPreviousCgpa] = useState<string>('3.45');
  const [previousUnits, setPreviousUnits] = useState<string>('36');

  // Course Score Inputs (Continuous Assessment max 30, Exam max 70)
  const [caScore, setCaScore] = useState<string>('24');
  const [examScore, setExamScore] = useState<string>('54');

  // Existing student selection
  const [selectedExistingId, setSelectedExistingId] = useState<string>('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matricInputRef = useRef<HTMLInputElement>(null);

  // Keyboard accessibility: Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Autofocus the matric input when modal mounts
  useEffect(() => {
    matricInputRef.current?.focus();
  }, []);

  // Auto calculate previous quality points for Year 2 students
  const parsedPrevCgpa = parseFloat(previousCgpa) || 0;
  const parsedPrevUnits = parseInt(previousUnits, 10) || 0;
  const computedPrevQP = parseFloat((parsedPrevCgpa * parsedPrevUnits).toFixed(2));

  // Current score calculations
  const parsedCA = Math.min(30, Math.max(0, parseFloat(caScore) || 0));
  const parsedExam = Math.min(70, Math.max(0, parseFloat(examScore) || 0));
  const currentTotal = parsedCA + parsedExam;
  const { grade, gradePoint, remark } = computeGrade(currentTotal, settings.gradingScale);
  const currentQP = parseFloat((gradePoint * course.creditUnit).toFixed(2));

  // Live Progressive CGPA computation
  const liveProgression = useMemo(() => {
    return computeProgressionCGPA(
      {
        level,
        year: isYear2 ? 2 : 1,
        previousCgpa: isYear2 ? parsedPrevCgpa : 0,
        previousCreditUnits: isYear2 ? parsedPrevUnits : 0,
        previousQualityPoints: isYear2 ? computedPrevQP : 0
      },
      course.creditUnit,
      currentQP
    );
  }, [level, isYear2, parsedPrevCgpa, parsedPrevUnits, computedPrevQP, course.creditUnit, currentQP]);

  // Filter available existing college students
  const availableExistingStudents = useMemo(() => {
    return students.filter(s => {
      const isAlreadyOnSheet = existingEnrolledStudentIds.includes(s.id);
      if (isAlreadyOnSheet) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return s.matricNumber.toLowerCase().includes(q) ||
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q);
    });
  }, [students, existingEnrolledStudentIds, searchQuery]);

  const selectedExistingStudent = students.find(s => s.id === selectedExistingId);

  // Quick helper to auto-generate official matric number format
  const handleGenerateMatric = () => {
    const yearPrefix = settings.currentSession.slice(2, 4) || '26';
    const code = course.programmeCode || 'CHT';
    const rand = Math.floor(100 + Math.random() * 900);
    setMatricNumber(`${yearPrefix}/MET/${code}/${rand}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (mode === 'new') {
        const trimmedFullName = fullName.trim();
        if (!trimmedFullName) {
          throw new Error('Please enter the student\'s Full Name.');
        }

        const nameParts = trimmedFullName.split(/\s+/).filter(Boolean);
        const firstName = nameParts[0] || 'Student';
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : firstName;
        const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : undefined;

        const effectiveMatric = matricNumber.trim() || 
          `${settings.currentSession.slice(2, 4)}/MET/${course.programmeCode || 'CHT'}/${Math.floor(100 + Math.random() * 900)}`;

        const newStudent = await addStudent({
          matricNumber: effectiveMatric,
          firstName,
          middleName,
          lastName,
          gender,
          department,
          programme,
          programmeCode: (course.programmeCode as any) || 'CHT',
          level,
          year: isYear2 ? 2 : 1,
          previousCgpa: isYear2 ? parsedPrevCgpa : undefined,
          previousCreditUnits: isYear2 ? parsedPrevUnits : undefined,
          previousQualityPoints: isYear2 ? computedPrevQP : undefined,
          admissionYear: isYear2 ? '2025' : '2026',
          currentSession: settings.currentSession,
          currentSemester: settings.currentSemester,
          status: 'active',
          clearanceStatus: { bursary: true, library: true, department: true },
          stateOfOrigin: 'Kano',
          lga: 'Nasarawa',
          phone: '+234 800 000 0000',
          email: `${effectiveMatric.toLowerCase().replace(/[^a-z0-9]/g, '.')}@student.metrolane.edu.ng`
        });

        await enrollStudentInCourse(
          newStudent.id,
          newStudent.matricNumber,
          course.id,
          settings.currentSession,
          settings.currentSemester,
          level
        );

        onStudentAdded(newStudent, parsedCA, parsedExam);
        onClose();
      } else {
        if (!selectedExistingStudent) {
          throw new Error('Please select an existing student from the list.');
        }

        await enrollStudentInCourse(
          selectedExistingStudent.id,
          selectedExistingStudent.matricNumber,
          course.id,
          settings.currentSession,
          settings.currentSemester,
          course.level
        );

        onStudentAdded(selectedExistingStudent, parsedCA, parsedExam);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to add student to score sheet');
      setSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-student-title"
      aria-describedby="add-student-desc"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1A1A2E] to-[#F47B20] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <UserPlus className="w-5 h-5 text-[#F9A825]" />
            </div>
            <div>
              <h3 id="add-student-title" className="text-base font-black">
                Add Student to Score Sheet
              </h3>
              <p id="add-student-desc" className="text-xs text-gray-200">
                Course: <strong className="text-[#F9A825]">{course.courseCode}</strong> ({course.courseTitle})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50/70 p-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'new'
                ? 'bg-[#F47B20] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add New Student (Matric, Name &amp; Level)
          </button>
          <button
            type="button"
            onClick={() => setMode('existing')}
            className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'existing'
                ? 'bg-[#F47B20] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Enroll Existing College Student
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {error && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'new' ? (
            <div className="space-y-4">
              {/* Core Required Fields: Matric Number, Full Name, and Level */}
              <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#F47B20]" />
                    Student Details
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateMatric}
                    className="text-[11px] font-bold text-[#F47B20] hover:text-[#E8601C] hover:underline cursor-pointer"
                  >
                    Auto-Generate Matric No
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Field 1: Matric Number */}
                  <div>
                    <label htmlFor="student-matric" className="block text-gray-700 font-bold mb-1 flex items-center gap-1">
                      <Hash className="w-3 h-3 text-gray-400" />
                      Matric Number *
                    </label>
                    <input
                      ref={matricInputRef}
                      id="student-matric"
                      type="text"
                      required
                      placeholder="e.g. 26/MET/CHT/007"
                      value={matricNumber}
                      onChange={(e) => setMatricNumber(e.target.value)}
                      className="w-full p-2.5 bg-white rounded-lg border border-gray-300 focus:border-[#F47B20] focus:ring-2 focus:ring-[#F47B20]/20 font-mono font-bold outline-none text-xs transition"
                    />
                  </div>

                  {/* Field 2: Full Name */}
                  <div>
                    <label htmlFor="student-fullname" className="block text-gray-700 font-bold mb-1 flex items-center gap-1">
                      <User className="w-3 h-3 text-gray-400" />
                      Full Name *
                    </label>
                    <input
                      id="student-fullname"
                      type="text"
                      required
                      placeholder="e.g. Zainab Ibrahim Aliyu"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full p-2.5 bg-white rounded-lg border border-gray-300 focus:border-[#F47B20] focus:ring-2 focus:ring-[#F47B20]/20 font-medium outline-none text-xs transition"
                    />
                  </div>

                  {/* Field 3: Level */}
                  <div>
                    <label htmlFor="student-level" className="block text-gray-700 font-bold mb-1 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-gray-400" />
                      Academic Level *
                    </label>
                    <select
                      id="student-level"
                      value={level}
                      onChange={(e) => setLevel(e.target.value as any)}
                      className="w-full p-2.5 bg-white rounded-lg border border-gray-300 focus:border-[#F47B20] focus:ring-2 focus:ring-[#F47B20]/20 font-bold outline-none text-xs transition cursor-pointer"
                    >
                      <option value="ND1">ND 1 (First Year)</option>
                      <option value="ND2">ND 2 (Second Year • Continuing)</option>
                      <option value="HND1">HND 1 (First Year)</option>
                      <option value="HND2">HND 2 (Second Year • Continuing)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label htmlFor="student-gender" className="block text-gray-600 font-semibold mb-1">
                      Gender
                    </label>
                    <select
                      id="student-gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full p-2 bg-white rounded-lg border border-gray-300 focus:border-[#F47B20] outline-none text-xs"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="student-programme" className="block text-gray-600 font-semibold mb-1">
                      Programme
                    </label>
                    <input
                      id="student-programme"
                      type="text"
                      readOnly
                      value={programme}
                      className="w-full p-2 bg-gray-100 rounded-lg border border-gray-200 text-gray-600 outline-none text-xs truncate"
                    />
                  </div>
                </div>
              </div>

              {/* Year 2 CGPA Baseline Box (When ND2 or HND2 is chosen) */}
              {isYear2 && (
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-[#F47B20]/40 rounded-xl space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <Sparkles className="w-4 h-4 text-[#F47B20]" />
                    <span className="text-xs uppercase tracking-wide">
                      Year 2 Student: Cumulative CGPA Continuation
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Student is enrolling at <strong>Year 2 ({level})</strong>. Enter their <strong>Year 1 previous academic record</strong> below to calculate their updated continuous CGPA automatically.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label htmlFor="prev-cgpa" className="block font-bold text-gray-800 mb-1">
                        Previous CGPA (Year 1) *
                      </label>
                      <input
                        id="prev-cgpa"
                        type="number"
                        step="0.01"
                        min="0"
                        max="4.00"
                        required
                        value={previousCgpa}
                        onChange={(e) => setPreviousCgpa(e.target.value)}
                        className="w-full p-2 bg-white border border-[#F47B20]/50 rounded-lg font-mono font-black text-sm text-amber-900 outline-none text-center shadow-xs"
                      />
                      <span className="text-[10px] text-gray-500 mt-0.5 block">NBTE scale 0.00 – 4.00</span>
                    </div>

                    <div>
                      <label htmlFor="prev-units" className="block font-bold text-gray-800 mb-1">
                        Year 1 Credit Units
                      </label>
                      <input
                        id="prev-units"
                        type="number"
                        min="1"
                        max="60"
                        value={previousUnits}
                        onChange={(e) => setPreviousUnits(e.target.value)}
                        className="w-full p-2 bg-white border border-gray-300 rounded-lg font-mono font-bold text-sm text-gray-800 outline-none text-center"
                      />
                      <span className="text-[10px] text-gray-500 mt-0.5 block">Standard Year 1: ~36 CU</span>
                    </div>

                    <div>
                      <span className="block font-bold text-gray-800 mb-1">
                        Year 1 Quality Points (Auto)
                      </span>
                      <div className="p-2 bg-amber-100/60 border border-amber-200 rounded-lg font-mono font-bold text-sm text-amber-900 text-center">
                        {computedPrevQP.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-gray-500 mt-0.5 block">Prev CGPA × Prev Units</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Existing Student Selection Tab */
            <div className="space-y-3">
              <span className="font-bold text-gray-900 uppercase text-[11px] tracking-wider block">
                Select Registered Student to Add to this Sheet
              </span>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search student by name or matric number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none"
                />
              </div>

              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white">
                {availableExistingStudents.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-xs">
                    No unregistered students found matching query.
                  </div>
                ) : (
                  availableExistingStudents.map(std => {
                    const isSelected = selectedExistingId === std.id;
                    const isStdYear2 = std.level === 'ND2' || std.level === 'HND2' || std.year === 2;
                    return (
                      <div
                        key={std.id}
                        onClick={() => setSelectedExistingId(std.id)}
                        className={`p-3 flex items-center justify-between cursor-pointer transition ${
                          isSelected ? 'bg-orange-50 border-l-4 border-[#F47B20]' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-gray-900">
                            {std.firstName} {std.lastName}
                          </div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                            <span className="font-mono font-semibold text-[#F47B20]">{std.matricNumber}</span>
                            <span>•</span>
                            <span>{std.level}</span>
                            <span>•</span>
                            <span>{std.programme}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          {isStdYear2 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              Prev CGPA: {std.previousCgpa?.toFixed(2) || '3.42'} (Yr 1)
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">Year 1</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Initial Score Input for Course */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#F47B20]" />
                Course Score Entry ({course.courseCode} • {course.creditUnit} Credit Units)
              </span>
              <span className="text-[11px] text-gray-500">Max CA: 30 • Max Exam: 70</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label htmlFor="student-ca-score" className="block text-gray-700 font-bold mb-1">
                  CA Score (30)
                </label>
                <input
                  id="student-ca-score"
                  type="number"
                  min="0"
                  max="30"
                  value={caScore}
                  onChange={(e) => setCaScore(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:border-[#F47B20] focus:ring-2 focus:ring-[#F47B20]/20 text-center font-bold text-sm outline-none"
                />
              </div>

              <div>
                <label htmlFor="student-exam-score" className="block text-gray-700 font-bold mb-1">
                  Exam Score (70)
                </label>
                <input
                  id="student-exam-score"
                  type="number"
                  min="0"
                  max="70"
                  value={examScore}
                  onChange={(e) => setExamScore(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:border-[#F47B20] focus:ring-2 focus:ring-[#F47B20]/20 text-center font-bold text-sm outline-none"
                />
              </div>

              <div>
                <span className="block text-gray-500 font-bold mb-1">
                  Total Score (100)
                </span>
                <div className="p-2.5 bg-white border border-gray-300 rounded-lg text-center font-black text-sm text-gray-900">
                  {currentTotal}
                </div>
              </div>

              <div>
                <span className="block text-gray-500 font-bold mb-1">
                  Grade &amp; Point
                </span>
                <div className="p-2.5 bg-white border border-gray-300 rounded-lg text-center font-black text-xs">
                  <span className={grade === 'F' ? 'text-red-600' : 'text-emerald-700'}>
                    {grade} ({gradePoint.toFixed(2)})
                  </span>
                </div>
              </div>
            </div>

            {/* Live Continuous CGPA Calculation Summary */}
            <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">
                  {isYear2 ? 'Previous CGPA' : 'Previous Status'}
                </span>
                <span className="text-sm font-black text-amber-900">
                  {isYear2 ? liveProgression.previousCgpa.toFixed(2) : 'N/A (Yr 1)'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">
                  Course Grade Point
                </span>
                <span className="text-sm font-black text-[#E8601C]">
                  {gradePoint.toFixed(2)} ({course.creditUnit} CU)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">
                  Continuous CGPA
                </span>
                <span className="text-sm font-black text-[#5B4FC4]">
                  {liveProgression.cumulativeCgpa.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-[11px] text-gray-500 hidden sm:inline">
              * Score is saved as draft and can be updated anytime before submission.
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 font-bold rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-[#F47B20] hover:bg-[#E8601C] text-white font-black rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {saving ? 'Adding...' : 'Add to Score Sheet'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
