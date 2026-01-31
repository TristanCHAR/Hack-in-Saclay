import { Router, type Request, type Response } from "express";
import db from "../db";
import type { CriseHistory } from "../types";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const rows = db.prepare("SELECT * FROM crise_history ORDER BY created_at DESC").all() as CriseHistory[];
  res.json(rows);
});

router.get("/:id", (req: Request<{ id: string }>, res: Response) => {
  const row = db.prepare("SELECT * FROM crise_history WHERE id = ?").get(req.params.id) as CriseHistory | undefined;
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.post("/", (req: Request<{}, {}, { duration: number }>, res: Response) => {
  const { duration } = req.body;
  if (duration == null || typeof duration !== "number") {
    res.status(400).json({ error: "duration (number) is required" });
    return;
  }
  const result = db.prepare("INSERT INTO crise_history (duration) VALUES (?)").run(duration);
  const row = db.prepare("SELECT * FROM crise_history WHERE id = ?").get(result.lastInsertRowid) as CriseHistory;
  res.status(201).json(row);
});

router.delete("/:id", (req: Request<{ id: string }>, res: Response) => {
  const result = db.prepare("DELETE FROM crise_history WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).send();
});

export default router;
