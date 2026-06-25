import { useEffect, useState } from 'react';
import axios from '../../services/axios.config';
import toast from 'react-hot-toast';

interface Company {
  id: number;
  name: string;
  user_count: string;
  project_count: string;
  created_at: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await axios.get('/admin/companies');
      setCompanies(response.data.data);
    } catch (error) {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const createCompany = async () => {
    if (!newCompanyName) {
      toast.error('Company name is required');
      return;
    }
    try {
      await axios.post('/admin/companies', { name: newCompanyName });
      toast.success('Company created');
      setShowModal(false);
      setNewCompanyName('');
      fetchCompanies();
    } catch (error) {
      toast.error('Failed to create company');
    }
  };

  const deleteCompany = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await axios.delete('/admin/companies/' + id);
      toast.success('Company deleted');
      fetchCompanies();
    } catch (error) {
      toast.error('Failed to delete company');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🏢 Companies</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          + New Company
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projects</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {companies.map((company) => (
              <tr key={company.id}>
                <td className="px-6 py-4 font-medium">{company.name}</td>
                <td className="px-6 py-4">{company.user_count || 0}</td>
                <td className="px-6 py-4">{company.project_count || 0}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(company.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <button onClick={() => deleteCompany(company.id)} className="text-red-600 hover:text-red-800">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-xl font-bold mb-4">Create Company</h3>
            <input
              type="text"
              placeholder="Company Name"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg mb-4"
            />
            <div className="flex gap-3">
              <button onClick={createCompany} className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
                Create
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
