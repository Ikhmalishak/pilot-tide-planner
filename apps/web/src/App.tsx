import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import TideIndicatorPage from './pages/TideIndicatorPage';
import HourlyLevelPage from './pages/HourlyLevelPage';
import NavigationWindowPage from './pages/NavigationWindowPage';
import RuleProfilePage from './pages/RuleProfilePage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tide-indicators" element={<TideIndicatorPage />} />
        <Route path="/hourly-levels" element={<HourlyLevelPage />} />
        <Route path="/navigation-windows" element={<NavigationWindowPage />} />
        <Route path="/rule-profiles" element={<RuleProfilePage />} />
      </Route>
    </Routes>
  );
}
