import React, { useMemo } from 'react';
import { Course, StudentRecord } from '../../types';
import { useData } from '../../context/DataContext';
import { 
  computeGrade, 
  computeClassification,
  calculateAcademicProgression 
} from '../../utils/academic';
import { 
  Calculator, 
  X, 
  TrendingUp, 
  BookOpen, 
  Layers,
  GraduationCap
} from 'lucide-react';

interface StudentProgressionModalProps {
  student: StudentRecord;
  course: Course;
  caScore: number;
  examScore: number;
  onClose: () => void;
}

export const StudentProgressionModal: React.FC<StudentProgressionModalProps> = ({
  student,
  course,
  caScore,
  examScore,
  onClose
}) => {
  const { settings, results } = useData();
  const totalScore = Math.min(100, Math.max(0, Number(caScore || 0) + Number(examScore || 0)));
  const { grade, gradePoint, remark } = computeGrade(totalScore, settings.gradingScale);
  const currentQP = parseFloat((gradePoint * course.creditUnit).toFixed(2));

  // Compute full 4-semester academic progression
  const progressionResult = useMemo(() => {
    return calculateAcademicProgression({
      student,
      targetLevel: course.level,
      targetSemester: course.semester,
      targetSession: settings.currentSession,
      allResults: results,
      customGradingScale: settings.gradingScale
    });
  }, [student, course.level, course.semester, settings.currentSession, results, settings.gradingScale]);

  const classification = computeClassification(progressionResult.cumulativeCgpa);
  const isFirstSemester = progressionResult.currentOrder === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1A1A2E] to-[#F47B20] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Calculator className="w-5 h-5 text-[#F9A825]" />
            </div>
            <div>
              <h3 className="text-base font-black">Student Academic CGPA Progression</h3>
              <p className="text-xs text-gray-200">
                {student.firstName} {student.lastName} • <span className="font-mono text-[#F9A825]">{student.matricNumber}</span>
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
        <div className="p-5 md:p-6 overflow-y-auto space-y-5 text-xs">
          {/* Student Profile Card */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Programme</span>
              <span className="font-bold text-gray-900 truncate block">{student.programme || course.programme}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Programme Level</span>
              <span className="font-black text-[#F47B20]">{progressionResult.currentLevelDisplay}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Semester</span>
              <span className="font-bold text-gray-800">{progressionResult.currentSemesterDisplay}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Current Standing</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block ${
                progressionResult.standing === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
              }`}>
                {progressionResult.standing}
              </span>
            </div>
          </div>

          {/* Three Required Summary Cards (Orange-and-White Theme) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            {/* Card A: Previous CGPA */}
            <div className="bg-white border-2 border-amber-200 rounded-xl p-4 shadow-xs hover:border-[#F47B20] transition">
              <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">
                Previous CGPA
              </span>
              <span className="text-2xl font-black text-amber-950 font-mono mt-1 block">
                {progressionResult.previousCgpaText}
              </span>
              <span className="text-[10px] text-gray-500 mt-1 block">
                {isFirstSemester 
                  ? 'First Semester (No prior records)' 
                  : `${progressionResult.previousQualityPoints.toFixed(1)} QP ÷ ${progressionResult.previousCreditUnits} CU`}
              </span>
            </div>

            {/* Card B: Current Semester GPA */}
            <div className="bg-white border-2 border-[#F47B20]/40 rounded-xl p-4 shadow-xs hover:border-[#F47B20] transition">
              <span className="text-[10px] font-black uppercase text-[#E8601C] tracking-wider block">
                Current Semester GPA
              </span>
              <span className="text-2xl font-black text-[#E8601C] font-mono mt-1 block">
                {progressionResult.currentGpa.toFixed(2)}
              </span>
              <span className="text-[10px] text-gray-500 mt-1 block">
                {progressionResult.currentQualityPoints.toFixed(1)} QP ÷ {progressionResult.currentCreditUnits} CU
              </span>
            </div>

            {/* Card C: Cumulative CGPA */}
            <div className="bg-gradient-to-br from-white to-purple-50/50 border-2 border-purple-300 rounded-xl p-4 shadow-xs hover:border-purple-500 transition">
              <span className="text-[10px] font-black uppercase text-[#5B4FC4] tracking-wider block">
                Cumulative CGPA
              </span>
              <span className="text-2xl font-black text-[#5B4FC4] font-mono mt-1 block">
                {progressionResult.cumulativeCgpa.toFixed(2)}
              </span>
              <span className="text-[10px] text-purple-700 font-bold mt-1 block uppercase">
                {classification}
              </span>
            </div>
          </div>

          {/* Current Course Score Box */}
          <div className="border border-orange-200 bg-orange-50/40 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-orange-950 uppercase text-[11px] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#E8601C]" />
                Selected Course Entry: {course.courseCode} ({course.courseTitle})
              </span>
              <span className="text-[11px] font-bold text-[#E8601C]">{course.creditUnit} Credit Units</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center pt-1">
              <div className="bg-white p-2 rounded-lg border border-orange-100">
                <span className="text-[10px] text-gray-400 font-semibold block">CA (30)</span>
                <span className="text-sm font-bold text-gray-900">{caScore}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-orange-100">
                <span className="text-[10px] text-gray-400 font-semibold block">Exam (70)</span>
                <span className="text-sm font-bold text-gray-900">{examScore}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-orange-100">
                <span className="text-[10px] text-gray-400 font-semibold block">Total (100)</span>
                <span className="text-sm font-black text-gray-900">{totalScore}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-orange-100">
                <span className="text-[10px] text-gray-400 font-semibold block">Grade (GP)</span>
                <span className="text-sm font-black text-[#5B4FC4]">{grade} ({gradePoint.toFixed(2)})</span>
              </div>
            </div>
          </div>

          {/* Academic Progression History Section */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#F47B20]" />
                <span className="font-black text-gray-800 uppercase tracking-wider text-[11px]">
                  Academic Performance History ({progressionResult.programmeType} Programme)
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-[#E8601C]">
                Chronological Semesters
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 uppercase text-[9px] font-bold border-b border-gray-200 tracking-wider">
                    <th className="py-2 px-3">Academic Level</th>
                    <th className="py-2 px-3">Semester</th>
                    <th className="py-2 px-3 text-center">Credit Units</th>
                    <th className="py-2 px-3 text-center">Quality Points</th>
                    <th className="py-2 px-3 text-center bg-orange-50/50 text-[#E8601C]">GPA</th>
                    <th className="py-2 px-3 text-center bg-purple-50/50 text-[#5B4FC4]">Cumulative CGPA</th>
                    <th className="py-2 px-3 text-center">Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {progressionResult.history.map((hist, idx) => (
                    <tr key={idx} className={hist.isCurrent ? 'bg-orange-50/40 font-bold' : 'hover:bg-gray-50'}>
                      <td className="py-2 px-3 font-bold text-gray-900">
                        {hist.level}
                        {hist.isCurrent && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] bg-[#F47B20] text-white">
                            Current
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-gray-700">{hist.semesterLabel}</td>
                      <td className="py-2 px-3 text-center text-gray-800">{hist.creditUnits}</td>
                      <td className="py-2 px-3 text-center text-gray-600">{hist.qualityPoints.toFixed(1)}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-[#E8601C] bg-orange-50/30">
                        {hist.gpa.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-black text-[#5B4FC4] bg-purple-50/30">
                        {hist.cgpa.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {computeClassification(hist.cgpa)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cumulative Formula Explanation */}
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-center font-mono text-[11px] text-amber-950">
            Weighted Formula: Cumulative CGPA = Total Quality Points ({progressionResult.cumulativeQualityPoints.toFixed(1)}) ÷ Total Attempted Credit Units ({progressionResult.cumulativeCreditUnits}) = <strong>{progressionResult.cumulativeCgpa.toFixed(2)}</strong>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#1A1A2E] hover:bg-[#2D2D44] text-white font-bold text-xs rounded-lg transition cursor-pointer"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};

