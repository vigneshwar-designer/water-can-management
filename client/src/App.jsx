import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import MainLayout from './layouts/MainLayout';
import QRScannerModal from './components/QRScannerModal';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Cans from './pages/Cans';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Protected Route Wrapper
const ProtectedRoute = ({ children, onOpenScanner }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-slate-400 font-semibold text-xs">Authenticating session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <MainLayout onOpenScanner={onOpenScanner}>
      {children}
    </MainLayout>
  );
};

const AppContent = () => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [triggerRefresh, setTriggerRefresh] = useState(0);

  const handleOpenScanner = () => setIsScannerOpen(true);
  const handleCloseScanner = () => setIsScannerOpen(false);
  
  // Trigger component refresh when actions are completed in the scanner
  const handleScannerCompleted = () => {
    setTriggerRefresh(prev => prev + 1);
  };

  return (
    <>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Authenticated Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute onOpenScanner={handleOpenScanner}>
              <Dashboard key={triggerRefresh} onOpenScanner={handleOpenScanner} />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/customers" 
          element={
            <ProtectedRoute onOpenScanner={handleOpenScanner}>
              <Customers key={triggerRefresh} />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/cans" 
          element={
            <ProtectedRoute onOpenScanner={handleOpenScanner}>
              <Cans key={triggerRefresh} />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute onOpenScanner={handleOpenScanner}>
              <Reports key={triggerRefresh} />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute onOpenScanner={handleOpenScanner}>
              <Settings key={triggerRefresh} />
            </ProtectedRoute>
          } 
        />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global QR scanner component */}
      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={handleCloseScanner} 
        onRefreshData={handleScannerCompleted} 
      />
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
