import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth.jsx';
import { Layout, Protected } from './components/index.js';
import { LoginPage } from './pages/LoginPage.jsx';
import { AdminVideosPage } from './pages/admin/VideosPage.jsx';
import { QuestionsPage } from './pages/admin/QuestionsPage.jsx';
import { AdminAssignmentsPage } from './pages/admin/AssignmentsPage.jsx';
import { AdminReportsPage } from './pages/admin/ReportsPage.jsx';
import { LearnerHomePage } from './pages/learner/HomePage.jsx';
import { PlayerPage } from './pages/learner/PlayerPage.jsx';

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? (user.role === 'admin' ? '/admin/videos' : '/learn') : '/login'} replace />;
}

const Page = ({ role, children }) => (
  <Protected role={role}>
    <Layout>{children}</Layout>
  </Protected>
);

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin/videos"
          element={
            <Page role="admin">
              <AdminVideosPage />
            </Page>
          }
        />
        <Route
          path="/admin/videos/:videoId/questions"
          element={
            <Page role="admin">
              <QuestionsPage />
            </Page>
          }
        />
        <Route
          path="/admin/assignments"
          element={
            <Page role="admin">
              <AdminAssignmentsPage />
            </Page>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <Page role="admin">
              <AdminReportsPage />
            </Page>
          }
        />
        <Route
          path="/learn"
          element={
            <Page role="learner">
              <LearnerHomePage />
            </Page>
          }
        />
        <Route
          path="/learn/:assignmentId"
          element={
            <Page role="learner">
              <PlayerPage />
            </Page>
          }
        />
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </AuthProvider>
  );
}
