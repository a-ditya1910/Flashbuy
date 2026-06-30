import { useState } from 'react';
import api from '../api';
import { User } from '../App';

export default function Login({ onLogin }: { onLogin: (t: string, u: User) => void }) {
  const [email, setEmail] = useState('aditya@test.com');
  const [password, setPassword] = useState('secret123');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      onLogin(res.data.token, res.data.user);
    } catch {
      setError('Invalid credentials');
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>⚡ FlashBuy</h1>
        <p className="tagline">High-speed flash sales</p>
        <form onSubmit={handleSubmit}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" />
          {error && <p className="error">{error}</p>}
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}
