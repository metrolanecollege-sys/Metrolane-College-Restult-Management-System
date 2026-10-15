import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Course, StudentRecord } from '../../types';
import { useData } from '../../context/DataContext';
import { computeGrade } from '../../utils/academic';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Check, 
  FileCheck,
  ClipboardPaste,
  Sparkles,
  CheckSquare,
  Square
} from 'lucide-react';

interface ImportCSVModalProps {
  course: Course;
  courseStudents: StudentRecord[];
  onClose: () => void;
  onImportComplete: (
    newDrafts: Record<string, { ca: number; exam: number }>,
    addedStudents: StudentRecord[]
  ) => void;
}

export interface ParsedStudentRow {
  selected: boolean;
  matricNumber: string;
  studentName: string;
  level: string;
  previousCgpa?: number;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  isValid: boolean;
  validationError?: string;
  matchStatus: 'enrolled' | 'existing_college' | 'new_student';
  matchedStudent?: StudentRecord;
}

export const ImportCSVModal: React.FC<ImportCSVModalProps> = ({
  course,
  courseStudents,
  onClose,
  onImportComplete
}) => {
  const { students, addStudent, enrollStudentInCourse, settings } = useData();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'sample'>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [autoRegisterNew, setAutoRegisterNew] = useState(true);
  const [pasteContent, setPasteContent] = useState('');

  // 1. Download Excel (.xlsx) Template
  const handleDownloadExcelTemplate = () => {
    const isYear2Course = course.level === 'ND2' || course.level === 'HND2';
    const headers = [
      'MatricNumber',
      'StudentName',
      'Level',
      'PreviousCGPA',
      'CAScore_Max30',
      'ExamScore_Max70'
    ];

    const sampleRows = courseStudents.length > 0 
      ? courseStudents.map((s, idx) => [
          s.matricNumber,
          `${s.firstName} ${s.lastName}`,
          s.level || course.level,
          s.previousCgpa || (isYear2Course ? 3.40 : 0.00),
          22 + (idx % 7),
          48 + (idx % 18)
        ])
      : [
          [
            `${settings.currentSession.slice(2, 4)}/MET/${course.programmeCode || 'CHT'}/001`,
            'Fatima Al-Hassan',
            course.level,
            isYear2Course ? 3.45 : 0.00,
            26,
            58
          ],
          [
            `${settings.currentSession.slice(2, 4)}/MET/${course.programmeCode || 'CHT'}/002`,
            'Usman Garba',
            course.level,
            isYear2Course ? 3.20 : 0.00,
            24,
            51
          ],
          [
            `${settings.currentSession.slice(2, 4)}/MET/${course.programmeCode || 'CHT'}/003`,
            'Zainab Kabir',
            course.level,
            isYear2Course ? 3.65 : 0.00,
            28,
            62
          ]
        ];

    const data = [headers, ...sampleRows];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Scores");
    XLSX.writeFile(wb, `${course.courseCode}_Score_Sheet_Template.xlsx`);
  };

  // 2. Download CSV (.csv) Template
  const handleDownloadCSVTemplate = () => {
    const isYear2Course = course.level === 'ND2' || course.level === 'HND2';
    const headers = [
      'MatricNumber',
      'StudentName',
      'Level',
      'PreviousCGPA',
      'CAScore_Max30',
      'ExamScore_Max70'
    ];

    const sampleRows = courseStudents.length > 0 
      ? courseStudents.map((s, idx) => [
          s.matricNumber,
          `"${s.firstName} ${s.lastName}"`,
          s.level || course.level,
          s.previousCgpa || (isYear2Course ? '3.40' : '0.00'),
          (22 + (idx % 7)).toString(),
          (48 + (idx % 18)).toString()
        ])
      : [
          [
            `${settings.currentSession.slice(2, 4)}/MET/${course.programmeCode || 'CHT'}/001`,
            '"Fatima Al-Hassan"',
            course.level,
            isYear2Course ? '3.45' : '0.00',
            '26',
            '58'
          ],
          [
            `${settings.currentSession.slice(2, 4)}/MET/${course.programmeCode || 'CHT'}/002`,
            '"Usman Garba"',
            course.level,
            isYear2Course ? '3.20' : '0.00',
            '24',
            '51'
          ]
        ];

    const csvContent = "data:text/csv;charset=utf-8," + [
      headers.join(','),
      ...sampleRows.map(r => r.join(','))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${course.courseCode}_Score_Sheet_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generic 2D Array Processor for parsed Excel / CSV rows
  const processMatrixData = (matrix: any[][], sourceName: string) => {
    setParseError(null);
    setFileName(sourceName);

    if (!matrix || matrix.length < 2) {
      throw new Error('Spreadsheet appears to be empty or has no data rows.');
    }

    // Inspect first row for column headers
    const headerRow = matrix[0].map((c: any) => String(c ?? '').trim().toLowerCase());

    const matricIdx = headerRow.findIndex(h => 
      h.includes('matric') || h.includes('reg') || h.includes('id') || h.includes('number')
    );
    const nameIdx = headerRow.findIndex(h => 
      h.includes('name') || h.includes('student') || h.includes('candidate')
    );
    const levelIdx = headerRow.findIndex(h => 
      h.includes('level') || h.includes('year') || h.includes('class')
    );
    const prevCgpaIdx = headerRow.findIndex(h => 
      h.includes('prev') || h.includes('cgpa') || h.includes('prior')
    );
    const caIdx = headerRow.findIndex(h => 
      h.includes('ca') || h.includes('test') || h.includes('assessment') || h.includes('continuous')
    );
    const examIdx = headerRow.findIndex(h => 
      h.includes('exam') || h.includes('theory') || h.includes('examination')
    );

    const rows: ParsedStudentRow[] = [];

    for (let r = 1; r < matrix.length; r++) {
      const row = matrix[r];
      if (!row || row.length === 0 || row.every((cell: any) => cell === '' || cell === null || cell === undefined)) {
        continue;
      }

      // Extract matriculation number
      const rawMatric = String(
        (matricIdx !== -1 ? row[matricIdx] : row[0]) ?? ''
      ).trim();

      if (!rawMatric || rawMatric === 'undefined' || rawMatric === 'null') {
        continue;
      }

      const rawName = String(
        (nameIdx !== -1 ? row[nameIdx] : (row.length > 2 ? row[1] : '')) ?? ''
      ).trim();

      const rawLevel = String(
        (levelIdx !== -1 ? row[levelIdx] : course.level) ?? course.level
      ).trim();

      const rawPrevCgpa = prevCgpaIdx !== -1 && row[prevCgpaIdx] !== undefined && row[prevCgpaIdx] !== ''
        ? parseFloat(String(row[prevCgpaIdx]))
        : undefined;

      // Extract scores
      let caVal = 0;
      let examVal = 0;

      if (caIdx !== -1 && row[caIdx] !== undefined && row[caIdx] !== '') {
        caVal = Number(row[caIdx]) || 0;
      } else if (row.length >= 3) {
        caVal = Number(row[row.length - 2]) || 0;
      }

      if (examIdx !== -1 && row[examIdx] !== undefined && row[examIdx] !== '') {
        examVal = Number(row[examIdx]) || 0;
      } else if (row.length >= 2) {
        examVal = Number(row[row.length - 1]) || 0;
      }

      caVal = Math.round(caVal);
      examVal = Math.round(examVal);

      let isValid = true;
      let validationError = '';

      if (caVal < 0 || caVal > 30) {
        isValid = false;
        validationError = `CA score (${caVal}) exceeds range 0–30`;
      }
      if (examVal < 0 || examVal > 70) {
        isValid = false;
        validationError = `Exam score (${examVal}) exceeds range 0–70`;
      }

      const total = Math.min(100, Math.max(0, caVal + examVal));
      const { grade } = computeGrade(total, settings.gradingScale);

      // Match against existing enrolled and college students
      const cleanMatric = rawMatric.replace(/\s+/g, '').toLowerCase();
      const enrolledMatch = courseStudents.find(
        s => s.matricNumber.replace(/\s+/g, '').toLowerCase() === cleanMatric
      );
      const collegeMatch = !enrolledMatch 
        ? students.find(s => s.matricNumber.replace(/\s+/g, '').toLowerCase() === cleanMatric)
        : undefined;

      let matchStatus: 'enrolled' | 'existing_college' | 'new_student' = 'new_student';
      let matchedStudent: StudentRecord | undefined = undefined;

      if (enrolledMatch) {
        matchStatus = 'enrolled';
        matchedStudent = enrolledMatch;
      } else if (collegeMatch) {
        matchStatus = 'existing_college';
        matchedStudent = collegeMatch;
      }

      rows.push({
        selected: isValid, // Checked by default if valid
        matricNumber: rawMatric,
        studentName: rawName || (matchedStudent ? `${matchedStudent.firstName} ${matchedStudent.lastName}` : 'Enrolled Student'),
        level: rawLevel || course.level,
        previousCgpa: rawPrevCgpa,
        caScore: caVal,
        examScore: examVal,
        totalScore: total,
        grade,
        isValid,
        validationError: validationError || undefined,
        matchStatus,
        matchedStudent
      });
    }

    if (rows.length === 0) {
      throw new Error('No valid student score rows were recognized from the spreadsheet.');
    }

    setParsedRows(rows);
    setIsProcessing(false);
  };

  // File Upload Handler (Supports .xlsx, .xls, .csv, .tsv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setIsProcessing(true);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        // Parse with SheetJS
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('No worksheet found in the uploaded workbook.');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const matrixData: any[][] = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          defval: '' 
        });

        processMatrixData(matrixData, file.name);
      } catch (err: any) {
        setParseError(err.message || 'Failed to parse Excel / CSV file');
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setParseError('Failed to read file from disk');
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // Paste Content Handler
  const handleParsePastedData = () => {
    if (!pasteContent.trim()) {
      setParseError('Please paste your Excel table rows first.');
      return;
    }

    try {
      setIsProcessing(true);
      const lines = pasteContent.split(/\r\n|\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        throw new Error('Pasted content must include a header line and at least one student row.');
      }

      // Check delimiter (tab if copied from Excel, otherwise comma/semicolon)
      const firstLine = lines[0];
      const delimiter = firstLine.includes('\t') ? '\t' : (firstLine.includes(';') ? ';' : ',');

      const matrix = lines.map(line => {
        return line.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''));
      });

      processMatrixData(matrix, 'Pasted Excel Table Data');
    } catch (err: any) {
      setParseError(err.message || 'Failed to process pasted content');
      setIsProcessing(false);
    }
  };

  // Load Sample Excel Data for this Course
  const handleLoadSampleData = () => {
    setIsProcessing(true);
    const isND2 = course.level === 'ND2' || course.level === 'HND2';
    
    // Pick existing enrolled students + 1 extra student from college
    const sampleMatrix: any[][] = [
      ['MatricNumber', 'StudentName', 'Level', 'PreviousCGPA', 'CAScore_Max30', 'ExamScore_Max70']
    ];

    if (courseStudents.length > 0) {
      courseStudents.slice(0, 3).forEach((std, i) => {
        sampleMatrix.push([
          std.matricNumber,
          `${std.firstName} ${std.lastName}`,
          std.level || course.level,
          std.previousCgpa || (isND2 ? 3.40 : 0.00),
          24 + (i * 2),
          52 + (i * 3)
        ]);
      });
    }

    // Add another student from college not yet in course
    const otherStudent = students.find(s => !courseStudents.some(cs => cs.id === s.id));
    if (otherStudent) {
      sampleMatrix.push([
        otherStudent.matricNumber,
        `${otherStudent.firstName} ${otherStudent.lastName}`,
        otherStudent.level || course.level,
        otherStudent.previousCgpa || (isND2 ? 3.35 : 0.00),
        25,
        56
      ]);
    } else {
      sampleMatrix.push([
        `${settings.currentSession.slice(2, 4)}/MET/${course.programmeCode || 'CHT'}/099`,
        'Maryam Abubakar',
        course.level,
        isND2 ? 3.50 : 0.00,
        27,
        60
      ]);
    }

    try {
      processMatrixData(sampleMatrix, `Sample_${course.courseCode}_Data.xlsx`);
    } catch (err: any) {
      setParseError(err.message);
      setIsProcessing(false);
    }
  };

  // Toggle selection for a single student row
  const toggleRowSelection = (index: number) => {
    setParsedRows(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        selected: !updated[index].selected
      };
      return updated;
    });
  };

  // Toggle selection for all rows
  const toggleSelectAll = (select: boolean) => {
    setParsedRows(prev => prev.map(r => ({
      ...r,
      selected: r.isValid ? select : false
    })));
  };

  // Commit and Apply Import for Selected Students
  const handleApplyImport = async () => {
    setIsProcessing(true);
    setParseError(null);

    try {
      const newDrafts: Record<string, { ca: number; exam: number }> = {};
      const newlyAddedStudents: StudentRecord[] = [];

      const selectedRows = parsedRows.filter(r => r.selected && r.isValid);

      if (selectedRows.length === 0) {
        throw new Error('Please select at least one valid student to import.');
      }

      for (const row of selectedRows) {
        let targetStudentId = row.matchedStudent?.id;

        // 1. If enrolled student
        if (row.matchStatus === 'enrolled' && row.matchedStudent) {
          targetStudentId = row.matchedStudent.id;
        } 
        // 2. If student exists in college but not yet enrolled in this course
        else if (row.matchStatus === 'existing_college' && row.matchedStudent) {
          targetStudentId = row.matchedStudent.id;
          await enrollStudentInCourse(
            row.matchedStudent.id,
            row.matchedStudent.matricNumber,
            course.id,
            settings.currentSession,
            settings.currentSemester,
            row.matchedStudent.level
          );
          newlyAddedStudents.push(row.matchedStudent);
        } 
        // 3. If completely new student and auto-register is enabled
        else if (row.matchStatus === 'new_student' && autoRegisterNew) {
          const names = row.studentName.split(' ');
          const fName = names[0] || 'Student';
          const lName = names.slice(1).join(' ') || 'Learner';
          const isYear2 = row.level === 'ND2' || row.level === 'HND2';

          const created = await addStudent({
            matricNumber: row.matricNumber,
            firstName: fName,
            lastName: lName,
            gender: 'Female',
            department: course.programme.includes('Community') ? 'Community Health Technology' : 'Health Technician',
            programme: course.programme,
            programmeCode: (course.programmeCode as any) || 'CHT',
            level: (row.level as any) || course.level,
            year: isYear2 ? 2 : 1,
            previousCgpa: isYear2 ? (row.previousCgpa || 3.40) : undefined,
            previousCreditUnits: isYear2 ? 36 : undefined,
            previousQualityPoints: isYear2 ? parseFloat(((row.previousCgpa || 3.40) * 36).toFixed(2)) : undefined,
            admissionYear: isYear2 ? '2025' : '2026',
            currentSession: settings.currentSession,
            currentSemester: settings.currentSemester,
            status: 'active',
            clearanceStatus: { bursary: true, library: true, department: true },
            stateOfOrigin: 'Kano',
            lga: 'Nasarawa',
            phone: '+234 800 000 0000',
            email: `${row.matricNumber.toLowerCase().replace(/[^a-z0-9]/g, '.')}@student.metrolane.edu.ng`
          });

          await enrollStudentInCourse(
            created.id,
            created.matricNumber,
            course.id,
            settings.currentSession,
            settings.currentSemester,
            created.level
          );

          targetStudentId = created.id;
          newlyAddedStudents.push(created);
        }

        if (targetStudentId) {
          newDrafts[targetStudentId] = {
            ca: row.caScore,
            exam: row.examScore
          };
        }
      }

      onImportComplete(newDrafts, newlyAddedStudents);
      onClose();
    } catch (err: any) {
      setParseError(err.message || 'Failed to apply imported scores');
      setIsProcessing(false);
    }
  };

  const validRows = parsedRows.filter(r => r.isValid);
  const selectedCount = parsedRows.filter(r => r.selected && r.isValid).length;
  const isAllSelected = validRows.length > 0 && selectedCount === validRows.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1A1A2E] to-[#F47B20] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Upload className="w-5 h-5 text-[#F9A825]" />
            </div>
            <div>
              <h3 className="text-base font-black">Import Student Scores (Excel / CSV)</h3>
              <p className="text-xs text-gray-200">
                Course: <strong className="text-[#F9A825]">{course.courseCode}</strong> — {course.courseTitle} ({course.level} • {course.creditUnit} CU)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 text-xs">
          {parseError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Download Templates Bar */}
          <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-white p-3.5 rounded-xl border border-orange-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="font-bold text-gray-900 block text-xs">
                Need a pre-filled spreadsheet template?
              </span>
              <p className="text-[11px] text-gray-600 mt-0.5">
                Download templates with current student names, matric numbers, and score columns.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadExcelTemplate}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition inline-flex items-center gap-1.5 shadow-2xs text-[11px] cursor-pointer"
                title="Download Excel Workbook (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={handleDownloadCSVTemplate}
                className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-800 font-bold border border-gray-300 rounded-lg transition inline-flex items-center gap-1.5 shadow-2xs text-[11px] cursor-pointer"
                title="Download Comma-Separated Values (.csv)"
              >
                <Download className="w-3.5 h-3.5 text-[#F47B20]" />
                CSV (.csv)
              </button>
            </div>
          </div>

          {/* Import Modes Switcher */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'upload' 
                  ? 'bg-[#1A1A2E] text-white shadow-2xs' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Excel / CSV File
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'paste' 
                  ? 'bg-[#1A1A2E] text-white shadow-2xs' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              Paste Excel Table Rows
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sample')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sample' 
                  ? 'bg-[#1A1A2E] text-white shadow-2xs' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F47B20]" />
              Quick Sample Data
            </button>
          </div>

          {/* TAB 1: FILE UPLOAD */}
          {activeTab === 'upload' && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="p-6 bg-orange-50/40 border-2 border-dashed border-[#F47B20]/40 hover:border-[#F47B20] rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition group"
            >
              <div className="w-12 h-12 rounded-full bg-orange-100 text-[#F47B20] flex items-center justify-center group-hover:scale-110 transition">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span className="font-black text-gray-900 mt-2 text-sm">
                {fileName ? fileName : 'Click to Browse or Drag Excel / CSV File'}
              </span>
              <p className="text-[11px] text-gray-500 mt-1 max-w-md">
                Supports Microsoft Excel Workbooks (<strong>.xlsx</strong>, <strong>.xls</strong>) and standard Comma/Tab Delimited (<strong>.csv</strong>).
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-[#E8601C] bg-orange-100/70 px-2 py-0.5 rounded-full">
                Columns recognized: MatricNumber, StudentName, Level, PrevCGPA, CA (Max 30), Exam (Max 70)
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/plain"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* TAB 2: PASTE EXCEL TABLE */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <p className="text-gray-600 text-[11px]">
                Copy rows directly from your Excel spreadsheet (including headers) and paste below:
              </p>
              <textarea
                rows={5}
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="MatricNumber	StudentName	Level	PreviousCGPA	CAScore_Max30	ExamScore_Max70&#10;25/MET/CHT/008	Musa Ibrahim Garba	ND2	3.40	26	58&#10;25/MET/CHT/009	Zainab Kabir	ND2	3.65	28	62"
                className="w-full p-3 font-mono text-[11px] border border-gray-300 rounded-xl outline-none focus:border-[#F47B20] bg-gray-50"
              />
              <button
                type="button"
                onClick={handleParsePastedData}
                className="px-4 py-2 bg-[#F47B20] hover:bg-[#E8601C] text-white font-bold rounded-lg shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                Parse Pasted Rows
              </button>
            </div>
          )}

          {/* TAB 3: QUICK SAMPLE DATA */}
          {activeTab === 'sample' && (
            <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-gray-900 font-bold">
                <Sparkles className="w-4 h-4 text-[#F47B20]" />
                <span>Test With Sample Excel Scores for {course.courseCode}</span>
              </div>
              <p className="text-[11px] text-gray-600">
                Instantly load simulated Excel records containing enrolled students and new college candidates to verify automated GPA and progressive CGPA calculation.
              </p>
              <button
                type="button"
                onClick={handleLoadSampleData}
                className="px-4 py-2 bg-[#1A1A2E] hover:bg-[#2D2D44] text-white font-bold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5 text-[#F47B20]" />
                Load Sample Student Scores
              </button>
            </div>
          )}

          {/* Auto Enroll Toggle & Selection Summary */}
          {parsedRows.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="text-[11px] text-amber-950 font-medium">
                  Parsed <strong>{parsedRows.length}</strong> student rows: 
                  <strong className="text-emerald-800 ml-1">{selectedCount} selected</strong> for score import.
                </span>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRegisterNew}
                  onChange={(e) => setAutoRegisterNew(e.target.checked)}
                  className="rounded text-[#F47B20] focus:ring-[#F47B20]"
                />
                Auto-enroll new students to course
              </label>
            </div>
          )}

          {/* Preview & Selection Table */}
          {parsedRows.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(!isAllSelected)}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-black cursor-pointer"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#F47B20]" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                    <span>{isAllSelected ? 'Deselect All' : 'Select All Students'}</span>
                  </button>
                </div>
                <span className="text-[10px] text-gray-500">
                  Select which students to import scores for
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-100 text-gray-600 uppercase text-[9px] font-bold sticky top-0 border-b border-gray-200">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">Import</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Matric No</th>
                      <th className="py-2 px-3">Student Name</th>
                      <th className="py-2 px-3 text-center">Level</th>
                      <th className="py-2 px-3 text-center">CA (30)</th>
                      <th className="py-2 px-3 text-center">Exam (70)</th>
                      <th className="py-2 px-3 text-center">Total (100)</th>
                      <th className="py-2 px-3 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {parsedRows.map((row, idx) => (
                      <tr 
                        key={idx} 
                        className={`transition ${
                          !row.isValid 
                            ? 'bg-red-50/60' 
                            : row.selected 
                              ? 'bg-orange-50/20 hover:bg-orange-50/40' 
                              : 'opacity-50 hover:opacity-80'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            disabled={!row.isValid}
                            checked={row.selected}
                            onChange={() => toggleRowSelection(idx)}
                            className="rounded text-[#F47B20] focus:ring-[#F47B20] cursor-pointer"
                          />
                        </td>

                        {/* Match Status Badge */}
                        <td className="py-2 px-3">
                          {row.matchStatus === 'enrolled' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Enrolled
                            </span>
                          ) : row.matchStatus === 'existing_college' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              Will Enroll
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              New Student
                            </span>
                          )}
                        </td>

                        {/* Matric */}
                        <td className="py-2 px-3 font-mono font-bold text-gray-900">
                          {row.matricNumber}
                        </td>

                        {/* Name */}
                        <td className="py-2 px-3 text-gray-800 font-semibold truncate max-w-[150px]">
                          {row.studentName}
                        </td>

                        {/* Level & Prev CGPA */}
                        <td className="py-2 px-3 text-center text-gray-600">
                          {row.level}
                          {row.previousCgpa ? (
                            <span className="block text-[9px] text-amber-700 font-bold">
                              Prev: {row.previousCgpa.toFixed(2)}
                            </span>
                          ) : null}
                        </td>

                        {/* CA */}
                        <td className={`py-2 px-3 text-center font-bold ${row.caScore > 30 ? 'text-red-600 bg-red-100' : 'text-gray-800'}`}>
                          {row.caScore}
                        </td>

                        {/* Exam */}
                        <td className={`py-2 px-3 text-center font-bold ${row.examScore > 70 ? 'text-red-600 bg-red-100' : 'text-gray-800'}`}>
                          {row.examScore}
                        </td>

                        {/* Total */}
                        <td className="py-2 px-3 text-center font-black text-gray-900">
                          {row.totalScore}
                        </td>

                        {/* Grade */}
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            row.grade === 'F' ? 'bg-red-100 text-red-700' :
                            row.grade === 'A' || row.grade === 'AB' ? 'bg-emerald-100 text-emerald-800' :
                            row.grade === 'B' || row.grade === 'BC' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {row.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs">
          <span className="text-gray-600 font-medium">
            {parsedRows.length > 0 
              ? `${selectedCount} of ${parsedRows.length} students selected for import.` 
              : 'Choose an Excel or CSV file to begin.'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-100 font-bold border border-gray-300 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedCount === 0 || isProcessing}
              onClick={handleApplyImport}
              className="px-5 py-2 bg-[#F47B20] hover:bg-[#E8601C] text-white font-black rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              {isProcessing ? 'Importing...' : `Import & Apply ${selectedCount} Student Scores`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
