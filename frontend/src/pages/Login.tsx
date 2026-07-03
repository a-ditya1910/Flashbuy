import { useState } from 'react';
import api from '../api';
import { User } from '../App';

export default function Login({ onLogin }: { onLogin: (t: string, u: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await api.post('/auth/register', { email, name, password, adminCode: adminCode || undefined });
      }
      const res = await api.post('/auth/login', { email, password });
      onLogin(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>⚡ FlashBuy</h1>
        <p className="tagline">High-speed flash sales</p>
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full name"
              required
            />
          )}
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
          />
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            required
          />
          {mode === 'register' && (
            <input
              value={adminCode}
              onChange={e => setAdminCode(e.target.value)}
              placeholder="Admin code (optional)"
            />
          )}
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>
        <p className="hint" style={{ marginTop: '16px', cursor: 'pointer' }} onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Login'}
        </p>
      </div>
    </div>
  );
}
