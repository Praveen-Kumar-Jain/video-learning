import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api.js';
import { Status } from '../../components/Status.jsx';

export function LearnerHomePage() {
  const query = useQuery({
    queryKey: ['assignments'],
    queryFn: () => api.get('/assignments/me').then((r) => r.data.assignments),
  });

  return (
    <main>
      <div className="page-title">
        <div>
          <h1>My learning</h1>
          <p>Your assigned and published video lessons.</p>
        </div>
      </div>
      <Status
        loading={query.isLoading}
        error={query.error}
        empty={
          !query.data?.length &&
          'No published videos are assigned to you yet. Ask your admin to publish and assign a lesson.'
        }
      >
        {query.data?.map(({ assignment, video, progress }) => {
          const percent = Math.round(progress?.completionPercentage || 0);
          const completed = progress?.status === 'completed' || percent >= 100;
          return (
            <article className="card row" key={assignment._id}>
              <div className="lesson-info">
                <h2>{video.title}</h2>
                <p>{video.description || 'No description provided.'}</p>
                <div className="progress-label">
                  <span>
                    {completed ? 'Completed' : progress?.status === 'in_progress' ? 'In progress' : 'Not started'}
                  </span>
                  <strong>{percent}%</strong>
                </div>
                <div className="progress-track" aria-label={`${percent}% complete`}>
                  <span style={{ width: `${percent}%` }} />
                </div>
              </div>
              <Link className={completed ? 'button secondary' : 'button'} to={`/learn/${assignment._id}`}>
                {completed ? 'Review video' : progress ? 'Continue learning' : 'Start learning'}
              </Link>
            </article>
          );
        })}
      </Status>
    </main>
  );
}
