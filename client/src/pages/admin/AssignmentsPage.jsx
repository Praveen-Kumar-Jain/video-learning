import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api.js';
import { Status } from '../../components/Status.jsx';

export function AdminAssignmentsPage() {
  const client = useQueryClient();
  const [message, setMessage] = useState('');

  const videos = useQuery({ queryKey: ['admin-videos'], queryFn: () => api.get('/videos').then((r) => r.data.videos) });
  const learners = useQuery({
    queryKey: ['learners'],
    queryFn: () => api.get('/users/learners').then((r) => r.data.learners),
  });
  const assignments = useQuery({
    queryKey: ['admin-assignments'],
    queryFn: () => api.get('/assignments').then((r) => r.data.assignments),
  });

  const refresh = () => client.invalidateQueries({ queryKey: ['admin-assignments'] });

  const create = useMutation({
    mutationFn: (payload) => api.post('/assignments', payload),
    onError: (error) => setMessage(error.response?.data?.message || 'Unable to create assignment.'),
  });

  const remove = useMutation({ mutationFn: (id) => api.delete(`/assignments/${id}`), onSuccess: refresh });

  function submit(event) {
    event.preventDefault();
    setMessage('');
    create.mutate(Object.fromEntries(new FormData(event.currentTarget)), {
      onSuccess: () => {
        event.currentTarget.reset();
        setMessage('Video assigned successfully.');
        refresh();
      },
    });
  }

  const loading = videos.isLoading || learners.isLoading || assignments.isLoading;
  const error = videos.error || learners.error || assignments.error;
  const publishedVideos = videos.data?.filter((video) => video.isPublished) || [];

  return (
    <main>
      <div className="page-title">
        <div>
          <h1>Assignments</h1>
          <p>Give learners access to published video lessons and manage existing assignments.</p>
        </div>
      </div>

      <form className="card form-grid" onSubmit={submit}>
        <h2 className="wide">Assign a video</h2>
        <label>
          Published video
          <select name="videoId" required defaultValue="">
            <option value="" disabled>
              Select a published video
            </option>
            {publishedVideos.map((video) => (
              <option key={video._id} value={video._id}>
                {video.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Learner
          <select name="learnerId" required defaultValue="">
            <option value="" disabled>
              Select a learner
            </option>
            {learners.data?.map((learner) => (
              <option key={learner._id} value={learner._id}>
                {learner.name} - {learner.email}
              </option>
            ))}
          </select>
        </label>
        <div>
          <button disabled={create.isPending || !publishedVideos.length || !learners.data?.length}>Assign video</button>
        </div>
        {!videos.isLoading && !publishedVideos.length && (
          <p className="hint wide">Publish a video first; draft videos cannot be assigned.</p>
        )}
        {message && <p className={message.includes('successfully') ? 'success' : 'error'}>{message}</p>}
      </form>

      <Status loading={loading} error={error} empty={!assignments.data?.length && 'No learner assignments yet.'}>
        {assignments.data?.map((assignment) => (
          <article className="card row" key={assignment._id}>
            <div>
              <h2>{assignment.videoId?.title || 'Deleted video'}</h2>
              <p>
                Assigned to {assignment.learnerId?.name || 'Deleted user'} ({assignment.learnerId?.email})
              </p>
              <span className="pill">Published video</span>
            </div>
            <button className="secondary" disabled={remove.isPending} onClick={() => remove.mutate(assignment._id)}>
              Remove
            </button>
          </article>
        ))}
      </Status>
    </main>
  );
}
