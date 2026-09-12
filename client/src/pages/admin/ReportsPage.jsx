import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api.js';
import { Status } from '../../components/Status.jsx';

export function AdminReportsPage() {
  const [videoId, setVideoId] = useState('');

  const videos = useQuery({ queryKey: ['admin-videos'], queryFn: () => api.get('/videos').then((r) => r.data.videos) });

  const progress = useQuery({
    queryKey: ['report-progress', videoId],
    queryFn: () => api.get(`/reports/videos/${videoId}/progress`).then((r) => r.data.learners),
    enabled: Boolean(videoId),
  });

  const responses = useQuery({
    queryKey: ['report-responses', videoId],
    queryFn: () => api.get(`/reports/videos/${videoId}/responses`).then((r) => r.data.responses),
    enabled: Boolean(videoId),
  });

  const selectedVideo = videos.data?.find((video) => video._id === videoId);
  const correctCount = responses.data?.filter((response) => response.isCorrect).length ?? 0;

  return (
    <main>
      <div className="page-title">
        <div>
          <h1>Reports</h1>
          <p>See who has watched each lesson and how they answered.</p>
        </div>
      </div>

      <div className="card form-grid">
        <label className="wide">
          Lesson
          <select value={videoId} onChange={(event) => setVideoId(event.target.value)}>
            <option value="">Select a lesson</option>
            {videos.data?.map((video) => (
              <option key={video._id} value={video._id}>
                {video.title}
                {video.isPublished ? '' : ' (draft)'}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!videoId && <p className="state">Select a lesson to see its learner progress and graded responses.</p>}

      {videoId && (
        <>
          <section className="card">
            <h2>Learner progress{selectedVideo && ` · ${selectedVideo.title}`}</h2>
            <Status
              loading={progress.isLoading}
              error={progress.error}
              empty={!progress.data?.length && 'No learners are assigned to this lesson yet.'}
            >
              <table>
                <thead>
                  <tr>
                    <th>Learner</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Last watched</th>
                  </tr>
                </thead>
                <tbody>
                  {progress.data?.map((row) => (
                    <tr key={row.assignmentId}>
                      <td>
                        {row.learner?.name || 'Deleted user'}
                        <br />
                        <span className="hint">{row.learner?.email}</span>
                      </td>
                      <td>
                        <span className={`pill ${row.progress.status === 'completed' ? 'live' : ''}`}>
                          {row.progress.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>{Math.round(row.progress.completionPercentage)}%</td>
                      <td>{Math.round(row.progress.lastWatchedSecond)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Status>
          </section>

          <section className="card">
            <h2>
              Graded responses{responses.data?.length ? ` · ${correctCount}/${responses.data.length} correct` : ''}
            </h2>
            <Status
              loading={responses.isLoading}
              error={responses.error}
              empty={!responses.data?.length && 'No answers submitted yet.'}
            >
              <table>
                <thead>
                  <tr>
                    <th>Learner</th>
                    <th>Question</th>
                    <th>Answer</th>
                    <th>Correct answer</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.data?.map((response) => (
                    <tr key={response.id}>
                      <td>{response.learner?.name || 'Deleted user'}</td>
                      <td>
                        {response.question.timestampSeconds}s · {response.question.prompt}
                      </td>
                      <td>{response.learnerAnswerLabel}</td>
                      <td>{response.correctAnswerLabel}</td>
                      <td>
                        <span className={`badge ${response.isCorrect ? 'correct' : 'incorrect'}`}>
                          {response.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Status>
          </section>
        </>
      )}
    </main>
  );
}
