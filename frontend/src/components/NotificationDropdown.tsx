import { useEffect, useState } from 'react';
import axios from '../services/axios.config';

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/notifications');
      setNotifications(res.data.data);
    } catch (error) {}
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get('/notifications/unread-count');
      setUnreadCount(res.data.data.count);
    } catch (error) {}
  };

  const markAsRead = async (id: number) => {
    try {
      await axios.put('/notifications/' + id + '/read');
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      fetchUnreadCount();
    } catch (error) {}
  };

  const markAllRead = async () => {
    try {
      await axios.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {}
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-purple-600"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-bold">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-purple-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="p-4 text-center text-gray-500 text-sm">No notifications</p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={'p-3 border-b cursor-pointer hover:bg-gray-50 ' + (!notif.is_read ? 'bg-purple-50' : '')}
              >
                <p className="text-sm">{notif.message}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
