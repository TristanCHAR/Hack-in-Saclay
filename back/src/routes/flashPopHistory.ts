import { Router, type Request, type Response } from "express";
import db from "../db";
import type { FlashPopHistory } from "../types";

interface FlashPopBody {
  mrt: number;
  inhibition_rate: number;
  iiv_score: number;
}

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const rows = db.prepare("SELECT * FROM flash_pop_history ORDER BY created_at DESC").all() as FlashPopHistory[];
  res.json(rows);
});

router.get("/:id", (req: Request<{ id: string }>, res: Response) => {
  const row = db.prepare("SELECT * FROM flash_pop_history WHERE id = ?").get(req.params.id) as FlashPopHistory | undefined;
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.post("/", (req: Request<{}, {}, FlashPopBody>, res: Response) => {
  const { mrt, inhibition_rate, iiv_score } = req.body;
  if (typeof mrt !== "number" || typeof inhibition_rate !== "number" || typeof iiv_score !== "number") {
    res.status(400).json({ error: "mrt, inhibition_rate, iiv_score (all numbers) are required" });
    return;
  }
  const result = db
    .prepare("INSERT INTO flash_pop_history (mrt, inhibition_rate, iiv_score) VALUES (?, ?, ?)")
    .run(mrt, inhibition_rate, iiv_score);
  const row = db.prepare("SELECT * FROM flash_pop_history WHERE id = ?").get(result.lastInsertRowid) as FlashPopHistory;
  res.status(201).json(row);
});

router.delete("/:id", (req: Request<{ id: string }>, res: Response) => {
  const result = db.prepare("DELETE FROM flash_pop_history WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).send();
});

export default router;
