import React, { useState, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { SearchProvider } from './contexts/SearchContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MobileNav from './components/MobileNav';
import BottomNav from './components/BottomNav';
import QuickActionsFloating from './components/QuickActionsFloating';
import ReferralModal from './components/ReferralModal';
import UploadReportModal from './components/UploadReportModal';
import { Loader2 } from 'lucide-react';
import { useTheme } from './hooks/useTheme';
import MarketingModal from './components/MarketingModal';
import AddProviderModal from './components/AddProviderModal';
import { useUIState } from './state/useUIState';
import DenialModal from './components/DenialModal';
import EquipmentModal from './components/EquipmentModal';
import OnboardingTour from './components/OnboardingTour';
import HelpButton from './components/HelpButton';
import { useTourState } from './state/useTourState';
import HelpMenuModal from './components/HelpMenuModal';
import QuickNoteModal from './components/QuickNoteModal';
import { useStartupCheck } from './hooks/useStartupCheck';
import SplashScreen from './components/system/SplashScreen';
import FatalScreen from './components/system/FatalScreen';
import ConvertLeadModal from './components/ConvertLeadModal';

// Lazy-loaded pages & components
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Referrals = React.lazy(() => import('./pages/Referrals'));
const Patients = React.lazy(() => import('./pages/Patients'));
const PatientDetailPage = React.lazy(() => import('./pages/PatientDetailPage'));
const Marketing = React.lazy(() => import('./pages/Marketing'));
const Trends = React.lazy(() => import('./pages/Trends'));
const Settings = React.lazy(() => import('./pages/Settings'));
const AuditLog = React.lazy(() => import('./pages/AuditLog'));
const MyAccounts = React.lazy(() => import('./pages/MyAccounts'));
const Archived = React.lazy(() => import('./pages/Archived'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const Reports = React.lazy(() => import('./pages/Reports'));
const LazyExportCenter = React.lazy(() => import('./components/export/ExportCenter'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));


const PageLoader: React.FC = () => (
    <div className="flex justify-center items-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
    </div>
);

const AppLayout: React.FC<{ safeMode: boolean }> = ({ safeMode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isBulkActionsVisible = useUIState(state => state.isBulkActionsVisible);
  const isOverlayVisible = useUIState(state => state.isOverlayVisible);
  const { startTour } = useTourState();

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        startTour('dashboard');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [startTour]);

  return (
    <div className="h-full bg-bg">
      <Sidebar />
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="md:pl-48 flex h-dvh flex-col">
        <Header onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-hidden">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
        </main>
      </div>
      {!isBulkActionsVisible && !isOverlayVisible && <QuickActionsFloating />}
      {!isBulkActionsVisible && <BottomNav />}
      <ReferralModal />
      <UploadReportModal />
      <MarketingModal />
      <ConvertLeadModal />
      <AddProviderModal />
      <DenialModal />
      <EquipmentModal />
      <QuickNoteModal />
      <OnboardingTour />
      <HelpButton />
      <HelpMenuModal />
      {!safeMode && (
        <Suspense fallback={null}>
            <LazyExportCenter />
        </Suspense>
      )}
    </div>
  );
};

const ProtectedRoute: React.FC<{ safeMode: boolean }> = ({ safeMode }) => {
  const { session, loading } = useAuth();
  if (loading) {
    return <SplashScreen text="Authenticating..." />;
  }
  if (!session) return <Navigate to="/login" replace />;
  return <AppLayout safeMode={safeMode} />;
};

const App: React.FC = () => {
  useTheme();
  const { status, detail, safeMode } = useStartupCheck();

  if (status === 'checking') {
    return <SplashScreen />;
  }

  if (status === 'error') {
    return <FatalScreen message="Application Startup Failed" detail={detail} />;
  }
  
  return (
    <Router basename={import.meta.env.BASE_URL || '/'}>
      <AuthProvider>
        <PreferencesProvider>
          <SearchProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<ProtectedRoute safeMode={safeMode} />}>
                  <Route index element={<Dashboard />} />
                  <Route path="/referrals" element={<Referrals />} />
                  <Route path="/referrals/:id" element={<Referrals />} />
                  <Route path="/patients" element={<Patients />} />
                  <Route path="/patient/:id" element={<PatientDetailPage />} />
                  <Route path="/marketing" element={<Marketing />} />
                  <Route path="/trends" element={<Trends />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/audit-log" element={<AuditLog />} />
                  <Route path="/my-accounts" element={<MyAccounts />} />
                  <Route path="/archived" element={<Archived />} />
                  
                  {!safeMode && <Route path="/reports" element={<Reports />} />}
                  
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
          </SearchProvider>
        </PreferencesProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
