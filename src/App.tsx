import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AppLayout from './components/AppLayout';
import AdminPage from './pages/AdminPage';
import JeuxPage from './pages/JeuxPage';
import FruitNinjaPage from './pages/FruitNinjaPage';
import JeuDuBruitPage from './pages/JeuDuBruitPage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<JeuxPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="jeux" element={<JeuxPage />} />
          <Route path="jeux/fruit-ninja" element={<FruitNinjaPage />} />
          <Route path="jeux/jeu-du-bruit" element={<JeuDuBruitPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
