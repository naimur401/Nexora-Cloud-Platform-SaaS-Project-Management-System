import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import pool from "../config/database";

const router = Router();

router.get("/", authenticate, async (req: any, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects ORDER BY id DESC");
    res.json({ success: true, data: result.rows });
  } catch { res.status(500).json({ success: false, message: "Failed to fetch projects" }); }
});

router.post("/", authenticate, async (req: any, res) => {
  try {
    const { title, description } = req.body;
    const companyId = req.user?.companyId || 1;
    const result = await pool.query("INSERT INTO projects (title, description, company_id) VALUES ($1, $2, $3) RETURNING *", [title, description, companyId]);
    res.json({ success: true, data: result.rows[0] });
  } catch { res.status(500).json({ success: false, message: "Failed to create project" }); }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    await pool.query("DELETE FROM tasks WHERE project_id = $1", [req.params.id]);
    await pool.query("DELETE FROM projects WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: "Project deleted" });
  } catch { res.status(500).json({ success: false, message: "Failed to delete project" }); }
});

export default router;
