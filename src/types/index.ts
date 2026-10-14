export type UserRole = 
  | 'super_admin' 
  | 'registrar' 
  | 'exam_officer' 
  | 'hod' 
  | 'lecturer' 
  | 'student';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone?: string;
  department?: string;
  assignedCourse?: string;
  assignedCourses?: string[];
  profilePhoto?: string;
  isActive: boolean;
  status?: 'Active' | 'Inactive' | 'Suspended';
  mustChangePassword?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface StudentRecord {
  id: string;
  uid?: string;
  matricNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: 'Male' | 'Female';
  dateOfBirth?: string;
  stateOfOrigin: string;
  lga: string;
  address?: string;
  phone: string;
  email: string;
  passportPhoto?: string;
  programme: string; // e.g., "ND in Community Health Technology"
  programmeCode: 'CHT' | 'HLT' | 'PBH' | 'CHTHND';
  department: string;
  level: 'ND1' | 'ND2' | 'HND1' | 'HND2';
  year?: 1 | 2; // Academic year (Year 1 or Year 2)
  previousCgpa?: number; // Previous CGPA carried forward from Year 1
  previousCreditUnits?: number; // Total credit units completed previously
  previousQualityPoints?: number; // Total quality points earned previously
  admissionYear: string;
  currentSession: string; // e.g., "2025/2026"
  currentSemester: '1st Semester' | '2nd Semester';
  status: 'active' | 'graduated' | 'withdrawn' | 'suspended' | 'deferred';
  clearanceStatus: {
    bursary: boolean;
    library: boolean;
    department: boolean;
  };
  nextOfKin?: {
    name: string;
    relationship: string;
    phone: string;
    address: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface Programme {
  id: string;
  name: string;
  code: string; // "CHT" | "HLT" | "PBH"
  degreeType: 'ND' | 'HND';
  duration: number; // e.g., 2
  department: string;
  isActive: boolean;
}

export interface Course {
  id: string;
  courseCode: string; // "CHT 101"
  courseTitle: string;
  creditUnit: number;
  courseType: 'Core' | 'Elective' | 'General Studies';
  programme: string;
  programmeCode?: string;
  level: 'ND1' | 'ND2' | 'HND1' | 'HND2';
  semester: '1st Semester' | '2nd Semester';
  caWeight: number; // usually 30
  examWeight: number; // usually 70
  prerequisite?: string | null;
  lecturerId?: string;
  lecturerName?: string;
  isActive: boolean;
}

export interface CourseRegistration {
  id: string;
  studentId: string;
  matricNumber: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  creditUnit: number;
  session: string;
  semester: '1st Semester' | '2nd Semester';
  level: string;
  registeredAt: string;
  status: 'registered' | 'dropped';
}

export type ResultApprovalStatus = 
  | 'draft' 
  | 'submitted' 
  | 'hod_approved' 
  | 'exam_officer_approved' 
  | 'published';

export interface ResultScore {
  id: string;
  studentId: string;
  matricNumber: string;
  studentName?: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  creditUnit: number;
  session: string;
  semester: '1st Semester' | '2nd Semester';
  level: string;
  programme: string;
  caScore: number; // 0-30
  examScore: number; // 0-70
  totalScore: number; // ca + exam
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  gradePoint: number; // 4.0, 3.5, 3.0, 2.5, 2.0, 0.0
  qualityPoint: number; // gradePoint * creditUnit
  remark: 'Pass' | 'Fail';
  isCarryover: boolean;
  enteredBy: string; // lecturerId
  status: ResultApprovalStatus;
  rejectionReason?: string;
  approvals: {
    hod?: { approved: boolean; by: string; date: string; signature?: string; comments?: string };
    examOfficer?: { approved: boolean; by: string; date: string; signature?: string; comments?: string };
    registrar?: { approved: boolean; by: string; date: string; signature?: string };
  };
  createdAt: string;
  updatedAt?: string;
}

export interface SemesterResultSummary {
  id: string;
  studentId: string;
  matricNumber: string;
  studentName?: string;
  session: string;
  semester: '1st Semester' | '2nd Semester';
  level: string;
  programme: string;
  totalCreditUnits: number;
  totalQualityPoints: number;
  gpa: number;
  cgpa: number;
  previousCgpa?: number;
  previousCreditUnits?: number;
  previousQualityPoints?: number;
  currentGpa?: number;
  currentCgpa?: number;
  totalCreditUnitsCumulative: number;
  totalQualityPointsCumulative: number;
  remark: 'Pass' | 'Probation' | 'Withdraw';
  classification: 'Distinction' | 'Upper Credit' | 'Lower Credit' | 'Pass' | 'Fail';
}

export interface AcademicSession {
  id: string;
  name: string; // "2025/2026"
  isCurrent: boolean;
  currentSemester: '1st Semester' | '2nd Semester';
  registrationOpen: boolean;
  resultEntryOpen: boolean;
  startDate?: string;
  endDate?: string;
}

export interface DigitalSignature {
  id: string;
  userId: string;
  role: 'exam_officer' | 'hod' | 'registrar';
  signatureImage: string; // data URL or Storage URL
  name: string;
  title: string;
  uploadedAt: string;
}

export interface ResultPin {
  id: string;
  pin: string; // e.g. "MET-9842-1049-5501"
  serialNumber: string; // e.g. "SN-2026-0001"
  studentId?: string | null;
  studentMatric?: string | null;
  isUsed: boolean;
  usedAt?: string | null;
  session: string;
  semester: string;
  generatedBy: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  description: string;
  targetCollection?: string;
  targetDocumentId?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface SystemSettings {
  schoolName: string;
  motto: string;
  currentSession: string;
  currentSemester: '1st Semester' | '2nd Semester';
  caMax: number;
  examMax: number;
  matricYearPrefix: string;
  resultPublished: boolean;
  maintenanceMode: boolean;
}
