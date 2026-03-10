import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

// Placeholder Pages
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Documents from './pages/Documents';
import Deductions from './pages/Deductions';
import AdvanceTax from './pages/AdvanceTax';
import Onboarding from './pages/Onboarding';
import RegimeComparison from './pages/RegimeComparison';
import TaxHealthScore from './pages/TaxHealthScore';
import Login from './pages/Login';
import Register from './pages/Register';

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect unauthenticated users to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/deductions" element={<Deductions />} />
            <Route path="/advance-tax" element={<AdvanceTax />} />
            <Route path="/regime-comparison" element={<RegimeComparison />} />
            <Route path="/health-score" element={<TaxHealthScore />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        user ? (user.persona ? <Navigate to="/dashboard" replace /> : <Navigate to="/onboarding" replace />) : <Login />
      } />
      <Route path="/register" element={
        user ? (user.persona ? <Navigate to="/dashboard" replace /> : <Navigate to="/onboarding" replace />) : <Register />
      } />

      {/* Semi-Protected Onboarding */}
      <Route path="/onboarding" element={
        <ProtectedRoute>
          <Onboarding />
        </ProtectedRoute>
      } />

      {/* Main App Layout Routes */}
      <Route path="/" element={
        user
          ? (user.persona ? <Navigate to="/dashboard" replace /> : <Navigate to="/onboarding" replace />)
          : <Navigate to="/login" replace />
      } />
      <Route path="/*" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
