
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../services/axios.config';
import toast from 'react-hot-toast';

export default function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    verifyInvite();
  }, [token]);

  const verifyInvite = async () => {
    try {
      const res = await axios.get('/invitations/verify/' + token);
      setInvite(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid invitation');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async () => {
    if (!formData.name || !formData.password) {
      toast.error('Please fill all fields');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post('/invitations/accept/' + token, formData);
      localStorage.setItem('token', res.data.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.data.user));
      toast.success('Welcome to the team!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Verifying...</div>;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600">{error}</p>
          <button onClick={() => navigate('/login')} className="mt-6 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 py-8">
      <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🎉</div>
          <h1 className="text-2xl font-bold text-gray-800">You're Invited!</h1>
          <p className="text-gray-500 text-sm mt-2">
            Join <strong>{invite.company_name}</strong> as {invite.role}
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 mb-6 text-sm">
          <div className="text-gray-600">Email:</div>
          <div className="font-semibold">{invite.email}</div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Create Password</label>
            <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600" />
          </div>
          <button onClick={acceptInvite} disabled={submitting}
            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold">
            {submitting ? 'Joining...' : 'Accept & Join'}
          </button>
        </div>
      </div>
    </div>
  );
}
