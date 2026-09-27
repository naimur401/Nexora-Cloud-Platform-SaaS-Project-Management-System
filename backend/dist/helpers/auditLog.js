"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = void 0;
const database_1 = __importDefault(require("../config/database"));
const createAuditLog = async (data) => {
    try {
        const details = data.details ? JSON.stringify(data.details) : null;
        await database_1.default.query('INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent) VALUES (, , , , )', [data.userId || null, data.action, details, data.ipAddress || null, data.userAgent || null]);
    }
    catch (error) {
        console.error('Audit log error:', error);
    }
};
exports.createAuditLog = createAuditLog;
