import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Programme, 
  Course, 
  StudentRecord, 
  ResultScore, 
  ResultApprovalStatus,
  AcademicSession, 
  DigitalSignature, 
  ResultPin, 
  AuditLogItem, 
  SystemSettings, 
  CourseRegistration, 
  SemesterResultSummary, 
  UserRole,
  UserProfile 
} from '../types';
import { computeGrade, computeClassification, computeAcademicStanding, generatePinCode, generatePinSerial, generateMatricNumber } from '../utils/academic';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc 
} from 'firebase/firestore';

// Default initial seeded programmes
const INITIAL_PROGRAMMES: Programme[] = [
  {
    id: 'prog_cht_nd',
    name: 'ND in Community Health Technology',
    code: 'CHT',
    degreeType: 'ND',
    duration: 2,
    department: 'Community Health Technology',
    isActive: true
  },
  {
    id: 'prog_hlt_nd',
    name: 'ND in Health Technician',
    code: 'HLT',
    degreeType: 'ND',
    duration: 2,
    department: 'Health Technician',
    isActive: true
  },
  {
    id: 'prog_pbh_nd',
    name: 'ND in Public Health',
    code: 'PBH',
    degreeType: 'ND',
    duration: 2,
    department: 'Public Health',
    isActive: true
  },
  {
    id: 'prog_cht_hnd',
    name: 'HND in Community Health Technology',
    code: 'CHT',
    degreeType: 'HND',
    duration: 2,
    department: 'Community Health Technology',
    isActive: true
  }
];

// Default initial seeded courses
const INITIAL_COURSES: Course[] = [
  {
    id: 'course_cht101',
    courseCode: 'CHT 101',
    courseTitle: 'Introduction to Community Health',
    creditUnit: 3,
    courseType: 'Core',
    programme: 'ND in Community Health Technology',
    programmeCode: 'CHT',
    level: 'ND1',
    semester: '1st Semester',
    caWeight: 30,
    examWeight: 70,
    prerequisite: null,
    lecturerId: 'lecturer_001',
    lecturerName: 'Dr. Amina Bello',
    isActive: true
  },
  {
    id: 'course_cht103',
    courseCode: 'CHT 103',
    courseTitle: 'Primary Health Care & Practice',
    creditUnit: 2,
    courseType: 'Core',
    programme: 'ND in Community Health Technology',
    programmeCode: 'CHT',
    level: 'ND1',
    semester: '1st Semester',
    caWeight: 30,
    examWeight: 70,
    prerequisite: null,
    lecturerId: 'lecturer_001',
    lecturerName: 'Dr. Amina Bello',
    isActive: true
  },
  {
    id: 'course_cht105',
    courseCode: 'CHT 105',
    courseTitle: 'Anatomy & Physiology I',
    creditUnit: 3,
    courseType: 'Core',
    programme: 'ND in Community Health Technology',
    programmeCode: 'CHT',
    level: 'ND1',
    semester: '1st Semester',
    caWeight: 30,
    examWeight: 70,
    prerequisite: null,
    lecturerId: 'lecturer_001',
    lecturerName: 'Dr. Amina Bello',
    isActive: true
  },
  {
    id: 'course_cht107',
    courseCode: 'CHT 107',
    courseTitle: 'Health Education & Promotion',
    creditUnit: 2,
    courseType: 'Core',
    programme: 'ND in Community Health Technology',
    programmeCode: 'CHT',
    level: 'ND1',
    semester: '1st Semester',
    caWeight: 30,
    examWeight: 70,
    prerequisite: null,
    lecturerId: 'lecturer_002',
    lecturerName: 'Mallam S. Usman',
    isActive: true
  },
  {
    id: 'course_gns101',
    courseCode: 'GNS 101',
    courseTitle: 'Use of English I',
    creditUnit: 2,
    courseType: 'General Studies',
    programme: 'ND in Community Health Technology',
    programmeCode: 'CHT',
    level: 'ND1',
    semester: '1st Semester',
    caWeight: 30,
    examWeight: 70,
    prerequisite: null,
    lecturerId: 'lecturer_003',
    lecturerName: 'Mrs. C. Okeke',
    isActive: true
  },
  {
    id: 'course_gns103',
    courseCode: 'GNS 103',
    courseTitle: 'Citizenship Education I',
    creditUnit: 2,
    courseType: 'General Studies',
    programme: 'ND in Community Health Technology',
    programmeCode: 'CHT',
    level: 'ND1',
    semester: '1st Semester',
    caWeight: 30,
    examWeight: 70,
    prerequisite: null,
    lecturerId: 'lecturer_003',
    lecturerName: 'Mrs. C. Okeke',
    isActive: true
  },
  {
    id: 'course_gns105',
    courseCode: 'GNS 105',
    courseTitle: 'Introduction to Computer Science',
    creditUnit: 2,
    courseType: 'General Studies',
    programme: 'ND in Community Health Technology',
    programmeCode: 'CHT',
    level: 'ND1',
    semester: '1st Semester',
    caWeight: 30,
    examWeight: 70,
    prerequisite: null,
    lecturerId: 'lecturer_004',
    lecturerName: 'Engr. D. Adeleke',
    isActive: true
  },
  // Public health sample courses
  {
    id: 'course_pbh101',
    courseCode: 'PBH 101',
    courseTitle: 'Fundamentals of Public Health',
    creditUnit: 3,
    courseType: 'Core',
    programme: 'ND in Public Health',
    programmeCode: 'PBH',
    level: 'ND1',
    semester: '1st Semester',
    caWeight: 30,
    examWeight: 70,
    prerequisite: null,
    lecturerId: 'lecturer_001',
    lecturerName: 'Dr. Amina Bello',
    isActive: true
  },
  // Health technician sample courses
  {
    id: 'course_hlt101',
    courseCode: 'HLT 101',
    courseTitle: 'Basic Clinical Procedures',
    creditUnit: 3,
    courseType: 'Core',
    programme: 'ND in Health Technician',
    programmeCode: 'HLT',
    level: 'ND1',
    semester: '1st Semester',
    caWeight: 30,
    examWeight: 70,
    prerequisite: null,
    lecturerId: 'lecturer_002',
    lecturerName: 'Mallam S. Usman',
    isActive: true
  },
  // Year 2 Courses (ND2)
  {
    id: 'course_cht201',
    courseCode: 'CHT 201',
    courseTitle: 'Community Health Management & Field Practicum',
    creditUnit: 3,
    courseType: 'Core',
    programme: 'ND in Community Health Technology',
    programmeCode: 'CHT',
    level: 'ND2',
    semester: '1st Semester',
    caWeight: 30,
    examWeight: 70,
    prerequisite: 'CHT 101',
    lecturerId: 'lecturer_001',
    lecturerName: 'Dr. Amina Bello',
    isActive: true
  },
  {
    id: 'course_cht203',
    courseCode: 'CHT 203',
    courseTitle: 'Maternal, Child Health & Family Planning',
    creditUnit: 3,
    courseType: 'Core',
    programme: 'ND in Community Health Technology',
    programmeCode: 'CHT',
    level: 'ND2',
    semester: '1st Semester',
    caWeight: 30,
    examWeight: 70,
    prerequisite: 'CHT 103',
    lecturerId: 'lecturer_001',
    lecturerName: 'Dr. Amina Bello',
    isActive: true
  },
  {
    id: 'course_hlt201',
    courseCode: 'HLT 201',
    courseTitle: 'Advanced Clinical Diagnostic Procedures',
    creditUnit: 3,
    courseType: 'Core',
    programme: 'ND in Health Technician',
    programmeCode: 'HLT',
    level: 'ND2',
    semester: '1st Semester',
    caWeight: 30,
    examWeight: 70,
    prerequisite: 'HLT 101',
    lecturerId: 'lecturer_002',
    lecturerName: 'Mallam S. Usman',
    isActive: true
  }
];

// Initial seeded students
const INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: 'student_001',
    uid: 'student_001',
    matricNumber: '26/MET/CHT/001',
    firstName: 'John',
    middleName: 'Chukwuemeka',
    lastName: 'Doe',
    gender: 'Male',
    dateOfBirth: '2004-05-14',
    stateOfOrigin: 'Enugu',
    lga: 'Nsukka',
    address: '14 College Road, Metrolane Campus Area',
    phone: '+234 812 555 6677',
    email: 'john.doe@student.metrolane.edu.ng',
    programme: 'ND in Community Health Technology',
    programmeCode: 'CHT',
    department: 'Community Health Technology',
    level: 'ND1',
    admissionYear: '2026',
    currentSession: '2025/2026',
    currentSemester: '1st Semester',
    status: 'active',
    clearanceStatus: {
      bursary: true,
      library: true,
      department: true
    },
    nextOfKin: {
      name: 'Elder Jude Doe',
      relationship: 'Father',
      phone: '+234 803 999 8811',
      address: 'Enugu City'
    },
    createdAt: '2026-01-10T10:00:00Z'
  },
  {
    id: 'student_002',
    uid: 'student_002',
    matricNumber: '26/MET/CHT/002',
    firstName: 'Fatima',
    middleName: 'Zarah',
    lastName: 'Mohammed',
    gender: 'Female',
    dateOfBirth: '2005-02-20',
    stateOfOrigin: 'Kaduna',
    lga: 'Zaria',
    address: '8 Sultan Close, Kaduna',
    phone: '+234 809 333 4455',
    email: 'fatima.mohammed@student.metrolane.edu.ng',
    programme: 'ND in Community Health Technology',
    programmeCode: 'CHT',
    department: 'Community Health Technology',
    level: 'ND1',
    admissionYear: '2026',
    currentSession: '2025/2026',
    currentSemester: '1st Semester',
    status: 'active',
    clearanceStatus: {
      bursary: true,
      library: true,
      department: true
    },
    createdAt: '2026-01-11T10:00:00Z'
  },
  {
    id: 'student_003',
    uid: 'student_003',
    matricNumber: '26/MET/HLT/001',
    firstName: 'Blessing',
    middleName: 'Oluwaseun',
    lastName: 'Adekunle',
    gender: 'Female',
    dateOfBirth: '2003-11-09',
    stateOfOrigin: 'Oyo',
    lga: 'Ibadan North',
    address: '22 Ring Road, Ibadan',
    phone: '+234 814 222 1199',
    email: 'blessing.adekunle@student.metrolane.edu.ng',
    programme: 'ND in Health Technician',
    programmeCode: 'HLT',
    department: 'Health Technician',
    level: 'ND1',
    admissionYear: '2026',
    currentSession: '2025/2026',
    currentSemester: '1st Semester',
    status: 'active',
    clearanceStatus: {
      bursary: true,
      library: true,
      department: false
    },
    createdAt: '2026-01-12T10:00:00Z'
  },
  {
    id: 'student_004',
    uid: 'student_004',
    matricNumber: '26/MET/PBH/001',
    firstName: 'Emmanuel',
    middleName: 'Chidubem',
    lastName: 'Okafor',
    gender: 'Male',
    dateOfBirth: '2004-08-17',
    stateOfOrigin: 'Anambra',
    lga: 'Awka South',
    address: '5 Health Lane, Awka',
    phone: '+234 817 999 1234',
    email: 'emmanuel.okafor@student.metrolane.edu.ng',
    programme: 'ND in Public Health',
    programmeCode: 'PBH',
    department: 'Public Health',
    level: 'ND1',
    admissionYear: '2026',
    currentSession: '2025/2026',
    currentSemester: '1st Semester',
    status: 'active',
    clearanceStatus: {
      bursary: true,
      library: true,
      department: true
    },
    createdAt: '2026-01-12T11:00:00Z'
  },
  {
    id: 'student_005',
    uid: 'student_005',
    matricNumber: '25/MET/CHT/008',
    firstName: 'Musa',
    middleName: 'Ibrahim',
    lastName: 'Garba',
    gender: 'Male',
    dateOfBirth: '2003-04-12',
    stateOfOrigin: 'Kano',
    lga: 'Nasarawa',
    address: '18 Campus View Road, Metrolane',
    phone: '+234 802 333 7788',
    email: 'musa.garba@student.metrolane.edu.ng',
    programme: 'ND in Community Health Technology',
    programmeCode: 'CHT',
    department: 'Community Health Technology',
    level: 'ND2',
    year: 2,
    previousCgpa: 3.42,
    previousCreditUnits: 36,
    previousQualityPoints: 123.12,
    admissionYear: '2025',
    currentSession: '2025/2026',
    currentSemester: '1st Semester',
    status: 'active',
    clearanceStatus: {
      bursary: true,
      library: true,
      department: true
    },
    createdAt: '2025-01-10T10:00:00Z'
  }
];

// Initial seeded academic sessions
const INITIAL_SESSIONS: AcademicSession[] = [
  {
    id: 'session_2025_2026',
    name: '2025/2026',
    isCurrent: true,
    currentSemester: '1st Semester',
    registrationOpen: true,
    resultEntryOpen: true,
    startDate: '2025-10-01',
    endDate: '2026-08-30'
  },
  {
    id: 'session_2024_2025',
    name: '2024/2025',
    isCurrent: false,
    currentSemester: '2nd Semester',
    registrationOpen: false,
    resultEntryOpen: false,
    startDate: '2024-10-01',
    endDate: '2025-08-30'
  }
];

// Seeded digital signatures
const INITIAL_SIGNATURES: DigitalSignature[] = [
  {
    id: 'sig_exam_officer',
    userId: 'exam_officer_001',
    role: 'exam_officer',
    name: 'Dr. (Mrs) Folashade Adeyemi',
    title: 'Examination Officer',
    signatureImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M10 40 Q 50 10, 80 35 T 150 25 T 190 35" fill="none" stroke="%231A1A2E" stroke-width="2.5"/><text x="110" y="52" font-size="10" font-family="sans-serif" fill="%23757575">Adeyemi F.</text></svg>',
    uploadedAt: '2026-01-05T09:00:00Z'
  },
  {
    id: 'sig_hod',
    userId: 'hod_cht_001',
    role: 'hod',
    name: 'Dr. Ibrahim Al-Hassan',
    title: 'Head of Department',
    signatureImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M15 45 Q 60 5, 95 30 T 140 15 T 185 40" fill="none" stroke="%231A1A2E" stroke-width="2.5"/><text x="100" y="52" font-size="10" font-family="sans-serif" fill="%23757575">I. Al-Hassan</text></svg>',
    uploadedAt: '2026-01-05T09:15:00Z'
  },
  {
    id: 'sig_registrar',
    userId: 'registrar_001',
    role: 'registrar',
    name: 'Barr. M. O. Danladi',
    title: 'College Registrar',
    signatureImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M20 35 Q 40 5, 70 25 T 130 10 T 180 30" fill="none" stroke="%231A1A2E" stroke-width="2.5"/><text x="120" y="50" font-size="10" font-family="sans-serif" fill="%23757575">M. O. Danladi</text></svg>',
    uploadedAt: '2026-01-05T09:30:00Z'
  }
];

// Initial pre-generated scratch PINs
const INITIAL_PINS: ResultPin[] = [
  {
    id: 'pin_001',
    pin: 'MET-8429-1052-7734',
    serialNumber: 'SN-2026-0001',
    studentId: 'student_001',
    studentMatric: '26/MET/CHT/001',
    isUsed: true,
    usedAt: '2026-02-15T14:20:00Z',
    session: '2025/2026',
    semester: '1st Semester',
    generatedBy: 'exam_officer_001',
    createdAt: '2026-01-20T08:00:00Z'
  },
  {
    id: 'pin_002',
    pin: 'MET-9301-4412-8821',
    serialNumber: 'SN-2026-0002',
    studentId: null,
    isUsed: false,
    session: '2025/2026',
    semester: '1st Semester',
    generatedBy: 'exam_officer_001',
    createdAt: '2026-01-20T08:00:00Z'
  },
  {
    id: 'pin_003',
    pin: 'MET-4192-8021-3310',
    serialNumber: 'SN-2026-0003',
    studentId: null,
    isUsed: false,
    session: '2025/2026',
    semester: '1st Semester',
    generatedBy: 'exam_officer_001',
    createdAt: '2026-01-20T08:00:00Z'
  },
  {
    id: 'pin_004',
    pin: 'MET-6571-9234-1188',
    serialNumber: 'SN-2026-0004',
    studentId: null,
    isUsed: false,
    session: '2025/2026',
    semester: '1st Semester',
    generatedBy: 'exam_officer_001',
    createdAt: '2026-01-20T08:00:00Z'
  }
];

// Initial course results for John Doe (26/MET/CHT/001)
const INITIAL_RESULTS: ResultScore[] = [
  {
    id: 'res_001',
    studentId: 'student_001',
    matricNumber: '26/MET/CHT/001',
    studentName: 'John Chukwuemeka Doe',
    courseId: 'course_cht101',
    courseCode: 'CHT 101',
    courseTitle: 'Introduction to Community Health',
    creditUnit: 3,
    session: '2025/2026',
    semester: '1st Semester',
    level: 'ND1',
    programme: 'ND in Community Health Technology',
    caScore: 24,
    examScore: 56,
    totalScore: 80,
    grade: 'A',
    gradePoint: 4.00,
    qualityPoint: 12.00,
    remark: 'Pass',
    isCarryover: false,
    enteredBy: 'lecturer_001',
    status: 'published',
    approvals: {
      hod: { approved: true, by: 'Dr. Ibrahim Al-Hassan', date: '2026-02-10T11:00:00Z' },
      examOfficer: { approved: true, by: 'Dr. (Mrs) Folashade Adeyemi', date: '2026-02-12T14:00:00Z' },
      registrar: { approved: true, by: 'Barr. M. O. Danladi', date: '2026-02-14T09:00:00Z' }
    },
    createdAt: '2026-02-05T10:00:00Z'
  },
  {
    id: 'res_002',
    studentId: 'student_001',
    matricNumber: '26/MET/CHT/001',
    studentName: 'John Chukwuemeka Doe',
    courseId: 'course_cht103',
    courseCode: 'CHT 103',
    courseTitle: 'Primary Health Care & Practice',
    creditUnit: 2,
    session: '2025/2026',
    semester: '1st Semester',
    level: 'ND1',
    programme: 'ND in Community Health Technology',
    caScore: 21,
    examScore: 48,
    totalScore: 69,
    grade: 'B',
    gradePoint: 3.50,
    qualityPoint: 7.00,
    remark: 'Pass',
    isCarryover: false,
    enteredBy: 'lecturer_001',
    status: 'published',
    approvals: {
      hod: { approved: true, by: 'Dr. Ibrahim Al-Hassan', date: '2026-02-10T11:00:00Z' },
      examOfficer: { approved: true, by: 'Dr. (Mrs) Folashade Adeyemi', date: '2026-02-12T14:00:00Z' },
      registrar: { approved: true, by: 'Barr. M. O. Danladi', date: '2026-02-14T09:00:00Z' }
    },
    createdAt: '2026-02-05T10:15:00Z'
  },
  {
    id: 'res_003',
    studentId: 'student_001',
    matricNumber: '26/MET/CHT/001',
    studentName: 'John Chukwuemeka Doe',
    courseId: 'course_cht105',
    courseCode: 'CHT 105',
    courseTitle: 'Anatomy & Physiology I',
    creditUnit: 3,
    session: '2025/2026',
    semester: '1st Semester',
    level: 'ND1',
    programme: 'ND in Community Health Technology',
    caScore: 22,
    examScore: 50,
    totalScore: 72,
    grade: 'A',
    gradePoint: 4.00,
    qualityPoint: 12.00,
    remark: 'Pass',
    isCarryover: false,
    enteredBy: 'lecturer_001',
    status: 'published',
    approvals: {
      hod: { approved: true, by: 'Dr. Ibrahim Al-Hassan', date: '2026-02-10T11:00:00Z' },
      examOfficer: { approved: true, by: 'Dr. (Mrs) Folashade Adeyemi', date: '2026-02-12T14:00:00Z' },
      registrar: { approved: true, by: 'Barr. M. O. Danladi', date: '2026-02-14T09:00:00Z' }
    },
    createdAt: '2026-02-05T10:30:00Z'
  },
  {
    id: 'res_004',
    studentId: 'student_001',
    matricNumber: '26/MET/CHT/001',
    studentName: 'John Chukwuemeka Doe',
    courseId: 'course_gns101',
    courseCode: 'GNS 101',
    courseTitle: 'Use of English I',
    creditUnit: 2,
    session: '2025/2026',
    semester: '1st Semester',
    level: 'ND1',
    programme: 'ND in Community Health Technology',
    caScore: 18,
    examScore: 40,
    totalScore: 58,
    grade: 'C',
    gradePoint: 3.00,
    qualityPoint: 6.00,
    remark: 'Pass',
    isCarryover: false,
    enteredBy: 'lecturer_003',
    status: 'published',
    approvals: {
      hod: { approved: true, by: 'Dr. Ibrahim Al-Hassan', date: '2026-02-10T11:00:00Z' },
      examOfficer: { approved: true, by: 'Dr. (Mrs) Folashade Adeyemi', date: '2026-02-12T14:00:00Z' },
      registrar: { approved: true, by: 'Barr. M. O. Danladi', date: '2026-02-14T09:00:00Z' }
    },
    createdAt: '2026-02-05T11:00:00Z'
  },
  {
    id: 'res_005',
    studentId: 'student_002',
    matricNumber: '26/MET/CHT/002',
    studentName: 'Fatima Zarah Mohammed',
    courseId: 'course_cht101',
    courseCode: 'CHT 101',
    courseTitle: 'Introduction to Community Health',
    creditUnit: 3,
    session: '2025/2026',
    semester: '1st Semester',
    level: 'ND1',
    programme: 'ND in Community Health Technology',
    caScore: 26,
    examScore: 61,
    totalScore: 87,
    grade: 'A',
    gradePoint: 4.00,
    qualityPoint: 12.00,
    remark: 'Pass',
    isCarryover: false,
    enteredBy: 'lecturer_001',
    status: 'submitted', // Ready for HOD review!
    approvals: {},
    createdAt: '2026-02-06T10:00:00Z'
  }
];

// Initial course registrations
const INITIAL_REGISTRATIONS: CourseRegistration[] = [
  {
    id: 'reg_001',
    studentId: 'student_001',
    matricNumber: '26/MET/CHT/001',
    courseId: 'course_cht101',
    courseCode: 'CHT 101',
    courseTitle: 'Introduction to Community Health',
    creditUnit: 3,
    session: '2025/2026',
    semester: '1st Semester',
    level: 'ND1',
    registeredAt: '2026-01-15T09:00:00Z',
    status: 'registered'
  },
  {
    id: 'reg_002',
    studentId: 'student_001',
    matricNumber: '26/MET/CHT/001',
    courseId: 'course_cht103',
    courseCode: 'CHT 103',
    courseTitle: 'Primary Health Care & Practice',
    creditUnit: 2,
    session: '2025/2026',
    semester: '1st Semester',
    level: 'ND1',
    registeredAt: '2026-01-15T09:00:00Z',
    status: 'registered'
  },
  {
    id: 'reg_003',
    studentId: 'student_001',
    matricNumber: '26/MET/CHT/001',
    courseId: 'course_cht105',
    courseCode: 'CHT 105',
    courseTitle: 'Anatomy & Physiology I',
    creditUnit: 3,
    session: '2025/2026',
    semester: '1st Semester',
    level: 'ND1',
    registeredAt: '2026-01-15T09:00:00Z',
    status: 'registered'
  },
  {
    id: 'reg_004',
    studentId: 'student_001',
    matricNumber: '26/MET/CHT/001',
    courseId: 'course_gns101',
    courseCode: 'GNS 101',
    courseTitle: 'Use of English I',
    creditUnit: 2,
    session: '2025/2026',
    semester: '1st Semester',
    level: 'ND1',
    registeredAt: '2026-01-15T09:00:00Z',
    status: 'registered'
  },
  {
    id: 'reg_005',
    studentId: 'student_002',
    matricNumber: '26/MET/CHT/002',
    courseId: 'course_cht101',
    courseCode: 'CHT 101',
    courseTitle: 'Introduction to Community Health',
    creditUnit: 3,
    session: '2025/2026',
    semester: '1st Semester',
    level: 'ND1',
    registeredAt: '2026-01-15T09:30:00Z',
    status: 'registered'
  },
  {
    id: 'reg_006',
    studentId: 'student_005',
    matricNumber: '25/MET/CHT/008',
    courseId: 'course_cht201',
    courseCode: 'CHT 201',
    courseTitle: 'Community Health Management & Field Practicum',
    creditUnit: 3,
    session: '2025/2026',
    semester: '1st Semester',
    level: 'ND2',
    registeredAt: '2026-01-15T10:00:00Z',
    status: 'registered'
  }
];

const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'audit_001',
    userId: 'super_admin_001',
    userName: 'Super Admin',
    role: 'super_admin',
    action: 'SYSTEM_INITIALIZATION',
    description: 'College database, academic programmes, and grading schemes bootstrapped.',
    timestamp: '2026-01-01T08:00:00Z'
  },
  {
    id: 'audit_002',
    userId: 'exam_officer_001',
    userName: 'Dr. Folashade Adeyemi',
    role: 'exam_officer',
    action: 'PINS_GENERATED',
    description: 'Generated batch of 4 result checking scratch PINs for 2025/2026 session.',
    timestamp: '2026-01-20T08:05:00Z'
  },
  {
    id: 'audit_003',
    userId: 'lecturer_001',
    userName: 'Dr. Amina Bello',
    role: 'lecturer',
    action: 'RESULTS_SUBMITTED',
    description: 'Submitted 1st semester results for course CHT 101 for HOD vetting.',
    timestamp: '2026-02-05T12:00:00Z'
  }
];

const INITIAL_SETTINGS: SystemSettings = {
  schoolName: 'Metrolane College of Health, Science & Technology',
  motto: 'Compassion in Health, Precision in Science, Innovation in Technology',
  currentSession: '2025/2026',
  currentSemester: '1st Semester',
  caMax: 30,
  examMax: 70,
  matricYearPrefix: '26',
  resultPublished: true,
  maintenanceMode: false
};

interface DataContextType {
  programmes: Programme[];
  courses: Course[];
  students: StudentRecord[];
  results: ResultScore[];
  sessions: AcademicSession[];
  signatures: DigitalSignature[];
  pins: ResultPin[];
  auditLogs: AuditLogItem[];
  settings: SystemSettings;
  courseRegistrations: CourseRegistration[];

  // CRUD & Operations
  addStudent: (student: Omit<StudentRecord, 'id' | 'createdAt' | 'matricNumber'> & { matricNumber?: string }) => Promise<StudentRecord>;
  enrollStudentInCourse: (studentId: string, matricNumber: string, courseId: string, session?: string, semester?: '1st Semester' | '2nd Semester', level?: string) => Promise<CourseRegistration>;
  updateStudent: (id: string, data: Partial<StudentRecord>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;

  addCourse: (course: Omit<Course, 'id'>) => Promise<Course>;
  updateCourse: (id: string, data: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;

  addProgramme: (programme: Omit<Programme, 'id'>) => Promise<Programme>;
  updateProgramme: (id: string, data: Partial<Programme>) => Promise<void>;

  saveResultScores: (scores: Partial<ResultScore>[], status?: 'draft' | 'submitted') => Promise<void>;
  approveResultScore: (resultId: string, role: 'hod' | 'exam_officer' | 'registrar', approverName: string, comments?: string) => Promise<void>;
  rejectResultScore: (resultId: string, role: 'hod' | 'exam_officer', rejectorName: string, reason: string) => Promise<void>;
  publishCourseResults: (courseId: string, session: string, semester: string) => Promise<void>;
  overrideResultScore: (resultId: string, updates: Partial<ResultScore>, adminReason: string) => Promise<void>;

  generatePinsBatch: (count: number, session: string, semester: string, generatorId: string) => Promise<ResultPin[]>;
  verifyAndRedeemPin: (pinCode: string, studentId: string, matric: string, session: string, semester: string) => Promise<{ success: boolean; message: string }>;

  saveSignature: (role: 'exam_officer' | 'hod' | 'registrar', name: string, title: string, signatureImage: string, userId: string) => Promise<void>;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  updateSession: (sessionId: string, data: Partial<AcademicSession>) => Promise<void>;
  createSession: (data: Omit<AcademicSession, 'id'>) => Promise<AcademicSession>;

  registerStudentCourses: (studentId: string, matricNumber: string, courseIds: string[], session: string, semester: '1st Semester' | '2nd Semester', level: string) => Promise<void>;
  dropStudentCourse: (registrationId: string) => Promise<void>;

  logAudit: (action: string, description: string, userRole?: string, userName?: string, userId?: string) => Promise<void>;

  computeStudentSemesterSummary: (studentId: string, session: string, semester: '1st Semester' | '2nd Semester') => SemesterResultSummary;

  users: UserProfile[];
  addUser: (data: Partial<UserProfile>) => Promise<UserProfile>;
  updateUser: (id: string, data: Partial<UserProfile>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'user_admin_001',
    email: 'metrolane.college@gmail.com',
    role: 'super_admin',
    fullName: 'Engr. Dr. A. K. Bello',
    phone: '+234 803 123 4567',
    department: 'Management Information System',
    assignedCourse: 'College MIS & Cyber Systems',
    assignedCourses: ['College MIS & Cyber Systems'],
    isActive: true,
    status: 'Active',
    createdAt: '2026-01-01T08:00:00Z'
  },
  {
    uid: 'user_reg_001',
    email: 'registrar@metrolane.edu.ng',
    role: 'registrar',
    fullName: 'Barr. M. O. Danladi',
    phone: '+234 802 987 6543',
    department: 'Registry Division',
    assignedCourse: 'Admissions & Academic Registry',
    assignedCourses: ['Admissions & Academic Registry'],
    isActive: true,
    status: 'Active',
    createdAt: '2026-01-02T08:00:00Z'
  },
  {
    uid: 'user_exam_001',
    email: 'examofficer@metrolane.edu.ng',
    role: 'exam_officer',
    fullName: 'Dr. (Mrs) Folashade Adeyemi',
    phone: '+234 805 333 4444',
    department: 'Academic Affairs & Examinations',
    assignedCourse: 'Central Examinations Directorate',
    assignedCourses: ['Central Examinations Directorate'],
    isActive: true,
    status: 'Active',
    createdAt: '2026-01-03T08:00:00Z'
  },
  {
    uid: 'user_hod_001',
    email: 'hod.cht@metrolane.edu.ng',
    role: 'hod',
    fullName: 'Dr. Ibrahim Al-Hassan',
    phone: '+234 806 777 8888',
    department: 'Community Health Technology',
    assignedCourse: 'CHT 101, CHT 103, CHT 201',
    assignedCourses: ['CHT 101', 'CHT 103', 'CHT 201'],
    isActive: true,
    status: 'Active',
    createdAt: '2026-01-04T08:00:00Z'
  },
  {
    uid: 'user_lec_001',
    email: 'amina.bello@metrolane.edu.ng',
    role: 'lecturer',
    fullName: 'Dr. Amina Bello',
    phone: '+234 808 111 2222',
    department: 'Community Health Technology',
    assignedCourse: 'CHT 101, CHT 103, CHT 105',
    assignedCourses: ['CHT 101', 'CHT 103', 'CHT 105'],
    isActive: true,
    status: 'Active',
    createdAt: '2026-01-05T08:00:00Z'
  },
  {
    uid: 'user_lec_002',
    email: 'usman.s@metrolane.edu.ng',
    role: 'lecturer',
    fullName: 'Mallam S. Usman',
    phone: '+234 807 222 3333',
    department: 'Health Technician',
    assignedCourse: 'HLT 101, HLT 103',
    assignedCourses: ['HLT 101', 'HLT 103'],
    isActive: true,
    status: 'Active',
    createdAt: '2026-01-06T08:00:00Z'
  },
  {
    uid: 'user_std_001',
    email: 'john.doe@student.metrolane.edu.ng',
    role: 'student',
    fullName: 'John Chukwuemeka Doe',
    phone: '+234 812 555 6677',
    department: 'Community Health Technology',
    assignedCourse: 'ND1 Community Health Curriculum',
    assignedCourses: ['ND1 Community Health Curriculum'],
    isActive: true,
    status: 'Active',
    createdAt: '2026-01-07T08:00:00Z'
  }
];

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Local storage assisted state for immediate zero-latency reactivity & offline tolerance
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const s = localStorage.getItem('metrolane_users');
    return s ? JSON.parse(s) : INITIAL_USERS;
  });
  const [programmes, setProgrammes] = useState<Programme[]>(() => {
    const s = localStorage.getItem('metrolane_programmes');
    return s ? JSON.parse(s) : INITIAL_PROGRAMMES;
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const s = localStorage.getItem('metrolane_courses');
    return s ? JSON.parse(s) : INITIAL_COURSES;
  });

  const [students, setStudents] = useState<StudentRecord[]>(() => {
    const s = localStorage.getItem('metrolane_students');
    return s ? JSON.parse(s) : INITIAL_STUDENTS;
  });

  const [results, setResults] = useState<ResultScore[]>(() => {
    const s = localStorage.getItem('metrolane_results');
    return s ? JSON.parse(s) : INITIAL_RESULTS;
  });

  const [sessions, setSessions] = useState<AcademicSession[]>(() => {
    const s = localStorage.getItem('metrolane_sessions');
    return s ? JSON.parse(s) : INITIAL_SESSIONS;
  });

  const [signatures, setSignatures] = useState<DigitalSignature[]>(() => {
    const s = localStorage.getItem('metrolane_signatures');
    return s ? JSON.parse(s) : INITIAL_SIGNATURES;
  });

  const [pins, setPins] = useState<ResultPin[]>(() => {
    const s = localStorage.getItem('metrolane_pins');
    return s ? JSON.parse(s) : INITIAL_PINS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    const s = localStorage.getItem('metrolane_audit_logs');
    return s ? JSON.parse(s) : INITIAL_AUDIT_LOGS;
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const s = localStorage.getItem('metrolane_settings');
    return s ? JSON.parse(s) : INITIAL_SETTINGS;
  });

  const [courseRegistrations, setCourseRegistrations] = useState<CourseRegistration[]>(() => {
    const s = localStorage.getItem('metrolane_registrations');
    return s ? JSON.parse(s) : INITIAL_REGISTRATIONS;
  });

  // Keep local storage synced for instant offline reliability
  useEffect(() => { localStorage.setItem('metrolane_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('metrolane_programmes', JSON.stringify(programmes)); }, [programmes]);
  useEffect(() => { localStorage.setItem('metrolane_courses', JSON.stringify(courses)); }, [courses]);
  useEffect(() => { localStorage.setItem('metrolane_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('metrolane_results', JSON.stringify(results)); }, [results]);
  useEffect(() => { localStorage.setItem('metrolane_sessions', JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { localStorage.setItem('metrolane_signatures', JSON.stringify(signatures)); }, [signatures]);
  useEffect(() => { localStorage.setItem('metrolane_pins', JSON.stringify(pins)); }, [pins]);
  useEffect(() => { localStorage.setItem('metrolane_audit_logs', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem('metrolane_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('metrolane_registrations', JSON.stringify(courseRegistrations)); }, [courseRegistrations]);

  // Connect to Firestore real-time snapshots with error handling
  useEffect(() => {
    const unsubStudents = onSnapshot(collection(db, 'students'), (snap) => {
      if (!snap.empty) {
        const loaded: StudentRecord[] = [];
        snap.forEach(d => loaded.push({ ...d.data(), id: d.id } as StudentRecord));
        setStudents(loaded);
      }
    }, (err) => {
      console.warn('Students listener fallback to local state:', err.message);
    });

    const unsubCourses = onSnapshot(collection(db, 'courses'), (snap) => {
      if (!snap.empty) {
        const loaded: Course[] = [];
        snap.forEach(d => loaded.push({ ...d.data(), id: d.id } as Course));
        setCourses(loaded);
      }
    }, (err) => {
      console.warn('Courses listener fallback to local state:', err.message);
    });

    const unsubResults = onSnapshot(collection(db, 'results'), (snap) => {
      if (!snap.empty) {
        const loaded: ResultScore[] = [];
        snap.forEach(d => loaded.push({ ...d.data(), id: d.id } as ResultScore));
        setResults(loaded);
      }
    }, (err) => {
      console.warn('Results listener fallback to local state:', err.message);
    });

    return () => {
      unsubStudents();
      unsubCourses();
      unsubResults();
    };
  }, []);

  const logAudit = async (
    action: string, 
    description: string, 
    userRole = 'system', 
    userName = 'System Admin', 
    userId = 'system'
  ) => {
    const newLog: AuditLogItem = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      userName,
      role: userRole,
      action,
      description,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);

    try {
      await addDoc(collection(db, 'auditLogs'), newLog);
    } catch {
      // Local state is preserved
    }
  };

  const addStudent = async (data: Omit<StudentRecord, 'id' | 'createdAt' | 'matricNumber'> & { matricNumber?: string }): Promise<StudentRecord> => {
    const admissionYear = data.admissionYear || '2026';
    const programmeCode = (data.programmeCode as any) || 'CHT';
    const sameProgCount = students.filter(s => s.programmeCode === programmeCode).length;
    const matricNumber = (data.matricNumber && data.matricNumber.trim().length > 0)
      ? data.matricNumber.trim()
      : generateMatricNumber(admissionYear, programmeCode, sameProgCount);
    
    const newStudent: StudentRecord = {
      id: `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      matricNumber,
      firstName: data.firstName || 'Student',
      lastName: data.lastName || 'Learner',
      middleName: data.middleName || '',
      gender: data.gender || 'Female',
      email: data.email || `${matricNumber.toLowerCase().replace(/[^a-z0-9]/g, '.')}@student.metrolane.edu.ng`,
      phone: data.phone || '+234 800 000 0000',
      stateOfOrigin: data.stateOfOrigin || 'Kano',
      lga: data.lga || 'Nasarawa',
      programme: data.programme || 'ND in Community Health Technology',
      programmeCode: programmeCode as any,
      department: data.department || 'Community Health Technology',
      level: data.level || 'ND1',
      year: data.year || (data.level === 'ND2' || data.level === 'HND2' ? 2 : 1),
      previousCgpa: data.previousCgpa,
      previousCreditUnits: data.previousCreditUnits,
      previousQualityPoints: data.previousQualityPoints,
      admissionYear,
      currentSession: data.currentSession || settings.currentSession,
      currentSemester: data.currentSemester || settings.currentSemester,
      status: data.status || 'active',
      clearanceStatus: data.clearanceStatus || { bursary: true, library: true, department: true },
      createdAt: new Date().toISOString()
    };

    setStudents(prev => [newStudent, ...prev.filter(s => s.matricNumber.toLowerCase() !== matricNumber.toLowerCase())]);

    try {
      await setDoc(doc(db, 'students', newStudent.id), newStudent);
    } catch {
      // local sync handles fallback
    }

    await logAudit(
      'STUDENT_REGISTERED',
      `Registered student ${newStudent.firstName} ${newStudent.lastName} with Matric No: ${matricNumber} (Level: ${newStudent.level}${newStudent.previousCgpa ? `, Prev CGPA: ${newStudent.previousCgpa}` : ''})`
    );

    return newStudent;
  };

  const enrollStudentInCourse = async (
    studentId: string, 
    matricNumber: string, 
    courseId: string, 
    session = settings.currentSession, 
    semester: '1st Semester' | '2nd Semester' = settings.currentSemester, 
    level = 'ND1'
  ): Promise<CourseRegistration> => {
    const crs = courses.find(c => c.id === courseId);
    const existing = courseRegistrations.find(
      r => (r.studentId === studentId || r.matricNumber.toLowerCase() === matricNumber.toLowerCase()) && 
           r.courseId === courseId && 
           r.session === session && 
           r.semester === semester
    );

    if (existing) {
      return existing;
    }

    const newReg: CourseRegistration = {
      id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId,
      matricNumber,
      courseId,
      courseCode: crs?.courseCode || 'CHT 101',
      courseTitle: crs?.courseTitle || 'Course Title',
      creditUnit: crs?.creditUnit || 3,
      session,
      semester,
      level: crs?.level || level,
      registeredAt: new Date().toISOString(),
      status: 'registered'
    };

    setCourseRegistrations(prev => [newReg, ...prev]);
    try {
      await setDoc(doc(db, 'courseRegistrations', newReg.id), newReg);
    } catch {
      // local sync
    }

    await logAudit('COURSE_ENROLLED', `Enrolled ${matricNumber} in ${crs?.courseCode || courseId}`);
    return newReg;
  };

  const updateStudent = async (id: string, data: Partial<StudentRecord>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s));
    try {
      await updateDoc(doc(db, 'students', id), { ...data, updatedAt: new Date().toISOString() });
    } catch {
      // Local sync fallback
    }
    await logAudit('STUDENT_UPDATED', `Updated student profile for ID: ${id}`);
  };

  const deleteStudent = async (id: string) => {
    // Soft delete / status: 'withdrawn'
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'withdrawn' } : s));
    try {
      await updateDoc(doc(db, 'students', id), { status: 'withdrawn' });
    } catch {
      // Local sync fallback
    }
    await logAudit('STUDENT_WITHDRAWN', `Soft deleted/withdrew student ID: ${id}`);
  };

  const addCourse = async (data: Omit<Course, 'id'>): Promise<Course> => {
    const newCourse: Course = {
      ...data,
      id: `crs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };
    setCourses(prev => [...prev, newCourse]);
    try {
      await setDoc(doc(db, 'courses', newCourse.id), newCourse);
    } catch {
      // local fallback
    }
    await logAudit('COURSE_CREATED', `Created course ${newCourse.courseCode} - ${newCourse.courseTitle}`);
    return newCourse;
  };

  const updateCourse = async (id: string, data: Partial<Course>) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    try {
      await updateDoc(doc(db, 'courses', id), data);
    } catch {
      // local fallback
    }
    await logAudit('COURSE_UPDATED', `Updated course ID: ${id}`);
  };

  const deleteCourse = async (id: string) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, isActive: false } : c));
    try {
      await updateDoc(doc(db, 'courses', id), { isActive: false });
    } catch {
      // local fallback
    }
    await logAudit('COURSE_DEACTIVATED', `Deactivated course ID: ${id}`);
  };

  const addProgramme = async (data: Omit<Programme, 'id'>): Promise<Programme> => {
    const newProg: Programme = {
      ...data,
      id: `prog_${Date.now()}`
    };
    setProgrammes(prev => [...prev, newProg]);
    try {
      await setDoc(doc(db, 'programmes', newProg.id), newProg);
    } catch {
      // local fallback
    }
    await logAudit('PROGRAMME_CREATED', `Added academic programme ${newProg.name}`);
    return newProg;
  };

  const updateProgramme = async (id: string, data: Partial<Programme>) => {
    setProgrammes(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    try {
      await updateDoc(doc(db, 'programmes', id), data);
    } catch {
      // local fallback
    }
  };

  const addUser = async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const assignedCourses = data.assignedCourses || (data.assignedCourse ? [data.assignedCourse] : []);
    const assignedCourse = data.assignedCourse || (assignedCourses.length > 0 ? assignedCourses.join(', ') : '');
    const newUser: UserProfile = {
      uid: data.uid || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: data.email || '',
      role: data.role || 'lecturer',
      fullName: data.fullName || '',
      phone: data.phone || '',
      department: data.department || '',
      assignedCourse,
      assignedCourses,
      isActive: data.isActive !== false,
      status: data.status || 'Active',
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [newUser, ...prev]);
    try {
      await setDoc(doc(db, 'users', newUser.uid), newUser);
    } catch {
      // local fallback
    }
    await logAudit('USER_CREATED', `Created user account for ${newUser.fullName} (${newUser.email}) - Role: ${newUser.role}`);
    return newUser;
  };

  const updateUser = async (id: string, data: Partial<UserProfile>) => {
    setUsers(prev => prev.map(u => {
      if (u.uid === id || (u as any).id === id) {
        const assignedCourses = data.assignedCourses || (data.assignedCourse ? [data.assignedCourse] : u.assignedCourses || []);
        const assignedCourse = data.assignedCourse ?? (assignedCourses.length > 0 ? assignedCourses.join(', ') : u.assignedCourse);
        return { 
          ...u, 
          ...data, 
          assignedCourse,
          assignedCourses,
          updatedAt: new Date().toISOString() 
        };
      }
      return u;
    }));
    try {
      await updateDoc(doc(db, 'users', id), { ...data, updatedAt: new Date().toISOString() });
    } catch {
      // local fallback
    }
    await logAudit('USER_UPDATED', `Updated user account details for UID: ${id}`);
  };

  const deleteUser = async (id: string) => {
    setUsers(prev => prev.map(u => (u.uid === id || (u as any).id === id) ? { ...u, isActive: false, status: 'Inactive' } : u));
    try {
      await updateDoc(doc(db, 'users', id), { isActive: false, status: 'Inactive' });
    } catch {
      // local fallback
    }
    await logAudit('USER_DEACTIVATED', `Deactivated user account UID: ${id}`);
  };

  const saveResultScores = async (scoreEntries: Partial<ResultScore>[], targetStatus: 'draft' | 'submitted' = 'draft') => {
    const updatedResults = [...results];

    for (const entry of scoreEntries) {
      if (!entry.studentId || !entry.courseId) continue;
      
      const ca = Number(entry.caScore ?? 0);
      const exam = Number(entry.examScore ?? 0);
      const total = ca + exam;
      const { grade, gradePoint, remark } = computeGrade(total);
      const cu = entry.creditUnit || 2;
      const qp = gradePoint * cu;

      const existingIndex = updatedResults.findIndex(
        r => r.studentId === entry.studentId && r.courseId === entry.courseId && r.session === entry.session
      );

      const computed: ResultScore = {
        id: entry.id || (existingIndex >= 0 ? updatedResults[existingIndex].id : `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`),
        studentId: entry.studentId,
        matricNumber: entry.matricNumber || '',
        studentName: entry.studentName || '',
        courseId: entry.courseId,
        courseCode: entry.courseCode || '',
        courseTitle: entry.courseTitle || '',
        creditUnit: cu,
        session: entry.session || settings.currentSession,
        semester: entry.semester || settings.currentSemester,
        level: entry.level || 'ND1',
        programme: entry.programme || '',
        caScore: ca,
        examScore: exam,
        totalScore: total,
        grade,
        gradePoint,
        qualityPoint: qp,
        remark,
        isCarryover: grade === 'F',
        enteredBy: entry.enteredBy || 'lecturer_001',
        status: targetStatus,
        approvals: existingIndex >= 0 ? updatedResults[existingIndex].approvals : {},
        createdAt: existingIndex >= 0 ? updatedResults[existingIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        updatedResults[existingIndex] = computed;
      } else {
        updatedResults.push(computed);
      }

      try {
        await setDoc(doc(db, 'results', computed.id), computed);
      } catch {
        // local sync
      }
    }

    setResults(updatedResults);
    await logAudit(
      targetStatus === 'submitted' ? 'RESULTS_SUBMITTED' : 'RESULTS_DRAFT_SAVED',
      `${targetStatus === 'submitted' ? 'Submitted' : 'Saved draft of'} ${scoreEntries.length} student scores`
    );
  };

  const approveResultScore = async (
    resultId: string, 
    role: 'hod' | 'exam_officer' | 'registrar', 
    approverName: string, 
    comments?: string
  ) => {
    const existing = results.find(r => r.id === resultId);
    if (!existing) return;

    let nextStatus: ResultApprovalStatus = existing.status;
    const approvals = { ...existing.approvals };

    if (role === 'hod') {
      nextStatus = 'hod_approved';
      approvals.hod = { approved: true, by: approverName, date: new Date().toISOString(), comments };
    } else if (role === 'exam_officer') {
      nextStatus = 'exam_officer_approved';
      approvals.examOfficer = { approved: true, by: approverName, date: new Date().toISOString(), comments };
    } else if (role === 'registrar') {
      approvals.registrar = { approved: true, by: approverName, date: new Date().toISOString() };
    }

    const updated = {
      ...existing,
      status: nextStatus,
      approvals,
      updatedAt: new Date().toISOString()
    };

    setResults(prev => prev.map(r => r.id === resultId ? updated : r));
    try {
      await updateDoc(doc(db, 'results', resultId), {
        status: nextStatus,
        approvals,
        updatedAt: new Date().toISOString()
      });
    } catch {
      // local sync
    }

    await logAudit(
      'RESULT_APPROVED',
      `${role.toUpperCase()} approved result for ${existing.courseCode} (${existing.matricNumber}) by ${approverName}`
    );
  };

  const rejectResultScore = async (
    resultId: string, 
    role: 'hod' | 'exam_officer', 
    rejectorName: string, 
    reason: string
  ) => {
    const existing = results.find(r => r.id === resultId);
    if (!existing) return;

    const updated = {
      ...existing,
      status: 'draft' as ResultApprovalStatus,
      rejectionReason: reason,
      updatedAt: new Date().toISOString()
    };

    setResults(prev => prev.map(r => r.id === resultId ? updated : r));
    try {
      await updateDoc(doc(db, 'results', resultId), {
        status: 'draft',
        rejectionReason: reason,
        updatedAt: new Date().toISOString()
      });
    } catch {
      // local sync
    }

    await logAudit(
      'RESULT_REJECTED',
      `${role.toUpperCase()} returned score for ${existing.courseCode} (${existing.matricNumber}). Reason: ${reason}`
    );
  };

  const publishCourseResults = async (courseId: string, session: string, semester: string) => {
    const updated = results.map(r => {
      if (r.courseId === courseId && r.session === session && r.semester === semester) {
        return { ...r, status: 'published' as ResultApprovalStatus, updatedAt: new Date().toISOString() };
      }
      return r;
    });

    setResults(updated);

    for (const r of updated.filter(x => x.courseId === courseId && x.session === session)) {
      try {
        await updateDoc(doc(db, 'results', r.id), { status: 'published', updatedAt: new Date().toISOString() });
      } catch {
        // local sync
      }
    }

    await logAudit('RESULTS_PUBLISHED', `Published results for course ID: ${courseId} for ${session} ${semester}`);
  };

  const overrideResultScore = async (resultId: string, updates: Partial<ResultScore>, adminReason: string) => {
    const existing = results.find(r => r.id === resultId);
    if (!existing) return;

    const total = (updates.caScore ?? existing.caScore) + (updates.examScore ?? existing.examScore);
    const { grade, gradePoint, remark } = computeGrade(total);
    const cu = updates.creditUnit ?? existing.creditUnit;
    const qp = gradePoint * cu;

    const updated: ResultScore = {
      ...existing,
      ...updates,
      totalScore: total,
      grade,
      gradePoint,
      qualityPoint: qp,
      remark,
      updatedAt: new Date().toISOString()
    };

    setResults(prev => prev.map(r => r.id === resultId ? updated : r));
    try {
      await setDoc(doc(db, 'results', resultId), updated);
    } catch {
      // local sync
    }

    await logAudit('RESULT_OVERRIDDEN', `Super Admin overrode result for ${existing.matricNumber}. Justification: ${adminReason}`);
  };

  const generatePinsBatch = async (count: number, session: string, semester: string, generatorId: string): Promise<ResultPin[]> => {
    const newPins: ResultPin[] = [];
    const startIndex = pins.length + 1;

    for (let i = 0; i < count; i++) {
      const pin: ResultPin = {
        id: `pin_${Date.now()}_${i}`,
        pin: generatePinCode(),
        serialNumber: generatePinSerial(startIndex + i),
        studentId: null,
        isUsed: false,
        session,
        semester,
        generatedBy: generatorId,
        createdAt: new Date().toISOString()
      };
      newPins.push(pin);

      try {
        await setDoc(doc(db, 'resultPins', pin.id), pin);
      } catch {
        // local sync
      }
    }

    setPins(prev => [...newPins, ...prev]);
    await logAudit('PINS_GENERATED', `Generated ${count} result scratch PINs for ${session} (${semester})`);
    return newPins;
  };

  const verifyAndRedeemPin = async (
    pinCode: string, 
    studentId: string, 
    matric: string, 
    session: string, 
    semester: string
  ): Promise<{ success: boolean; message: string }> => {
    const cleanPin = pinCode.trim().toUpperCase();
    const pinDoc = pins.find(p => p.pin.toUpperCase() === cleanPin);

    if (!pinDoc) {
      return { success: false, message: 'Invalid Result PIN. Please verify the 16-digit scratch PIN and try again.' };
    }

    if (pinDoc.isUsed) {
      // If already used by THIS student for THIS session/semester, allow access
      if (pinDoc.studentId === studentId || pinDoc.studentMatric === matric) {
        return { success: true, message: 'PIN already registered to your account. Access granted.' };
      }
      return { success: false, message: 'This PIN has already been used by another student.' };
    }

    // Redeem PIN for this student
    const updatedPin: ResultPin = {
      ...pinDoc,
      isUsed: true,
      usedAt: new Date().toISOString(),
      studentId,
      studentMatric: matric,
      session,
      semester
    };

    setPins(prev => prev.map(p => p.id === pinDoc.id ? updatedPin : p));
    try {
      await updateDoc(doc(db, 'resultPins', pinDoc.id), {
        isUsed: true,
        usedAt: new Date().toISOString(),
        studentId,
        studentMatric: matric,
        session,
        semester
      });
    } catch {
      // local sync
    }

    await logAudit('PIN_REDEEMED', `Student ${matric} successfully redeemed PIN ${pinDoc.serialNumber}`);
    return { success: true, message: 'Result PIN verified successfully!' };
  };

  const saveSignature = async (
    role: 'exam_officer' | 'hod' | 'registrar', 
    name: string, 
    title: string, 
    signatureImage: string, 
    userId: string
  ) => {
    const sig: DigitalSignature = {
      id: `sig_${role}`,
      userId,
      role,
      name,
      title,
      signatureImage,
      uploadedAt: new Date().toISOString()
    };

    setSignatures(prev => {
      const filtered = prev.filter(s => s.role !== role);
      return [...filtered, sig];
    });

    try {
      await setDoc(doc(db, 'signatures', sig.id), sig);
    } catch {
      // local sync
    }

    await logAudit('SIGNATURE_SAVED', `Updated digital signature for ${title} (${name})`);
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    try {
      await updateDoc(doc(db, 'settings', 'general'), newSettings);
    } catch {
      // local sync
    }
    await logAudit('SETTINGS_UPDATED', 'College system settings and academic policies modified');
  };

  const updateSession = async (sessionId: string, data: Partial<AcademicSession>) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return { ...s, ...data };
      }
      // If setting isCurrent to true, deactivate other sessions
      if (data.isCurrent) {
        return { ...s, isCurrent: false };
      }
      return s;
    }));
    try {
      await updateDoc(doc(db, 'sessions', sessionId), data);
    } catch {
      // local sync
    }
  };

  const createSession = async (data: Omit<AcademicSession, 'id'>): Promise<AcademicSession> => {
    const newSession: AcademicSession = {
      ...data,
      id: `sess_${Date.now()}`
    };
    setSessions(prev => [newSession, ...prev]);
    try {
      await setDoc(doc(db, 'sessions', newSession.id), newSession);
    } catch {
      // local sync
    }
    await logAudit('SESSION_CREATED', `Academic session ${newSession.name} created`);
    return newSession;
  };

  const registerStudentCourses = async (
    studentId: string, 
    matricNumber: string, 
    courseIds: string[], 
    session: string, 
    semester: '1st Semester' | '2nd Semester', 
    level: string
  ) => {
    const newRegs: CourseRegistration[] = [];

    for (const cId of courseIds) {
      const crs = courses.find(c => c.id === cId);
      if (!crs) continue;

      const exists = courseRegistrations.some(
        r => r.studentId === studentId && r.courseId === cId && r.session === session && r.semester === semester
      );
      if (exists) continue;

      const reg: CourseRegistration = {
        id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        studentId,
        matricNumber,
        courseId: cId,
        courseCode: crs.courseCode,
        courseTitle: crs.courseTitle,
        creditUnit: crs.creditUnit,
        session,
        semester,
        level,
        registeredAt: new Date().toISOString(),
        status: 'registered'
      };
      newRegs.push(reg);

      try {
        await setDoc(doc(db, 'courseRegistrations', reg.id), reg);
      } catch {
        // local sync
      }
    }

    setCourseRegistrations(prev => [...newRegs, ...prev]);
    await logAudit('COURSES_REGISTERED', `Student ${matricNumber} enrolled in ${newRegs.length} courses for ${session} (${semester})`);
  };

  const dropStudentCourse = async (registrationId: string) => {
    setCourseRegistrations(prev => prev.filter(r => r.id !== registrationId));
    try {
      await deleteDoc(doc(db, 'courseRegistrations', registrationId));
    } catch {
      // local sync
    }
  };

  // GPA and CGPA computation according to the Nigerian NBTE standard
  const computeStudentSemesterSummary = (
    studentId: string, 
    session: string, 
    semester: '1st Semester' | '2nd Semester'
  ): SemesterResultSummary => {
    const student = students.find(s => s.id === studentId);
    const semesterScores = results.filter(
      r => r.studentId === studentId && r.session === session && r.semester === semester
    );

    const totalCU = semesterScores.reduce((acc, curr) => acc + (curr.creditUnit || 0), 0);
    const totalQP = semesterScores.reduce((acc, curr) => acc + (curr.qualityPoint || 0), 0);
    const gpa = totalCU > 0 ? parseFloat((totalQP / totalCU).toFixed(2)) : 0.00;

    // Check if student is Year 2 (ND2, HND2, year: 2) or has previous records
    const isYear2 = student?.level === 'ND2' || student?.level === 'HND2' || student?.year === 2;
    let prevCU = 0;
    let prevQP = 0;
    let prevCgpa = 0;

    if (isYear2) {
      // Prior-year completed results from ND1 / HND1 or previous session
      const priorScores = results.filter(
        r => r.studentId === studentId && (r.level === 'ND1' || r.level === 'HND1' || r.session !== session)
      );
      if (priorScores.length > 0) {
        prevCU = priorScores.reduce((acc, curr) => acc + (curr.creditUnit || 0), 0);
        prevQP = priorScores.reduce((acc, curr) => acc + (curr.qualityPoint || 0), 0);
        prevCgpa = prevCU > 0 ? parseFloat((prevQP / prevCU).toFixed(2)) : 0;
      }

      // If student has explicit previous CGPA from student information, use that baseline
      if (student?.previousCgpa && student.previousCgpa > 0) {
        prevCgpa = student.previousCgpa;
        prevCU = student.previousCreditUnits && student.previousCreditUnits > 0 ? student.previousCreditUnits : (prevCU > 0 ? prevCU : 36);
        prevQP = student.previousQualityPoints && student.previousQualityPoints > 0 
          ? student.previousQualityPoints 
          : parseFloat((prevCgpa * prevCU).toFixed(2));
      } else if (prevCU === 0) {
        // Default baseline for Year 2 if not yet set
        prevCgpa = 3.40;
        prevCU = 36;
        prevQP = parseFloat((3.40 * 36).toFixed(2));
      }
    }

    const cumCU = prevCU + totalCU;
    const cumQP = parseFloat((prevQP + totalQP).toFixed(2));
    const cgpa = cumCU > 0 ? parseFloat((cumQP / cumCU).toFixed(2)) : gpa;

    const classification = computeClassification(cgpa);
    const remark = computeAcademicStanding(gpa);

    return {
      id: `sem_res_${studentId}_${session}_${semester}`,
      studentId,
      matricNumber: student?.matricNumber || '',
      studentName: student ? `${student.firstName} ${student.lastName}` : '',
      session,
      semester,
      level: student?.level || 'ND1',
      programme: student?.programme || '',
      totalCreditUnits: totalCU,
      totalQualityPoints: totalQP,
      gpa,
      cgpa,
      previousCgpa: isYear2 ? prevCgpa : undefined,
      previousCreditUnits: isYear2 ? prevCU : undefined,
      previousQualityPoints: isYear2 ? prevQP : undefined,
      currentGpa: gpa,
      currentCgpa: cgpa,
      totalCreditUnitsCumulative: cumCU,
      totalQualityPointsCumulative: cumQP,
      remark,
      classification
    };
  };

  return (
    <DataContext.Provider
      value={{
        programmes,
        courses,
        students,
        results,
        sessions,
        signatures,
        pins,
        auditLogs,
        settings,
        courseRegistrations,
        users,

        addUser,
        updateUser,
        deleteUser,

        addStudent,
        enrollStudentInCourse,
        updateStudent,
        deleteStudent,

        addCourse,
        updateCourse,
        deleteCourse,

        addProgramme,
        updateProgramme,

        saveResultScores,
        approveResultScore,
        rejectResultScore,
        publishCourseResults,
        overrideResultScore,

        generatePinsBatch,
        verifyAndRedeemPin,

        saveSignature,
        updateSettings,
        updateSession,
        createSession,

        registerStudentCourses,
        dropStudentCourse,

        logAudit,
        computeStudentSemesterSummary
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
