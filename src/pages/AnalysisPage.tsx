import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
  ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';
import {
  TrendingDown, TrendingUp, Pill, Brain, Activity, Mic, Zap,
  RefreshCw, BarChart3
} from 'lucide-react';
import { api } from '../services/api';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useChildAuthStore } from '../stores/childAuthStore';
import './AnalysisPage.css';

const BrainScene = React.lazy(() => import('../components/BrainScene'));

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
interface Crise { id: number; duration: number; created_at: string }
interface Drug { id: number; name: string; created_at: string }
interface FlashPop { id: number; mrt: number; inhibition_rate: number; iiv_score: number; created_at: string }
interface NoiseGame { id: number; vocal_intention_latence: number; motrice_planification: number; created_at: string }

interface TimelinePoint {
  label: string;
  ts: number;
  mrt: number | null;
  motrice: number | null;
  drugCount: number;
  criseCount: number;
  inhibition: number | null;
}

/* ═══════════════════════════════════════════════════════════
   MATH HELPERS
   ═══════════════════════════════════════════════════════════ */
const toDate = (s: string) => new Date(s.replace(' ', 'T'));
const avg = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = avg(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

function pearson(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 3) return 0;
  const n = x.length;
  const sx = x.reduce((a, b) => a + b, 0);
  const sy = y.reduce((a, b) => a + b, 0);
  const sxy = x.reduce((a, xi, i) => a + xi * y[i], 0);
  const sx2 = x.reduce((a, xi) => a + xi * xi, 0);
  const sy2 = y.reduce((a, yi) => a + yi * yi, 0);
  const num = n * sxy - sx * sy;
  const den = Math.sqrt((n * sx2 - sx * sx) * (n * sy2 - sy * sy));
  return den === 0 ? 0 : num / den;
}

/* ═══════════════════════════════════════════════════════════
   DOMAIN LOGIC
   ═══════════════════════════════════════════════════════════ */
function impactRatio(crises: Crise[]): number {
  const now = Date.now(), W = 7 * 864e5;
  const curr = crises.filter(c => now - toDate(c.created_at).getTime() <= W).length;
  const prev = crises.filter(c => {
    const d = now - toDate(c.created_at).getTime();
    return d > W && d <= 2 * W;
  }).length;
  if (prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

function adherenceCalc(drugs: Drug[]): { count: number; target: number; pct: number } {
  const now = Date.now(), W = 7 * 864e5;
  const count = drugs.filter(d => now - toDate(d.created_at).getTime() <= W).length;
  const target = 14;
  return { count, target, pct: clamp((count / target) * 100, 0, 100) };
}

function stabilityScore(fp: FlashPop[], ng: NoiseGame[]): number {
  if (!fp.length && !ng.length) return 0;

  // Ne garder que les 5 dernières sessions de chaque jeu
  // pour éviter que l'historique ancien dilue les performances récentes
  const RECENT = 5;
  const recentFp = fp
    .slice()
    .sort((a, b) => toDate(b.created_at).getTime() - toDate(a.created_at).getTime())
    .slice(0, RECENT);
  const recentNg = ng
    .slice()
    .sort((a, b) => toDate(b.created_at).getTime() - toDate(a.created_at).getTime())
    .slice(0, RECENT);

  // IIV (écart-type des temps de réaction) : 0ms = parfait, ≥300ms = instable
  // Échelle linéaire inversée sur [0, 300] → [100, 0]
  const iiv = recentFp.length
    ? clamp(100 - (avg(recentFp.map(f => f.iiv_score)) / 300) * 100, 0, 100)
    : null;

  // Planification motrice (air time moyen/saut) : ~400ms = bon contrôle, ≥1200ms = flottement excessif
  // Meilleur score autour de 400ms, dégradation au-delà
  const avgMot = recentNg.length ? avg(recentNg.map(n => n.motrice_planification)) : null;
  const mot = avgMot !== null
    ? clamp(100 - Math.abs(avgMot - 400) / 8, 0, 100)
    : null;

  // Moyenne pondérée uniquement sur les métriques disponibles
  if (iiv !== null && mot !== null) return Math.round(0.5 * iiv + 0.5 * mot);
  if (iiv !== null) return Math.round(iiv);
  return Math.round(mot!);
}

// Fenêtre de proximité pour associer drugs/crises à une session de jeu (±30 min)
const PROXIMITY_MS = 30 * 60 * 1000;

const fmtTime = (d: Date) => {
  const dd = d.getDate(), mm = d.getMonth() + 1;
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} ${hh}:${mi}`;
};

function buildTimeline(
  crises: Crise[], drugs: Drug[], fps: FlashPop[], ngs: NoiseGame[]
): TimelinePoint[] {
  const points: TimelinePoint[] = [];
  const gameTimestamps: number[] = [];

  for (const fp of fps) {
    const t = toDate(fp.created_at).getTime();
    gameTimestamps.push(t);
    points.push({
      ts: t,
      label: fmtTime(toDate(fp.created_at)),
      mrt: Math.round(fp.mrt),
      motrice: null,
      inhibition: Math.round(fp.inhibition_rate * 100) / 100,
      drugCount: drugs.filter(d => Math.abs(toDate(d.created_at).getTime() - t) <= PROXIMITY_MS).length,
      criseCount: crises.filter(c => Math.abs(toDate(c.created_at).getTime() - t) <= PROXIMITY_MS).length,
    });
  }

  for (const ng of ngs) {
    const t = toDate(ng.created_at).getTime();
    gameTimestamps.push(t);
    points.push({
      ts: t,
      label: fmtTime(toDate(ng.created_at)),
      mrt: null,
      motrice: Math.round(ng.motrice_planification),
      inhibition: null,
      drugCount: drugs.filter(d => Math.abs(toDate(d.created_at).getTime() - t) <= PROXIMITY_MS).length,
      criseCount: crises.filter(c => Math.abs(toDate(c.created_at).getTime() - t) <= PROXIMITY_MS).length,
    });
  }

  // Ajouter les drugs qui ne sont proches d'aucune session de jeu
  for (const d of drugs) {
    const t = toDate(d.created_at).getTime();
    const nearGame = gameTimestamps.some(gt => Math.abs(gt - t) <= PROXIMITY_MS);
    if (!nearGame) {
      points.push({
        ts: t, label: fmtTime(toDate(d.created_at)),
        mrt: null, motrice: null, inhibition: null,
        drugCount: 1, criseCount: crises.filter(c => Math.abs(toDate(c.created_at).getTime() - t) <= PROXIMITY_MS).length,
      });
    }
  }

  // Ajouter les crises qui ne sont proches d'aucune session de jeu ni d'un drug déjà ajouté
  const allTs = points.map(p => p.ts);
  for (const c of crises) {
    const t = toDate(c.created_at).getTime();
    const nearExisting = allTs.some(et => Math.abs(et - t) <= PROXIMITY_MS);
    if (!nearExisting) {
      points.push({
        ts: t, label: fmtTime(toDate(c.created_at)),
        mrt: null, motrice: null, inhibition: null,
        drugCount: 0, criseCount: 1,
      });
    }
  }

  points.sort((a, b) => a.ts - b.ts);
  return points;
}

function getLastDrug(drugs: Drug[]): string {
  if (!drugs.length) return '—';
  return [...drugs].sort((a, b) => toDate(b.created_at).getTime() - toDate(a.created_at).getTime())[0].name;
}

/* ═══════════════════════════════════════════════════════════
   ANIMATED COUNT-UP HOOK
   ═══════════════════════════════════════════════════════════ */
function useCountUp(target: number, decimals = 1, duration = 1400) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      setVal(from + (target - from) * eased);
      if (t < 1) requestAnimationFrame(tick);
      else prev.current = target;
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return Number(val.toFixed(decimals));
}

/* ═══════════════════════════════════════════════════════════
   VOCAL GAUGE (SVG + glow)
   ═══════════════════════════════════════════════════════════ */
const VocalGauge: React.FC<{ value: number; maxVal: number }> = ({ value, maxVal }) => {
  const pct = clamp(value / maxVal, 0, 1);
  const R = 70, CX = 90, CY = 90;
  const circ = Math.PI * R;
  const offset = circ * (1 - pct);
  const hue = (1 - pct) * 120;
  const color = `hsl(${hue}, 80%, 55%)`;
  return (
    <div className="gauge-wrapper">
      <svg viewBox="0 0 180 110" className="gauge-svg">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d={`M ${CX - R},${CY} A ${R},${R} 0 0,1 ${CX + R},${CY}`}
          fill="none" stroke="#eaeaea" strokeWidth="14" strokeLinecap="round" />
        <path d={`M ${CX - R},${CY} A ${R},${R} 0 0,1 ${CX + R},${CY}`}
          fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          filter="url(#glow)"
          style={{ transition: 'stroke-dashoffset 1.2s ease, stroke 1.2s ease' }} />
        <text x={CX} y={CY - 15} textAnchor="middle" className="gauge-value-text">{Math.round(value)}</text>
        <text x={CX} y={CY + 5} textAnchor="middle" className="gauge-unit-text">ms</text>
      </svg>
      <div className="gauge-labels"><span>Optimal</span><span>Fatigue</span></div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   CUSTOM TOOLTIP
   ═══════════════════════════════════════════════════════════ */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as TimelinePoint | undefined;
  return (
    <div className="metrics-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p: any, i: number) =>
        p.value != null ? (
          <p key={i} style={{ color: p.color || p.stroke }}>
            {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</strong>
          </p>
        ) : null
      )}
      {point && point.drugCount > 0 && (
        <p style={{ color: '#66BB6A', fontWeight: 700 }}>Médicament(s) : {point.drugCount}</p>
      )}
      {point && point.criseCount > 0 && (
        <p style={{ color: '#FF6B6B', fontWeight: 700 }}>Crise(s) : {point.criseCount}</p>
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
  const [refreshing, setRefreshing] = useState(false);
  const [childName, setChildName] = useState<string>('');
  const { activeWorkspace } = useWorkspaceStore();

  const fetchData = async () => {
    try {
      let currentChildId = null;
      let currentChildName = '';

      if (activeWorkspace) {
        // Mode Parent : on cherche l'enfant du workspace
        const { supabase } = await import('../lib/supabase');
        const { data: children, error: childError } = await supabase
          .from('children')
          .select('id, name')
          .eq('workspace_id', activeWorkspace.id)
          .limit(1);

        if (childError) throw childError;

        if (children && children.length > 0) {
          currentChildId = children[0].id;
          currentChildName = children[0].name;
        }
      } else {
        // Tentative de fallback sur l'auth enfant directe
        const childAuthStr = localStorage.getItem('childAuth');
        if (childAuthStr) {
          const auth = JSON.parse(childAuthStr);
          currentChildId = auth.id;
          currentChildName = auth.name;
        }
      }

      if (!currentChildId) {
        setError('Aucun enfant ou workspace sélectionné');
        setLoading(false);
        return;
      }

      setChildName(currentChildName);
      console.log("[Analysis] Fetching data for child:", currentChildId, currentChildName);

      // Récupérer les données depuis Supabase
      const [c, d, fpRaw, ngRaw] = await Promise.all([
        api.getCrises(),
        api.getDrugs(),
        api.getFlashPopHistory(),
        api.getNoiseGameHistory(),
      ]);

      console.log("[Analysis] Data fetched:", { crises: c, drugs: d, flashPop: fpRaw, noiseGame: ngRaw });

      // Transformer les données au format attendu par AnalysisPage
      const fp = (fpRaw || []).map((session: any) => ({
        id: session.id,
        mrt: session.metrics?.mrt || 0,
        inhibition_rate: session.metrics?.inhibition_rate || 0,
        iiv_score: session.metrics?.iiv_score || 0,
        created_at: session.started_at,
      }));

      const ng = (ngRaw || []).map((session: any) => ({
        id: session.id,
        vocal_intention_latence: session.metrics?.vocal_intention_latence || 0,
        motrice_planification: session.metrics?.motrice_planification || 0,
        created_at: session.started_at,
      }));

      setCrises(Array.isArray(c) ? c : []);
      setDrugs(Array.isArray(d) ? d : []);
      setFlashPops(fp);
      setNoiseGames(ng);
      setError(null);
    } catch (e: any) {
      console.error("[Analysis] Fetch error:", e);
      setError(e.message);
    }
  };

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setTimeout(() => setRefreshing(false), 600);
  };

  /* ── Computed ── */
  const impact = useMemo(() => impactRatio(crises), [crises]);
  const adh = useMemo(() => adherenceCalc(drugs), [drugs]);
  const stability = useMemo(() => stabilityScore(flashPops, noiseGames), [flashPops, noiseGames]);
  const timeline = useMemo(() => buildTimeline(crises, drugs, flashPops, noiseGames), [crises, drugs, flashPops, noiseGames]);
  const baselineMrt = useMemo(() => flashPops.length ? Math.round(avg(flashPops.map(f => f.mrt))) : null, [flashPops]);
  const baselineVocal = useMemo(() => noiseGames.length ? Math.round(avg(noiseGames.map(n => n.vocal_intention_latence))) : null, [noiseGames]);
  const avgVocal = useMemo(() => noiseGames.length ? avg(noiseGames.map(n => n.vocal_intention_latence)) : 0, [noiseGames]);
  const maxVocal = useMemo(() => noiseGames.length ? Math.max(...noiseGames.map(n => n.vocal_intention_latence), 500) : 500, [noiseGames]);
  const lastDrug = useMemo(() => getLastDrug(drugs), [drugs]);
  const totalSessions = flashPops.length + noiseGames.length;

  /* ── Stats ── */
  const stats = useMemo(() => {
    const mrtArr = flashPops.map(f => f.mrt);
    const motriceArr = noiseGames.map(n => n.motrice_planification);
    const inhibArr = flashPops.map(f => f.inhibition_rate);
    const tl = timeline.filter(t => t.mrt !== null);
    const r = pearson(tl.map(t => t.drugCount), tl.map(t => t.mrt as number));
    return {
      mrtMean: avg(mrtArr), mrtStdDev: stdDev(mrtArr),
      motriceMean: avg(motriceArr), motriceStdDev: stdDev(motriceArr),
      inhibMean: avg(inhibArr), correlation: r,
      totalDataPoints: flashPops.length + noiseGames.length + crises.length + drugs.length,
    };
  }, [flashPops, noiseGames, crises, drugs, timeline]);

  /* ── Animated ── */
  const animImpact = useCountUp(impact);
  const animStability = useCountUp(stability, 0);
  const animMrt = useCountUp(stats.mrtMean, 0);

  const inhibitionData = useMemo(() =>
    flashPops.map(fp => ({
      date: fmtTime(toDate(fp.created_at)),
      ts: toDate(fp.created_at).getTime(),
      rate: fp.inhibition_rate,
      iiv: fp.iiv_score,
    })), [flashPops]);

  const hasData = crises.length || drugs.length || flashPops.length || noiseGames.length;

  if (loading) {
    return (<div className="metrics-page"><div className="metrics-loading"><div className="spinner" /><p>Chargement des données...</p></div></div>);
  }
  if (error && !hasData) {
    return (<div className="metrics-page"><div className="metrics-empty"><Activity size={48} /><p>Erreur : {error}</p></div></div>);
  }
  if (!hasData) {
    return (
      <div className="metrics-page">
        <div className="metrics-empty">
          <Brain size={48} /><h3>Aucune donnée disponible</h3>
          <p>Jouez à Flash Pop ou au Jeu du Bruit pour commencer à collecter des métriques.</p>
        </div>
        <button
          onClick={() => fetchData()}
          className="refresh-btn"
          title="Rafraîchir les données"
        >
          <RefreshCw className={refreshing ? 'spinning' : ''} size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="metrics-page">
      {/* ═══ HEADER ═══ */}
      <div className="metrics-header-row">
        <div>
          <h1 className="metrics-title">NeuroPerformance{childName ? ` — ${childName}` : ''}</h1>
          <p className="metrics-subtitle">{stats.totalDataPoints} données — Dernier traitement : {lastDrug}</p>
        </div>
        <button className={`btn-refresh ${refreshing ? 'spinning' : ''}`} onClick={handleRefresh}>
          <RefreshCw size={18} />
        </button>
      </div>

      {/* ═══ HERO: 3D BRAIN + KPIs ═══ */}
      <div className="metrics-hero">
        <div className="brain-container metrics-glass">
          <Suspense fallback={<div className="brain-fallback"><Brain size={64} className="pulse-icon" /></div>}>
            <BrainScene stability={stability} dataCount={totalSessions}
              criseCount={crises.length} drugCount={drugs.length} flashPopCount={flashPops.length} />
          </Suspense>
          <div className="brain-overlay">
            <span className="brain-score">{animStability}</span>
            <span className="brain-label">Stabilité Cognitive</span>
            <span className="brain-explain">Basé sur les 5 dernières sessions : régularité des réactions (IIV) + contrôle moteur vocal. 100 = stable, 0 = instable.</span>
          </div>
        </div>

        <div className="metrics-kpi-strip">
          <div className="metrics-glass metrics-kpi-card fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className={`kpi-icon-box ${impact <= 0 ? 'kpi-green' : 'kpi-red'}`}>
              {impact <= 0 ? <TrendingDown size={22} /> : <TrendingUp size={22} />}
            </div>
            <div className="kpi-body">
              <span className="kpi-label">Réduction des Crises</span>
              <span className={`kpi-value ${impact <= 0 ? 'text-green' : 'text-red'}`}>
                {impact > 0 ? '+' : ''}{animImpact.toFixed(1)}%
              </span>
              <span className="kpi-hint">Variation du nombre de crises entre les 7 derniers jours et les 7 jours d'avant. Négatif = amélioration.</span>
            </div>
          </div>

          <div className="metrics-glass metrics-kpi-card fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="kpi-icon-box kpi-blue"><Pill size={22} /></div>
            <div className="kpi-body">
              <span className="kpi-label">Adhérence Traitement</span>
              <span className="kpi-value">{adh.count}<span className="kpi-frac">/{adh.target}</span></span>
              <div className="kpi-bar"><div className="kpi-bar-fill" style={{ width: `${adh.pct}%` }} /></div>
              <span className="kpi-hint">Nombre de prises de médicament enregistrées sur 7 jours, vs l'objectif de {adh.target} prises/semaine.</span>
            </div>
          </div>

          <div className="metrics-glass metrics-kpi-card fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="kpi-icon-box kpi-purple"><Zap size={22} /></div>
            <div className="kpi-body">
              <span className="kpi-label">MRT Moyen</span>
              <span className="kpi-value">{animMrt}<span className="kpi-frac"> ms</span></span>
              <span className="kpi-hint">Mean Reaction Time : temps de réaction moyen pour cliquer un ballon dans Flash Pop. {stats.mrtStdDev > 0 ? `Écart-type (σ) = ${stats.mrtStdDev.toFixed(1)} ms.` : 'En attente de données.'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ STATS BANNER ═══ */}
      <div className="stats-banner fade-in-up" style={{ animationDelay: '0.35s' }}>
        <div className="stat-chip" title="Nombre total d'enregistrements (crises + médicaments + sessions de jeu)">
          <span className="stat-label-mini">n =</span><span className="stat-val-mini">{stats.totalDataPoints}</span>
        </div>
        <div className="stat-chip" title="Corrélation de Pearson entre le nombre de prises de médicament et le temps de réaction moyen par jour. Proche de -1 = le traitement réduit le MRT.">
          <span className="stat-label-mini">r(Drug,MRT) =</span>
          <span className={`stat-val-mini ${Math.abs(stats.correlation) > 0.3 ? 'text-green' : ''}`}>{stats.correlation.toFixed(3)}</span>
        </div>
        <div className="stat-chip" title="Écart-type du temps de réaction moyen entre les sessions. Plus c'est bas, plus les performances sont régulières.">
          <span className="stat-label-mini">σ MRT =</span><span className="stat-val-mini">{stats.mrtStdDev.toFixed(1)}</span>
        </div>
        <div className="stat-chip" title="Écart-type de la planification motrice entre les sessions. Plus c'est bas, plus le controle moteur est stable.">
          <span className="stat-label-mini">σ Motrice =</span><span className="stat-val-mini">{stats.motriceStdDev.toFixed(1)}</span>
        </div>
        <div className="stat-chip" title="Taux d'inhibition moyen : capacité à ne pas cliquer sur les méduses dans Flash Pop. 100% = aucune méduse cliquée.">
          <span className="stat-label-mini">Inhib. moy =</span><span className="stat-val-mini">{(stats.inhibMean * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* ═══ MASTER CORRELATION CHART ═══ */}
      <section className="metrics-section fade-in-up" style={{ animationDelay: '0.4s' }}>
        <div className="section-title-row"><BarChart3 size={20} /><h2 className="metrics-section-title">Corrélation Traitement — Performance</h2></div>
        <div className="metrics-glass metrics-chart-box">
          {timeline.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={360}>
                <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradMrt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4facfe" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4facfe" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradMotrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9C7CFF" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#9C7CFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#999', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: '#999', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#999', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />

                  {baselineMrt != null && (
                    <ReferenceLine yAxisId="left" y={baselineMrt} stroke="#4facfe" strokeDasharray="6 4" strokeOpacity={0.35}
                      label={{ value: `Baseline ${baselineMrt}ms`, fill: '#4facfe', fontSize: 10, position: 'right' }} />
                  )}

                  <Area yAxisId="left" type="monotone" dataKey="mrt" stroke="#4facfe" strokeWidth={3}
                    fill="url(#gradMrt)" fillOpacity={1} connectNulls name="MRT (Flash Pop)"
                    dot={{ r: 5, fill: '#4facfe', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 7, stroke: '#4facfe', strokeWidth: 2, fill: '#fff' }} />
                  <Area yAxisId="right" type="monotone" dataKey="motrice" stroke="#9C7CFF" strokeWidth={3}
                    fill="url(#gradMotrice)" fillOpacity={1} connectNulls name="Planif. Motrice (ms)"
                    dot={{ r: 5, fill: '#9C7CFF', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 7, stroke: '#9C7CFF', strokeWidth: 2, fill: '#fff' }} />
                </AreaChart>
              </ResponsiveContainer>

              {/* Barre d'événements : médicaments et crises */}
              <div className="events-bar">
                {timeline.map((t, i) => (
                  <div key={i} className="events-bar-slot">
                    {t.drugCount > 0 && (
                      <span className="event-pill event-drug" title={`${t.label} — ${t.drugCount} médicament(s)`}>
                        💊 ×{t.drugCount}
                      </span>
                    )}
                    {t.criseCount > 0 && (
                      <span className="event-pill event-crise" title={`${t.label} — ${t.criseCount} crise(s)`}>
                        ⚡ ×{t.criseCount}
                      </span>
                    )}
                    {t.drugCount === 0 && t.criseCount === 0 && (
                      <span className="event-pill event-empty" />
                    )}
                  </div>
                ))}
              </div>

              <div className="chart-legend-row">
                <span className="legend-chip"><span className="ldot" style={{ background: '#4facfe' }} />MRT (temps de réaction, ms)</span>
                <span className="legend-chip"><span className="ldot" style={{ background: '#9C7CFF' }} />Planif. Motrice (durée en l'air, ms)</span>
                <span className="legend-chip"><span className="ldot" style={{ background: '#66BB6A' }} />💊 Prise médicament</span>
                <span className="legend-chip"><span className="ldot ldot-crisis" />⚡ Crise</span>
              </div>
              <p className="chart-explain">Ce graphique montre l'évolution session par session. La courbe bleue (MRT) indique la vitesse de réaction cognitive. La courbe violette mesure le contrôle moteur vocal. La barre d'événements sous le graphique affiche les prises de médicaments (💊 vert) et les crises (⚡ rouge) à proximité de chaque session (±30 min), ou de manière autonome si aucun jeu n'a eu lieu à ce moment.</p>
            </>
          ) : (
            <p className="no-data-msg">Jouez quelques sessions pour voir apparaitre le graphique.</p>
          )}
        </div>

        <div className="metrics-glass metrics-analysis-box">
          <Activity size={18} />
          <p>
            <strong>Analyse automatique :</strong>{' '}
            {impact <= 0
              ? `L'amélioration de la planification motrice coïncide avec la prise de ${lastDrug}. Les crises ont diminué de ${Math.abs(impact).toFixed(1)}% sur les 7 derniers jours.`
              : crises.length === 0
                ? 'Aucune crise enregistrée. Continuez le suivi pour établir une baseline fiable.'
                : `Augmentation de ${impact.toFixed(1)}% des crises. Un suivi rapproché est recommandé.`}
            {stats.correlation !== 0 && (
              <> Corrélation Drug/MRT : <strong>r = {stats.correlation.toFixed(3)}</strong>
                {Math.abs(stats.correlation) > 0.5 ? ' (significative)' : ' (faible)'}.</>
            )}
          </p>
        </div>
      </section>

      {/* ═══ BOTTOM GRID ═══ */}
      <div className="metrics-bottom-grid">
        <section className="metrics-glass metrics-card-padded fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="card-header-row"><Mic size={18} /><h3>Jauge de Stress Vocal</h3></div>
          <p className="card-desc">Temps moyen entre l'approche d'un obstacle et le cri du joueur dans le Jeu du Bruit. Une valeur haute indique un temps de réaction vocal lent (fatigue ou difficulté de planification).</p>
          {noiseGames.length > 0 ? (
            <><VocalGauge value={avgVocal} maxVal={maxVocal} />
              {baselineVocal != null && <p className="baseline-note">Baseline : <strong>{baselineVocal} ms</strong></p>}</>
          ) : <p className="no-data-msg">Jouez au Jeu du Bruit pour collecter des données vocales.</p>}
        </section>

        <section className="metrics-glass metrics-card-padded fade-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="card-header-row"><Zap size={18} /><h3>Carte d'Inhibition</h3></div>
          <p className="card-desc">Chaque point = une session Flash Pop. Axe Y = taux d'inhibition (capacité à éviter les méduses, 1.0 = parfait). Taille du point = variabilité intra-individuelle (IIV, écart-type des temps de réaction). Vert = bonne inhibition (&ge;70%), orange = modérée, rouge = faible (&lt;40%).</p>
          {inhibitionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fill: '#999', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="rate" tick={{ fill: '#999', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 1]} />
                <ZAxis dataKey="iiv" range={[80, 500]} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  labelStyle={{ color: '#1A1A1A' }} itemStyle={{ color: '#666' }} />
                <Scatter name="Inhibition" data={inhibitionData}>
                  {inhibitionData.map((d, i) => (
                    <Cell key={i} fill={d.rate >= 0.7 ? '#66BB6A' : d.rate >= 0.4 ? '#FFA726' : '#FF6B6B'} fillOpacity={0.8} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          ) : <p className="no-data-msg">Jouez à Flash Pop pour collecter des données d'inhibition.</p>}
        </section>
      </div>
    </div>
  );
};

export default AnalysisPage;
