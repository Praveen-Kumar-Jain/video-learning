import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  if (user) return navigate(user.role === 'admin' ? '/admin/videos' : '/learn');

  async function submit(event) {
    event.preventDefault();
    setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const { data: session } = await api.post('/auth/login', data);
      login(session);
      navigate(session.user.role === 'admin' ? '/admin/videos' : '/learn');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in');
    }
  }

  return (
    <main className="auth">
      <form className="card" onSubmit={submit}>
        <h1>Welcome back</h1>
        <p>Sign in to manage or learn from video courses.</p>
        <label>
          Email
          <input type="email" name="email" required defaultValue="admin@example.com" />
        </label>
        <label>
          Password
          <input type="password" name="password" required defaultValue="Password123!" />
        </label>
        {error && <p className="error">{error}</p>}
        <button>Sign in</button>
        <small>Seed accounts: admin@example.com or learner@example.com</small>
      </form>
    </main>
  );
}
