const API_BASE_URL = 'http://localhost:3000';

export const api = {
  // Crise History
  getCrises: () => fetch(`${API_BASE_URL}/crise-history`).then(res => res.json()),
  createCrise: (duration: number) =>
    fetch(`${API_BASE_URL}/crise-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration })
    }).then(res => res.json()),

  // Drug History
  getDrugs: () => fetch(`${API_BASE_URL}/drug-history`).then(res => res.json()),
  createDrug: (name: string) =>
    fetch(`${API_BASE_URL}/drug-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    }).then(res => res.json()),

  // Flash Pop History (Cognitif)
  getFlashPopHistory: () => fetch(`${API_BASE_URL}/flash-pop-history`).then(res => res.json()),
  createFlashPopResult: (mrt: number, inhibition_rate: number, iiv_score: number) =>
    fetch(`${API_BASE_URL}/flash-pop-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mrt, inhibition_rate, iiv_score })
    }).then(res => res.json()),

  // Noise Game History (Moteur)
  getNoiseGameHistory: () => fetch(`${API_BASE_URL}/noise-game-history`).then(res => res.json()),
  createNoiseGameResult: (vocal_initention_latence: number, motrice_planification: number) =>
    fetch(`${API_BASE_URL}/noise-game-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vocal_initention_latence, motrice_planification })
    }).then(res => res.json()),
};
