import React from 'react';
import { Course, StudentRecord } from '../../types';
import { computeGrade, computeProgressionCGPA, computeClassification } from '../../utils/academic';
import { 
  Calculator, 
  X, 
  TrendingUp, 
  GraduationCap, 
  Sparkles, 
  BookOpen, 
  CheckCircle2,
  Layers
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
  const isYear2 = student.level === 'ND2' || student.level === 'HND2' || student.year === 2;
  const totalScore = Math.min(100, Math.max(0, Number(caScore || 0) + Number(examScore || 0)));
  const { grade, gradePoint, remark } = computeGrade(totalScore);
  const currentQP = parseFloat((gradePoint * course.creditUnit).toFixed(2));

  const progression = computeProgressionCGPA(
    student,
    course.creditUnit,
    currentQP
  );

  const classification = computeClassification(progression.cumulativeCgpa);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden max-h-[92vh] flex flex-col">
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
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Student Profile Card */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Programme</span>
              <span className="font-bold text-gray-900 truncate block">{student.programme}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Current Academic Level</span>
              <span className="font-black text-[#F47B20]">{progression.levelLabel}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Academic Year</span>
              <span className="font-bold text-gray-800">{isYear2 ? 'Year 2 of 2' : 'Year 1 of 2'}</span>
            </div>
          </div>

          {/* 1. PREVIOUS RECORD (YEAR 1) */}
          <div className="border border-amber-200 bg-amber-50/60 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 uppercase text-[11px] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#F47B20]" />
                1. Previous Academic Record (Year 1)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-200/80 text-amber-900">
                {isYear2 ? 'Year 1 Cumulative Baseline' : 'First Year of Study'}
              </span>
            </div>

            {isYear2 ? (
              <div className="grid grid-cols-3 gap-3 text-center pt-1">
                <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Year 1 Units</span>
                  <span className="text-base font-black text-gray-900">{progression.previousUnits} CU</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Year 1 Quality Points</span>
                  <span className="text-base font-black text-gray-900">{progression.previousQualityPoints.toFixed(2)}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-[#F47B20]/40 shadow-xs">
                  <span className="text-[10px] text-[#F47B20] uppercase font-bold block">Previous CGPA</span>
                  <span className="text-lg font-black text-amber-900">{progression.previousCgpa.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-[11px] italic">
                Student is in Year 1. Previous CGPA is not applicable as this is their inaugural academic year.
              </p>
            )}
          </div>

          {/* 2. CURRENT COURSE SCORE */}
          <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 uppercase text-[11px] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-700" />
                2. Current Course Performance ({course.courseCode})
              </span>
              <span className="text-[11px] text-blue-800 font-bold">{course.creditUnit} Credit Units</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center pt-1">
              <div className="bg-white p-2 rounded-lg border border-blue-100">
                <span className="text-[10px] text-gray-400 font-semibold block">CA (30)</span>
                <span className="text-sm font-bold text-gray-900">{caScore}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-blue-100">
                <span className="text-[10px] text-gray-400 font-semibold block">Exam (70)</span>
                <span className="text-sm font-bold text-gray-900">{examScore}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-blue-100">
                <span className="text-[10px] text-gray-400 font-semibold block">Total (100)</span>
                <span className="text-sm font-black text-gray-900">{totalScore}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-blue-100">
                <span className="text-[10px] text-gray-400 font-semibold block">Grade (GP)</span>
                <span className="text-sm font-black text-[#5B4FC4]">{grade} ({gradePoint.toFixed(2)})</span>
              </div>
            </div>
          </div>

          {/* 3. CONTINUOUS CUMULATIVE CGPA RESULT */}
          <div className="p-5 bg-gradient-to-br from-purple-50 via-white to-orange-50 border-2 border-[#5B4FC4]/40 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-950 uppercase text-[11px] flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#5B4FC4]" />
                3. Continuous Cumulative CGPA Calculation
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#5B4FC4] text-white">
                {classification}
              </span>
            </div>

            {/* Formula display */}
            <div className="p-3 bg-white/90 border border-purple-200 rounded-lg text-center font-mono text-[11px] text-purple-900">
              {isYear2 ? (
                <>
                  CGPA = ({progression.previousQualityPoints.toFixed(2)} + {currentQP.toFixed(2)}) ÷ ({progression.previousUnits} + {course.creditUnit}) = <strong>{progression.cumulativeCgpa.toFixed(2)}</strong>
                </>
              ) : (
                <>
                  GPA = {currentQP.toFixed(2)} ÷ {course.creditUnit} = <strong>{progression.cumulativeCgpa.toFixed(2)}</strong>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">
                  {isYear2 ? 'Previous CGPA' : 'Previous Status'}
                </span>
                <span className="text-lg font-black text-amber-900 mt-0.5 block">
                  {isYear2 ? progression.previousCgpa.toFixed(2) : 'N/A'}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">
                  Current Course GP
                </span>
                <span className="text-lg font-black text-[#E8601C] mt-0.5 block">
                  {gradePoint.toFixed(2)}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border-2 border-[#5B4FC4] shadow-xs col-span-2 sm:col-span-1">
                <span className="text-[10px] text-[#5B4FC4] uppercase font-bold block">
                  Current Cumulative CGPA
                </span>
                <span className="text-2xl font-black text-[#5B4FC4] mt-0.5 block">
                  {progression.cumulativeCgpa.toFixed(2)}
                </span>
              </div>
            </div>
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
