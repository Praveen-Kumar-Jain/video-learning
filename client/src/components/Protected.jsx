import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export function Protected({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin/videos' : '/learn'} replace />;
  return children;
}
