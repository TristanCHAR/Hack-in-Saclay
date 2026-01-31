import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import AdminPage from './pages/AdminPage';
import JeuxPage from './pages/JeuxPage';
import AnalysisPage from './pages/AnalysisPage';
import FruitNinjaPage from './pages/FruitNinjaPage';
import JeuDuBruitPage from './pages/JeuDuBruitPage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/app/jeux" replace />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/jeux" replace />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="jeux" element={<JeuxPage />} />
          <Route path="analyse" element={<AnalysisPage />} />
          <Route path="jeux/fruit-ninja" element={<FruitNinjaPage />} />
          <Route path="jeux/jeu-du-bruit" element={<JeuDuBruitPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
