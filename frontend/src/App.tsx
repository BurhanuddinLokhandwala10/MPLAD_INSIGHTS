import { Navigate, Route, Routes } from 'react-router-dom';

import { Layout } from './components';
import {
  About,
  Alerts,
  Analytics,
  Dashboard,
  Investigation,
  MapView,
  Projects,
  RiskExplorer,
} from './pages';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="risk-explorer" element={<RiskExplorer />} />
        <Route path="map" element={<MapView />} />
        <Route path="project/:id" element={<Investigation />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="about" element={<About />} />
      </Route>
    </Routes>
  );
}
