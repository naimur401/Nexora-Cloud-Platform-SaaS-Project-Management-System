import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import crypto from 'crypto';
import cloudinary from './config/cloudinary';
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

    if (assignedTo && assignedTo !== req.user?.id) {
      await pool.query(
        'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
        [assignedTo, 'You have been assigned a new task: ' + title, 'TASK_ASSIGNED']
      );
    }

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
    const oldTask = await pool.query('SELECT status, title, assigned_to FROM tasks WHERE id = $1', [id]);
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

    if (result.rows[0].assigned_to && result.rows[0].assigned_to !== req.user?.id) {
      await pool.query(
        'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
        [result.rows[0].assigned_to, 'Task status changed to ' + status + ': ' + result.rows[0].title, 'TASK_STATUS_CHANGED']
      );
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
});

// ============ COMMENTS ============
app.get('/api/tasks/:taskId/comments', authenticate, async (req: AuthRequest, res) => {
  try {
    const { taskId } = req.params;
    const result = await pool.query(
      'SELECT c.*, u.name as user_name, u.email as user_email FROM comments c LEFT JOIN users u ON u.id = c.user_id WHERE c.task_id = $1 ORDER BY c.created_at ASC',
      [taskId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Comments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
});

app.post('/api/tasks/:taskId/comments', authenticate, async (req: AuthRequest, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
    }

    const result = await pool.query(
      'INSERT INTO comments (content, task_id, user_id) VALUES ($1, $2, $3) RETURNING *',
      [content, taskId, userId]
    );

    const user = await pool.query('SELECT name, email FROM users WHERE id = $1', [userId]);
    const comment = { ...result.rows[0], user_name: user.rows[0]?.name, user_email: user.rows[0]?.email };

    const task = await pool.query('SELECT title, assigned_to, project_id FROM tasks WHERE id = $1', [taskId]);

    if (task.rows.length > 0 && task.rows[0].assigned_to && task.rows[0].assigned_to !== userId) {
      await pool.query(
        'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
        [task.rows[0].assigned_to, (user.rows[0]?.name || 'Someone') + ' commented on task: ' + task.rows[0].title, 'COMMENT_ADDED']
      );
    }

    await createAuditLog({
      userId,
      action: 'COMMENT_ADDED',
      details: { taskId, content: content.substring(0, 50) },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success: true, data: comment });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to create comment' });
  }
});

app.delete('/api/comments/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const comment = await pool.query('SELECT user_id FROM comments WHERE id = $1', [id]);

    if (comment.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (comment.rows[0].user_id !== req.user?.id && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [id]);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
});

// ============ NOTIFICATIONS ============
app.get('/api/notifications', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user?.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

app.get('/api/notifications/unread-count', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user?.id]
    );
    res.json({ success: true, data: { count: parseInt(result.rows[0].count) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch count' });
  }
});

app.put('/api/notifications/:id/read', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [id, req.user?.id]
    );
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update' });
  }
});

app.put('/api/notifications/read-all', authenticate, async (req: AuthRequest, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [req.user?.id]
    );
    res.json({ success: true, message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update' });
  }
});

// ============ FILE UPLOAD ============
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf',
                     'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, PDF, DOC, DOCX allowed.'));
    }
  }
});

app.post('/api/tasks/:taskId/attachments', authenticate, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const { taskId } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const result: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'nexora/attachments', resource_type: 'auto' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file!.buffer);
    });

    const dbResult = await pool.query(
      'INSERT INTO attachments (file_name, file_url, file_type, file_size, task_id, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.file.originalname, result.secure_url, req.file.mimetype, req.file.size, taskId, req.user?.id]
    );

    await createAuditLog({
      userId: req.user?.id,
      action: 'FILE_UPLOADED',
      details: { taskId, fileName: req.file.originalname },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success: true, data: dbResult.rows[0] });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message || 'Upload failed' });
  }
});

app.get('/api/tasks/:taskId/attachments', authenticate, async (req: AuthRequest, res) => {
  try {
    const { taskId } = req.params;
    const result = await pool.query(
      'SELECT a.*, u.name as uploaded_by_name FROM attachments a LEFT JOIN users u ON u.id = a.uploaded_by WHERE a.task_id = $1 ORDER BY a.created_at DESC',
      [taskId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attachments' });
  }
});

app.delete('/api/attachments/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const attachment = await pool.query('SELECT uploaded_by FROM attachments WHERE id = $1', [id]);

    if (attachment.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    if (attachment.rows[0].uploaded_by !== req.user?.id && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await pool.query('DELETE FROM attachments WHERE id = $1', [id]);
    res.json({ success: true, message: 'Attachment deleted' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete attachment' });
  }
});

// ============ SETTINGS - PROFILE ============
app.get('/api/settings/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, company_id, created_at FROM users WHERE id = $1',
      [req.user?.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

app.put('/api/settings/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, email } = req.body;
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, role',
      [name, email, req.user?.id]
    );
    await createAuditLog({
      userId: req.user?.id,
      action: 'PROFILE_UPDATED',
      details: { name, email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(400).json({ success: false, message: 'Email already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
  }
});

app.put('/api/settings/password', authenticate, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [req.user?.id]);
    const user = result.rows[0];

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user?.id]);

    await createAuditLog({
      userId: req.user?.id,
      action: 'PASSWORD_CHANGED',
      details: { email: req.user?.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update password' });
  }
});

// ============ SETTINGS - API KEYS ============
app.get('/api/settings/api-keys', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user?.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch API keys' });
  }
});

app.post('/api/settings/api-keys', authenticate, async (req: AuthRequest, res) => {
  try {
    const { keyName } = req.body;
    const apiKey = 'nxr_' + crypto.randomBytes(24).toString('hex');

    const result = await pool.query(
      'INSERT INTO api_keys (user_id, key_name, api_key) VALUES ($1, $2, $3) RETURNING *',
      [req.user?.id, keyName, apiKey]
    );

    await createAuditLog({
      userId: req.user?.id,
      action: 'API_KEY_CREATED',
      details: { keyName },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create API key' });
  }
});

app.delete('/api/settings/api-keys/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM api_keys WHERE id = $1 AND user_id = $2', [id, req.user?.id]);

    await createAuditLog({
      userId: req.user?.id,
      action: 'API_KEY_REVOKED',
      details: { keyId: id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success: true, message: 'API key revoked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to revoke API key' });
  }
});

// ============ SETTINGS - PREFERENCES ============
app.get('/api/settings/preferences', authenticate, async (req: AuthRequest, res) => {
  try {
    let result = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [req.user?.id]);

    if (result.rows.length === 0) {
      result = await pool.query(
        'INSERT INTO user_settings (user_id) VALUES ($1) RETURNING *',
        [req.user?.id]
      );
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch preferences' });
  }
});

app.put('/api/settings/preferences', authenticate, async (req: AuthRequest, res) => {
  try {
    const { email_notifications, push_notifications, two_factor_enabled, language, timezone } = req.body;

    const result = await pool.query(
      `INSERT INTO user_settings (user_id, email_notifications, push_notifications, two_factor_enabled, language, timezone)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
       email_notifications = $2, push_notifications = $3, two_factor_enabled = $4,
       language = $5, timezone = $6, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.user?.id, email_notifications, push_notifications, two_factor_enabled, language, timezone]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update preferences' });
  }
});

// ============ INVITATIONS ============
app.get('/api/invitations', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const companyId = req.user?.companyId || 1;
    const result = await pool.query(
      'SELECT i.*, u.name as invited_by_name FROM invitations i LEFT JOIN users u ON u.id = i.invited_by WHERE i.company_id = $1 ORDER BY i.created_at DESC',
      [companyId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Invitations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch invitations' });
  }
});

app.post('/api/invitations', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { email, role = 'TEAM_MEMBER' } = req.body;
    const companyId = req.user?.companyId || 1;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const existingInvite = await pool.query(
      'SELECT id FROM invitations WHERE email = $1 AND status = $2 AND expires_at > NOW()',
      [email, 'PENDING']
    );
    if (existingInvite.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Invitation already sent' });
    }

    const token = crypto.randomBytes(32).toString('hex');

    const result = await pool.query(
      'INSERT INTO invitations (email, token, company_id, invited_by, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [email, token, companyId, req.user?.id, role]
    );

    await createAuditLog({
      userId: req.user?.id,
      action: 'INVITATION_SENT',
      details: { email, role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Send invitation error:', error);
    res.status(500).json({ success: false, message: 'Failed to send invitation' });
  }
});

app.delete('/api/invitations/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const { id } = req.params;
    await pool.query('DELETE FROM invitations WHERE id = $1', [id]);
    res.json({ success: true, message: 'Invitation cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel invitation' });
  }
});

app.get('/api/invitations/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const result = await pool.query(
      'SELECT i.*, c.name as company_name FROM invitations i LEFT JOIN companies c ON c.id = i.company_id WHERE i.token = $1 AND i.status = $2 AND i.expires_at > NOW()',
      [token, 'PENDING']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid or expired invitation' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to verify invitation' });
  }
});

app.post('/api/invitations/accept/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { name, password } = req.body;

    const inviteResult = await pool.query(
      'SELECT * FROM invitations WHERE token = $1 AND status = $2 AND expires_at > NOW()',
      [token, 'PENDING']
    );

    if (inviteResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid or expired invitation' });
    }

    const invite = inviteResult.rows[0];

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [invite.email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userResult = await pool.query(
      'INSERT INTO users (name, email, password, role, company_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
      [name, invite.email, hashedPassword, invite.role, invite.company_id]
    );

    await pool.query('UPDATE invitations SET status = $1 WHERE id = $2', ['ACCEPTED', invite.id]);

    const user = userResult.rows[0];
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    await createAuditLog({
      userId: user.id,
      action: 'INVITATION_ACCEPTED',
      details: { email: user.email, role: user.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success: true, data: { user, token: jwtToken } });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ success: false, message: 'Failed to accept invitation' });
  }
});

// ============ ADMIN STATS ============
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

    const taskStatus = await pool.query('SELECT status, COUNT(*) as count FROM tasks GROUP BY status');

    const projectProgress = await pool.query(
      "SELECT p.id, p.title, COUNT(t.id) as total_tasks, COUNT(CASE WHEN t.status = 'DONE' THEN 1 END) as completed_tasks FROM projects p LEFT JOIN tasks t ON t.project_id = p.id GROUP BY p.id, p.title ORDER BY p.id DESC LIMIT 10"
    );

    const companyStats = await pool.query(
      'SELECT c.name, COUNT(DISTINCT u.id) as user_count, COUNT(DISTINCT p.id) as project_count FROM companies c LEFT JOIN users u ON u.company_id = c.id LEFT JOIN projects p ON p.company_id = c.id GROUP BY c.id, c.name ORDER BY c.id DESC LIMIT 10'
    );

    const userGrowth = await pool.query(
      "SELECT TO_CHAR(created_at, 'Mon YYYY') as month, COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '6 months' GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at) ORDER BY DATE_TRUNC('month', created_at) ASC"
    );

    const monthlyTasks = await pool.query(
      "SELECT TO_CHAR(created_at, 'Mon') as month, COUNT(*) as total, COUNT(CASE WHEN status = 'DONE' THEN 1 END) as completed FROM tasks WHERE created_at >= NOW() - INTERVAL '6 months' GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at) ORDER BY DATE_TRUNC('month', created_at) ASC"
    );

    const completionRate = await pool.query(
      "SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'DONE' THEN 1 END) as completed FROM tasks"
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

// ============ SUBSCRIPTION PLANS ============
app.get('/api/admin/plans', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('SELECT * FROM subscription_plans ORDER BY price ASC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch plans' });
  }
});

app.post('/api/admin/plans', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const { name, price, max_users, max_projects, features } = req.body;
    const result = await pool.query(
      'INSERT INTO subscription_plans (name, price, max_users, max_projects, features) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, price, max_users, max_projects, features]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create plan' });
  }
});

// ============ COMPANY SUBSCRIPTIONS ============
app.get('/api/admin/subscriptions', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const result = await pool.query(
      "SELECT cs.*, c.name as company_name, sp.name as plan_name, sp.price, sp.max_users, sp.max_projects FROM company_subscriptions cs LEFT JOIN companies c ON c.id = cs.company_id LEFT JOIN subscription_plans sp ON sp.id = cs.plan_id ORDER BY cs.created_at DESC"
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch subscriptions' });
  }
});

app.post('/api/admin/subscriptions', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const { companyId, planId } = req.body;
    const existing = await pool.query('SELECT id FROM company_subscriptions WHERE company_id = $1', [companyId]);

    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        'UPDATE company_subscriptions SET plan_id = $1, started_at = CURRENT_TIMESTAMP WHERE company_id = $2 RETURNING *',
        [planId, companyId]
      );
    } else {
      result = await pool.query(
        'INSERT INTO company_subscriptions (company_id, plan_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'30 days\') RETURNING *',
        [companyId, planId]
      );
    }

    const plan = await pool.query('SELECT price FROM subscription_plans WHERE id = $1', [planId]);
    if (plan.rows[0].price > 0) {
      await pool.query(
        'INSERT INTO billing_history (company_id, plan_id, amount, invoice_number) VALUES ($1, $2, $3, $4)',
        [companyId, planId, plan.rows[0].price, 'INV-' + Date.now()]
      );
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to assign subscription' });
  }
});

// ============ BILLING HISTORY ============
app.get('/api/admin/billing', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const result = await pool.query(
      "SELECT bh.*, c.name as company_name, sp.name as plan_name FROM billing_history bh LEFT JOIN companies c ON c.id = bh.company_id LEFT JOIN subscription_plans sp ON sp.id = bh.plan_id ORDER BY bh.paid_at DESC LIMIT 50"
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch billing' });
  }
});

// ============ ADMIN COMPANIES ============
app.get('/api/admin/companies', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const result = await pool.query('SELECT * FROM companies ORDER BY id DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
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
    res.status(500).json({ success: false, message: 'Failed to delete company' });
  }
});

// ============ ADMIN USERS ============
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
      details: {
        userId: id,
        email: oldUser.rows[0]?.email,
        oldRole: oldUser.rows[0]?.role,
        newRole: role
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
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
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

// ============ AUDIT LOGS ============
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
    res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
});

// ============ START SERVER ============
app.listen(PORT, () => {
  console.log('========================================');
  console.log('🚀 Nexora Backend Server');
  console.log('📡 Running on http://localhost:' + PORT);
  console.log('📦 PostgreSQL connected');
  console.log('✅ Features enabled:');
  console.log('   - Auth + JWT');
  console.log('   - Projects + Tasks');
  console.log('   - Comments + Notifications');
  console.log('   - File Upload (Cloudinary)');
  console.log('   - Settings (Profile, API Keys, Preferences)');
  console.log('   - Team Invitations');
  console.log('   - Subscriptions + Billing');
  console.log('   - Admin Panel (Stats, Analytics, Audit Logs)');
  console.log('========================================');
});