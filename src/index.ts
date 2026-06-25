import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db';
import adminRoutes from './routes/admin.routes';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'nexora_super_secret_key';

app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Nexora API with PostgreSQL' });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = ', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, data: { user: userWithoutPassword, token } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role = 'TEAM_MEMBER', companyId } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role, company_id) VALUES (, , , , ) RETURNING id, name, email, role',
      [name, email, hashedPassword, role, companyId || null]
    );
    const token = jwt.sign({ id: result.rows[0].id, email, role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, data: { user: result.rows[0], token } });
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(400).json({ success: false, message: 'Email already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Registration failed' });
    }
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out' });
});

// Project routes
app.get('/api/projects', authenticate, async (req: any, res) => {
  const result = await pool.query('SELECT * FROM projects ORDER BY id DESC');
  res.json({ success: true, data: result.rows });
});

app.post('/api/projects', authenticate, async (req: any, res) => {
  const { title, description } = req.body;
  const companyId = req.user.companyId || 1;
  const result = await pool.query(
    'INSERT INTO projects (title, description, company_id) VALUES (, , ) RETURNING *',
    [title, description, companyId]
  );
  res.json({ success: true, data: result.rows[0] });
});

app.delete('/api/projects/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM tasks WHERE project_id = ', [id]);
  await pool.query('DELETE FROM projects WHERE id = ', [id]);
  res.json({ success: true, message: 'Project deleted' });
});

// Task routes
app.get('/api/tasks', authenticate, async (req: any, res) => {
  const result = await pool.query('SELECT * FROM tasks ORDER BY id DESC');
  res.json({ success: true, data: result.rows });
});

app.post('/api/tasks', authenticate, async (req: any, res) => {
  const { title, description, priority, projectId, assignedTo } = req.body;
  const result = await pool.query(
    'INSERT INTO tasks (title, description, priority, project_id, assigned_to) VALUES (, , , , ) RETURNING *',
    [title, description, priority || 'MEDIUM', projectId, assignedTo || null]
  );
  res.json({ success: true, data: result.rows[0] });
});

app.put('/api/tasks/:id/status', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await pool.query(
    'UPDATE tasks SET status = , updated_at = CURRENT_TIMESTAMP WHERE id =  RETURNING *',
    [status, id]
  );
  res.json({ success: true, data: result.rows[0] });
});

// Admin Routes
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
});
