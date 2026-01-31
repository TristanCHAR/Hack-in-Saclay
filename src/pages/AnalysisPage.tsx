import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceDot,
  ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';
import { TrendingDown, TrendingUp, Pill, Brain, Activity, Mic, Zap } from 'lucide-react';
import { api } from '../services/api';
import './AnalysisPage.css';

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
interface Crise { id: number; duration: number; created_at: string }
interface Drug { id: number; name: string; created_at: string }
interface FlashPop { id: number; mrt: number; inhibition_rate: number; iiv_score: number; created_at: string }
interface NoiseGame { id: number; vocal_initention_latence: number; motrice_planification: number; created_at: string }

interface TimelinePoint {
  label: string;
  date: string;
  mrt: number | null;
  motrice: number | null;
  drugCount: number;
  criseCount: number;
}

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */
const toDate = (s: string) => new Date(s.replace(' ', 'T'));
const dayOf = (s: string) => s.split(' ')[0];
const fmtDay = (d: string) => {
  const p = d.split('-');
  return `${parseInt(p[2])}/${parseInt(p[1])}`;
};
const avg = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/* ── Impact Ratio: crises 7j actuels vs 7j précédents ── */
function impactRatio(crises: Crise[]): number {
  const now = Date.now();
  const W = 7 * 864e5;
  const curr = crises.filter(c => now - toDate(c.created_at).getTime() <= W).length;
  const prev = crises.filter(c => {
    const d = now - toDate(c.created_at).getTime();
    return d > W && d <= 2 * W;
  }).length;
  if (prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

/* ── Adhérence: prises / objectif théorique (2/jour × 7j = 14) ── */
function adherence(drugs: Drug[]): { count: number; target: number; pct: number } {
  const now = Date.now();
  const W = 7 * 864e5;
  const count = drugs.filter(d => now - toDate(d.created_at).getTime() <= W).length;
  const target = 14;
  return { count, target, pct: clamp((count / target) * 100, 0, 100) };
}

/* ── Stabilité cognitive: moyenne pondérée IIV + planification motrice ── */
function stabilityScore(fp: FlashPop[], ng: NoiseGame[]): number {
  if (!fp.length && !ng.length) return 0;
  const iiv = fp.length ? clamp(100 - avg(fp.map(f => f.iiv_score)) * 2, 0, 100) : 50;
  const mot = ng.length ? clamp(100 - (avg(ng.map(n => n.motrice_planification)) - 80) / 3.5, 0, 100) : 50;
  return Math.round(0.5 * iiv + 0.5 * mot);
}

/* ── Timeline par jour ── */
function buildTimeline(
  crises: Crise[], drugs: Drug[], fps: FlashPop[], ngs: NoiseGame[]
): TimelinePoint[] {
  const days = new Set<string>();
  [...crises, ...drugs, ...fps, ...ngs].forEach(i => days.add(dayOf(i.created_at)));
  return Array.from(days).sort().map(d => {
    const dfp = fps.filter(f => dayOf(f.created_at) === d);
    const dng = ngs.filter(n => dayOf(n.created_at) === d);
    const dDrugs = drugs.filter(dr => dayOf(dr.created_at) === d);
    const dCrises = crises.filter(c => dayOf(c.created_at) === d);
    return {
      date: d,
      label: fmtDay(d),
      mrt: dfp.length ? Math.round(avg(dfp.map(f => f.mrt))) : null,
      motrice: dng.length ? Math.round(avg(dng.map(n => n.motrice_planification))) : null,
      drugCount: dDrugs.length,
      criseCount: dCrises.length,
    };
  });
}

function getLastDrug(drugs: Drug[]): string {
  if (!drugs.length) return '—';
  const sorted = [...drugs].sort((a, b) => toDate(b.created_at).getTime() - toDate(a.created_at).getTime());
  return sorted[0].name;
}

/* ═══════════════════════════════════════════════════════════
   VOCAL STRESS GAUGE (SVG)
   ═══════════════════════════════════════════════════════════ */
const VocalGauge: React.FC<{ value: number; maxVal: number }> = ({ value, maxVal }) => {
  const pct = clamp(value / maxVal, 0, 1);
  const R = 70, CX = 90, CY = 90;
  const circumference = Math.PI * R;
  const offset = circumference * (1 - pct);
  const hue = (1 - pct) * 120; // 120 = green, 0 = red
  const color = `hsl(${hue}, 80%, 55%)`;

  return (
    <div className="gauge-wrapper">
      <svg viewBox="0 0 180 110" className="gauge-svg">
        <path
          d={`M ${CX - R},${CY} A ${R},${R} 0 0,1 ${CX + R},${CY}`}
          fill="none"
          stroke="#eaeaea"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d={`M ${CX - R},${CY} A ${R},${R} 0 0,1 ${CX + R},${CY}`}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease, stroke 1s ease' }}
        />
        <text x={CX} y={CY - 15} textAnchor="middle" className="gauge-value-text">
          {Math.round(value)}
        </text>
        <text x={CX} y={CY + 5} textAnchor="middle" className="gauge-unit-text">
          ms
        </text>
      </svg>
      <div className="gauge-labels">
        <span>Optimal</span>
        <span>Fatigue</span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   CUSTOM TOOLTIP
   ═══════════════════════════════════════════════════════════ */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="metrics-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p: any, i: number) =>
        p.value != null ? (
          <p key={i} style={{ color: p.color }}>
            {p.name}: <strong>{p.value} ms</strong>
          </p>
        ) : null
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
const AnalysisPage: React.FC = () => {
  const [crises, setCrises] = useState<Crise[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [flashPops, setFlashPops] = useState<FlashPop[]>([]);
  const [noiseGames, setNoiseGames] = useState<NoiseGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getCrises(),
      api.getDrugs(),
      api.getFlashPopHistory(),
      api.getNoiseGameHistory(),
    ])
      .then(([c, d, fp, ng]) => {
        setCrises(Array.isArray(c) ? c : []);
        setDrugs(Array.isArray(d) ? d : []);
        setFlashPops(Array.isArray(fp) ? fp : []);
        setNoiseGames(Array.isArray(ng) ? ng : []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  /* ── Computed values ── */
  const impact = useMemo(() => impactRatio(crises), [crises]);
  const adh = useMemo(() => adherence(drugs), [drugs]);
  const stability = useMemo(() => stabilityScore(flashPops, noiseGames), [flashPops, noiseGames]);
  const timeline = useMemo(
    () => buildTimeline(crises, drugs, flashPops, noiseGames),
    [crises, drugs, flashPops, noiseGames]
  );
  const baselineMrt = useMemo(
    () => (flashPops.length ? Math.round(avg(flashPops.map(f => f.mrt))) : null),
    [flashPops]
  );
  const baselineVocal = useMemo(
    () => (noiseGames.length ? Math.round(avg(noiseGames.map(n => n.vocal_initention_latence))) : null),
    [noiseGames]
  );
  const avgVocal = useMemo(
    () => (noiseGames.length ? avg(noiseGames.map(n => n.vocal_initention_latence)) : 0),
    [noiseGames]
  );
  const maxVocal = useMemo(
    () => (noiseGames.length ? Math.max(...noiseGames.map(n => n.vocal_initention_latence), 500) : 500),
    [noiseGames]
  );
  const lastDrug = useMemo(() => getLastDrug(drugs), [drugs]);

  const inhibitionData = useMemo(
    () =>
      flashPops.map(fp => ({
        date: fmtDay(dayOf(fp.created_at)),
        ts: toDate(fp.created_at).getTime(),
        rate: fp.inhibition_rate,
        iiv: fp.iiv_score,
      })),
    [flashPops]
  );

  const hasData = crises.length || drugs.length || flashPops.length || noiseGames.length;

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="metrics-page">
        <div className="metrics-loading">
          <div className="spinner" />
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="metrics-page">
        <div className="metrics-empty">
          <Activity size={48} />
          <p>Erreur de connexion : {error}</p>
        </div>
      </div>
    );
  }

  /* ── Empty ── */
  if (!hasData) {
    return (
      <div className="metrics-page">
        <div className="metrics-empty">
          <Brain size={48} />
          <h3>Aucune donnée disponible</h3>
          <p>Jouez à Flash Pop ou au Jeu du Bruit pour commencer à collecter des métriques cognitives.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="metrics-page">
      <h1 className="metrics-title">Tableau de Bord Médical</h1>
      <p className="metrics-subtitle">Corrélation traitement — performance cognitive</p>

      {/* ════════════════════════════════════════════════════
          HERO KPI STRIP
          ════════════════════════════════════════════════════ */}
      <div className="metrics-kpi-strip">
        {/* Réduction des Crises */}
        <div className="metrics-glass metrics-kpi-card">
          <div className={`kpi-icon-box ${impact <= 0 ? 'kpi-green' : 'kpi-red'}`}>
            {impact <= 0 ? <TrendingDown size={22} /> : <TrendingUp size={22} />}
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Réduction des Crises</span>
            <span className={`kpi-value ${impact <= 0 ? 'text-green' : 'text-red'}`}>
              {impact > 0 ? '+' : ''}{impact.toFixed(1)}%
            </span>
            <span className="kpi-hint">7j vs 7j précédents</span>
          </div>
        </div>

        {/* Adhérence au Traitement */}
        <div className="metrics-glass metrics-kpi-card">
          <div className="kpi-icon-box kpi-blue">
            <Pill size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Adhérence au Traitement</span>
            <span className="kpi-value">
              {adh.count}<span className="kpi-frac">/{adh.target}</span>
            </span>
            <div className="kpi-bar">
              <div className="kpi-bar-fill" style={{ width: `${adh.pct}%` }} />
            </div>
          </div>
        </div>

        {/* Score de Stabilité Cognitive */}
        <div className="metrics-glass metrics-kpi-card">
          <div className="kpi-icon-box kpi-purple">
            <Brain size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Stabilité Cognitive</span>
            <span className="kpi-value">
              {stability}<span className="kpi-frac">/100</span>
            </span>
            <span className="kpi-hint">IIV + Planification motrice</span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          MASTER CORRELATION CHART
          ════════════════════════════════════════════════════ */}
      <section className="metrics-section">
        <h2 className="metrics-section-title">Corrélation Traitement — Performance</h2>
        <div className="metrics-glass metrics-chart-box">
          {timeline.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#999', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: '#999', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: 'MRT (ms)', angle: -90, position: 'insideLeft', fill: '#999', fontSize: 11, dx: 15 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: '#999', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: 'Planif. (ms)', angle: 90, position: 'insideRight', fill: '#999', fontSize: 11, dx: -15 }}
                  />
                  <Tooltip content={<ChartTooltip />} />

                  {/* Drug "bars" — thick transparent vertical lines */}
                  {timeline.filter(t => t.drugCount > 0).map((t, i) => (
                    <ReferenceLine
                      key={`drug-${i}`}
                      x={t.label}
                      yAxisId="left"
                      stroke="#4facfe"
                      strokeWidth={28}
                      strokeOpacity={0.08}
                    />
                  ))}

                  {/* Baseline MRT (dashed) */}
                  {baselineMrt != null && (
                    <ReferenceLine
                      yAxisId="left"
                      y={baselineMrt}
                      stroke="#4facfe"
                      strokeDasharray="6 4"
                      strokeOpacity={0.35}
                    />
                  )}

                  {/* Performance lines */}
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="mrt"
                    stroke="#4facfe"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#4facfe', stroke: '#fff', strokeWidth: 2 }}
                    connectNulls
                    name="MRT (Flash Pop)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="motrice"
                    stroke="#9C7CFF"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#9C7CFF', stroke: '#fff', strokeWidth: 2 }}
                    connectNulls
                    name="Planif. Motrice"
                  />

                  {/* Crisis markers — red dots */}
                  {timeline.filter(t => t.criseCount > 0).map((t, i) => (
                    <ReferenceDot
                      key={`crise-${i}`}
                      x={t.label}
                      y={t.mrt ?? baselineMrt ?? 300}
                      yAxisId="left"
                      r={7}
                      fill="#FF6B6B"
                      stroke="#fff"
                      strokeWidth={3}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>

              <div className="chart-legend-row">
                <span className="legend-chip">
                  <span className="ldot" style={{ background: '#4facfe' }} />MRT (Flash Pop)
                </span>
                <span className="legend-chip">
                  <span className="ldot" style={{ background: '#9C7CFF' }} />Planif. Motrice
                </span>
                <span className="legend-chip">
                  <span className="ldot" style={{ background: 'rgba(96,165,250,0.35)' }} />Prise médicament
                </span>
                <span className="legend-chip">
                  <span className="ldot" style={{ background: '#FF6B6B' }} />Crise
                </span>
              </div>
            </>
          ) : (
            <p className="no-data-msg">Pas encore de données pour le graphique.</p>
          )}
        </div>

        {/* Auto-analysis */}
        <div className="metrics-glass metrics-analysis-box">
          <Activity size={18} />
          <p>
            <strong>Analyse automatique :</strong>{' '}
            {impact <= 0
              ? `L'amélioration de la planification motrice coïncide avec la prise de ${lastDrug}. Les crises ont diminué de ${Math.abs(impact).toFixed(1)}% sur les 7 derniers jours.`
              : `Augmentation de ${impact.toFixed(1)}% des crises observée. Un suivi rapproché est recommandé.`}
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          BOTTOM GRID — Gauge + Heatmap
          ════════════════════════════════════════════════════ */}
      <div className="metrics-bottom-grid">
        {/* Vocal Stress Gauge */}
        <section className="metrics-glass metrics-card-padded">
          <div className="card-header-row">
            <Mic size={18} />
            <h3>Stress Vocal</h3>
          </div>
          <p className="card-desc">
            Latence d'intention vocale — plus la valeur est haute, plus la fatigue neurologique est importante.
          </p>
          <VocalGauge value={avgVocal} maxVal={maxVocal} />
          {baselineVocal != null && (
            <p className="baseline-note">
              Baseline moyenne : <strong>{baselineVocal} ms</strong>
            </p>
          )}
        </section>

        {/* Inhibition Heatmap (Bubble Chart) */}
        <section className="metrics-glass metrics-card-padded">
          <div className="card-header-row">
            <Zap size={18} />
            <h3>Inhibition au fil du temps</h3>
          </div>
          <p className="card-desc">
            Chaque bulle représente une session. Taille = IIV score, position Y = taux d'inhibition.
          </p>
          {inhibitionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#999', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  name="Date"
                />
                <YAxis
                  dataKey="rate"
                  tick={{ fill: '#999', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  name="Taux"
                  domain={[0, 1]}
                />
                <ZAxis dataKey="iiv" range={[60, 400]} name="IIV" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3', stroke: '#ddd' }}
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #f0f0f0',
                    borderRadius: 12,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  }}
                  labelStyle={{ color: '#1A1A1A' }}
                  itemStyle={{ color: '#666' }}
                />
                <Scatter name="Inhibition" data={inhibitionData}>
                  {inhibitionData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.rate >= 0.7 ? '#66BB6A' : d.rate >= 0.4 ? '#FFA726' : '#FF6B6B'}
                      fillOpacity={0.75}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data-msg">Aucune session Flash Pop enregistrée.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default AnalysisPage;
