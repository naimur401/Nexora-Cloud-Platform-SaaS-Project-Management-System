import { useEffect, useState } from 'react';
import axios from '../../services/axios.config';
import toast from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  company_id: number;
  company_name: string;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);
  const [filters, setFilters] = useState({ companyId: '', role: '' });

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.companyId) params.append('companyId', filters.companyId);
      if (filters.role) params.append('role', filters.role);
      const response = await axios.get(/admin/users?);
      setUsers(response.data.data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get('/admin/companies');
      setCompanies(response.data.data);
    } catch (error) {
      console.error('Failed to load companies');
    }
  };

  const changeRole = async (userId: number, newRole: string) => {
    try {
      await axios.put(/admin/users//role, { role: newRole });
      toast.success('Role updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await axios.delete(/admin/users/);
      toast.success('User deleted');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">👥 Users</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4">
        <select
          value={filters.companyId}
          onChange={(e) => setFilters({ ...filters, companyId: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">All Roles</option>
          <option value="COMPANY_ADMIN">Company Admin</option>
          <option value="TEAM_MEMBER">Team Member</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 font-medium">{user.name}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    onChange={(e) => changeRole(user.id, e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="COMPANY_ADMIN">Admin</option>
                    <option value="TEAM_MEMBER">Member</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-sm">{user.company_name || '-'}</td>
                <td className="px-6 py-4">
                  <button onClick={() => deleteUser(user.id)} className="text-red-600 hover:text-red-800">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
