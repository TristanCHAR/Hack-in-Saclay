import { Router, type Request, type Response } from "express";
import db from "../db";
import type { DrugHistory } from "../types";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const rows = db.prepare("SELECT * FROM drug_history ORDER BY created_at DESC").all() as DrugHistory[];
  res.json(rows);
});

router.get("/:id", (req: Request<{ id: string }>, res: Response) => {
  const row = db.prepare("SELECT * FROM drug_history WHERE id = ?").get(req.params.id) as DrugHistory | undefined;
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.post("/", (req: Request<{}, {}, { name: string }>, res: Response) => {
  const { name } = req.body;
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "name (string) is required" });
    return;
  }
  const result = db.prepare("INSERT INTO drug_history (name) VALUES (?)").run(name);
  const row = db.prepare("SELECT * FROM drug_history WHERE id = ?").get(result.lastInsertRowid) as DrugHistory;
  res.status(201).json(row);
});

router.delete("/:id", (req: Request<{ id: string }>, res: Response) => {
  const result = db.prepare("DELETE FROM drug_history WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).send();
});

export default router;
