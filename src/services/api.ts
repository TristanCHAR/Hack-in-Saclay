import { supabase } from '../lib/supabase';

// Helper pour récupérer le child_id actuel (enfant ou workspace)
const getCurrentChildId = async (): Promise<string | null> => {
  // 1. Si connecté en tant qu'enfant (directement via ChildLoginPage)
  const childAuthStr = localStorage.getItem('childAuth');
  if (childAuthStr) {
    try {
      const childAuth = JSON.parse(childAuthStr);
      // Correction : l'objet persiste est directement le child, pas {child: ...}
      const id = childAuth.id || null;
      if (id) {
        console.log("[API] Resolved childId from childAuth (Child Mode):", id);
        return id;
      }
    } catch { }
  }

  // 2. Si connecté en tant que parent (via LoginPage), on cherche l'enfant du workspace actif
  const workspaceStr = localStorage.getItem('activeWorkspace');
  if (workspaceStr) {
    try {
      const workspace = JSON.parse(workspaceStr);
      console.log("[API] Fetching child for workspace (Parent Mode):", workspace.id);

      const { data, error } = await supabase
        .from('children')
        .select('id')
        .eq('workspace_id', workspace.id)
        .limit(1);

      if (error) throw error;

      const id = data && data.length > 0 ? data[0].id : null;
      console.log("[API] Resolved childId from workspace:", id);
      return id;
    } catch (err) {
      console.error("[API] Error resolving child from workspace:", err);
    }
  }

  console.warn("[API] Could not resolve any childId (Not logged in as child or no workspace selected)");
  return null;
};

export const api = {
  // ============================================
  // GAME SESSIONS (Supabase)
  // ============================================

  getFlashPopHistory: async () => {
    const childId = await getCurrentChildId();
    if (!childId) {
      console.warn("[API] getFlashPopHistory: No childId found");
      return [];
    }

    console.log("[API] getFlashPopHistory for child:", childId);
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('child_id', childId)
      .eq('game_id', 'flash-pop')
      .order('started_at', { ascending: false });

    if (error) {
      console.error("[API] getFlashPopHistory error:", error);
      return [];
    }

    console.log("[API] getFlashPopHistory result count:", data?.length || 0);
    return data || [];
  },

  createFlashPopResult: async (mrt: number, inhibition_rate: number, iiv_score: number) => {
    const childId = await getCurrentChildId();
    if (!childId) throw new Error('No child ID found');

    const payload = {
      child_id: childId,
      game_id: 'flash-pop',
      metrics: { mrt, inhibition_rate, iiv_score },
      score: Math.round(inhibition_rate * 100),
    };

    console.log("[API] createFlashPopResult payload:", payload);
    const { data, error } = await supabase
      .from('game_sessions')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("[API] createFlashPopResult error:", error);
      throw error;
    }

    console.log("[API] createFlashPopResult success:", data.id);

    // Aussi enregistrer dans cognitive_scores (faculty, score, session_id)
    const { error: scoreError } = await supabase.from('cognitive_scores').insert({
      child_id: childId,
      session_id: data.id,
      faculty: 'inhibition',
      score: Math.round(inhibition_rate * 100),
    });

    if (scoreError) {
      console.warn("[API] cognitive_scores insert failed (non-critical):", scoreError);
    }

    return data;
  },

  getNoiseGameHistory: async () => {
    const childId = await getCurrentChildId();
    if (!childId) return [];

    console.log("[API] getNoiseGameHistory for child:", childId);
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('child_id', childId)
      .eq('game_id', 'noise-game')
      .order('started_at', { ascending: false });

    if (error) {
      console.error("[API] getNoiseGameHistory error:", error);
      return [];
    }

    return data || [];
  },

  createNoiseGameResult: async (vocal_intention_latence: number, motrice_planification: number) => {
    const childId = await getCurrentChildId();
    if (!childId) throw new Error('No child ID found');

    const payload = {
      child_id: childId,
      game_id: 'noise-game',
      metrics: { vocal_intention_latence, motrice_planification },
    };

    console.log("[API] createNoiseGameResult payload:", payload);
    const { data, error } = await supabase
      .from('game_sessions')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("[API] createNoiseGameResult error:", error);
      throw error;
    }
    return data;
  },

  // ============================================
  // CRISES & DRUGS (Supabase également)
  // ============================================

  getCrises: async () => {
    const childId = await getCurrentChildId();
    if (!childId) return [];

    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('child_id', childId)
      .eq('game_id', 'crise')
      .order('started_at', { ascending: false });

    if (error) {
      console.error("[API] getCrises error:", error);
      return [];
    }

    return (data || []).map((d: any) => ({
      id: d.id,
      duration: d.metrics?.duration || 0,
      created_at: d.started_at,
    }));
  },

  createCrise: async (duration: number) => {
    const childId = await getCurrentChildId();
    if (!childId) throw new Error('No child ID found');

    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        child_id: childId,
        game_id: 'crise',
        metrics: { duration },
      })
      .select()
      .single();

    if (error) {
      console.error("[API] createCrise error:", error);
      throw error;
    }
    return data;
  },

  getDrugs: async () => {
    const childId = await getCurrentChildId();
    if (!childId) return [];

    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('child_id', childId)
      .eq('game_id', 'drug')
      .order('started_at', { ascending: false });

    if (error) {
      console.error("[API] getDrugs error:", error);
      return [];
    }

    return (data || []).map((d: any) => ({
      id: d.id,
      name: d.metrics?.name || 'Unknown',
      created_at: d.started_at,
    }));
  },

  createDrug: async (name: string) => {
    const childId = await getCurrentChildId();
    if (!childId) throw new Error('No child ID found');

    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        child_id: childId,
        game_id: 'drug',
        metrics: { name },
      })
      .select()
      .single();

    if (error) {
      console.error("[API] createDrug error:", error);
      throw error;
    }
    return data;
  },
};
