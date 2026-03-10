import { Routes, Route, Navigate } from 'react-router-dom';
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
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/*" element={<AppLayout />} />
    </Routes>
  );
}

export default App;
