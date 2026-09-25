import pool from '../config/database';

interface AuditLogData {
  userId?: number;
  action: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export const createAuditLog = async (data: AuditLogData) => {
  try {
    const details = data.details ? JSON.stringify(data.details) : null;
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent) VALUES (, , , , )',
      [data.userId || null, data.action, details, data.ipAddress || null, data.userAgent || null]
    );
  } catch (error) {
    console.error('Audit log error:', error);
  }
};
