import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/axios.config';
import toast from 'react-hot-toast';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface Stats {
  totalCompanies: number;
  totalUsers: number;
  totalProjects: number;
  totalTasks: number;
}

interface Analytics {
  taskStatus: any[];
  projectProgress: any[];
  companyStats: any[];
  userGrowth: any[];
  monthlyTasks: any[];
  completionRate: { total: number; completed: number; rate: number };
}

const COLORS = ['#FBBF24', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        axios.get('/admin/stats'),
        axios.get('/admin/analytics')
      ]);
      setStats(statsRes.data.data);
      setAnalytics(analyticsRes.data.data);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Access denied. Super Admin only.');
        navigate('/dashboard');
      } else {
        toast.error('Failed to load dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading Dashboard...</div>;
  }

  const taskStatusData = analytics?.taskStatus.map(item => ({
    name: item.status,
    value: parseInt(item.count)
  })) || [];

  const userGrowthData = analytics?.userGrowth.map(item => ({
    month: item.month,
    users: parseInt(item.count)
  })) || [];

  const projectProgressData = analytics?.projectProgress.map(item => ({
    name: item.title.length > 15 ? item.title.substring(0, 15) + '...' : item.title,
    completed: parseInt(item.completed_tasks),
    pending: parseInt(item.total_tasks) - parseInt(item.completed_tasks)
  })) || [];

  const companyStatsData = analytics?.companyStats.map(item => ({
    name: item.name.length > 12 ? item.name.substring(0, 12) + '...' : item.name,
    users: parseInt(item.user_count),
    projects: parseInt(item.project_count)
  })) || [];

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
          <div className="text-3xl mb-2">🏢</div>
          <div className="text-3xl font-bold">{stats?.totalCompanies || 0}</div>
          <div className="text-sm opacity-90">Total Companies</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
          <div className="text-sm opacity-90">Total Users</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
          <div className="text-3xl mb-2">📁</div>
          <div className="text-3xl font-bold">{stats?.totalProjects || 0}</div>
          <div className="text-sm opacity-90">Total Projects</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow p-6 text-white">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-3xl font-bold">{stats?.totalTasks || 0}</div>
          <div className="text-sm opacity-90">Total Tasks</div>
        </div>
      </div>

      {/* Completion Rate Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">📊 Task Completion Rate</h2>
        <div className="flex items-center gap-6">
          <div className="text-5xl font-bold text-purple-600">{analytics?.completionRate.rate}%</div>
          <div className="flex-1">
            <div className="text-sm text-gray-600 mb-2">
              {analytics?.completionRate.completed} of {analytics?.completionRate.total} tasks completed
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-4 rounded-full transition-all"
                style={{ width: (analytics?.completionRate.rate || 0) + '%' }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Task Status Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🥧 Task Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={taskStatusData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => name + ': ' + value}
              >
                {taskStatusData.map((entry, index) => (
                  <Cell key={'cell-' + index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth Line Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📈 User Growth</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#8B5CF6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Project Progress Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📊 Project Progress</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectProgressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" stackId="a" fill="#10B981" name="Completed" />
              <Bar dataKey="pending" stackId="a" fill="#FBBF24" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Company Stats Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🏢 Company Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={companyStatsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="users" fill="#3B82F6" name="Users" />
              <Bar dataKey="projects" fill="#8B5CF6" name="Projects" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
