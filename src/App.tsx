import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ConfigErrorScreen } from './components/ConfigErrorScreen';
import { firebaseReady, firebaseConfigError } from './firebase/config.js';
import { LandingPage } from './pages/LandingPage';
import { BusinessDashboard } from './pages/BusinessDashboard';
import { ApplyPage } from './pages/ApplyPage';
import { OfficerDashboard } from './pages/OfficerDashboard';
import { ReviewPage } from './pages/ReviewPage';
import { CertificatePage } from './pages/CertificatePage';
import { VerifyPage } from './pages/VerifyPage';
import { OfficerSignup } from './pages/OfficerSignup';
import { OfficerVerificationPage } from './pages/admin/OfficerVerificationPage';
import { Scale } from 'lucide-react';
import { BusinessDashboard } from './pages/BusinessDashboard';
import { ApplyPage } from './pages/ApplyPage';
import { OfficerDashboard } from './pages/OfficerDashboard';
import { ReviewPage } from './pages/ReviewPage';
import { CertificatePage } from './pages/CertificatePage';
import { VerifyPage } from './pages/VerifyPage';
import { OfficerSignup } from './pages/OfficerSignup';
import { OfficerVerificationPage } from './pages/admin/OfficerVerificationPage';
import { Scale } from 'lucide-react';

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
    <div className="w-14 h-14 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-md mb-4 animate-pulse">
      <Scale className="w-8 h-8" />
    </div>
    <p className="text-sm text-slate-600 font-medium">Loading portal...</p>
  </div>
);

const AppRoutes: React.FC = () => {
  const { role, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-blue-200">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/business" element={<BusinessDashboard />} />
          <Route path="/apply" element={<ApplyPage />} />
          <Route path="/officer" element={<OfficerDashboard />} />
          <Route path="/review/:id" element={<ReviewPage />} />
          <Route path="/certificate/:id" element={<CertificatePage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/officer-signup" element={<OfficerSignup />} />
          <Route path="/admin/officer-verification" element={<OfficerVerificationPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default function App() {
  if (!firebaseReady) {
    return (
      <ConfigErrorScreen
        message={
          firebaseConfigError ||
          'Firebase is not configured. Set VITE_FIREBASE_* environment variables and redeploy.'
        }
      />
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="bottom-right" />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
