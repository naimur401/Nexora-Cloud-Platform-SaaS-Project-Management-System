import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../services/axios.config';
import toast from 'react-hot-toast';

interface Stats {
  totalCompanies: number;
  totalUsers: number;
  totalProjects: number;
  totalTasks: number;
  tasksByStatus: any[];
  recentUsers: any[];
  recentCompanies: any[];
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/admin/stats');
      setStats(response.data.data);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Access denied. Super Admin only.');
        navigate('/dashboard');
      } else {
        toast.error('Failed to load stats');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading Admin Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">🏢</div>
            <div className="text-2xl font-bold text-purple-600">{stats?.totalCompanies || 0}</div>
            <div className="text-gray-600">Total Companies</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-2xl font-bold text-blue-600">{stats?.totalUsers || 0}</div>
            <div className="text-gray-600">Total Users</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">📁</div>
            <div className="text-2xl font-bold text-green-600">{stats?.totalProjects || 0}</div>
            <div className="text-gray-600">Total Projects</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-orange-600">{stats?.totalTasks || 0}</div>
            <div className="text-gray-600">Total Tasks</div>
          </div>
        </div>

        {/* Recent Companies */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">🏢 Recent Companies</h2>
          </div>
          <div className="p-6">
            {stats?.recentCompanies?.length === 0 ? (
              <p className="text-gray-500">No companies yet</p>
            ) : (
              <div className="grid gap-3">
                {stats?.recentCompanies?.map((company: any) => (
                  <div key={company.id} className="border rounded-lg p-3">
                    <div className="font-semibold">{company.name}</div>
                    <div className="text-sm text-gray-500">Created: {new Date(company.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">👥 Recent Users</h2>
          </div>
          <div className="p-6">
            {stats?.recentUsers?.length === 0 ? (
              <p className="text-gray-500">No users yet</p>
            ) : (
              <div className="grid gap-3">
                {stats?.recentUsers?.map((user: any) => (
                  <div key={user.id} className="border rounded-lg p-3">
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email} • {user.role}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
