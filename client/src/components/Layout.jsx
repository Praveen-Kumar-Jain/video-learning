import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export function Layout({ children }) {
  const { user, logout } = useAuth();
  return (
    <>
      <header>
        <NavLink className="brand" to={user.role === 'admin' ? '/admin/videos' : '/learn'}>
          Video Learning
        </NavLink>
        <nav>
          {user.role === 'admin' && (
            <>
              <NavLink to="/admin/videos">Videos</NavLink>
              <NavLink to="/admin/assignments">Assignments</NavLink>
              <NavLink to="/admin/reports">Reports</NavLink>
            </>
          )}
          {user.role === 'learner' && <NavLink to="/learn">My learning</NavLink>}
          <span>{user.name}</span>
          <button className="link" onClick={logout}>
            Sign out
          </button>
        </nav>
      </header>
      {children}
    </>
  );
}
