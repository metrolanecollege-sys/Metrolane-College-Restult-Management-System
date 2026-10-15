import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Course, ResultScore, StudentRecord, Programme, AcademicSession } from '../../types';
import { 
  computeGrade, 
  computeClassification,
  computeAcademicStanding,
  calculateAcademicProgression,
  DEFAULT_GRADING_SCALE
} from '../../utils/academic';
import { AddStudentScoreModal } from './AddStudentScoreModal';
import { ImportCSVModal } from './ImportCSVModal';
import { StudentProgressionModal } from './StudentProgressionModal';
import { ResultSlip } from '../documents/ResultSlip';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  FileSpreadsheet, 
  UserPlus, 
  Calculator, 
  TrendingUp, 
  Printer, 
  Settings, 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Save, 
  Upload, 
  Download, 
  RefreshCw, 
  Award, 
  FileText, 
  ChevronRight, 
  Info, 
  ShieldCheck, 
  CheckSquare, 
  X, 
  Loader2, 
  Sparkles, 
  AlertTriangle,
  ClipboardList,
  BarChart3,
  FileCheck
} from 'lucide-react';

interface IctUserPortalProps {
  activeTab: string;
  onSelectTab?: (tab: string) => void;
}

export const LecturerPortal: React.FC<IctUserPortalProps> = ({ activeTab, onSelectTab }) => {
  const { currentUser } = useAuth();
  const { 
    courses, 
    students, 
    results, 
    saveResultScores, 
    settings, 
    updateSettings,
    courseRegistrations,
    addStudent,
    updateStudent,
    deleteStudent,
    addCourse,
    updateCourse,
    deleteCourse,
    enrollStudentInCourse,
    registerStudentCourses,
    dropStudentCourse,
    sessions,
    signatures,
    computeStudentSemesterSummary
  } = useData();

  // Normalize legacy tab IDs (e.g. 'score_entry' -> 'result_entry')
  const currentTab = activeTab === 'score_entry' ? 'result_entry' : (activeTab || 'dashboard');

  const handleTabChange = (tabId: string) => {
    onSelectTab?.(tabId);
  };

  // Toast notification state
  const [toast, setToast] = useState<{ id: string; type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Modals state
  const [progressionStudent, setProgressionStudent] = useState<StudentRecord | null>(null);
  const [viewProfileStudent, setViewProfileStudent] = useState<StudentRecord | null>(null);
  const [editStudent, setEditStudent] = useState<StudentRecord | null>(null);
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<StudentRecord | null>(null);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [editCourseItem, setEditCourseItem] = useState<Course | null>(null);
  const [deleteConfirmCourse, setDeleteConfirmCourse] = useState<Course | null>(null);
  const [selectedStudentForSlip, setSelectedStudentForSlip] = useState<StudentRecord | null>(null);

  // ==========================================
  // SECTION 1: COURSE-BY-COURSE RESULT ENTRY
  // ==========================================
  const [selectedSession, setSelectedSession] = useState<string>(settings.currentSession || '2025/2026');
  const [selectedProgType, setSelectedProgType] = useState<'ND' | 'HND'>('ND');
  const [selectedDept, setSelectedDept] = useState<string>('Community Health Technology');
  const [selectedLevel, setSelectedLevel] = useState<'ND1' | 'ND2' | 'HND1' | 'HND2'>('ND1');
  const [selectedSemester, setSelectedSemester] = useState<'1st Semester' | '2nd Semester'>('1st Semester');

  // Filter courses strictly matching: Department, Programme type, Level, and Semester
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      if (c.isActive === false) return false;
      const courseDept = c.department || c.programme || '';
      const deptMatch = !selectedDept || courseDept.toLowerCase().includes(selectedDept.toLowerCase());
      const progMatch = selectedProgType === 'HND' 
        ? (c.programme.toUpperCase().includes('HND') || c.level.startsWith('HND'))
        : (!c.programme.toUpperCase().includes('HND') && !c.level.startsWith('HND'));
      const levelMatch = c.level === selectedLevel;
      const semMatch = c.semester === selectedSemester;
      return deptMatch && progMatch && levelMatch && semMatch;
    });
  }, [courses, selectedDept, selectedProgType, selectedLevel, selectedSemester]);

  // Selected course ID within the filtered course list
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  // Auto-sync selected course when filtered courses change
  useEffect(() => {
    if (filteredCourses.length > 0) {
      if (!filteredCourses.some(c => c.id === selectedCourseId)) {
        setSelectedCourseId(filteredCourses[0].id);
      }
    } else {
      setSelectedCourseId('');
    }
  }, [filteredCourses, selectedCourseId]);

  const activeCourse = courses.find(c => c.id === selectedCourseId) || filteredCourses[0];

  // Dynamic enrollment list in memory during this session
  const [dynamicallyEnrolledIds, setDynamicallyEnrolledIds] = useState<string[]>([]);

  // Registered students for the active course
  const registeredStudentIds = useMemo(() => {
    return courseRegistrations
      .filter(r => r.courseId === activeCourse?.id && r.status === 'registered')
      .map(r => r.studentId);
  }, [courseRegistrations, activeCourse]);

  // Local draft scores map: studentId -> { ca: number; exam: number }
  const [draftScores, setDraftScores] = useState<Record<string, { ca: number; exam: number }>>({});

  // Sync draft state from existing database results whenever selected course or session changes
  useEffect(() => {
    if (!activeCourse) return;
    const initialMap: Record<string, { ca: number; exam: number }> = {};
    results
      .filter(r => r.courseId === activeCourse.id && r.session === selectedSession)
      .forEach(r => {
        initialMap[r.studentId] = { ca: r.caScore, exam: r.examScore };
      });
    setDraftScores(initialMap);
  }, [activeCourse?.id, selectedSession, results]);

  // Students on score sheet: registered, dynamically added, has score, or fallback active students in level & dept
  const courseStudents = useMemo(() => {
    if (!activeCourse) return [];
    return students.filter(s => {
      if (s.status === 'withdrawn') return false;
      const isRegistered = registeredStudentIds.includes(s.id);
      const isDynamic = dynamicallyEnrolledIds.includes(s.id);
      const hasScore = draftScores[s.id] !== undefined;
      const matchesLevelAndProg = s.level === activeCourse.level && 
        ((selectedProgType === 'HND' && s.programme.includes('HND')) || (selectedProgType === 'ND' && !s.programme.includes('HND')));
      return isRegistered || isDynamic || hasScore || matchesLevelAndProg;
    });
  }, [students, activeCourse, registeredStudentIds, dynamicallyEnrolledIds, draftScores, selectedProgType]);

  // Configurable Max scores for CA and Exam
  const [caMaxConfig, setCaMaxConfig] = useState<number>(30);
  const [examMaxConfig, setExamMaxConfig] = useState<number>(70);
  const [showConfigMaxScores, setShowConfigMaxScores] = useState<boolean>(false);

  // Saving state & save confirmation
  const [isSavingScores, setIsSavingScores] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Handle score change directly in score table
  const handleScoreChange = (studentId: string, field: 'ca' | 'exam', rawVal: string) => {
    const current = draftScores[studentId] || { ca: 0, exam: 0 };
    let numVal = parseFloat(rawVal);
    if (isNaN(numVal) || numVal < 0) numVal = 0;
    
    if (field === 'ca') {
      if (numVal > caMaxConfig) numVal = caMaxConfig;
      setDraftScores(prev => ({
        ...prev,
        [studentId]: { ...current, ca: numVal }
      }));
    } else {
      if (numVal > examMaxConfig) numVal = examMaxConfig;
      setDraftScores(prev => ({
        ...prev,
        [studentId]: { ...current, exam: numVal }
      }));
    }
  };

  // Save Results Course by Course
  const handleSaveCourseResults = async () => {
    if (!activeCourse) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'No Course Selected',
        message: 'Please select a valid course before saving scores.'
      });
      return;
    }

    setIsSavingScores(true);
    try {
      const scoreEntries: Partial<ResultScore>[] = [];

      for (const student of courseStudents) {
        const studentScore = draftScores[student.id];
        // If ICT user has entered any CA or Exam score or an existing result exists
        if (studentScore !== undefined) {
          const ca = Math.min(caMaxConfig, Math.max(0, studentScore.ca || 0));
          const exam = Math.min(examMaxConfig, Math.max(0, studentScore.exam || 0));
          const total = ca + exam;
          const { grade, gradePoint, remark } = computeGrade(total, settings.gradingScale);
          const cu = activeCourse.creditUnit || 2;
          const qp = parseFloat((gradePoint * cu).toFixed(2));

          scoreEntries.push({
            studentId: student.id,
            matricNumber: student.matricNumber,
            studentName: `${student.firstName} ${student.lastName}`.trim(),
            courseId: activeCourse.id,
            courseCode: activeCourse.courseCode,
            courseTitle: activeCourse.courseTitle,
            creditUnit: cu,
            session: selectedSession,
            semester: selectedSemester,
            level: activeCourse.level,
            programme: student.programme || activeCourse.programme,
            caScore: ca,
            examScore: exam,
            totalScore: total,
            grade,
            gradePoint,
            qualityPoint: qp,
            remark,
            isCarryover: grade === 'F',
            enteredBy: currentUser?.uid || 'ict_staff_001',
            status: 'submitted'
          });
        }
      }

      if (scoreEntries.length === 0) {
        setToast({
          id: String(Date.now()),
          type: 'info',
          title: 'No Scores Entered',
          message: 'No student scores were entered to save for this course.'
        });
        setIsSavingScores(false);
        return;
      }

      await saveResultScores(scoreEntries, 'submitted');
      const msg = `Successfully saved results for ${activeCourse.courseCode} (${activeCourse.courseTitle})! ${scoreEntries.length} student scores recorded. You can now select the next course.`;
      setSaveSuccessMessage(msg);
      setToast({
        id: String(Date.now()),
        type: 'success',
        title: 'Course Results Saved',
        message: msg
      });
    } catch (err: any) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Failed to Save Results',
        message: err.message || 'An unexpected error occurred while saving scores.'
      });
    } finally {
      setIsSavingScores(false);
    }
  };

  // Add Student to Score Sheet Modal
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);

  // Native CSV file picker ref
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const [isNativeImporting, setIsNativeImporting] = useState(false);

  const handleTriggerNativeCSV = () => {
    if (csvFileInputRef.current) {
      csvFileInputRef.current.value = '';
      csvFileInputRef.current.click();
    }
  };

  const handleNativeCSVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Invalid File Format',
        message: 'Only .csv format files are accepted. Please export your Excel sheet as CSV.'
      });
      return;
    }

    setIsNativeImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        let text = (event.target?.result as string) || '';
        // Remove Excel UTF-8 BOM
        if (text.charCodeAt(0) === 0xFEFF) {
          text = text.substring(1);
        }

        const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          throw new Error('CSV file is empty or missing data rows.');
        }

        const headerLine = lines[0];
        const delimiter = headerLine.includes('\t') ? '\t' : (headerLine.includes(';') ? ';' : ',');
        const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

        const matricIdx = headers.findIndex(h => h.includes('matric') || h.includes('reg') || h.includes('id'));
        const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('student'));
        const caIdx = headers.findIndex(h => h.includes('ca') || h.includes('test') || h.includes('continuous') || h.includes('assessment'));
        const examIdx = headers.findIndex(h => h.includes('exam') || h.includes('examination') || h.includes('score'));

        if (matricIdx === -1 && nameIdx === -1) {
          throw new Error('CSV must contain at least a Matric Number or Student Name column.');
        }

        let importedCount = 0;
        const newDrafts: Record<string, { ca: number; exam: number }> = { ...draftScores };
        const newEnrolledIds: string[] = [...dynamicallyEnrolledIds];

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
          if (row.length === 0 || row.every(val => val === '')) continue;

          const rawMatric = matricIdx >= 0 ? row[matricIdx] : '';
          const rawName = nameIdx >= 0 ? row[nameIdx] : '';
          const rawCA = caIdx >= 0 ? parseFloat(row[caIdx]) : NaN;
          const rawExam = examIdx >= 0 ? parseFloat(row[examIdx]) : NaN;

          // Match student
          let matchedStudent = students.find(s => 
            (rawMatric && s.matricNumber.trim().toLowerCase() === rawMatric.trim().toLowerCase()) ||
            (rawName && `${s.firstName} ${s.lastName}`.trim().toLowerCase() === rawName.trim().toLowerCase())
          );

          // If not found and valid matric exists, create student automatically
          if (!matchedStudent && rawMatric && rawMatric.length > 3) {
            const nameParts = (rawName || 'Imported Student').split(' ');
            const fName = nameParts[0] || 'Student';
            const lName = nameParts.slice(1).join(' ') || 'Learner';
            
            matchedStudent = await addStudent({
              matricNumber: rawMatric,
              firstName: fName,
              lastName: lName,
              gender: 'Female',
              department: selectedDept,
              programme: selectedProgType === 'HND' ? 'HND in Community Health Technology' : 'ND in Community Health Technology',
              programmeCode: 'CHT',
              level: selectedLevel,
              currentSession: selectedSession,
              currentSemester: selectedSemester,
              admissionYear: '2026',
              status: 'active',
              phone: '+234 800 000 0000',
              email: `${rawMatric.toLowerCase().replace(/[^a-z0-9]/g, '.')}@student.metrolane.edu.ng`,
              stateOfOrigin: 'Kano',
              lga: 'Nasarawa',
              clearanceStatus: { bursary: true, library: true, department: true }
            });
          }

          if (matchedStudent) {
            if (!newEnrolledIds.includes(matchedStudent.id)) {
              newEnrolledIds.push(matchedStudent.id);
            }
            const existingScore = newDrafts[matchedStudent.id] || { ca: 0, exam: 0 };
            const cleanCA = !isNaN(rawCA) ? Math.min(caMaxConfig, Math.max(0, rawCA)) : existingScore.ca;
            const cleanExam = !isNaN(rawExam) ? Math.min(examMaxConfig, Math.max(0, rawExam)) : existingScore.exam;
            newDrafts[matchedStudent.id] = { ca: cleanCA, exam: cleanExam };
            importedCount++;
          }
        }

        setDynamicallyEnrolledIds(newEnrolledIds);
        setDraftScores(newDrafts);

        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'CSV Import Completed',
          message: `Successfully processed ${importedCount} student scores from ${file.name}.`
        });
      } catch (err: any) {
        setToast({
          id: String(Date.now()),
          type: 'error',
          title: 'CSV Import Failed',
          message: err.message || 'Failed to parse Excel CSV file. Ensure valid headers are present.'
        });
      } finally {
        setIsNativeImporting(false);
      }
    };

    reader.onerror = () => {
      setIsNativeImporting(false);
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Read Error',
        message: 'Could not read the selected CSV file.'
      });
    };

    reader.readAsText(file);
  };

  // ==========================================
  // SECTION 2: STUDENT REGISTRATION FORM STATE
  // ==========================================
  const [regForm, setRegForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    matricNumber: '',
    gender: 'Male' as 'Male' | 'Female',
    dateOfBirth: '2004-01-01',
    email: '',
    phone: '',
    department: 'Community Health Technology',
    programme: 'ND in Community Health Technology',
    programmeCode: 'CHT',
    level: 'ND1' as 'ND1' | 'ND2' | 'HND1' | 'HND2',
    currentSession: settings.currentSession || '2025/2026',
    currentSemester: '1st Semester' as '1st Semester' | '2nd Semester',
    admissionYear: '2026',
    status: 'active' as 'active' | 'graduated' | 'withdrawn',
    passportPhoto: ''
  });

  const [isRegisteringStudent, setIsRegisteringStudent] = useState(false);
  const [matricCheckError, setMatricCheckError] = useState<string | null>(null);

  const handleGenerateMatric = () => {
    const yr = regForm.admissionYear.slice(-2);
    const code = regForm.programme.includes('Health Technician') ? 'HLT' : (regForm.programme.includes('Public') ? 'PBH' : 'CHT');
    const progStudents = students.filter(s => s.programme.includes(code)).length + 1;
    const pad = String(progStudents).padStart(3, '0');
    const generated = `${yr}/MET/${code}/${pad}`;
    setRegForm(prev => ({ ...prev, matricNumber: generated }));
    setMatricCheckError(null);
  };

  const handleRegisterStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.firstName || !regForm.lastName) {
      setToast({ id: String(Date.now()), type: 'error', title: 'Missing Name', message: 'First name and last name are required.' });
      return;
    }

    // Check duplicate matriculation number
    const trimmedMatric = regForm.matricNumber.trim();
    if (trimmedMatric) {
      const duplicate = students.find(s => s.matricNumber.toLowerCase() === trimmedMatric.toLowerCase());
      if (duplicate) {
        setMatricCheckError(`Matriculation number "${trimmedMatric}" already belongs to ${duplicate.firstName} ${duplicate.lastName}. Please use a unique matric number.`);
        return;
      }
    }

    setIsRegisteringStudent(true);
    setMatricCheckError(null);

    try {
      const newStd = await addStudent({
        matricNumber: trimmedMatric,
        firstName: regForm.firstName.trim(),
        middleName: regForm.middleName.trim(),
        lastName: regForm.lastName.trim(),
        gender: regForm.gender,
        dateOfBirth: regForm.dateOfBirth,
        email: regForm.email.trim() || `${(trimmedMatric || 'std').toLowerCase().replace(/[^a-z0-9]/g, '.')}@student.metrolane.edu.ng`,
        phone: regForm.phone.trim() || '+234 800 000 0000',
        department: regForm.department,
        programme: regForm.programme,
        programmeCode: regForm.programme.includes('Health Technician') ? 'HLT' : (regForm.programme.includes('Public') ? 'PBH' : 'CHT'),
        level: regForm.level,
        currentSession: regForm.currentSession,
        currentSemester: regForm.currentSemester,
        admissionYear: regForm.admissionYear,
        status: regForm.status,
        passportPhoto: regForm.passportPhoto,
        stateOfOrigin: 'Kano',
        lga: 'Nasarawa',
        clearanceStatus: { bursary: true, library: true, department: true }
      });

      setToast({
        id: String(Date.now()),
        type: 'success',
        title: 'Student Registered Successfully',
        message: `${newStd.firstName} ${newStd.lastName} (${newStd.matricNumber}) is now enrolled in ${newStd.programme}.`
      });

      // Reset form
      setRegForm({
        firstName: '',
        middleName: '',
        lastName: '',
        matricNumber: '',
        gender: 'Male',
        dateOfBirth: '2004-01-01',
        email: '',
        phone: '',
        department: regForm.department,
        programme: regForm.programme,
        programmeCode: regForm.programmeCode,
        level: regForm.level,
        currentSession: regForm.currentSession,
        currentSemester: regForm.currentSemester,
        admissionYear: regForm.admissionYear,
        status: 'active',
        passportPhoto: ''
      });
    } catch (err: any) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Registration Failed',
        message: err.message || 'Could not complete student registration.'
      });
    } finally {
      setIsRegisteringStudent(false);
    }
  };

  // ==========================================
  // SECTION 3: STUDENT MANAGEMENT FILTERS
  // ==========================================
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDeptFilter, setStudentDeptFilter] = useState('All');
  const [studentProgFilter, setStudentProgFilter] = useState('All');
  const [studentLevelFilter, setStudentLevelFilter] = useState('All');
  const [studentStatusFilter, setStudentStatusFilter] = useState('All');

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const q = studentSearch.toLowerCase().trim();
      const matchSearch = !q || 
        s.matricNumber.toLowerCase().includes(q) || 
        `${s.firstName} ${s.lastName} ${s.middleName || ''}`.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q);

      const matchDept = studentDeptFilter === 'All' || s.department.toLowerCase().includes(studentDeptFilter.toLowerCase());
      const matchProg = studentProgFilter === 'All' || 
        (studentProgFilter === 'ND' ? !s.programme.toUpperCase().includes('HND') : s.programme.toUpperCase().includes('HND'));
      const matchLevel = studentLevelFilter === 'All' || s.level === studentLevelFilter;
      const matchStatus = studentStatusFilter === 'All' || s.status === studentStatusFilter;

      return matchSearch && matchDept && matchProg && matchLevel && matchStatus;
    });
  }, [students, studentSearch, studentDeptFilter, studentProgFilter, studentLevelFilter, studentStatusFilter]);

  // ==========================================
  // SECTION 4: COURSE MANAGEMENT STATE & FILTERS
  // ==========================================
  const [courseSearch, setCourseSearch] = useState('');
  const [courseDeptFilter, setCourseDeptFilter] = useState('All');
  const [courseProgFilter, setCourseProgFilter] = useState('All');
  const [courseLevelFilter, setCourseLevelFilter] = useState('All');
  const [courseSemFilter, setCourseSemFilter] = useState('All');

  const filteredCoursesManagement = useMemo(() => {
    return courses.filter(c => {
      if (c.isActive === false) return false;
      const q = courseSearch.toLowerCase().trim();
      const matchSearch = !q || c.courseCode.toLowerCase().includes(q) || c.courseTitle.toLowerCase().includes(q);
      const courseDept = c.department || c.programme || '';
      const matchDept = courseDeptFilter === 'All' || courseDept.toLowerCase().includes(courseDeptFilter.toLowerCase());
      const matchProg = courseProgFilter === 'All' || 
        (courseProgFilter === 'ND' ? !c.programme.toUpperCase().includes('HND') : c.programme.toUpperCase().includes('HND'));
      const matchLevel = courseLevelFilter === 'All' || c.level === courseLevelFilter;
      const matchSem = courseSemFilter === 'All' || c.semester === courseSemFilter;
      return matchSearch && matchDept && matchProg && matchLevel && matchSem;
    });
  }, [courses, courseSearch, courseDeptFilter, courseProgFilter, courseLevelFilter, courseSemFilter]);

  // New course form
  const [newCourseForm, setNewCourseForm] = useState({
    courseCode: '',
    courseTitle: '',
    department: 'Community Health Technology',
    programme: 'ND in Community Health Technology',
    programmeCode: 'CHT',
    level: 'ND1' as 'ND1' | 'ND2' | 'HND1' | 'HND2',
    semester: '1st Semester' as '1st Semester' | '2nd Semester',
    creditUnit: 3,
    courseType: 'Core' as 'Core' | 'Elective' | 'General Studies',
    caWeight: 30,
    examWeight: 70
  });

  const handleAddCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseForm.courseCode || !newCourseForm.courseTitle) {
      setToast({ id: String(Date.now()), type: 'error', title: 'Missing Fields', message: 'Course Code and Course Title are required.' });
      return;
    }
    if (!newCourseForm.creditUnit || newCourseForm.creditUnit < 1) {
      setToast({ id: String(Date.now()), type: 'error', title: 'Invalid Credit Unit', message: 'Course must have a valid credit unit (1-6) for GPA calculation.' });
      return;
    }

    try {
      const added = await addCourse({
        courseCode: newCourseForm.courseCode.toUpperCase().trim(),
        courseTitle: newCourseForm.courseTitle.trim(),
        department: newCourseForm.department,
        programme: newCourseForm.programme,
        programmeCode: newCourseForm.programmeCode,
        level: newCourseForm.level,
        semester: newCourseForm.semester,
        creditUnit: Number(newCourseForm.creditUnit),
        courseType: newCourseForm.courseType,
        caWeight: Number(newCourseForm.caWeight) || 30,
        examWeight: Number(newCourseForm.examWeight) || 70,
        prerequisite: null,
        isActive: true
      });

      setToast({
        id: String(Date.now()),
        type: 'success',
        title: 'Course Added',
        message: `${added.courseCode} – ${added.courseTitle} (${added.creditUnit} Units) has been created.`
      });
      setShowAddCourseModal(false);
      setNewCourseForm({
        courseCode: '',
        courseTitle: '',
        department: 'Community Health Technology',
        programme: 'ND in Community Health Technology',
        programmeCode: 'CHT',
        level: 'ND1',
        semester: '1st Semester',
        creditUnit: 3,
        courseType: 'Core',
        caWeight: 30,
        examWeight: 70
      });
    } catch (err: any) {
      setToast({ id: String(Date.now()), type: 'error', title: 'Error', message: err.message || 'Failed to add course.' });
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    // Check if course has recorded results
    const hasResults = results.some(r => r.courseId === course.id);
    if (hasResults) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Course Cannot Be Deleted',
        message: `Course ${course.courseCode} has active academic records and student scores. It cannot be deleted.`
      });
      setDeleteConfirmCourse(null);
      return;
    }

    try {
      await deleteCourse(course.id);
      setToast({
        id: String(Date.now()),
        type: 'success',
        title: 'Course Deleted',
        message: `Course ${course.courseCode} was successfully removed.`
      });
      setDeleteConfirmCourse(null);
    } catch (err: any) {
      setToast({ id: String(Date.now()), type: 'error', title: 'Error', message: err.message || 'Failed to delete course.' });
    }
  };

  // ==========================================
  // DASHBOARD STATISTICS
  // ==========================================
  const stats = useMemo(() => {
    const totalStudents = students.filter(s => s.status !== 'withdrawn').length;
    const totalCourses = courses.filter(c => c.isActive !== false).length;
    const completedResults = results.filter(r => r.totalScore !== undefined && r.totalScore > 0).length;
    
    // Estimate pending: enrolled students across courses minus completed
    const totalEnrolledPositions = courseRegistrations.filter(r => r.status === 'registered').length || (totalStudents * 5);
    const pendingResults = Math.max(0, totalEnrolledPositions - completedResults);
    
    const ndStudents = students.filter(s => 
      s.status !== 'withdrawn' && (!s.programme.toUpperCase().includes('HND') && !s.level.startsWith('HND'))
    ).length;

    const hndStudents = students.filter(s => 
      s.status !== 'withdrawn' && (s.programme.toUpperCase().includes('HND') || s.level.startsWith('HND'))
    ).length;

    return {
      totalStudents,
      totalCourses,
      completedResults,
      pendingResults,
      ndStudents,
      hndStudents
    };
  }, [students, courses, results, courseRegistrations]);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Toast Notification Container */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-xl shadow-xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' :
          toast.type === 'error' ? 'bg-red-50 border-red-300 text-red-900' :
          'bg-blue-50 border-blue-300 text-blue-900'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /> :
           toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" /> :
           <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />}
          <div className="flex-1 text-xs">
            <h5 className="font-bold text-sm mb-0.5">{toast.title}</h5>
            <p>{toast.message}</p>
          </div>
          <button 
            type="button" 
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-gray-700 text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hidden Native File Input for CSV Import */}
      <input 
        type="file" 
        ref={csvFileInputRef}
        onChange={handleNativeCSVChange}
        accept=".csv"
        className="hidden" 
      />

      {/* ========================================================= */}
      {/* 1. ICT DASHBOARD */}
      {/* ========================================================= */}
      {currentTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-[#FF7924] via-[#F35B08] to-[#D84300] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 max-w-3xl">
              <span className="inline-block px-2.5 py-1 bg-white/20 backdrop-blur-xs text-white text-[11px] font-black uppercase tracking-wider rounded-md mb-2">
                Authorized ICT Operations Center
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome Back, ICT Staff
              </h2>
              <p className="mt-2 text-sm sm:text-base text-white/95 leading-relaxed font-normal">
                Manage student information, course registration, academic results, and cumulative academic performance.
              </p>
              
              <div className="mt-5 flex flex-wrap gap-2.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleTabChange('result_entry')}
                  className="px-4 py-2 bg-white text-[#D84300] font-bold rounded-lg shadow-xs hover:bg-orange-50 transition cursor-pointer flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Enter Student Scores</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('student_registration')}
                  className="px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register New Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('course_management')}
                  className="px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Course Management</span>
                </button>
              </div>
            </div>
          </div>

          {/* 6 Statistics Cards (Orange and White Styling) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-xs hover:border-[#FF6B0A] transition">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Students</span>
                <Users className="w-4 h-4 text-[#FF6B0A]" />
              </div>
              <div className="text-2xl font-black text-gray-900">{stats.totalStudents}</div>
              <div className="text-[10px] text-gray-400 mt-1 font-medium">Registered Active</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-xs hover:border-[#FF6B0A] transition">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Courses</span>
                <BookOpen className="w-4 h-4 text-[#FF6B0A]" />
              </div>
              <div className="text-2xl font-black text-gray-900">{stats.totalCourses}</div>
              <div className="text-[10px] text-gray-400 mt-1 font-medium">Active Curricula</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-xs hover:border-[#FF6B0A] transition">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Results Entered</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600">{stats.completedResults}</div>
              <div className="text-[10px] text-gray-400 mt-1 font-medium">Course Scores Saved</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-xs hover:border-[#FF6B0A] transition">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Pending Results</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600">{stats.pendingResults}</div>
              <div className="text-[10px] text-gray-400 mt-1 font-medium">Awaiting Entry</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-xs hover:border-[#FF6B0A] transition">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">ND Students</span>
                <GraduationCap className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-gray-900">{stats.ndStudents}</div>
              <div className="text-[10px] text-gray-400 mt-1 font-medium">ND 1 &amp; ND 2 Enrolled</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-xs hover:border-[#FF6B0A] transition">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">HND Students</span>
                <Award className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-gray-900">{stats.hndStudents}</div>
              <div className="text-[10px] text-gray-400 mt-1 font-medium">HND 1 &amp; HND 2 Enrolled</div>
            </div>
          </div>

          {/* Quick Workflows Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div 
              onClick={() => handleTabChange('result_entry')}
              className="bg-white p-5 rounded-xl border border-gray-200 hover:border-[#FF6B0A] hover:shadow-md transition cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-orange-100 text-[#FF6B0A] flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1 group-hover:text-[#FF6B0A] transition">
                Course-by-Course Result Entry
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                Select courses individually, enter Continuous Assessment &amp; Exam scores, and automatically calculate total, grades, and quality points.
              </p>
              <span className="text-xs font-bold text-[#FF6B0A] flex items-center gap-1">
                Open Score Sheet <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div 
              onClick={() => handleTabChange('student_registration')}
              className="bg-white p-5 rounded-xl border border-gray-200 hover:border-[#FF6B0A] hover:shadow-md transition cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <UserPlus className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1 group-hover:text-emerald-600 transition">
                Register New Student
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                Enroll students with personal details, matriculation number validation, academic levels, and passport photo attachments.
              </p>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                New Registration <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div 
              onClick={() => handleTabChange('result_computation')}
              className="bg-white p-5 rounded-xl border border-gray-200 hover:border-[#FF6B0A] hover:shadow-md transition cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition">
                Result Computation &amp; Broadsheets
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                Compute provisional or final semester GPAs, track cumulative weighted CGPAs across ND/HND, and export master broadsheets.
              </p>
              <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                Compute Results <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. STUDENT REGISTRATION */}
      {/* ========================================================= */}
      {currentTab === 'student_registration' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#FF6B0A]" />
                Student Registration Portal
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Authorized ICT staff portal to create permanent student academic records in the database.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleTabChange('student_management')}
              className="px-3.5 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Users className="w-3.5 h-3.5" />
              <span>View All Students</span>
            </button>
          </div>

          <form onSubmit={handleRegisterStudentSubmit} className="p-6 space-y-6">
            {matricCheckError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{matricCheckError}</span>
              </div>
            )}

            {/* Sub-section 1: Personal Information */}
            <div>
              <h4 className="text-xs font-extrabold uppercase text-[#FF6B0A] tracking-wider mb-3 pb-1 border-b border-orange-100 flex items-center gap-1.5">
                <span>1. Personal Information</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={regForm.firstName}
                    onChange={(e) => setRegForm({ ...regForm, firstName: e.target.value })}
                    placeholder="e.g. Fatima"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-[#FF6B0A] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={regForm.middleName}
                    onChange={(e) => setRegForm({ ...regForm, middleName: e.target.value })}
                    placeholder="e.g. Zarah"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-[#FF6B0A] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={regForm.lastName}
                    onChange={(e) => setRegForm({ ...regForm, lastName: e.target.value })}
                    placeholder="e.g. Mohammed"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-[#FF6B0A] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Matriculation Number *
                    <button
                      type="button"
                      onClick={handleGenerateMatric}
                      className="ml-2 text-[#FF6B0A] hover:underline font-normal text-[11px] cursor-pointer"
                    >
                      (Auto-Generate)
                    </button>
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.matricNumber}
                    onChange={(e) => {
                      setRegForm({ ...regForm, matricNumber: e.target.value });
                      setMatricCheckError(null);
                    }}
                    placeholder="e.g. 26/MET/CHT/002"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-[#FF6B0A] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Gender *</label>
                  <select
                    value={regForm.gender}
                    onChange={(e) => setRegForm({ ...regForm, gender: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-[#FF6B0A] outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={regForm.dateOfBirth}
                    onChange={(e) => setRegForm({ ...regForm, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-[#FF6B0A] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="student@metrolane.edu.ng"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-[#FF6B0A] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    placeholder="+234 800 000 0000"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-[#FF6B0A] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Sub-section 2: Academic Information */}
            <div>
              <h4 className="text-xs font-extrabold uppercase text-[#FF6B0A] tracking-wider mb-3 pb-1 border-b border-orange-100 flex items-center gap-1.5">
                <span>2. Academic Information</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Department *</label>
                  <select
                    value={regForm.department}
                    onChange={(e) => {
                      const dept = e.target.value;
                      const prog = dept.includes('Health Technician') ? 'ND in Health Technician' :
                        dept.includes('Public') ? 'ND in Public Health' : 'ND in Community Health Technology';
                      setRegForm({ ...regForm, department: dept, programme: prog });
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-[#FF6B0A] outline-none"
                  >
                    <option value="Community Health Technology">Community Health Technology</option>
                    <option value="Health Technician">Health Technician</option>
                    <option value="Public Health">Public Health</option>
                    <option value="Environmental Health Technology">Environmental Health Technology</option>
                    <option value="Medical Laboratory Technology">Medical Laboratory Technology</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Programme (ND or HND) *</label>
                  <select
                    value={regForm.programme}
                    onChange={(e) => {
                      const p = e.target.value;
                      const isHnd = p.includes('HND');
                      setRegForm({ 
                        ...regForm, 
                        programme: p, 
                        level: isHnd ? 'HND1' : 'ND1' 
                      });
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-[#FF6B0A] outline-none"
                  >
                    <option value="ND in Community Health Technology">ND in Community Health Technology</option>
                    <option value="ND in Health Technician">ND in Health Technician</option>
                    <option value="ND in Public Health">ND in Public Health</option>
                    <option value="HND in Community Health Technology">HND in Community Health Technology</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Academic Level *</label>
                  <select
                    value={regForm.level}
                    onChange={(e) => setRegForm({ ...regForm, level: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-[#FF6B0A] outline-none font-bold text-[#FF6B0A]"
                  >
                    <option value="ND1">ND 1</option>
                    <option value="ND2">ND 2</option>
                    <option value="HND1">HND 1</option>
                    <option value="HND2">HND 2</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Academic Session *</label>
                  <input
                    type="text"
                    required
                    value={regForm.currentSession}
                    onChange={(e) => setRegForm({ ...regForm, currentSession: e.target.value })}
                    placeholder="2025/2026"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-[#FF6B0A] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Semester *</label>
                  <select
                    value={regForm.currentSemester}
                    onChange={(e) => setRegForm({ ...regForm, currentSemester: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-[#FF6B0A] outline-none"
                  >
                    <option value="1st Semester">First Semester</option>
                    <option value="2nd Semester">Second Semester</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Admission Year *</label>
                  <input
                    type="text"
                    required
                    value={regForm.admissionYear}
                    onChange={(e) => setRegForm({ ...regForm, admissionYear: e.target.value })}
                    placeholder="2026"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-[#FF6B0A] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Sub-section 3: Additional Information */}
            <div>
              <h4 className="text-xs font-extrabold uppercase text-[#FF6B0A] tracking-wider mb-3 pb-1 border-b border-orange-100 flex items-center gap-1.5">
                <span>3. Additional Information &amp; Status</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Student Status *</label>
                  <select
                    value={regForm.status}
                    onChange={(e) => setRegForm({ ...regForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-[#FF6B0A] outline-none font-bold"
                  >
                    <option value="active">Active (Enrolled)</option>
                    <option value="graduated">Graduated</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Passport Photograph URL / File</label>
                  <input
                    type="text"
                    value={regForm.passportPhoto}
                    onChange={(e) => setRegForm({ ...regForm, passportPhoto: e.target.value })}
                    placeholder="https://images.unsplash.com/... or leave blank for default avatar"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-[#FF6B0A] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRegForm({
                  firstName: '', middleName: '', lastName: '', matricNumber: '',
                  gender: 'Male', dateOfBirth: '2004-01-01', email: '', phone: '',
                  department: 'Community Health Technology', programme: 'ND in Community Health Technology',
                  programmeCode: 'CHT', level: 'ND1', currentSession: '2025/2026',
                  currentSemester: '1st Semester', admissionYear: '2026', status: 'active', passportPhoto: ''
                })}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 text-xs transition cursor-pointer"
              >
                Reset Fields
              </button>
              <button
                type="submit"
                disabled={isRegisteringStudent}
                className="px-6 py-2.5 bg-[#FF6B0A] hover:bg-[#E8601C] text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isRegisteringStudent ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save &amp; Register Student</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. STUDENT MANAGEMENT */}
      {/* ========================================================= */}
      {currentTab === 'student_management' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-[#FF6B0A]" />
                Student Records &amp; Academic Profiles
              </h3>
              <p className="text-xs text-gray-500">
                Search, filter, view academic history, and manage enrolled students.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleTabChange('student_registration')}
              className="px-4 py-2 bg-[#FF6B0A] hover:bg-[#E8601C] text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Student</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block text-gray-500 font-bold mb-1">Search Name / Matric</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search matric or name..."
                  className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-[#FF6B0A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-500 font-bold mb-1">Department</label>
              <select
                value={studentDeptFilter}
                onChange={(e) => setStudentDeptFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-[#FF6B0A]"
              >
                <option value="All">All Departments</option>
                <option value="Community Health">Community Health</option>
                <option value="Health Technician">Health Technician</option>
                <option value="Public Health">Public Health</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-500 font-bold mb-1">Programme</label>
              <select
                value={studentProgFilter}
                onChange={(e) => setStudentProgFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-[#FF6B0A]"
              >
                <option value="All">All Programmes (ND &amp; HND)</option>
                <option value="ND">National Diploma (ND)</option>
                <option value="HND">Higher National Diploma (HND)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-500 font-bold mb-1">Academic Level</label>
              <select
                value={studentLevelFilter}
                onChange={(e) => setStudentLevelFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-[#FF6B0A]"
              >
                <option value="All">All Levels</option>
                <option value="ND1">ND 1</option>
                <option value="ND2">ND 2</option>
                <option value="HND1">HND 1</option>
                <option value="HND2">HND 2</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-500 font-bold mb-1">Status</label>
              <select
                value={studentStatusFilter}
                onChange={(e) => setStudentStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-[#FF6B0A]"
              >
                <option value="All">All Statuses</option>
                <option value="active">Active</option>
                <option value="graduated">Graduated</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
          </div>

          {/* Student Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">S/N</th>
                    <th className="py-3 px-3">Matric Number</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-3">Programme</th>
                    <th className="py-3 px-3">Level</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-center">Progression &amp; CGPA</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400">
                        No student records match your query.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((std, idx) => {
                      const prog = calculateAcademicProgression({
                        student: std,
                        allResults: results,
                        customGradingScale: settings.gradingScale
                      });

                      return (
                        <tr key={std.id} className="hover:bg-orange-50/40 transition">
                          <td className="py-3 px-3 text-gray-400 font-mono">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-bold text-gray-900">{std.matricNumber}</td>
                          <td className="py-3 px-4 font-semibold text-gray-900">
                            {std.firstName} {std.lastName}
                          </td>
                          <td className="py-3 px-3 text-gray-600">{std.programme}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 bg-orange-100 text-[#FF6B0A] font-bold rounded-md text-[10px]">
                              {std.level.replace(/(\d)/, ' $1')}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              std.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                              std.status === 'graduated' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {std.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => setProgressionStudent(std)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-bold text-[11px] transition cursor-pointer inline-flex items-center gap-1"
                              title="View Cumulative CGPA and Semester History"
                            >
                              <Calculator className="w-3.5 h-3.5 text-amber-600" />
                              <span>CGPA: {prog.cumulativeCgpa.toFixed(2)}</span>
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setViewProfileStudent(std)}
                                className="p-1.5 text-gray-600 hover:text-[#FF6B0A] hover:bg-gray-100 rounded-md transition cursor-pointer"
                                title="View Academic Profile"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditStudent(std)}
                                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                                title="Edit Student Information"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmStudent(std)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                                title="Withdraw or Delete Student"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. COURSE MANAGEMENT */}
      {/* ========================================================= */}
      {currentTab === 'course_management' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#FF6B0A]" />
                Institutional Course Management
              </h3>
              <p className="text-xs text-gray-500">
                Manage all college courses with verified credit units required for GPA and progressive CGPA computation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddCourseModal(true)}
              className="px-4 py-2 bg-[#FF6B0A] hover:bg-[#E8601C] text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Course</span>
            </button>
          </div>

          {/* Course Filters */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block text-gray-500 font-bold mb-1">Search Code / Title</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder="e.g. MTH 111, CHT 101"
                  className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-[#FF6B0A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-500 font-bold mb-1">Department</label>
              <select
                value={courseDeptFilter}
                onChange={(e) => setCourseDeptFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-[#FF6B0A]"
              >
                <option value="All">All Departments</option>
                <option value="Community Health">Community Health</option>
                <option value="Health Technician">Health Technician</option>
                <option value="Public Health">Public Health</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-500 font-bold mb-1">Programme</label>
              <select
                value={courseProgFilter}
                onChange={(e) => setCourseProgFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-[#FF6B0A]"
              >
                <option value="All">All Programmes (ND/HND)</option>
                <option value="ND">ND</option>
                <option value="HND">HND</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-500 font-bold mb-1">Academic Level</label>
              <select
                value={courseLevelFilter}
                onChange={(e) => setCourseLevelFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-[#FF6B0A]"
              >
                <option value="All">All Levels</option>
                <option value="ND1">ND 1</option>
                <option value="ND2">ND 2</option>
                <option value="HND1">HND 1</option>
                <option value="HND2">HND 2</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-500 font-bold mb-1">Semester</label>
              <select
                value={courseSemFilter}
                onChange={(e) => setCourseSemFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-[#FF6B0A]"
              >
                <option value="All">All Semesters</option>
                <option value="1st Semester">First Semester</option>
                <option value="2nd Semester">Second Semester</option>
              </select>
            </div>
          </div>

          {/* Courses Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">S/N</th>
                    <th className="py-3 px-3">Course Code</th>
                    <th className="py-3 px-4">Course Title</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Level</th>
                    <th className="py-3 px-3">Semester</th>
                    <th className="py-3 px-3 text-center">Credit Unit</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCoursesManagement.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-400">
                        No courses found matching selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredCoursesManagement.map((crs, idx) => {
                      const hasAcademicRecords = results.some(r => r.courseId === crs.id);
                      return (
                        <tr key={crs.id} className="hover:bg-orange-50/30 transition">
                          <td className="py-3 px-3 text-gray-400 font-mono">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-bold text-[#FF6B0A]">{crs.courseCode}</td>
                          <td className="py-3 px-4 font-semibold text-gray-900">{crs.courseTitle}</td>
                          <td className="py-3 px-3 text-gray-600">{crs.department || crs.programme}</td>
                          <td className="py-3 px-3 font-medium">{crs.level.replace(/(\d)/, ' $1')}</td>
                          <td className="py-3 px-3 text-gray-600">{crs.semester}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2.5 py-1 bg-orange-100 text-[#FF6B0A] font-black rounded-md">
                              {crs.creditUnit} Units
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              crs.courseType === 'Core' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {crs.courseType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditCourseItem(crs)}
                                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                                title="Edit Course Details"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmCourse(crs)}
                                disabled={hasAcademicRecords}
                                className={`p-1.5 rounded-md transition ${
                                  hasAcademicRecords
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer'
                                }`}
                                title={hasAcademicRecords ? 'Cannot delete: referenced in academic results' : 'Delete Course'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. COURSE REGISTRATION */}
      {/* ========================================================= */}
      {currentTab === 'course_registration' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#FF6B0A]" />
                Student Course Registration Management
              </h3>
              <p className="text-xs text-gray-500">
                Register cohorts for semester courses in bulk or per student.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                const targetCourses = courses.filter(c => c.level === selectedLevel && c.semester === selectedSemester && c.isActive !== false);
                const targetStudents = students.filter(s => s.level === selectedLevel && s.status === 'active');
                
                let registered = 0;
                for (const std of targetStudents) {
                  for (const crs of targetCourses) {
                    await enrollStudentInCourse(std.id, std.matricNumber, crs.id, selectedSession, selectedSemester, selectedLevel);
                    registered++;
                  }
                }
                setToast({
                  id: String(Date.now()),
                  type: 'success',
                  title: 'Bulk Enrollment Completed',
                  message: `Enrolled ${targetStudents.length} students into ${targetCourses.length} courses for ${selectedLevel} (${registered} registrations).`
                });
              }}
              className="px-4 py-2 bg-[#FF6B0A] hover:bg-[#E8601C] text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>Bulk Register All {selectedLevel} Students</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
              Currently Registered Courses ({courseRegistrations.length} Records)
            </h4>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 text-gray-600 font-bold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">S/N</th>
                    <th className="py-2.5 px-3">Matric Number</th>
                    <th className="py-2.5 px-3">Course Code</th>
                    <th className="py-2.5 px-3">Credit Unit</th>
                    <th className="py-2.5 px-3">Session</th>
                    <th className="py-2.5 px-3">Semester</th>
                    <th className="py-2.5 px-3">Level</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {courseRegistrations.slice(0, 50).map((reg, idx) => (
                    <tr key={reg.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 text-gray-400 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-gray-900">{reg.matricNumber}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#FF6B0A]">{reg.courseCode}</td>
                      <td className="py-2.5 px-3">{reg.creditUnit} Units</td>
                      <td className="py-2.5 px-3 text-gray-600">{reg.session}</td>
                      <td className="py-2.5 px-3 text-gray-600">{reg.semester}</td>
                      <td className="py-2.5 px-3">{reg.level}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={async () => {
                            await dropStudentCourse(reg.id);
                            setToast({
                              id: String(Date.now()),
                              type: 'info',
                              title: 'Course Dropped',
                              message: `Dropped ${reg.courseCode} for ${reg.matricNumber}.`
                            });
                          }}
                          className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                        >
                          Drop
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

      {/* ========================================================= */}
      {/* 6. COURSE-BY-COURSE SCORE ENTRY (MOST IMPORTANT FEATURE) */}
      {/* ========================================================= */}
      {currentTab === 'result_entry' && (
        <div className="space-y-4">
          {/* Step 1: Academic Selection Filter Bar */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-[#FF6B0A] tracking-wider bg-orange-50 px-2 py-0.5 rounded-sm">
                  Step 1 &bull; Course-by-Course Result Entry
                </span>
                <h3 className="font-extrabold text-gray-900 text-base mt-1">
                  Select Academic Session, Programme, Level &amp; Course
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfigMaxScores(!showConfigMaxScores)}
                  className="px-2.5 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition cursor-pointer flex items-center gap-1"
                  title="Configure CA and Examination maximum scores"
                >
                  <Settings className="w-3.5 h-3.5 text-gray-500" />
                  <span>Max Scores (CA: {caMaxConfig}, Exam: {examMaxConfig})</span>
                </button>
              </div>
            </div>

            {/* Configurable Max Scores Drawer */}
            {showConfigMaxScores && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex flex-wrap items-center gap-4 text-xs">
                <span className="font-bold text-[#FF6B0A]">Configurable Score Maximums:</span>
                <div className="flex items-center gap-1.5">
                  <label className="text-gray-700 font-medium">CA Max:</label>
                  <input
                    type="number"
                    min="10"
                    max="50"
                    value={caMaxConfig}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 30;
                      setCaMaxConfig(v);
                      setExamMaxConfig(100 - v);
                    }}
                    className="w-16 px-2 py-1 bg-white border border-gray-300 rounded font-bold text-center"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-gray-700 font-medium">Exam Max:</label>
                  <input
                    type="number"
                    min="50"
                    max="90"
                    value={examMaxConfig}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 70;
                      setExamMaxConfig(v);
                      setCaMaxConfig(100 - v);
                    }}
                    className="w-16 px-2 py-1 bg-white border border-gray-300 rounded font-bold text-center"
                  />
                </div>
                <span className="text-[11px] text-gray-500">
                  Total Score: <strong>{caMaxConfig + examMaxConfig} Marks</strong> (CA + Exam)
                </span>
              </div>
            )}

            {/* Dropdowns Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Academic Session</label>
                <select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none font-bold text-gray-800 focus:border-[#FF6B0A] focus:bg-white"
                >
                  <option value="2025/2026">2025/2026</option>
                  <option value="2024/2025">2024/2025</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Programme (ND/HND)</label>
                <select
                  value={selectedProgType}
                  onChange={(e) => {
                    const pt = e.target.value as 'ND' | 'HND';
                    setSelectedProgType(pt);
                    setSelectedLevel(pt === 'HND' ? 'HND1' : 'ND1');
                  }}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none font-bold text-gray-800 focus:border-[#FF6B0A] focus:bg-white"
                >
                  <option value="ND">National Diploma (ND)</option>
                  <option value="HND">Higher National Diploma (HND)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Department</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none font-medium text-gray-800 focus:border-[#FF6B0A] focus:bg-white"
                >
                  <option value="Community Health Technology">Community Health Technology</option>
                  <option value="Health Technician">Health Technician</option>
                  <option value="Public Health">Public Health</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Academic Level</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none font-bold text-[#FF6B0A] focus:border-[#FF6B0A] focus:bg-white"
                >
                  {selectedProgType === 'ND' ? (
                    <>
                      <option value="ND1">ND 1</option>
                      <option value="ND2">ND 2</option>
                    </>
                  ) : (
                    <>
                      <option value="HND1">HND 1</option>
                      <option value="HND2">HND 2</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Semester</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none font-medium text-gray-800 focus:border-[#FF6B0A] focus:bg-white"
                >
                  <option value="1st Semester">First Semester</option>
                  <option value="2nd Semester">Second Semester</option>
                </select>
              </div>

              <div>
                <label className="block text-[#FF6B0A] font-extrabold mb-1">Selected Course *</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3 py-2 bg-orange-50 border-2 border-[#FF6B0A] rounded-lg outline-none font-bold text-gray-900 focus:bg-white"
                >
                  {filteredCourses.length === 0 ? (
                    <option value="">No courses matching</option>
                  ) : (
                    filteredCourses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.courseCode} – {c.courseTitle} ({c.creditUnit} CU)
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Course Information Card & Action Buttons */}
          {activeCourse ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-gray-900 font-mono">
                      {activeCourse.courseCode}
                    </span>
                    <span className="px-2.5 py-0.5 bg-[#FF6B0A] text-white text-[11px] font-black rounded-md">
                      {activeCourse.creditUnit} Credit Units
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[11px] font-bold rounded-md">
                      {activeCourse.courseType}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-gray-800 mt-0.5">
                    {activeCourse.courseTitle}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {activeCourse.department || activeCourse.programme} &bull; {activeCourse.level.replace(/(\d)/, ' $1')} &bull; {activeCourse.semester} &bull; Session: {selectedSession}
                  </p>
                </div>

                {/* Direct Action Buttons: Add Student to Score Sheet & Import CSV File & Save Results */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStudentModal(true)}
                    className="px-3.5 py-2 bg-white border border-gray-300 hover:border-[#FF6B0A] hover:text-[#FF6B0A] text-gray-700 text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-[#FF6B0A]" />
                    <span>Add Student to Score Sheet</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTriggerNativeCSV}
                    disabled={isNativeImporting}
                    className="px-3.5 py-2 bg-white border border-gray-300 hover:border-emerald-600 hover:text-emerald-700 text-gray-700 text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {isNativeImporting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    ) : (
                      <Upload className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>Import CSV File</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCourseResults}
                    disabled={isSavingScores}
                    className="px-5 py-2 bg-[#FF6B0A] hover:bg-[#E8601C] text-white text-xs font-black rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {isSavingScores ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Results</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {saveSuccessMessage && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
                  <span className="font-medium">{saveSuccessMessage}</span>
                  <button 
                    type="button" 
                    onClick={() => setSaveSuccessMessage(null)} 
                    className="text-emerald-700 font-bold ml-2 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 bg-amber-50 border border-amber-200 rounded-xl text-center text-amber-900 text-sm">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="font-bold">No Course Selected for Current Filters</p>
              <p className="text-xs text-amber-700 mt-1">Please select an academic department, level, and semester with active courses.</p>
            </div>
          )}

          {/* Step 3: Student Score Entry Table */}
          {activeCourse && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-gray-800">
                    Student Score Sheet ({courseStudents.length} Students)
                  </span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-500">
                    CA: <strong>0–{caMaxConfig}</strong> &bull; Exam: <strong>0–{examMaxConfig}</strong> &bull; Total: <strong>0–100</strong>
                  </span>
                </div>
                <div className="text-[11px] text-gray-400">
                  Grades, Grade Points &amp; Quality Points calculate automatically
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3 w-12 text-center">S/N</th>
                      <th className="py-3 px-3 font-mono">Matric Number</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-3 w-28 text-center bg-orange-50/50">CA Score ({caMaxConfig})</th>
                      <th className="py-3 px-3 w-28 text-center bg-orange-50/50">Exam Score ({examMaxConfig})</th>
                      <th className="py-3 px-3 w-20 text-center font-bold">Total (100)</th>
                      <th className="py-3 px-3 w-16 text-center">Grade</th>
                      <th className="py-3 px-3 w-20 text-center">Grade Point</th>
                      <th className="py-3 px-3 w-24 text-center">Quality Points</th>
                      <th className="py-3 px-3 text-right">Progression</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {courseStudents.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-10 text-center text-gray-400">
                          <p className="font-bold text-gray-600">No students currently registered for {activeCourse.courseCode}</p>
                          <p className="text-xs text-gray-400 mt-1">Use "Add Student to Score Sheet" or "Import CSV File" above to populate the score sheet.</p>
                        </td>
                      </tr>
                    ) : (
                      courseStudents.map((student, idx) => {
                        const scores = draftScores[student.id] || { ca: 0, exam: 0 };
                        const ca = scores.ca || 0;
                        const exam = scores.exam || 0;
                        const total = ca + exam;
                        const { grade, gradePoint } = computeGrade(total, settings.gradingScale);
                        const cu = activeCourse.creditUnit || 2;
                        const qualityPoints = (gradePoint * cu).toFixed(2);

                        return (
                          <tr key={student.id} className="hover:bg-orange-50/30 transition">
                            <td className="py-2.5 px-3 text-center text-gray-400 font-mono">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-gray-900">{student.matricNumber}</td>
                            <td className="py-2.5 px-4 font-semibold text-gray-800">
                              {student.firstName} {student.lastName}
                            </td>

                            {/* CA Input */}
                            <td className="py-2 px-3 text-center bg-orange-50/20">
                              <input
                                type="number"
                                min="0"
                                max={caMaxConfig}
                                step="1"
                                value={scores.ca === 0 && !draftScores[student.id] ? '' : scores.ca}
                                onChange={(e) => handleScoreChange(student.id, 'ca', e.target.value)}
                                placeholder="0"
                                className="w-20 px-2 py-1 text-center font-bold bg-white border border-gray-300 rounded-md focus:border-[#FF6B0A] focus:ring-1 focus:ring-[#FF6B0A] outline-none"
                              />
                            </td>

                            {/* Exam Input */}
                            <td className="py-2 px-3 text-center bg-orange-50/20">
                              <input
                                type="number"
                                min="0"
                                max={examMaxConfig}
                                step="1"
                                value={scores.exam === 0 && !draftScores[student.id] ? '' : scores.exam}
                                onChange={(e) => handleScoreChange(student.id, 'exam', e.target.value)}
                                placeholder="0"
                                className="w-20 px-2 py-1 text-center font-bold bg-white border border-gray-300 rounded-md focus:border-[#FF6B0A] focus:ring-1 focus:ring-[#FF6B0A] outline-none"
                              />
                            </td>

                            {/* Computed Total */}
                            <td className="py-2.5 px-3 text-center font-black text-gray-900">
                              {total}
                            </td>

                            {/* Computed Grade */}
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                                grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                                grade === 'AB' || grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                grade === 'BC' || grade === 'C' ? 'bg-amber-100 text-amber-800' :
                                grade === 'CD' || grade === 'D' || grade === 'E' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {grade}
                              </span>
                            </td>

                            {/* Computed Grade Point */}
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-700">
                              {gradePoint.toFixed(2)}
                            </td>

                            {/* Computed Quality Points */}
                            <td className="py-2.5 px-3 text-center font-mono font-black text-[#FF6B0A]">
                              {qualityPoints}
                            </td>

                            {/* Action: Progression Modal */}
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => setProgressionStudent(student)}
                                className="p-1.5 text-gray-400 hover:text-[#FF6B0A] hover:bg-orange-50 rounded-md transition cursor-pointer"
                                title="View Student Progression & Cumulative CGPA"
                              >
                                <Calculator className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Bottom Action Toolbar */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-700">Total Enrolled: {courseStudents.length}</span>
                  <span className="text-gray-300">&bull;</span>
                  <span className="text-gray-500">Credit Unit: {activeCourse.creditUnit}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStudentModal(true)}
                    className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:border-[#FF6B0A] hover:text-[#FF6B0A] transition cursor-pointer flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCourseResults}
                    disabled={isSavingScores}
                    className="px-5 py-1.5 bg-[#FF6B0A] hover:bg-[#E8601C] text-white font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Course Results</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. RESULT COMPUTATION & BROADSHEETS */}
      {/* ========================================================= */}
      {currentTab === 'result_computation' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#FF6B0A]" />
                Automated GPA &amp; Cumulative CGPA Computation Engine
              </h3>
              <p className="text-xs text-gray-500">
                Computes weighted Quality Points &divide; Total Credit Units. Shows Provisional GPA until all semester courses are scored.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-white border border-gray-300 text-gray-700 font-bold text-xs rounded-lg hover:bg-gray-50 transition cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Broadsheet</span>
              </button>
            </div>
          </div>

          {/* Broadsheet Cohort Filter */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Academic Session</label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold"
              >
                <option value="2025/2026">2025/2026</option>
                <option value="2024/2025">2024/2025</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">Programme Type</label>
              <select
                value={selectedProgType}
                onChange={(e) => {
                  const pt = e.target.value as 'ND' | 'HND';
                  setSelectedProgType(pt);
                  setSelectedLevel(pt === 'HND' ? 'HND1' : 'ND1');
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold"
              >
                <option value="ND">National Diploma (ND)</option>
                <option value="HND">Higher National Diploma (HND)</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">Academic Level</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-[#FF6B0A]"
              >
                {selectedProgType === 'ND' ? (
                  <>
                    <option value="ND1">ND 1</option>
                    <option value="ND2">ND 2</option>
                  </>
                ) : (
                  <>
                    <option value="HND1">HND 1</option>
                    <option value="HND2">HND 2</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none font-medium"
              >
                <option value="1st Semester">First Semester</option>
                <option value="2nd Semester">Second Semester</option>
              </select>
            </div>
          </div>

          {/* Master Broadsheet Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">S/N</th>
                    <th className="py-3 px-3">Matric Number</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-3 text-center">Credit Units</th>
                    <th className="py-3 px-3 text-center">Quality Points</th>
                    <th className="py-3 px-3 text-center">Semester GPA</th>
                    <th className="py-3 px-3 text-center">Previous CGPA</th>
                    <th className="py-3 px-3 text-center font-bold text-[#FF6B0A]">Cumulative CGPA</th>
                    <th className="py-3 px-3 text-center">Standing</th>
                    <th className="py-3 px-3 text-right">Result Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students
                    .filter(s => s.level === selectedLevel && s.status !== 'withdrawn' && 
                      ((selectedProgType === 'HND' && s.programme.includes('HND')) || (selectedProgType === 'ND' && !s.programme.includes('HND')))
                    )
                    .map((std, idx) => {
                      const prog = calculateAcademicProgression({
                        student: std,
                        targetLevel: selectedLevel,
                        targetSemester: selectedSemester,
                        targetSession: selectedSession,
                        allResults: results,
                        customGradingScale: settings.gradingScale
                      });

                      // Check whether all courses for this semester have scores
                      const semesterCourses = courses.filter(c => c.level === selectedLevel && c.semester === selectedSemester && c.isActive !== false);
                      const scoredCount = results.filter(r => r.studentId === std.id && r.level === selectedLevel && r.semester === selectedSemester && r.session === selectedSession).length;
                      const isComplete = semesterCourses.length > 0 && scoredCount >= semesterCourses.length;

                      return (
                        <tr key={std.id} className="hover:bg-orange-50/20 transition">
                          <td className="py-3 px-3 text-gray-400 font-mono">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-bold text-gray-900">{std.matricNumber}</td>
                          <td className="py-3 px-4 font-semibold text-gray-900">{std.firstName} {std.lastName}</td>
                          <td className="py-3 px-3 text-center">{prog.currentCreditUnits}</td>
                          <td className="py-3 px-3 text-center font-mono">{prog.currentQualityPoints.toFixed(2)}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`} title={isComplete ? 'Final Semester GPA' : 'Provisional: Courses Still In Progress'}>
                              {prog.currentGpa.toFixed(2)} {isComplete ? '✓' : '(Prov)'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-gray-600">
                            {prog.previousCgpaText}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-black text-[#FF6B0A] text-sm">
                            {prog.cumulativeCgpa.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              prog.standing === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {prog.standing}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForSlip(std)}
                              className="px-2 py-1 text-xs font-bold text-[#FF6B0A] hover:bg-orange-50 rounded transition cursor-pointer"
                            >
                              View Slip
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. STUDENT RESULTS & SLIPS */}
      {/* ========================================================= */}
      {currentTab === 'student_results' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#FF6B0A]" />
                Student Academic Transcripts &amp; Result Slips
              </h3>
              <p className="text-xs text-gray-500">
                Generate official result slips with 3 summary cards and 4-semester academic progression history.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {students.map((student) => {
              const prog = calculateAcademicProgression({
                student,
                allResults: results,
                customGradingScale: settings.gradingScale
              });

              return (
                <div key={student.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs hover:border-[#FF6B0A] transition">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-[#FF6B0A] font-bold flex items-center justify-center text-sm">
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{student.firstName} {student.lastName}</h4>
                      <p className="text-xs text-gray-500 font-mono">{student.matricNumber}</p>
                    </div>
                  </div>

                  <div className="text-xs space-y-1 mb-4 text-gray-600">
                    <div>Level: <strong>{student.level.replace(/(\d)/, ' $1')}</strong></div>
                    <div>Programme: <strong>{student.programme}</strong></div>
                    <div className="pt-2 flex items-center justify-between font-bold text-gray-900 border-t border-gray-100">
                      <span>Cumulative CGPA:</span>
                      <span className="text-[#FF6B0A] text-sm">{prog.cumulativeCgpa.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedStudentForSlip(student)}
                      className="flex-1 py-1.5 bg-[#FF6B0A] hover:bg-[#E8601C] text-white text-xs font-bold rounded-lg transition text-center cursor-pointer"
                    >
                      Official Result Slip
                    </button>
                    <button
                      type="button"
                      onClick={() => setProgressionStudent(student)}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition cursor-pointer"
                      title="View Academic Progression Table"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. GPA & CGPA MANAGEMENT */}
      {/* ========================================================= */}
      {currentTab === 'gpa_cgpa_management' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
            <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-[#FF6B0A]" />
              Institutional GPA &amp; CGPA Classification Standards
            </h3>
            <p className="text-xs text-gray-500">
              National Board for Technical Education (NBTE) 4.00 grading scale and cumulative weighted calculation standards.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="font-bold text-emerald-900 block text-sm">Distinction</span>
                <span className="text-emerald-700 font-mono text-xs">CGPA: 3.50 &ndash; 4.00</span>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="font-bold text-blue-900 block text-sm">Upper Credit</span>
                <span className="text-blue-700 font-mono text-xs">CGPA: 3.00 &ndash; 3.49</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="font-bold text-amber-900 block text-sm">Lower Credit</span>
                <span className="text-amber-700 font-mono text-xs">CGPA: 2.50 &ndash; 2.99</span>
              </div>
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <span className="font-bold text-orange-900 block text-sm">Pass</span>
                <span className="text-orange-700 font-mono text-xs">CGPA: 2.00 &ndash; 2.49</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 10. ACADEMIC SESSIONS */}
      {/* ========================================================= */}
      {currentTab === 'academic_sessions' && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#FF6B0A]" />
            Academic Sessions &amp; Calendar Management
          </h3>
          <p className="text-xs text-gray-500">
            Current active session: <strong>{settings.currentSession}</strong> ({settings.currentSemester})
          </p>
          <div className="divide-y divide-gray-100 text-xs">
            {['2025/2026', '2024/2025'].map((sess) => (
              <div key={sess} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 text-sm font-mono">{sess}</span>
                  <span className="text-gray-400 ml-2">Academic Calendar</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  sess === settings.currentSession ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {sess === settings.currentSession ? 'Active Session' : 'Archived'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 11. REPORTS & ANALYTICS */}
      {/* ========================================================= */}
      {currentTab === 'reports_analytics' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
            <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2 mb-1">
              <BarChart3 className="w-5 h-5 text-[#FF6B0A]" />
              Academic Performance Reports &amp; Analytics
            </h3>
            <p className="text-xs text-gray-500">
              Departmental score distributions, overall pass rate, and student progression metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-bold text-gray-500 block mb-2">Overall Pass Rate</span>
              <div className="text-3xl font-black text-emerald-600">94.2%</div>
              <p className="text-[11px] text-gray-400 mt-1">Based on scored course examinations</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-bold text-gray-500 block mb-2">Average Semester GPA</span>
              <div className="text-3xl font-black text-blue-600">3.42</div>
              <p className="text-[11px] text-gray-400 mt-1">Across all ND &amp; HND cohorts</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-bold text-gray-500 block mb-2">Distinction Ratio</span>
              <div className="text-3xl font-black text-[#FF6B0A]">38.5%</div>
              <p className="text-[11px] text-gray-400 mt-1">Students with CGPA &ge; 3.50</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 12. PRINT RESULTS */}
      {/* ========================================================= */}
      {currentTab === 'print_results' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#FF6B0A]" />
                Official Result Printing Station
              </h3>
              <p className="text-xs text-gray-500">
                Select any registered student to preview and print official college result slips with signatures and verification codes.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-700">
              Select Student to Generate Printable Slip
            </div>
            <div className="divide-y divide-gray-100 text-xs">
              {students.map(std => (
                <div key={std.id} className="p-3.5 flex items-center justify-between hover:bg-orange-50/30 transition">
                  <div>
                    <span className="font-bold text-gray-900 font-mono">{std.matricNumber}</span>
                    <span className="text-gray-600 ml-3 font-semibold">{std.firstName} {std.lastName}</span>
                    <span className="text-gray-400 ml-2">({std.level} &bull; {std.programme})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentForSlip(std)}
                    className="px-3 py-1 bg-[#FF6B0A] hover:bg-[#E8601C] text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Print Slip</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 13. PROFILE & SETTINGS */}
      {/* ========================================================= */}
      {currentTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
            <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2 mb-1">
              <Settings className="w-5 h-5 text-[#FF6B0A]" />
              ICT Staff Profile &amp; Portal Settings
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              Authorized credentials and institutional scoring thresholds.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-gray-500 font-bold mb-1">Full Name</label>
                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-bold text-gray-800">
                  {currentUser?.fullName || 'Mal. Kabiru Haruna (ICT Staff)'}
                </div>
              </div>

              <div>
                <label className="block text-gray-500 font-bold mb-1">Email Address</label>
                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-mono text-gray-800">
                  {currentUser?.email || 'ict.staff@metrolane.edu.ng'}
                </div>
              </div>

              <div>
                <label className="block text-gray-500 font-bold mb-1">Department</label>
                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-bold text-gray-800">
                  ICT &amp; Academic Computing Division
                </div>
              </div>

              <div>
                <label className="block text-gray-500 font-bold mb-1">Portal Access Role</label>
                <div className="p-2.5 bg-orange-50 border border-orange-200 text-[#FF6B0A] rounded-lg font-black uppercase text-[11px]">
                  Authorized ICT Staff (Full Results &amp; Student Operations)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}

      {/* Add Student to Score Sheet Modal */}
      {showAddStudentModal && activeCourse && (
        <AddStudentScoreModal
          course={activeCourse}
          existingEnrolledStudentIds={courseStudents.map(s => s.id)}
          onClose={() => setShowAddStudentModal(false)}
          onStudentAdded={(student, ca, exam) => {
            setDynamicallyEnrolledIds(prev => [...prev, student.id]);
            setDraftScores(prev => ({
              ...prev,
              [student.id]: { ca, exam }
            }));
            setShowAddStudentModal(false);
            setToast({
              id: String(Date.now()),
              type: 'success',
              title: 'Student Added to Score Sheet',
              message: `${student.firstName} ${student.lastName} (${student.matricNumber}) added with scores CA: ${ca}, Exam: ${exam}.`
            });
          }}
        />
      )}

      {/* Student Academic Progression Modal (4-Semester History) */}
      {progressionStudent && (
        <StudentProgressionModal
          student={progressionStudent}
          course={activeCourse}
          caScore={draftScores[progressionStudent.id]?.ca || 0}
          examScore={draftScores[progressionStudent.id]?.exam || 0}
          onClose={() => setProgressionStudent(null)}
        />
      )}

      {/* View Full Student Profile Modal */}
      {viewProfileStudent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 text-base">Student Academic Profile</h3>
              <button 
                type="button" 
                onClick={() => setViewProfileStudent(null)}
                className="text-gray-400 hover:text-gray-700 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="py-4 space-y-4 text-xs">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-orange-100 text-[#FF6B0A] font-bold text-xl flex items-center justify-center">
                  {viewProfileStudent.firstName[0]}{viewProfileStudent.lastName[0]}
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-gray-900">
                    {viewProfileStudent.firstName} {viewProfileStudent.middleName || ''} {viewProfileStudent.lastName}
                  </h4>
                  <p className="font-mono text-gray-500 font-bold">{viewProfileStudent.matricNumber}</p>
                  <p className="text-gray-600">{viewProfileStudent.programme} &bull; Level: {viewProfileStudent.level}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div>Email: <strong>{viewProfileStudent.email}</strong></div>
                <div>Phone: <strong>{viewProfileStudent.phone}</strong></div>
                <div>Department: <strong>{viewProfileStudent.department}</strong></div>
                <div>Admission Year: <strong>{viewProfileStudent.admissionYear}</strong></div>
                <div>Status: <strong className="uppercase">{viewProfileStudent.status}</strong></div>
                <div>State of Origin: <strong>{viewProfileStudent.stateOfOrigin}</strong></div>
              </div>

              <div className="pt-2">
                <h5 className="font-bold text-gray-900 uppercase tracking-wider mb-2">Registered Courses &amp; Scores</h5>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100 text-gray-600 font-bold text-[10px]">
                      <tr>
                        <th className="p-2">Course</th>
                        <th className="p-2">CU</th>
                        <th className="p-2">CA</th>
                        <th className="p-2">Exam</th>
                        <th className="p-2">Total</th>
                        <th className="p-2">Grade</th>
                        <th className="p-2">QP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {results.filter(r => r.studentId === viewProfileStudent.id).map(r => (
                        <tr key={r.id}>
                          <td className="p-2 font-mono font-bold text-[#FF6B0A]">{r.courseCode}</td>
                          <td className="p-2">{r.creditUnit}</td>
                          <td className="p-2">{r.caScore}</td>
                          <td className="p-2">{r.examScore}</td>
                          <td className="p-2 font-bold">{r.totalScore}</td>
                          <td className="p-2 font-bold">{r.grade}</td>
                          <td className="p-2 font-mono">{r.qualityPoint?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setViewProfileStudent(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Student Confirmation Modal */}
      {deleteConfirmStudent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-red-600 text-base mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Confirm Student Deletion
            </h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Are you sure you want to withdraw/delete <strong>{deleteConfirmStudent.firstName} {deleteConfirmStudent.lastName}</strong> ({deleteConfirmStudent.matricNumber})? This student's active status will be revoked.
            </p>
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeleteConfirmStudent(null)}
                className="px-3.5 py-2 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteStudent(deleteConfirmStudent.id);
                  setToast({
                    id: String(Date.now()),
                    type: 'success',
                    title: 'Student Withdrawn',
                    message: `${deleteConfirmStudent.firstName} ${deleteConfirmStudent.lastName} has been withdrawn.`
                  });
                  setDeleteConfirmStudent(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg cursor-pointer"
              >
                Confirm Delete / Withdraw
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Course Modal */}
      {showAddCourseModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#FF6B0A]" />
                Add New Course
              </h3>
              <button onClick={() => setShowAddCourseModal(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleAddCourseSubmit} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Course Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MTH 111"
                  value={newCourseForm.courseCode}
                  onChange={(e) => setNewCourseForm({ ...newCourseForm, courseCode: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:bg-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. General Mathematics"
                  value={newCourseForm.courseTitle}
                  onChange={(e) => setNewCourseForm({ ...newCourseForm, courseTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Credit Unit (Required for GPA) *</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    required
                    value={newCourseForm.creditUnit}
                    onChange={(e) => setNewCourseForm({ ...newCourseForm, creditUnit: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:bg-white font-bold text-[#FF6B0A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Course Status *</label>
                  <select
                    value={newCourseForm.courseType}
                    onChange={(e) => setNewCourseForm({ ...newCourseForm, courseType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:bg-white"
                  >
                    <option value="Core">Compulsory (Core)</option>
                    <option value="Elective">Elective</option>
                    <option value="General Studies">General Studies</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Academic Level *</label>
                  <select
                    value={newCourseForm.level}
                    onChange={(e) => setNewCourseForm({ ...newCourseForm, level: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:bg-white"
                  >
                    <option value="ND1">ND 1</option>
                    <option value="ND2">ND 2</option>
                    <option value="HND1">HND 1</option>
                    <option value="HND2">HND 2</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Semester *</label>
                  <select
                    value={newCourseForm.semester}
                    onChange={(e) => setNewCourseForm({ ...newCourseForm, semester: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:bg-white"
                  >
                    <option value="1st Semester">First Semester</option>
                    <option value="2nd Semester">Second Semester</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Department</label>
                <select
                  value={newCourseForm.department}
                  onChange={(e) => setNewCourseForm({ ...newCourseForm, department: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:bg-white"
                >
                  <option value="Community Health Technology">Community Health Technology</option>
                  <option value="Health Technician">Health Technician</option>
                  <option value="Public Health">Public Health</option>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#FF6B0A] hover:bg-[#E8601C] text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Course Confirmation Modal */}
      {deleteConfirmCourse && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-red-600 text-base mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Confirm Course Deletion
            </h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Are you sure you want to remove <strong>{deleteConfirmCourse.courseCode} – {deleteConfirmCourse.courseTitle}</strong>? This action is only permitted if no academic results reference this course.
            </p>
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeleteConfirmCourse(null)}
                className="px-3.5 py-2 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCourse(deleteConfirmCourse)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Result Slip Modal */}
      {selectedStudentForSlip && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl max-h-[95vh] overflow-y-auto">
            <ResultSlip
              student={selectedStudentForSlip}
              results={results.filter(r => r.studentId === selectedStudentForSlip.id)}
              summary={computeStudentSemesterSummary(selectedStudentForSlip.id, selectedSession, selectedSemester)}
              signatures={signatures}
              session={selectedSession}
              semester={selectedSemester}
              onClose={() => setSelectedStudentForSlip(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
