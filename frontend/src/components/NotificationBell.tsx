import { useEffect, useState, useRef } from "react";
import axios from "../services/axios.config";
import toast from "react-hot-toast";

interface Notification {
  id: number;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("/notifications");
      setNotifications(res.data.data || []);
    } catch {}
  };

  const markAsRead = async (id: number) => {
    try {
      await axios.put("/notifications/" + id + "/read");
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await axios.put("/notifications/read-all");
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      toast.success("All marked as read");
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 text-gray-600 hover:text-purple-600 transition">
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-purple-600 hover:text-purple-800">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} onClick={() => !n.is_read && markAsRead(n.id)}
                  className={"p-4 border-b cursor-pointer hover:bg-gray-50 transition " + (!n.is_read ? "bg-purple-50" : "")}>
                  <div className="flex gap-3 items-start">
                    <span className="text-lg">{n.type === "TASK_ASSIGNED" ? "📋" : "🔔"}</span>
                    <div className="flex-1">
                      <p className={"text-sm " + (!n.is_read ? "font-semibold text-gray-800" : "text-gray-600")}>
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    {!n.is_read && <span className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0 mt-1"></span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}