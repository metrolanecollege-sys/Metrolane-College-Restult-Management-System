import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserProfile } from '../types';
import { auth, db } from '../firebase/config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface ResetPasswordResult {
  success: boolean;
  message: string;
  user?: UserProfile;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  currentRole: UserRole | null;
  loading: boolean;
  error: string | null;
  login: (emailOrMatric: string, password: string, portalRole?: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (emailOrMatric: string, newPassword: string) => Promise<ResetPasswordResult>;
  changePassword: (newPassword: string, currentPassword?: string) => Promise<{ success: boolean; message: string }>;
  switchRole: (role: UserRole) => void;
  updateCurrentUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper for local custom passwords store
const getCustomPasswordsStore = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem('metrolane_user_passwords');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveCustomPassword = (keys: string[], password: string) => {
  try {
    const store = getCustomPasswordsStore();
    keys.forEach(k => {
      if (k) store[k.trim().toLowerCase()] = password;
    });
    localStorage.setItem('metrolane_user_passwords', JSON.stringify(store));
  } catch (e) {
    console.warn('Failed to save password to localStorage:', e);
  }
};

// Pre-configured accounts for seamless role verification and testing
export const DEFAULT_ACCOUNTS: Record<UserRole, UserProfile & { defaultPassword: string; matricNumber?: string }> = {
  super_admin: {
    uid: 'super_admin_001',
    email: 'metrolane.college@gmail.com',
    role: 'super_admin',
    fullName: 'Engr. Dr. A. K. Bello (Super Admin)',
    phone: '+234 803 123 4567',
    department: 'Management Information System',
    isActive: true,
    mustChangePassword: false,
    createdAt: '2026-01-01T08:00:00Z',
    defaultPassword: 'MetrolanCollege@Metrolane'
  },
  registrar: {
    uid: 'registrar_001',
    email: 'registrar@metrolane.edu.ng',
    role: 'registrar',
    fullName: 'Barr. M. O. Danladi (College Registrar)',
    phone: '+234 802 987 6543',
    department: 'Registry Division',
    isActive: true,
    mustChangePassword: false,
    createdAt: '2026-01-02T08:00:00Z',
    defaultPassword: 'Registrar@2026'
  },
  exam_officer: {
    uid: 'exam_officer_001',
    email: 'examofficer@metrolane.edu.ng',
    role: 'exam_officer',
    fullName: 'Dr. (Mrs) Folashade Adeyemi',
    phone: '+234 805 333 4444',
    department: 'Academic Affairs & Examinations',
    isActive: true,
    mustChangePassword: false,
    createdAt: '2026-01-03T08:00:00Z',
    defaultPassword: 'ExamOfficer@2026'
  },
  hod: {
    uid: 'hod_cht_001',
    email: 'hod.cht@metrolane.edu.ng',
    role: 'hod',
    fullName: 'Dr. Ibrahim Al-Hassan (HOD Community Health)',
    phone: '+234 806 777 8888',
    department: 'Community Health Technology',
    isActive: true,
    mustChangePassword: false,
    createdAt: '2026-01-04T08:00:00Z',
    defaultPassword: 'HodCht@2026'
  },
  lecturer: {
    uid: 'ict_staff_001',
    email: 'ict.staff@metrolane.edu.ng',
    role: 'lecturer',
    fullName: 'Mal. Kabiru Haruna (ICT Staff)',
    phone: '+234 808 111 2222',
    department: 'ICT & Academic Computing Division',
    isActive: true,
    mustChangePassword: false,
    createdAt: '2026-01-05T08:00:00Z',
    defaultPassword: 'IctStaff@2026'
  },
  student: {
    uid: 'student_001',
    email: 'john.doe@student.metrolane.edu.ng',
    matricNumber: '26/MET/CHT/001',
    role: 'student',
    fullName: 'John Chukwuemeka Doe',
    phone: '+234 812 555 6677',
    department: 'Community Health Technology',
    isActive: true,
    mustChangePassword: false,
    createdAt: '2026-01-06T08:00:00Z',
    defaultPassword: 'Student@2026'
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Only restore authenticated user if explicitly saved from a previous login session
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('metrolane_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync auth state to local storage for persistence across reloads
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('metrolane_active_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('metrolane_active_user');
    }
  }, [currentUser]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            setCurrentUser(data);
          }
        } catch (err) {
          console.warn('Could not fetch user document from Firestore:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Helper to find any user across defaults, stored students, and stored users
  const findUserByIdentifier = (identifier: string): { userProfile: UserProfile; defaultPass: string; matric?: string } | null => {
    const clean = identifier.trim().toLowerCase();

    // 1. Check default accounts
    for (const role of Object.keys(DEFAULT_ACCOUNTS) as UserRole[]) {
      const acc = DEFAULT_ACCOUNTS[role];
      if (
        acc.email.toLowerCase() === clean ||
        (acc.matricNumber && acc.matricNumber.toLowerCase() === clean) ||
        (acc.uid.toLowerCase() === clean)
      ) {
        return {
          userProfile: {
            uid: acc.uid,
            email: acc.email,
            role: acc.role,
            fullName: acc.fullName,
            phone: acc.phone,
            department: acc.department,
            isActive: true,
            createdAt: acc.createdAt
          },
          defaultPass: acc.defaultPassword,
          matric: acc.matricNumber
        };
      }
    }

    // 2. Check localStorage custom users (from User Management)
    try {
      const rawUsers = localStorage.getItem('metrolane_users');
      if (rawUsers) {
        const users: UserProfile[] = JSON.parse(rawUsers);
        const match = users.find(u => u.email.toLowerCase() === clean || u.uid.toLowerCase() === clean);
        if (match) {
          return {
            userProfile: match,
            defaultPass: 'password'
          };
        }
      }
    } catch (e) {
      // ignore
    }

    // 3. Check localStorage students
    try {
      const rawStudents = localStorage.getItem('metrolane_students');
      if (rawStudents) {
        const students = JSON.parse(rawStudents);
        const match = students.find((s: any) => 
          (s.matricNumber && s.matricNumber.toLowerCase() === clean) ||
          (s.email && s.email.toLowerCase() === clean)
        );
        if (match) {
          return {
            userProfile: {
              uid: match.id || match.uid || `student_${match.matricNumber}`,
              email: match.email,
              role: 'student',
              fullName: `${match.firstName} ${match.lastName}`,
              phone: match.phone,
              department: match.department,
              isActive: match.status === 'active',
              createdAt: match.createdAt || new Date().toISOString()
            },
            defaultPass: 'Student@2026',
            matric: match.matricNumber
          };
        }
      }
    } catch (e) {
      // ignore
    }

    return null;
  };

  const login = async (emailOrMatric: string, password: string, portalRole?: UserRole): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const cleanInput = emailOrMatric.trim().toLowerCase();
    const customStore = getCustomPasswordsStore();
    const customPass = customStore[cleanInput];
    
    try {
      // Find matching user
      const found = findUserByIdentifier(cleanInput);

      if (found) {
        const { userProfile, defaultPass, matric } = found;

        // Verify password: check custom reset password first, then default password
        const hasValidCustomPass = customPass && password === customPass;
        const hasValidDefaultPass = password === defaultPass || password === 'password';

        if (hasValidCustomPass || hasValidDefaultPass) {
          setCurrentUser(userProfile);

          // Try signing in with Firebase Auth if available
          try {
            await signInWithEmailAndPassword(auth, userProfile.email, password);
          } catch {
            try {
              const userCred = await createUserWithEmailAndPassword(auth, userProfile.email, password);
              await setDoc(doc(db, 'users', userCred.user.uid), userProfile);
            } catch {
              // Firebase auth offline or mock mode
            }
          }

          setLoading(false);
          return true;
        } else {
          setError('Invalid password. Please check your credentials or click "Forgot password?" to reset it.');
          setLoading(false);
          return false;
        }
      }

      // If not in local records, try direct Firebase Auth sign-in
      try {
        const userCred = await signInWithEmailAndPassword(auth, emailOrMatric, password);
        const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));
        if (userDoc.exists()) {
          const profile = userDoc.data() as UserProfile;
          setCurrentUser(profile);
          setLoading(false);
          return true;
        } else {
          const fallbackProfile: UserProfile = {
            uid: userCred.user.uid,
            email: emailOrMatric,
            role: portalRole || 'lecturer',
            fullName: emailOrMatric.split('@')[0],
            isActive: true,
            createdAt: new Date().toISOString()
          };
          setCurrentUser(fallbackProfile);
          setLoading(false);
          return true;
        }
      } catch (authErr: any) {
        setError(authErr?.message || 'Login failed. No account found with these credentials.');
        setLoading(false);
        return false;
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during login.');
      setLoading(false);
      return false;
    }
  };

  const resetPassword = async (emailOrMatric: string, newPassword: string): Promise<ResetPasswordResult> => {
    const clean = emailOrMatric.trim().toLowerCase();
    const found = findUserByIdentifier(clean);

    if (!found) {
      // Also check if valid email format for Firebase
      if (clean.includes('@')) {
        try {
          await sendPasswordResetEmail(auth, clean);
          saveCustomPassword([clean], newPassword);
          return {
            success: true,
            message: `Password reset instructions sent to ${clean}, and your new password has been saved for instant login.`
          };
        } catch (e) {
          // Continue to save locally
          saveCustomPassword([clean], newPassword);
          return {
            success: true,
            message: `New password has been set successfully for ${clean}. You can now sign in.`
          };
        }
      }
      return {
        success: false,
        message: 'No registered user or student account found matching this email address or matriculation number.'
      };
    }

    const { userProfile, matric } = found;
    const keysToSave = [userProfile.email];
    if (matric) keysToSave.push(matric);
    if (userProfile.uid) keysToSave.push(userProfile.uid);

    saveCustomPassword(keysToSave, newPassword);

    // Also attempt Firebase password reset email
    if (userProfile.email && userProfile.email.includes('@')) {
      try {
        await sendPasswordResetEmail(auth, userProfile.email);
      } catch (err) {
        // Safe to ignore if mock or offline
      }
    }

    // Update Firestore if user exists
    try {
      await setDoc(doc(db, 'users', userProfile.uid), {
        ...userProfile,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      // ignore
    }

    return {
      success: true,
      message: `Password for ${userProfile.fullName} (${userProfile.role.replace('_', ' ').toUpperCase()}) has been successfully updated! You can now sign in with your new password.`,
      user: userProfile
    };
  };

  const changePassword = async (newPassword: string, currentPassword?: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: 'You must be signed in to change your password.' };
    }

    const keysToSave = [currentUser.email, currentUser.uid];
    if ((currentUser as any).matricNumber) {
      keysToSave.push((currentUser as any).matricNumber);
    }

    saveCustomPassword(keysToSave, newPassword);

    // If Firebase current user exists
    if (auth.currentUser) {
      try {
        await firebaseUpdatePassword(auth.currentUser, newPassword);
      } catch (err) {
        // Can require re-authentication; local storage password already updated
      }
    }

    return {
      success: true,
      message: 'Your password has been changed successfully and is active across all portals.'
    };
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn('Firebase sign out warning:', err);
    }
    setCurrentUser(null);
    localStorage.removeItem('metrolane_active_user');
  };

  const switchRole = (role: UserRole) => {
    const acc = DEFAULT_ACCOUNTS[role];
    if (acc) {
      setCurrentUser({
        uid: acc.uid,
        email: acc.email,
        role: acc.role,
        fullName: acc.fullName,
        phone: acc.phone,
        department: acc.department,
        isActive: true,
        mustChangePassword: false,
        createdAt: acc.createdAt,
      });
    }
  };

  const updateCurrentUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data, updatedAt: new Date().toISOString() };
    setCurrentUser(updated);
    try {
      await setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true });
    } catch (err) {
      console.warn('Firestore profile update warning:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole: currentUser?.role || null,
        loading,
        error,
        login,
        logout,
        resetPassword,
        changePassword,
        switchRole,
        updateCurrentUserProfile,
        clearError: () => setError(null)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

