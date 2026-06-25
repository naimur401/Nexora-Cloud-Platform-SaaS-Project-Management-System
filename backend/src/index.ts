import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 5000;
const JWT_SECRET = 'nexora_super_secret_key';

// In-memory database
let users: any[] = [
  { id: 1, name: 'Super Admin', email: 'admin@nexora.com', password: bcrypt.hashSync('admin123', 10), role: 'SUPER_ADMIN', companyId: 1 }
];
let companies: any[] = [
  { id: 1, name: 'Nexora Demo Company' }
];
let projects: any[] = [
  { id: 1, title: 'Nexora Platform', description: 'Main SaaS project', status: 'ACTIVE', companyId: 1 },
  { id: 2, title: 'Mobile App', description: 'React Native app', status: 'ACTIVE', companyId: 1 }
];
let tasks: any[] = [
  { id: 1, title: 'Setup Auth System', description: 'JWT authentication', status: 'TODO', priority: 'HIGH', projectId: 1 },
  { id: 2, title: 'Create API Routes', description: 'REST APIs', status: 'IN_PROGRESS', priority: 'MEDIUM', projectId: 1 }
];
let nextId = { user: 2, project: 3, task: 3, company: 2 };

app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
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
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Nexora API Running' });
});

// ============ AUTH ============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    const { password: _, ...userData } = user;
    res.json({ success: true, data: { user: userData, token } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role = 'TEAM_MEMBER' } = req.body;
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    const newUser = { id: nextId.user++, name, email, password: bcrypt.hashSync(password, 10), role, companyId: null };
    users.push(newUser);
    const token = jwt.sign({ id: newUser.id, email, role }, JWT_SECRET, { expiresIn: '1d' });
    const { password: _, ...userData } = newUser;
    res.json({ success: true, data: { user: userData, token } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out' });
});

// ============ PROJECTS ============
app.get('/api/projects', authenticate, (req, res) => {
  res.json({ success: true, data: projects });
});

app.post('/api/projects', authenticate, (req, res) => {
  const { title, description } = req.body;
  const newProject = { id: nextId.project++, title, description, status: 'ACTIVE', companyId: 1 };
  projects.push(newProject);
  res.json({ success: true, data: newProject });
});

app.delete('/api/projects/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  projects = projects.filter(p => p.id !== id);
  tasks = tasks.filter(t => t.projectId !== id);
  res.json({ success: true, message: 'Deleted' });
});

// ============ TASKS ============
app.get('/api/tasks', authenticate, (req, res) => {
  res.json({ success: true, data: tasks });
});

app.post('/api/tasks', authenticate, (req, res) => {
  const { title, description, priority, projectId, assignedTo } = req.body;
  const newTask = { id: nextId.task++, title, description, status: 'TODO', priority: priority || 'MEDIUM', projectId, assignedTo };
  tasks.push(newTask);
  res.json({ success: true, data: newTask });
});

app.put('/api/tasks/:id/status', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.status = status;
    res.json({ success: true, data: task });
  } else {
    res.status(404).json({ success: false, message: 'Task not found' });
  }
});

// ============ ADMIN ============
app.get('/api/admin/stats', authenticate, (req: any, res) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  res.json({
    success: true,
    data: {
      totalCompanies: companies.length,
      totalUsers: users.length,
      totalProjects: projects.length,
      totalTasks: tasks.length,
      recentUsers: users.slice(0, 5),
      recentCompanies: companies.slice(0, 5)
    }
  });
});

app.get('/api/admin/companies', authenticate, (req: any, res) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  const data = companies.map((c: any) => ({ ...c, user_count: 0, project_count: 0 }));
  res.json({ success: true, data });
});

app.post('/api/admin/companies', authenticate, (req: any, res) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  const { name } = req.body;
  const newCompany = { id: nextId.company++, name };
  companies.push(newCompany);
  res.json({ success: true, data: newCompany });
});

app.delete('/api/admin/companies/:id', authenticate, (req: any, res) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  companies = companies.filter((c: any) => c.id !== id);
  res.json({ success: true, message: 'Deleted' });
});

app.get('/api/admin/users', authenticate, (req: any, res) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  const data = users.filter((u: any) => u.role !== 'SUPER_ADMIN').map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    company_id: u.companyId,
    company_name: u.companyId ? 'Nexora Demo Company' : null,
    created_at: new Date()
  }));
  res.json({ success: true, data });
});

app.put('/api/admin/users/:id/role', authenticate, (req: any, res) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const { role } = req.body;
  const user = users.find((u: any) => u.id === id);
  if (user) {
    user.role = role;
    res.json({ success: true, data: user });
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});

app.delete('/api/admin/users/:id', authenticate, (req: any, res) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  users = users.filter((u: any) => u.id !== id);
  res.json({ success: true, message: 'Deleted' });
});

app.get('/api/admin/logs', authenticate, (req: any, res) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  res.json({ success: true, data: [] });
});

app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
  console.log('In-memory database active');
});
