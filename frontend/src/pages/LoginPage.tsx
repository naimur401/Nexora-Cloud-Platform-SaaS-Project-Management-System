import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('admin@nexora.com');
  const [password, setPassword] = useState('admin123');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      if (response.success) {
        toast.success('Login successful!');
        const userRole = response.data.user.role;
        if (userRole === 'SUPER_ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error(response.message || 'Login failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-96">
        <h2 className="text-2xl font-bold text-center mb-6">Nexora Cloud</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded mb-3"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700"
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>
        <div className="mt-4 text-center text-sm">
          <p className="text-gray-600">Demo: admin@nexora.com / admin123</p>
          <Link to="/register" className="text-purple-600 hover:underline">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
