import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Sales from './pages/Sales';
import Orders from './pages/Orders';
import AdminPanel from './pages/AdminPanel';
import NotificationBell from './components/NotificationBell'; 

type Page = 'sales' | 'orders' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const s = localStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  });
  const [page, setPage] = useState<Page>('sales');

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else { localStorage.removeItem('token'); localStorage.removeItem('user'); }
  }, [token]);

  function handleLogin(t: string, u: User) {
    setToken(t);
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
  }

  if (!token || !user) return <Login onLogin={handleLogin} />;

  return (
    <div className="app">
      <nav className="navbar">
        <span className="logo">⚡ FlashBuy</span>
        <div className="nav-links">
          <button className={page === 'sales' ? 'active' : ''} onClick={() => setPage('sales')}>Live Sales</button>
          <button className={page === 'orders' ? 'active' : ''} onClick={() => setPage('orders')}>My Orders</button>
          {user.role === 'admin' && (
            <button className={page === 'admin' ? 'active admin-btn' : 'admin-btn'} onClick={() => setPage('admin')}>
              Admin Panel
            </button>
          )}
          <NotificationBell />
          <span className="user-badge">{user.role === 'admin' ? '👑' : '👤'} {user.name}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      {page === 'sales' && <Sales />}
      {page === 'orders' && <Orders />}
      {page === 'admin' && user.role === 'admin' && <AdminPanel />}
    </div>
  );
}
