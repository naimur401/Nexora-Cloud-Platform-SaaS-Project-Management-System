import { useEffect, useState } from 'react';
import axios from '../../services/axios.config';
import toast from 'react-hot-toast';

interface Log {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  action: string;
  details: any;
  created_at: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get('/admin/logs');
      setLogs(response.data.data);
    } catch (error) {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📋 Audit Logs</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No logs yet</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium">{log.user_name || 'System'}</div>
                    <div className="text-xs text-gray-500">{log.user_email}</div>
                  </td>
                  <td className="px-6 py-4">{log.action}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.details ? JSON.stringify(log.details) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
