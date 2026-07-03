import { useState, useEffect, useRef } from 'react';

interface Notification {
  id: number; type: string; message: string; is_read: boolean; created_at: string;
}

export default function NotificationBell() {
  const [data, setData] = useState<{ notifications: Notification[]; unreadCount: number }>({ notifications: [], unreadCount: 0 });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function fetchNotifs() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const base = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:4003';
      const r = await fetch(`${base}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setData(await r.json());
    } catch {}
  }

  async function markAllRead() {
    const token = localStorage.getItem('token');
    const base = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:4003';
    await fetch(`${base}/api/notifications/read-all`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
    setData(prev => ({ ...prev, unreadCount: 0, notifications: prev.notifications.map(n => ({ ...n, is_read: true })) }));
  }

  useEffect(() => {
    fetchNotifs();
    const t = setInterval(fetchNotifs, 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function handleOpen() {
    setOpen(o => !o);
    if (!open && data.unreadCount > 0) markAllRead();
  }

  const toIST = (utc: string) => {
    const d = new Date(new Date(utc).getTime() + 330 * 60 * 1000);
    const h = d.getUTCHours(), m = String(d.getUTCMinutes()).padStart(2, '0');
    return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const icon = (type: string) => type === 'payment.success' ? '✅' : '❌';

  return (
    <div className="bell-wrap" ref={ref}>
      <button className="bell-btn" onClick={handleOpen}>
        🔔
        {data.unreadCount > 0 && <span className="bell-badge">{data.unreadCount}</span>}
      </button>
      {open && (
        <div className="bell-dropdown">
          <p className="bell-title">Notifications</p>
          {data.notifications.length === 0 && <p className="bell-empty">No notifications yet</p>}
          {data.notifications.map(n => (
            <div key={n.id} className={`bell-item ${n.is_read ? '' : 'unread'}`}>
              <span>{icon(n.type)}</span>
              <div>
                <p className="bell-msg">{n.message}</p>
                <p className="bell-time">{toIST(n.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
