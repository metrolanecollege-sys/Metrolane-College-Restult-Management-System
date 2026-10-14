import React, { useState, useRef } from 'react';
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
  FileCheck
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

interface ParsedCSVRow {
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
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedCSVRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [autoRegisterNew, setAutoRegisterNew] = useState(true);

  // Download Course-specific CSV Template
  const handleDownloadTemplate = () => {
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
            '"Sample Student One"',
            course.level,
            isYear2Course ? '3.45' : '0.00',
            '25',
            '58'
          ],
          [
            `${settings.currentSession.slice(2, 4)}/MET/${course.programmeCode || 'CHT'}/002`,
            '"Sample Student Two"',
            course.level,
            isYear2Course ? '3.20' : '0.00',
            '21',
            '45'
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

  // Parse CSV File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);

        if (lines.length < 2) {
          throw new Error('CSV file appears to be empty or has no data rows.');
        }

        const headerLine = lines[0].toLowerCase();
        const headerParts = headerLine.split(',').map(h => h.trim().replace(/['"]/g, ''));

        // Identify column indices
        const matricIdx = headerParts.findIndex(h => h.includes('matric') || h.includes('reg') || h.includes('id'));
        const nameIdx = headerParts.findIndex(h => h.includes('name'));
        const levelIdx = headerParts.findIndex(h => h.includes('level') || h.includes('year'));
        const prevCgpaIdx = headerParts.findIndex(h => h.includes('prev') || h.includes('cgpa'));
        const caIdx = headerParts.findIndex(h => h.includes('ca') || h.includes('test') || h.includes('assessment'));
        const examIdx = headerParts.findIndex(h => h.includes('exam'));

        const rows: ParsedCSVRow[] = [];

        for (let i = 1; i < lines.length; i++) {
          const rawLine = lines[i].trim();
          if (!rawLine) continue;

          // Simple CSV line splitter handling quoted strings
          const parts: string[] = [];
          let currentPart = '';
          let inQuotes = false;
          for (let charIdx = 0; charIdx < rawLine.length; charIdx++) {
            const char = rawLine[charIdx];
            if (char === '"' || char === "'") {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              parts.push(currentPart.trim().replace(/^["']|["']$/g, ''));
              currentPart = '';
            } else {
              currentPart += char;
            }
          }
          parts.push(currentPart.trim().replace(/^["']|["']$/g, ''));

          if (parts.length < 2) continue;

          // Extract values
          const matric = (matricIdx !== -1 ? parts[matricIdx] : parts[0])?.trim() || '';
          if (!matric) continue;

          const rawName = (nameIdx !== -1 ? parts[nameIdx] : (parts.length > 3 ? parts[1] : ''))?.trim() || '';
          const rawLevel = (levelIdx !== -1 ? parts[levelIdx] : course.level)?.trim() || course.level;
          const rawPrevCgpa = prevCgpaIdx !== -1 ? parseFloat(parts[prevCgpaIdx]) : undefined;

          // Scores: Fallback to last two numeric columns if header not found
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

          let isValid = true;
          let validationError = '';

          if (caVal < 0 || caVal > 30) {
            isValid = false;
            validationError = `CA score (${caVal}) exceeds allowable range 0-30`;
          }
          if (examVal < 0 || examVal > 70) {
            isValid = false;
            validationError = `Exam score (${examVal}) exceeds allowable range 0-70`;
          }

          const total = Math.min(100, Math.max(0, caVal + examVal));
          const { grade } = computeGrade(total);

          // Find matches in existing students
          const enrolledMatch = courseStudents.find(
            s => s.matricNumber.toLowerCase() === matric.toLowerCase()
          );
          const collegeMatch = !enrolledMatch 
            ? students.find(s => s.matricNumber.toLowerCase() === matric.toLowerCase())
            : undefined;

          let matchStatus: 'enrolled' | 'existing_college' | 'new_student' = 'new_student';
          let matchedStudent = undefined;

          if (enrolledMatch) {
            matchStatus = 'enrolled';
            matchedStudent = enrolledMatch;
          } else if (collegeMatch) {
            matchStatus = 'existing_college';
            matchedStudent = collegeMatch;
          }

          rows.push({
            matricNumber: matric,
            studentName: rawName || (matchedStudent ? `${matchedStudent.firstName} ${matchedStudent.lastName}` : 'New Student'),
            level: rawLevel,
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
          throw new Error('No valid student rows found in the CSV file.');
        }

        setParsedRows(rows);
        setIsProcessing(false);
      } catch (err: any) {
        setParseError(err.message || 'Error parsing CSV file');
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setParseError('Failed to read file from disk');
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  // Commit and Apply Import
  const handleApplyImport = async () => {
    setIsProcessing(true);
    setParseError(null);

    try {
      const newDrafts: Record<string, { ca: number; exam: number }> = {};
      const newlyAddedStudents: StudentRecord[] = [];

      for (const row of parsedRows) {
        if (!row.isValid) continue;

        let targetStudentId = row.matchedStudent?.id;

        // If enrolled student
        if (row.matchStatus === 'enrolled' && row.matchedStudent) {
          targetStudentId = row.matchedStudent.id;
        } 
        // If student exists in college but not yet enrolled in this course
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
        // If completely new student and auto-register is enabled
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

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;
  const newStudentCount = parsedRows.filter(r => r.matchStatus === 'new_student').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1A1A2E] to-[#F47B20] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Upload className="w-5 h-5 text-[#F9A825]" />
            </div>
            <div>
              <h3 className="text-base font-black">Import Student Scores from CSV</h3>
              <p className="text-xs text-gray-200">
                Course: <strong className="text-[#F9A825]">{course.courseCode}</strong> — {course.courseTitle} ({course.level})
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {parseError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Action Ribbon: Template & Uploader */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Download Template Box */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col justify-between">
              <div>
                <span className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[#F47B20]" />
                  Download Course CSV Template
                </span>
                <p className="text-[11px] text-gray-500 mt-1">
                  Download a pre-formatted CSV template containing all {courseStudents.length} currently enrolled students, CA (30), and Exam (70) columns.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="mt-3 px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-800 font-bold border border-gray-300 rounded-lg transition inline-flex items-center gap-1.5 self-start shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#F47B20]" />
                Download Template (.csv)
              </button>
            </div>

            {/* Upload File Box */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="p-4 bg-orange-50/50 border-2 border-dashed border-[#F47B20]/40 hover:border-[#F47B20] rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition group"
            >
              <Upload className="w-6 h-6 text-[#F47B20] group-hover:scale-110 transition" />
              <span className="font-bold text-gray-900 mt-2">
                {fileName ? fileName : 'Click to Browse or Drag CSV File'}
              </span>
              <span className="text-[10px] text-gray-500 mt-0.5">
                Supports standard CSV (.csv) with Matric, CA, and Exam scores
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Auto Register Toggle */}
          {parsedRows.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="text-[11px] text-amber-900">
                  Found <strong>{parsedRows.length}</strong> student rows ({validCount} valid, {invalidCount} invalid, {newStudentCount} new students).
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

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="font-bold text-gray-800 uppercase text-[10px] tracking-wider">
                  CSV Preview &amp; Verification ({parsedRows.length} Records)
                </span>
                <span className="text-[10px] text-gray-500">
                  Verify scores before saving to sheet
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-100 text-gray-600 uppercase text-[10px] font-bold sticky top-0">
                    <tr>
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
                        className={!row.isValid ? 'bg-red-50/60' : 'hover:bg-orange-50/20'}
                      >
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
                        <td className="py-2 px-3 font-mono font-bold text-gray-900">
                          {row.matricNumber}
                        </td>
                        <td className="py-2 px-3 text-gray-800 font-semibold truncate max-w-[150px]">
                          {row.studentName}
                        </td>
                        <td className="py-2 px-3 text-center text-gray-600">
                          {row.level}
                          {row.previousCgpa ? (
                            <span className="block text-[9px] text-amber-700 font-bold">
                              Prev: {row.previousCgpa}
                            </span>
                          ) : null}
                        </td>
                        <td className={`py-2 px-3 text-center font-bold ${row.caScore > 30 ? 'text-red-600 bg-red-100' : 'text-gray-800'}`}>
                          {row.caScore}
                        </td>
                        <td className={`py-2 px-3 text-center font-bold ${row.examScore > 70 ? 'text-red-600 bg-red-100' : 'text-gray-800'}`}>
                          {row.examScore}
                        </td>
                        <td className="py-2 px-3 text-center font-black text-gray-900">
                          {row.totalScore}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            row.grade === 'F' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
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
          <span className="text-gray-500">
            {parsedRows.length > 0 ? `${validCount} ready to import.` : 'Select a CSV file to preview.'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-100 font-bold border border-gray-300 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={validCount === 0 || isProcessing}
              onClick={handleApplyImport}
              className="px-5 py-2 bg-[#F47B20] hover:bg-[#E8601C] text-white font-black rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              {isProcessing ? 'Importing...' : `Import & Apply ${validCount} Scores`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
