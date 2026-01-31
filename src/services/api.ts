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

  // ============================================
  // EVALUATION & ONBOARDING
  // ============================================

  completeEvaluation: async () => {
    const childId = await getCurrentChildId();
    if (!childId) throw new Error('No child ID found');

    console.log("[API] Completing evaluation for child:", childId);

    // 1. Récupérer les derniers scores pour l'algo de recommandation
    const [flashPopHistory, noiseHistory] = await Promise.all([
      api.getFlashPopHistory(),
      api.getNoiseGameHistory()
    ]);

    const lastFlashPop = flashPopHistory[0] || {};
    const lastNoise = noiseHistory[0] || {};

    const inhibitionScore = lastFlashPop.score || 0;
    const noiseScore = 50; // Score arbitraire pour l'instant car NoiseGame n'a pas de score normalisé 0-100 facile

    let recommendationTitle = "";
    let recommendationMsg = "";

    // Logique de recommandation basique (à affiner)
    if (inhibitionScore < 50) {
      recommendationTitle = "Renforcement Inhibition requis";
      recommendationMsg = "L'évaluation indique des difficultés d'inhibition. Nous recommandons des sessions régulières de Flash Pop.";
    } else {
      recommendationTitle = "Bonne Inhibition";
      recommendationMsg = "Excellents résultats en inhibition ! Vous pouvez explorer d'autres jeux pour diversifier.";
    }

    // 2. Marquer l'enfant comme onboarded
    const { error: updateError } = await supabase
      .from('children')
      .update({ is_onboarded: true })
      .eq('id', childId);

    if (updateError) {
      console.error("[API] Failed to update onboarding status:", updateError);
      throw updateError;
    }

    // 3. Créer une notification pour le parent
    // On doit récupérer le workspace_id de l'enfant pour la notif
    const { data: childData } = await supabase
      .from('children')
      .select('workspace_id, name')
      .eq('id', childId)
      .single();

    if (childData) {
      // Message générique basé sur les scores uniquement
      const neutralTitle = `Rapport d'évaluation : ${childData.name}`;
      const neutralMsg = `L'évaluation est terminée. Score Inhibition : ${inhibitionScore}/100. Score Bruit : ${noiseScore}.`;

      const { error: notifError } = await supabase.from('notifications').insert({
        workspace_id: childData.workspace_id,
        child_id: childId,
        type: 'evaluation_report',
        title: neutralTitle,
        message: neutralMsg,
        data: {
          inhibitionScore,
          noiseScore,
          recommendation: "Voir le détail complet dans l'onglet Analyse."
        }
      });

      if (notifError) {
        console.error("[API] Failed to create notification:", notifError);
      } else {
        console.log("[API] Notification created successfully for workspace:", childData.workspace_id);
      }
    }

    console.log("[API] Evaluation completed successfully");
    return true;
  },

  // ============================================
  // NOTIFICATIONS (Parent Inbox)
  // ============================================

  getNotifications: async (workspaceId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[API] getNotifications error:", error);
      return [];
    }
    return data || [];
  },

  markNotificationAsRead: async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error("[API] markNotificationAsRead error:", error);
      throw error;
    }
    if (error) {
      console.error("[API] markNotificationAsRead error:", error);
      throw error;
    }
    return true;
  },

  sendTestNotification: async (workspaceId: string) => {
    console.log("[API] Sending test notification to workspace:", workspaceId);
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        workspace_id: workspaceId,
        type: 'session_alert', // Valid types: 'evaluation_report', 'session_alert', 'milestone'
        title: 'Test Notification',
        message: 'Ceci est une notification de test pour vérifier le système.',
        data: { test: true },
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.error("[API] Failed to send test notification:", error);
      throw error;
    }
    return data;
  }
};
