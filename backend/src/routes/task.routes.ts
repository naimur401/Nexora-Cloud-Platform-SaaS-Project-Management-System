import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import pool from "../config/database";

const router = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tasks ORDER BY id DESC");
    res.json({ success: true, data: result.rows });
  } catch { res.status(500).json({ success: false, message: "Failed to fetch tasks" }); }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const { title, description, priority, projectId, assignedTo } = req.body;
    const result = await pool.query(
      "INSERT INTO tasks (title, description, priority, project_id, assigned_to) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [title, description, priority || "MEDIUM", projectId, assignedTo || null]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch { res.status(500).json({ success: false, message: "Failed to create task" }); }
});

router.put("/:id/status", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [req.body.status, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch { res.status(500).json({ success: false, message: "Failed to update task" }); }
});

export default router;
