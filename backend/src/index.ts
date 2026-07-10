import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

import pool from "./config/database";
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from "./utils/jwt";

const app = express();
const PORT = 5000;

app.use(helmet());
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"], credentials: true }));
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

interface AuthRequest extends express.Request { user?: any; }

const authenticate = (req: AuthRequest, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ success: false, message: "Access token required" });
  const decoded = verifyAccessToken(authHeader.split(" ")[1]);
  if (!decoded)
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  req.user = decoded;
  next();
};

// ============ HEALTH ============
app.get("/api/health", (req, res) => res.json({ status: "OK" }));

// ============ AUTH ============
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role = "TEAM_MEMBER", companyId } = req.body;
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0)
      return res.status(400).json({ success: false, message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password, role, company_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, company_id",
      [name, email, hashedPassword, role, companyId || null]
    );
    const user = result.rows[0];
    const payload = { id: user.id, email: user.email, role: user.role, companyId: user.company_id };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await pool.query("INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)", [user.id, refreshToken]);
    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: false, sameSite: "strict", maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(201).json({ success: true, data: { user, accessToken, token: accessToken } });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const payload = { id: user.id, email: user.email, role: user.role, companyId: user.company_id };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await pool.query("INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)", [user.id, refreshToken]);
    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: false, sameSite: "strict", maxAge: 7 * 24 * 60 * 60 * 1000 });

    const { password: _, ...userData } = user;
    res.json({ success: true, data: { user: userData, accessToken, token: accessToken } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

app.post("/api/auth/refresh-token", async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: "Refresh token required" });

    const stored = await pool.query("SELECT * FROM refresh_tokens WHERE token = $1", [token]);
    if (stored.rows.length === 0)
      return res.status(403).json({ success: false, message: "Invalid refresh token" });

    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [token]);
      return res.status(403).json({ success: false, message: "Expired refresh token" });
    }

    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [decoded.id]);
    if (userResult.rows.length === 0)
      return res.status(404).json({ success: false, message: "User not found" });

    const user = userResult.rows[0];
    const payload = { id: user.id, email: user.email, role: user.role, companyId: user.company_id };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [token]);
    await pool.query("INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)", [user.id, newRefreshToken]);
    res.cookie("refreshToken", newRefreshToken, { httpOnly: true, secure: false, sameSite: "strict", maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({ success: true, data: { accessToken: newAccessToken } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Token refresh failed" });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [token]);
    res.clearCookie("refreshToken");
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Logout failed" });
  }
});

app.get("/api/auth/me", authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, role, company_id, created_at FROM users WHERE id = $1", [req.user?.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: result.rows[0] });
  } catch { res.status(500).json({ success: false, message: "Failed to get user" }); }
});

// ============ PROJECTS ============
app.get("/api/projects", authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects ORDER BY id DESC");
    res.json({ success: true, data: result.rows });
  } catch { res.status(500).json({ success: false, message: "Failed to fetch projects" }); }
});

app.post("/api/projects", authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, description } = req.body;
    const companyId = req.user?.companyId || 1;
    const result = await pool.query("INSERT INTO projects (title, description, company_id) VALUES ($1, $2, $3) RETURNING *", [title, description, companyId]);
    res.json({ success: true, data: result.rows[0] });
  } catch { res.status(500).json({ success: false, message: "Failed to create project" }); }
});

app.delete("/api/projects/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    await pool.query("DELETE FROM tasks WHERE project_id = $1", [req.params.id]);
    await pool.query("DELETE FROM projects WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: "Project deleted" });
  } catch { res.status(500).json({ success: false, message: "Failed to delete project" }); }
});

// ============ TASKS ============
app.get("/api/tasks", authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query("SELECT * FROM tasks ORDER BY id DESC");
    res.json({ success: true, data: result.rows });
  } catch { res.status(500).json({ success: false, message: "Failed to fetch tasks" }); }
});

app.post("/api/tasks", authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, description, priority, projectId, assignedTo } = req.body;
    const result = await pool.query(
      "INSERT INTO tasks (title, description, priority, project_id, assigned_to) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [title, description, priority || "MEDIUM", projectId, assignedTo || null]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch { res.status(500).json({ success: false, message: "Failed to create task" }); }
});

app.put("/api/tasks/:id/status", authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query("UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *", [req.body.status, req.params.id]);
    res.json({ success: true, data: result.rows[0] });
  } catch { res.status(500).json({ success: false, message: "Failed to update task" }); }
});

// ============ ADMIN ============
const adminOnly = (req: AuthRequest, res: any, next: any) => {
  authenticate(req, res, () => {
    if (req.user?.role !== "SUPER_ADMIN")
      return res.status(403).json({ success: false, message: "Access denied" });
    next();
  });
};

app.get("/api/admin/stats", adminOnly, async (req: AuthRequest, res) => {
  try {
    const [companies, users, projects, tasks, recentCompanies, recentUsers] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM companies"),
      pool.query("SELECT COUNT(*) FROM users"),
      pool.query("SELECT COUNT(*) FROM projects"),
      pool.query("SELECT COUNT(*) FROM tasks"),
      pool.query("SELECT * FROM companies ORDER BY created_at DESC LIMIT 5"),
      pool.query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5"),
    ]);
    res.json({ success: true, data: {
      totalCompanies: parseInt(companies.rows[0].count),
      totalUsers: parseInt(users.rows[0].count),
      totalProjects: parseInt(projects.rows[0].count),
      totalTasks: parseInt(tasks.rows[0].count),
      recentCompanies: recentCompanies.rows,
      recentUsers: recentUsers.rows,
    }});
  } catch { res.status(500).json({ success: false, message: "Failed to fetch stats" }); }
});

app.get("/api/admin/companies", adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`SELECT c.*, COUNT(DISTINCT u.id) as user_count, COUNT(DISTINCT p.id) as project_count FROM companies c LEFT JOIN users u ON u.company_id = c.id LEFT JOIN projects p ON p.company_id = c.id GROUP BY c.id ORDER BY c.id DESC`);
    res.json({ success: true, data: result.rows });
  } catch { res.status(500).json({ success: false, message: "Failed to fetch companies" }); }
});

app.post("/api/admin/companies", adminOnly, async (req, res) => {
  try {
    const result = await pool.query("INSERT INTO companies (name) VALUES ($1) RETURNING *", [req.body.name]);
    res.json({ success: true, data: result.rows[0] });
  } catch { res.status(500).json({ success: false, message: "Failed to create company" }); }
});

app.delete("/api/admin/companies/:id", adminOnly, async (req, res) => {
  try {
    await pool.query("DELETE FROM companies WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: "Company deleted" });
  } catch { res.status(500).json({ success: false, message: "Failed to delete company" }); }
});

app.get("/api/admin/users", adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`SELECT u.id, u.name, u.email, u.role, u.company_id, u.created_at, c.name as company_name FROM users u LEFT JOIN companies c ON c.id = u.company_id WHERE u.role != $1 ORDER BY u.id DESC`, ["SUPER_ADMIN"]);
    res.json({ success: true, data: result.rows });
  } catch { res.status(500).json({ success: false, message: "Failed to fetch users" }); }
});

app.put("/api/admin/users/:id/role", adminOnly, async (req, res) => {
  try {
    const result = await pool.query("UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role", [req.body.role, req.params.id]);
    res.json({ success: true, data: result.rows[0] });
  } catch { res.status(500).json({ success: false, message: "Failed to update role" }); }
});

app.delete("/api/admin/users/:id", adminOnly, async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: "User deleted" });
  } catch { res.status(500).json({ success: false, message: "Failed to delete user" }); }
});

app.get("/api/admin/logs", adminOnly, async (req, res) => {
  try {
    const result = await pool.query("SELECT al.*, u.name as user_name, u.email as user_email FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id ORDER BY al.created_at DESC LIMIT 100");
    res.json({ success: true, data: result.rows });
  } catch { res.status(500).json({ success: false, message: "Failed to fetch logs" }); }
});


// ============ COMMENTS ============
app.get("/api/tasks/:id/comments", authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.name as user_name, u.email as user_email
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.task_id = $1
      ORDER BY c.created_at ASC
    `, [req.params.id]);
    res.json({ success: true, data: result.rows });
  } catch { res.status(500).json({ success: false, message: "Failed to fetch comments" }); }
});

app.post("/api/tasks/:id/comments", authenticate, async (req: AuthRequest, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: "Content is required" });
    const result = await pool.query(`
      INSERT INTO comments (content, task_id, user_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [content, req.params.id, req.user?.id]);
    const comment = await pool.query(`
      SELECT c.*, u.name as user_name, u.email as user_email
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [result.rows[0].id]);
    res.status(201).json({ success: true, data: comment.rows[0] });
  } catch { res.status(500).json({ success: false, message: "Failed to add comment" }); }
});

app.delete("/api/tasks/:taskId/comments/:commentId", authenticate, async (req: AuthRequest, res) => {
  try {
    const comment = await pool.query("SELECT * FROM comments WHERE id = $1", [req.params.commentId]);
    if (comment.rows.length === 0)
      return res.status(404).json({ success: false, message: "Comment not found" });
    if (comment.rows[0].user_id !== req.user?.id && req.user?.role !== "SUPER_ADMIN")
      return res.status(403).json({ success: false, message: "Not authorized" });
    await pool.query("DELETE FROM comments WHERE id = $1", [req.params.commentId]);
    res.json({ success: true, message: "Comment deleted" });
  } catch { res.status(500).json({ success: false, message: "Failed to delete comment" }); }
});
app.listen(PORT, () => console.log("Server running on http://localhost:" + PORT));

