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
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'TEAM_MEMBER', companyId: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      let url = '/admin/users';
      const params = [];
      if (filters.companyId) params.push('companyId=' + filters.companyId);
      if (filters.role) params.push('role=' + filters.role);
      if (params.length > 0) url = url + '?' + params.join('&');
      const response = await axios.get(url);
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

  const createUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Name, email and password are required');
      return;
    }
    setCreating(true);
    try {
      await axios.post('/auth/register', {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        companyId: newUser.companyId || null,
      });
      toast.success('User created successfully');
      setShowModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'TEAM_MEMBER', companyId: '' });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const changeRole = async (userId: number, newRole: string) => {
    try {
      await axios.put('/admin/users/' + userId + '/role', { role: newRole });
      toast.success('Role updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await axios.delete('/admin/users/' + userId);
      toast.success('User deleted');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          + New User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4">
        <select value={filters.companyId} onChange={(e) => setFilters({ ...filters, companyId: e.target.value })} className="px-3 py-2 border rounded-lg">
          <option value="">All Companies</option>
          {companies.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
        <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })} className="px-3 py-2 border rounded-lg">
          <option value="">All Roles</option>
          <option value="COMPANY_ADMIN">Company Admin</option>
          <option value="TEAM_MEMBER">Team Member</option>
        </select>
      </div>

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
            {users.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No users found</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 font-medium">{user.name}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">
                    <select value={user.role} onChange={(e) => changeRole(user.id, e.target.value)} className="text-sm border rounded px-2 py-1">
                      <option value="COMPANY_ADMIN">Company Admin</option>
                      <option value="TEAM_MEMBER">Team Member</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm">{user.company_name || '-'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => deleteUser(user.id)} className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-xl font-bold mb-4">Create New User</h3>
            <input type="text" placeholder="Full Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg mb-3" />
            <input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg mb-3" />
            <input type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="w-full px-3 py-2 border rounded-lg mb-3" />
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg mb-3">
              <option value="TEAM_MEMBER">Team Member</option>
              <option value="COMPANY_ADMIN">Company Admin</option>
            </select>
            <select value={newUser.companyId} onChange={(e) => setNewUser({ ...newUser, companyId: e.target.value })} className="w-full px-3 py-2 border rounded-lg mb-4">
              <option value="">No Company</option>
              {companies.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
            <div className="flex gap-3">
              <button onClick={createUser} disabled={creating} className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50">
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
