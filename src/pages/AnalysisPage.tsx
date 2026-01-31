import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceLine, ReferenceDot, Scatter, ScatterChart
} from 'recharts';
import { Activity, Pill, AlertTriangle, TrendingDown, ChevronRight, Plus } from 'lucide-react';
import './AnalysisPage.css';

// Mock data pour la démonstration
const performanceData = [
  { time: '08:00', performance: 45, med: true, seizure: false },
  { time: '10:00', performance: 75, med: false, seizure: false },
  { time: '12:00', performance: 85, med: false, seizure: false },
  { time: '14:00', performance: 60, med: false, seizure: true },
  { time: '16:00', performance: 30, med: true, seizure: false },
  { time: '18:00', performance: 65, med: false, seizure: false },
  { time: '20:00', performance: 80, med: false, seizure: false },
  { time: '22:00', performance: 70, med: false, seizure: false },
];

const AnalysisPage: React.FC = () => {
  // Calcul des zones d'ombre médicamenteuses (demi-vie simulée)
  const medWindows = useMemo(() => {
    return performanceData.filter(d => d.med).map(d => ({
      time: d.time,
      value: d.performance
    }));
  }, []);

  const seizurePoints = useMemo(() => {
    return performanceData.filter(d => d.seizure).map(d => ({
      time: d.time,
      value: d.performance
    }));
  }, []);

  return (
    <div className="analysis-container">
      {/* 1. Header: The Vital Signs */}
      <div className="vital-signs-header">
        <div className="kpi-card glass-card">
          <div className="kpi-icon-wrapper med-icon">
            <Pill size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Couverture Thérapeutique</span>
            <div className="kpi-value-row">
              <span className="kpi-value">18/21</span>
              <span className="kpi-sub">prises (7j)</span>
            </div>
            <div className="kpi-progress-bar">
              <div className="progress-fill" style={{ width: '85%' }}></div>
            </div>
          </div>
        </div>

        <div className="kpi-card glass-card">
          <div className="kpi-icon-wrapper seizure-icon">
            <AlertTriangle size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Évènements (30j)</span>
            <div className="kpi-value-row">
              <span className="kpi-value pulse-red">12</span>
              <span className="kpi-sub">crises</span>
            </div>
          </div>
        </div>

        <div className="kpi-card glass-card">
          <div className="kpi-icon-wrapper progress-icon">
            <TrendingDown size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Impact Servier (vs M-1)</span>
            <div className="kpi-value-row">
              <span className="kpi-value trend-green">-24.8%</span>
            </div>
            <p className="kpi-argument">Démonstration mathématique du gain de qualité de vie.</p>
          </div>
        </div>
      </div>

      <div className="analysis-main-layout">
        {/* 2. Main: The Insight Engine */}
        <div className="insight-engine-section">
          <div className="section-header">
            <h2>Graphique de Corrélation 3D</h2>
            <p className="section-subtitle">Performance cognitive vs Traitement</p>
          </div>

          <div className="chart-container glass-card">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4facfe" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4facfe" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A0C4FF" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#A0C4FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#999', fontSize: 12 }}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                />

                {/* Layer 3: Fenêtres Médicamenteuses */}
                {medWindows.map((med, i) => (
                  <ReferenceLine
                    key={`med-${i}`}
                    x={med.time}
                    stroke="#A0C4FF"
                    strokeWidth={40}
                    strokeOpacity={0.1}
                  />
                ))}

                {/* Layer 1: Courbe de performance */}
                <Area
                  type="monotone"
                  dataKey="performance"
                  stroke="#4facfe"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorPerf)"
                />

                {/* Layer 2: Points de Crise */}
                {seizurePoints.map((s, i) => (
                  <ReferenceDot
                    key={`seizure-${i}`}
                    x={s.time}
                    y={s.value}
                    r={8}
                    fill="#FF6B6B"
                    stroke="#fff"
                    strokeWidth={3}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              <span className="legend-item"><span className="dot perf"></span> Performance</span>
              <span className="legend-item"><span className="dot med"></span> Fenêtre Médicament</span>
              <span className="legend-item"><span className="dot seizure"></span> Crise</span>
            </div>
            <p className="insight-wow">
              "Regardez comment la performance de l'enfant remonte systématiquement dans la zone d'ombre du médicament."
            </p>
          </div>
        </div>

        {/* 3 & 4. Sidebar: Actions & Logs */}
        <div className="analysis-sidebar">
          {/* Module Médicaments */}
          <div className="sidebar-module glass-card">
            <div className="module-header">
              <h3>Chrono-Therapy</h3>
              <button className="btn-icon-add"><Plus size={18} /></button>
            </div>
            <div className="med-chrono-list">
              <div className="med-chrono-item taken">
                <div className="med-status-badge">V</div>
                <div className="med-info">
                  <span className="med-time">08:00</span>
                  <span className="med-name">Fenfluramine 2.5mg</span>
                </div>
              </div>
              <div className="med-chrono-item pending">
                <div className="med-status-badge"></div>
                <div className="med-info">
                  <span className="med-time">20:00</span>
                  <span className="med-name">Fenfluramine 2.5mg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Module Crises */}
          <div className="sidebar-module glass-card">
            <div className="module-header">
              <h3>The Instant Tracker</h3>
            </div>
            <div className="emergency-tracker-container">
              <button className="btn-emergency-log">
                <div className="btn-inner">
                  <AlertTriangle size={32} color="#fff" />
                </div>
                <div className="hold-progress"></div>
              </button>
              <p className="hold-hint">Maintenir 1s pour signaler</p>
            </div>

            <div className="post-seizure-types">
              <button className="type-icon-btn">⚡️<span>Tonico-clonique</span></button>
              <button className="type-icon-btn">😶<span>Absence</span></button>
              <button className="type-icon-btn">💪<span>Myoclonique</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;
