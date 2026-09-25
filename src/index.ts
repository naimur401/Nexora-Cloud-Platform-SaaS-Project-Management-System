import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './config/database';
import { createAuditLog } from './helpers/auditLog';

const app = express();
const PORT = 5000;
const JWT_SECRET = 'nexora_super_secret_key';

app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

interface AuthRequest extends express.Request {
  user?: any;
}

const authenticate = (req: AuthRequest, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// ============ HEALTH ============
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Nexora API with PostgreSQL' });
});

// ============ AUTH ============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    await createAuditLog({
      userId: user.id,
      action: 'USER_LOGIN',
      details: { email: user.email, role: user.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    const { password: _, ...userData } = user;
    res.json({ success: true, data: { user: userData, token } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role = 'TEAM_MEMBER', companyId } = req.body;
    
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role, company_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
      [name, email, hashedPassword, role, companyId || null]
    );
    
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    await createAuditLog({
      userId: user.id,
      action: 'USER_REGISTERED',
      details: { email: user.email, role: user.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({ success: true, data: { user, token } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

app.post('/api/auth/logout', async (req: AuthRequest, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        await createAuditLog({
          userId: decoded.id,
          action: 'USER_LOGOUT',
          details: { email: decoded.email },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      } catch (err) {}
    }
  } catch (error) {}
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out' });
});

// ============ PROJECTS ============
app.get('/api/projects', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY id DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Projects error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch projects' });
  }
});

app.post('/api/projects', authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, description } = req.body;
    const companyId = req.user?.companyId || 1;
    const result = await pool.query(
      'INSERT INTO projects (title, description, company_id) VALUES ($1, $2, $3) RETURNING *',
      [title, description, companyId]
    );
    
    await createAuditLog({
      userId: req.user?.id,
      action: 'PROJECT_CREATED',
      details: { title, description },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ success: false, message: 'Failed to create project' });
  }
});

app.delete('/api/projects/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const project = await pool.query('SELECT title FROM projects WHERE id = $1', [id]);
    await pool.query('DELETE FROM tasks WHERE project_id = $1', [id]);
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    
    await createAuditLog({
      userId: req.user?.id,
      action: 'PROJECT_DELETED',
      details: { projectId: id, title: project.rows[0]?.title },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete project' });
  }
});

// ============ TASKS ============
app.get('/api/tasks', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY id DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Tasks error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, description, priority, projectId, assignedTo } = req.body;
    const result = await pool.query(
      'INSERT INTO tasks (title, description, priority, project_id, assigned_to) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, priority || 'MEDIUM', projectId, assignedTo || null]
    );
    
    await createAuditLog({
      userId: req.user?.id,
      action: 'TASK_CREATED',
      details: { title, priority, projectId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, message: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const oldTask = await pool.query('SELECT status, title FROM tasks WHERE id = $1', [id]);
    const result = await pool.query(
      'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    await createAuditLog({
      userId: req.user?.id,
      action: 'TASK_STATUS_CHANGED',
      details: { 
        taskId: id, 
        title: oldTask.rows[0]?.title,
        oldStatus: oldTask.rows[0]?.status,
        newStatus: status
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
});

// ============ ADMIN ============
app.get('/api/admin/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const companies = await pool.query('SELECT COUNT(*) FROM companies');
    const users = await pool.query('SELECT COUNT(*) FROM users');
    const projects = await pool.query('SELECT COUNT(*) FROM projects');
    const tasks = await pool.query('SELECT COUNT(*) FROM tasks');
    res.json({
      success: true,
      data: {
        totalCompanies: parseInt(companies.rows[0].count),
        totalUsers: parseInt(users.rows[0].count),
        totalProjects: parseInt(projects.rows[0].count),
        totalTasks: parseInt(tasks.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// ============ ANALYTICS ============
app.get('/api/admin/analytics', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const taskStatus = await pool.query(
      'SELECT status, COUNT(*) as count FROM tasks GROUP BY status'
    );

    const projectProgress = await pool.query(
      'SELECT p.id, p.title, COUNT(t.id) as total_tasks, COUNT(CASE WHEN t.status = $1 THEN 1 END) as completed_tasks FROM projects p LEFT JOIN tasks t ON t.project_id = p.id GROUP BY p.id, p.title ORDER BY p.id DESC LIMIT 10',
      ['DONE']
    );

    const companyStats = await pool.query(
      'SELECT c.name, COUNT(DISTINCT u.id) as user_count, COUNT(DISTINCT p.id) as project_count FROM companies c LEFT JOIN users u ON u.company_id = c.id LEFT JOIN projects p ON p.company_id = c.id GROUP BY c.id, c.name ORDER BY c.id DESC LIMIT 10'
    );

    const userGrowth = await pool.query(
      'SELECT TO_CHAR(created_at, $1) as month, COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL $2 GROUP BY TO_CHAR(created_at, $1), DATE_TRUNC($3, created_at) ORDER BY DATE_TRUNC($3, created_at) ASC',
      ['Mon YYYY', '6 months', 'month']
    );

    const monthlyTasks = await pool.query(
      'SELECT TO_CHAR(created_at, $1) as month, COUNT(*) as total, COUNT(CASE WHEN status = $2 THEN 1 END) as completed FROM tasks WHERE created_at >= NOW() - INTERVAL $3 GROUP BY TO_CHAR(created_at, $1), DATE_TRUNC($4, created_at) ORDER BY DATE_TRUNC($4, created_at) ASC',
      ['Mon', 'DONE', '6 months', 'month']
    );

    const completionRate = await pool.query(
      'SELECT COUNT(*) as total, COUNT(CASE WHEN status = $1 THEN 1 END) as completed FROM tasks',
      ['DONE']
    );

    res.json({
      success: true,
      data: {
        taskStatus: taskStatus.rows,
        projectProgress: projectProgress.rows,
        companyStats: companyStats.rows,
        userGrowth: userGrowth.rows,
        monthlyTasks: monthlyTasks.rows,
        completionRate: {
          total: parseInt(completionRate.rows[0].total),
          completed: parseInt(completionRate.rows[0].completed),
          rate: completionRate.rows[0].total > 0 
            ? Math.round((completionRate.rows[0].completed / completionRate.rows[0].total) * 100)
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
});

app.get('/api/admin/companies', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const result = await pool.query('SELECT * FROM companies ORDER BY id DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Companies error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch companies' });
  }
});

app.post('/api/admin/companies', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const { name } = req.body;
    const result = await pool.query('INSERT INTO companies (name) VALUES ($1) RETURNING *', [name]);
    
    await createAuditLog({
      userId: req.user?.id,
      action: 'COMPANY_CREATED',
      details: { name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ success: false, message: 'Failed to create company' });
  }
});

app.delete('/api/admin/companies/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const { id } = req.params;
    const company = await pool.query('SELECT name FROM companies WHERE id = $1', [id]);
    await pool.query('DELETE FROM companies WHERE id = $1', [id]);
    
    await createAuditLog({
      userId: req.user?.id,
      action: 'COMPANY_DELETED',
      details: { companyId: id, name: company.rows[0]?.name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({ success: true, message: 'Company deleted' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete company' });
  }
});

app.get('/api/admin/users', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const result = await pool.query(
      'SELECT id, name, email, role, company_id FROM users WHERE role != $1 ORDER BY id DESC',
      ['SUPER_ADMIN']
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

app.put('/api/admin/users/:id/role', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const { id } = req.params;
    const { role } = req.body;
    const oldUser = await pool.query('SELECT role, email FROM users WHERE id = $1', [id]);
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, id]
    );
    
    await createAuditLog({
      userId: req.user?.id,
      action: 'USER_ROLE_CHANGED',
      details: { userId: id, email: oldUser.rows[0]?.email, oldRole: oldUser.rows[0]?.role, newRole: role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, message: 'Failed to update role' });
  }
});

app.delete('/api/admin/users/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const { id } = req.params;
    const user = await pool.query('SELECT name, email FROM users WHERE id = $1', [id]);
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    
    await createAuditLog({
      userId: req.user?.id,
      action: 'USER_DELETED',
      details: { userId: id, email: user.rows[0]?.email, name: user.rows[0]?.name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

app.get('/api/admin/logs', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const result = await pool.query(
      'SELECT al.*, u.name as user_name, u.email as user_email FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id ORDER BY al.created_at DESC LIMIT 100'
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
});

app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
  console.log('PostgreSQL connected');
  console.log('Analytics API enabled');
});