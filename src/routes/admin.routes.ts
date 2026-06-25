import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'nexora_super_secret_key';

// Middleware to check if user is SUPER_ADMIN
const isSuperAdmin = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as any;
    if (decoded.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied. Super Admin only.' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// ============ STATISTICS ============
router.get('/stats', isSuperAdmin, async (req, res) => {
  try {
    const companiesResult = await pool.query('SELECT COUNT(*) FROM companies');
    const usersResult = await pool.query('SELECT COUNT(*) FROM users');
    const projectsResult = await pool.query('SELECT COUNT(*) FROM projects');
    const tasksResult = await pool.query('SELECT COUNT(*) FROM tasks');
    const tasksByStatus = await pool.query('SELECT status, COUNT(*) FROM tasks GROUP BY status');
    const recentUsers = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5');
    const recentCompanies = await pool.query('SELECT id, name, created_at FROM companies ORDER BY created_at DESC LIMIT 5');

    res.json({
      success: true,
      data: {
        totalCompanies: parseInt(companiesResult.rows[0].count),
        totalUsers: parseInt(usersResult.rows[0].count),
        totalProjects: parseInt(projectsResult.rows[0].count),
        totalTasks: parseInt(tasksResult.rows[0].count),
        tasksByStatus: tasksByStatus.rows,
        recentUsers: recentUsers.rows,
        recentCompanies: recentCompanies.rows
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// ============ COMPANY MANAGEMENT ============
router.get('/companies', isSuperAdmin, async (req, res) => {
  try {
    const result = await pool.query(\
      SELECT c.*, 
             COUNT(DISTINCT u.id) as user_count,
             COUNT(DISTINCT p.id) as project_count
      FROM companies c
      LEFT JOIN users u ON u.company_id = c.id
      LEFT JOIN projects p ON p.company_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    \);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Companies error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch companies' });
  }
});

router.post('/companies', isSuperAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }
    const result = await pool.query(
      'INSERT INTO companies (name) VALUES () RETURNING *',
      [name]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(400).json({ success: false, message: 'Company already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to create company' });
    }
  }
});

router.put('/companies/:id', isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const result = await pool.query(
      'UPDATE companies SET name =  WHERE id =  RETURNING *',
      [name, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update company' });
  }
});

router.delete('/companies/:id', isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE company_id = )', [id]);
    await pool.query('DELETE FROM projects WHERE company_id = ', [id]);
    await pool.query('DELETE FROM users WHERE company_id = ', [id]);
    await pool.query('DELETE FROM companies WHERE id = ', [id]);
    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete company' });
  }
});

// ============ USER MANAGEMENT ============
router.get('/users', isSuperAdmin, async (req, res) => {
  try {
    const { companyId, role } = req.query;
    let query = \
      SELECT u.id, u.name, u.email, u.role, u.company_id, c.name as company_name, u.created_at
      FROM users u
      LEFT JOIN companies c ON c.id = u.company_id
      WHERE u.role != 'SUPER_ADMIN'
    \;
    const params: any[] = [];
    if (companyId) {
      params.push(companyId);
      query +=  AND u.company_id = src\routes{params.length};
    }
    if (role) {
      params.push(role);
      query +=  AND u.role = src\routes{params.length};
    }
    query += ' ORDER BY u.created_at DESC';
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

router.put('/users/:id/role', isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['COMPANY_ADMIN', 'TEAM_MEMBER'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const result = await pool.query(
      'UPDATE users SET role =  WHERE id =  RETURNING id, name, email, role',
      [role, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user role' });
  }
});

router.delete('/users/:id', isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = ', [id]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

// ============ SYSTEM LOGS (Audit Trail) ============
router.get('/logs', isSuperAdmin, async (req, res) => {
  try {
    // Create audit_logs table if not exists
    await pool.query(\
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        action VARCHAR(255),
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    \);
    const result = await pool.query(\
      SELECT al.*, u.name as user_name, u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ORDER BY al.created_at DESC
      LIMIT 50
    \);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
});

export default router;
