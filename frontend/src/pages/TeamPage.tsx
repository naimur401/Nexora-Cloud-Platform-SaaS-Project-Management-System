
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../services/axios.config';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';

export default function TeamPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', role: 'TEAM_MEMBER' });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    if (!['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(currentUser?.role)) {
      toast.error('Access denied');
      navigate('/dashboard');
      return;
    }
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const res = await axios.get('/invitations');
      setInvitations(res.data.data || []);
    } catch {
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async () => {
    if (!inviteData.email) {
      toast.error('Please enter email');
      return;
    }
    try {
      const res = await axios.post('/invitations', inviteData);
      setInvitations([res.data.data, ...invitations]);
      setShowInviteModal(false);
      setInviteData({ email: '', role: 'TEAM_MEMBER' });
      toast.success('Invitation sent');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    }
  };

  const cancelInvitation = async (id: number) => {
    if (!confirm('Cancel this invitation?')) return;
    try {
      await axios.delete('/invitations/' + id);
      setInvitations(invitations.filter(i => i.id !== id));
      toast.success('Invitation cancelled');
    } catch {
      toast.error('Failed to cancel');
    }
  };

  const copyInviteLink = (token: string) => {
    const link = window.location.origin + '/invite/' + token;
    navigator.clipboard.writeText(link);
    toast.success('Link copied!');
  };

  const getStatusBadge = (status: string) => {
    if (status === 'PENDING') return 'bg-yellow-100 text-yellow-800';
    if (status === 'ACCEPTED') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <button onClick={() => navigate('/dashboard')} className="text-purple-600 hover:underline">← Back</button>
          <h1 className="text-xl font-bold">👥 Team Management</h1>
          <button onClick={() => setShowInviteModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            + Invite Member
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">📧 Invitations ({invitations.length})</h2>
            <p className="text-sm text-gray-500">Invite team members to join your company</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invited By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invitations.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No invitations yet. Click "+ Invite Member" to send one.
                  </td></tr>
                ) : (
                  invitations.map((invite) => (
                    <tr key={invite.id}>
                      <td className="px-6 py-4 font-medium">{invite.email}</td>
                      <td className="px-6 py-4 text-sm">{invite.role}</td>
                      <td className="px-6 py-4">
                        <span className={'px-2 py-1 rounded text-xs ' + getStatusBadge(invite.status)}>{invite.status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{invite.invited_by_name || '-'}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">{new Date(invite.expires_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        {invite.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button onClick={() => copyInviteLink(invite.token)} className="text-purple-600 hover:text-purple-800 text-sm">Copy Link</button>
                            <button onClick={() => cancelInvitation(invite.id)} className="text-red-600 hover:text-red-800 text-sm">Cancel</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-xl font-bold mb-4">Invite Team Member</h3>
            <input type="email" placeholder="Email address" value={inviteData.email}
              onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mb-3" />
            <select value={inviteData.role} onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mb-4">
              <option value="TEAM_MEMBER">Team Member</option>
              <option value="COMPANY_ADMIN">Company Admin</option>
            </select>
            <div className="flex gap-3">
              <button onClick={sendInvitation} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Send Invite</button>
              <button onClick={() => setShowInviteModal(false)} className="flex-1 px-4 py-2 bg-gray-300 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
