import { Router, type Request, type Response } from "express";
import db from "../db";
import type { NoiseGameHistory } from "../types";

interface NoiseGameBody {
  vocal_initention_latence: number;
  motrice_planification: number;
}

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const rows = db.prepare("SELECT * FROM noise_game_history ORDER BY created_at DESC").all() as NoiseGameHistory[];
  res.json(rows);
});

router.get("/:id", (req: Request<{ id: string }>, res: Response) => {
  const row = db.prepare("SELECT * FROM noise_game_history WHERE id = ?").get(req.params.id) as NoiseGameHistory | undefined;
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.post("/", (req: Request<{}, {}, NoiseGameBody>, res: Response) => {
  const { vocal_initention_latence, motrice_planification } = req.body;
  if (typeof vocal_initention_latence !== "number" || typeof motrice_planification !== "number") {
    res.status(400).json({ error: "vocal_initention_latence, motrice_planification (both numbers) are required" });
    return;
  }
  const result = db
    .prepare("INSERT INTO noise_game_history (vocal_initention_latence, motrice_planification) VALUES (?, ?)")
    .run(vocal_initention_latence, motrice_planification);
  const row = db.prepare("SELECT * FROM noise_game_history WHERE id = ?").get(result.lastInsertRowid) as NoiseGameHistory;
  res.status(201).json(row);
});

router.delete("/:id", (req: Request<{ id: string }>, res: Response) => {
  const result = db.prepare("DELETE FROM noise_game_history WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).send();
});

export default router;
