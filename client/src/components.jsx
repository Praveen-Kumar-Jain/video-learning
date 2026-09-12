import { NavLink, Navigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';

export function Protected({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin/videos' : '/learn'} replace />;
  return children;
}
export function Layout({ children }) {
  const { user, logout } = useAuth();
  return <><header><NavLink className="brand" to={user.role === 'admin' ? '/admin/videos' : '/learn'}>Video Learning</NavLink><nav>{user.role === 'admin' && <><NavLink to="/admin/videos">Videos</NavLink><NavLink to="/admin/assignments">Assignments</NavLink></>} {user.role === 'learner' && <NavLink to="/learn">My learning</NavLink>}<span>{user.name}</span><button className="link" onClick={logout}>Sign out</button></nav></header>{children}</>;
}
export function Status({ error, loading, empty, children }) {
  if (loading) return <p className="state">Loading…</p>;
  if (error) return <p className="state error">{error.message || 'Something went wrong.'}</p>;
  if (empty) return <p className="state">{empty}</p>;
  return children;
}
