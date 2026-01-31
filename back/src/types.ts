export interface CriseHistory {
  id: number;
  duration: number;
  created_at: string;
}

export interface DrugHistory {
  id: number;
  name: string;
  created_at: string;
}

export interface FlashPopHistory {
  id: number;
  mrt: number;
  inhibition_rate: number;
  iiv_score: number;
  created_at: string;
}

export interface NoiseGameHistory {
  id: number;
  vocal_initention_latence: number;
  motrice_planification: number;
  created_at: string;
}
