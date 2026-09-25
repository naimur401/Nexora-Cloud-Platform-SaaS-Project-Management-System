import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../services/axios.config';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [prefs, setPrefs] = useState({
    email_notifications: true,
    push_notifications: true,
    two_factor_enabled: false,
    language: 'en',
    timezone: 'UTC'
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [profileRes, keysRes, prefsRes] = await Promise.all([
        axios.get('/settings/profile'),
        axios.get('/settings/api-keys'),
        axios.get('/settings/preferences')
      ]);
      setProfile({ name: profileRes.data.data.name, email: profileRes.data.data.email });
      setApiKeys(keysRes.data.data);
      setPrefs(prefsRes.data.data);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      await axios.put('/settings/profile', profile);
      toast.success('Profile updated');
      const user = authService.getCurrentUser();
      localStorage.setItem('user', JSON.stringify({ ...user, name: profile.name, email: profile.email }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const changePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await axios.put('/settings/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      toast.success('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a key name');
      return;
    }
    try {
      const res = await axios.post('/settings/api-keys', { keyName: newKeyName });
      setApiKeys([res.data.data, ...apiKeys]);
      setNewKeyName('');
      toast.success('API key created');
    } catch (error) {
      toast.error('Failed to create API key');
    }
  };

  const revokeApiKey = async (id: number) => {
    if (!confirm('Revoke this API key?')) return;
    try {
      await axios.delete('/settings/api-keys/' + id);
      setApiKeys(apiKeys.filter(k => k.id !== id));
      toast.success('API key revoked');
    } catch (error) {
      toast.error('Failed to revoke key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const savePreferences = async () => {
    try {
      await axios.put('/settings/preferences', prefs);
      toast.success('Preferences saved');
    } catch (error) {
      toast.error('Failed to save preferences');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <button onClick={() => navigate('/dashboard')} className="text-purple-600 hover:underline">
            ← Back to Dashboard
          </button>
          <h1 className="text-xl font-bold">⚙️ Settings</h1>
          <div></div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b flex overflow-x-auto">
            {[
              { id: 'profile', label: '👤 Profile' },
              { id: 'password', label: '🔒 Password' },
              { id: 'api-keys', label: '🔑 API Keys' },
              { id: 'preferences', label: '⚙️ Preferences' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={'px-6 py-3 text-sm font-medium whitespace-nowrap ' + (activeTab === tab.id ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700')}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">👤 Profile Information</h2>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600" />
              </div>
              <button onClick={saveProfile} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Save Changes
              </button>
            </div>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">🔒 Change Password</h2>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input type="password" value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input type="password" value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input type="password" value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600" />
              </div>
              <button onClick={changePassword} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Change Password
              </button>
            </div>
          </div>
        )}

        {activeTab === 'api-keys' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">🔑 API Keys</h2>
            <p className="text-sm text-gray-500 mb-4">Use API keys to access Nexora API programmatically.</p>

            <div className="flex gap-3 mb-6">
              <input type="text" placeholder="Key name (e.g., Production Key)" value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600" />
              <button onClick={createApiKey} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Generate Key
              </button>
            </div>

            <div className="space-y-3">
              {apiKeys.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No API keys yet.</p>
              ) : (
                apiKeys.map(key => (
                  <div key={key.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{key.key_name}</h4>
                        <p className="text-xs text-gray-500">Created: {new Date(key.created_at).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => revokeApiKey(key.id)} className="text-red-500 hover:text-red-700 text-sm">
                        Revoke
                      </button>
                    </div>
                    <div className="flex gap-2 items-center bg-gray-50 rounded p-2">
                      <code className="text-xs flex-1 truncate font-mono">{key.api_key}</code>
                      <button onClick={() => copyToClipboard(key.api_key)} className="text-purple-600 hover:text-purple-800 text-xs">
                        Copy
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">⚙️ Preferences</h2>
            <div className="space-y-6 max-w-md">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-gray-500">Receive updates via email</div>
                </div>
                <input type="checkbox" checked={prefs.email_notifications}
                  onChange={(e) => setPrefs({ ...prefs, email_notifications: e.target.checked })}
                  className="w-5 h-5" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Push Notifications</div>
                  <div className="text-sm text-gray-500">Receive real-time notifications</div>
                </div>
                <input type="checkbox" checked={prefs.push_notifications}
                  onChange={(e) => setPrefs({ ...prefs, push_notifications: e.target.checked })}
                  className="w-5 h-5" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-gray-500">Add extra security to your account</div>
                </div>
                <input type="checkbox" checked={prefs.two_factor_enabled}
                  onChange={(e) => setPrefs({ ...prefs, two_factor_enabled: e.target.checked })}
                  className="w-5 h-5" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select value={prefs.language} onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg">
                  <option value="en">English</option>
                  <option value="ar">العربية (Arabic)</option>
                  <option value="bn">বাংলা (Bengali)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <select value={prefs.timezone} onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="UTC">UTC</option>
                  <option value="Asia/Riyadh">Riyadh (GMT+3)</option>
                  <option value="Asia/Dhaka">Dhaka (GMT+6)</option>
                </select>
              </div>

              <button onClick={savePreferences} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}