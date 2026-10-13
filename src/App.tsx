import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { UserRole } from './types';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { AdminPortal } from './components/portals/AdminPortal';
import { RegistrarPortal } from './components/portals/RegistrarPortal';
import { ExamOfficerPortal } from './components/portals/ExamOfficerPortal';
import { HodPortal } from './components/portals/HodPortal';
import { LecturerPortal } from './components/portals/LecturerPortal';
import { StudentPortal } from './components/portals/StudentPortal';

const MainAppContent: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  
  // Selected login portal when not authenticated
  const [targetPortalRole, setTargetPortalRole] = useState<UserRole>('lecturer');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = React.useRef<HTMLElement>(null);

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Reset tab to dashboard whenever role switches
  React.useEffect(() => {
    setActiveTab('dashboard');
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentRole]);

  // If user is not logged in, show authentic split-screen login page
  if (!currentUser) {
    return (
      <LoginPage
        portalRole={targetPortalRole}
        onSelectPortalRole={(role) => setTargetPortalRole(role)}
      />
    );
  }

  const renderActivePortal = () => {
    switch (currentRole) {
      case 'super_admin':
        return <AdminPortal activeTab={activeTab} onSelectTab={handleSelectTab} />;
      case 'registrar':
        return <RegistrarPortal activeTab={activeTab} onSelectTab={handleSelectTab} />;
      case 'exam_officer':
        return <ExamOfficerPortal activeTab={activeTab} onSelectTab={handleSelectTab} />;
      case 'hod':
        return <HodPortal activeTab={activeTab} onSelectTab={handleSelectTab} />;
      case 'lecturer':
        return <LecturerPortal activeTab={activeTab} onSelectTab={handleSelectTab} />;
      case 'student':
        return <StudentPortal activeTab={activeTab} onSelectTab={handleSelectTab} />;
      default:
        return <AdminPortal activeTab={activeTab} onSelectTab={handleSelectTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col font-sans antialiased text-[#212121]">
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentRole={currentRole || 'super_admin'}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderActivePortal()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainAppContent />
      </DataProvider>
    </AuthProvider>
  );
}
