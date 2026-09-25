import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const user = authService.getCurrentUser();

  const handleLogout = async () => {
    await authService.logout();
    toast.success('Logged out');
    navigate('/login');
  };

 const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: '📊' },
  { path: '/admin/companies', label: 'Companies', icon: '🏢' },
  { path: '/admin/users', label: 'Users', icon: '👥' },
  { path: '/admin/subscriptions', label: 'Subscriptions', icon: '💳' },
  { path: '/admin/logs', label: 'Audit Logs', icon: '📋' },
];
  const getLinkClass = (path: string) => {
    const baseClass = 'flex items-center gap-3 px-4 py-3 rounded-lg transition';
    if (location.pathname === path) {
      return baseClass + ' bg-purple-100 text-purple-600';
    }
    return baseClass + ' hover:bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-2xl">
              {isSidebarOpen ? '◀' : '▶'}
            </button>
            <Link to="/admin" className="text-2xl font-bold text-purple-600">
              Nexora Admin
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">{user?.role}</span>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className={(isSidebarOpen ? 'w-64' : 'w-16') + ' bg-white shadow-sm min-h-[calc(100vh-64px)] transition-all duration-300'}>
          <div className="p-4">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={getLinkClass(item.path)}
                >
                  <span>{item.icon}</span>
                  {isSidebarOpen && <span>{item.label}</span>}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
