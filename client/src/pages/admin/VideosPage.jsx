import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api.js';
import { Status } from '../../components/Status.jsx';

export function AdminVideosPage() {
  const client = useQueryClient();
  const [editing, setEditing] = useState(null);

  const query = useQuery({
    queryKey: ['admin-videos'],
    queryFn: () => api.get('/videos').then((r) => r.data.videos),
  });

  const save = useMutation({
    mutationFn: ({ id, payload }) => (id ? api.patch(`/videos/${id}`, payload) : api.post('/videos', payload)),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['admin-videos'] });
      setEditing(null);
    },
  });

  const publish = useMutation({
    mutationFn: ({ id, isPublished }) => api.patch(`/videos/${id}/publish`, { isPublished }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['admin-videos'] }),
  });

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/videos/${id}`),
    onSuccess: () => client.invalidateQueries({ queryKey: ['admin-videos'] }),
  });

  function submit(event) {
    event.preventDefault();
    const raw = Object.fromEntries(new FormData(event.currentTarget));
    save.mutate({ id: editing?._id, payload: { ...raw, durationSeconds: Number(raw.durationSeconds) } });
  }

  function handleDelete(video) {
    if (window.confirm(`Delete "${video.title}"? This also removes its questions and assignments.`)) {
      remove.mutate(video._id);
    }
  }

  return (
    <main>
      <div className="page-title">
        <div>
          <h1>Videos</h1>
          <p>Create, publish, and maintain learning content.</p>
        </div>
        <button onClick={() => setEditing({})}>New video</button>
      </div>

      {editing && (
        <form className="card form-grid" onSubmit={submit}>
          <h2 className="wide">{editing._id ? 'Edit video' : 'New video'}</h2>
          <label>
            Title
            <input name="title" required defaultValue={editing.title} />
          </label>
          <label>
            Video URL
            <input name="videoUrl" type="url" required defaultValue={editing.videoUrl} />
          </label>
          <label>
            Duration (seconds)
            <input name="durationSeconds" type="number" min="1" required defaultValue={editing.durationSeconds} />
          </label>
          <label>
            Thumbnail URL
            <input name="thumbnailUrl" type="url" defaultValue={editing.thumbnailUrl} />
          </label>
          <label className="wide">
            Description
            <textarea name="description" defaultValue={editing.description} />
          </label>
          <div>
            <button disabled={save.isPending}>Save video</button>
            <button type="button" className="secondary" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <Status loading={query.isLoading} error={query.error} empty={!query.data?.length && 'No videos yet.'}>
        {query.data?.map((video) => (
          <article className="card row" key={video._id}>
            <div>
              <h2>{video.title}</h2>
              <p>{video.description || 'No description'}</p>
              <span className={video.isPublished ? 'pill live' : 'pill'}>
                {video.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <div className="actions">
              <Link className="button secondary" to={`/admin/videos/${video._id}/questions`}>
                Questions
              </Link>
              <button className="secondary" onClick={() => setEditing(video)}>
                Edit
              </button>
              <button onClick={() => publish.mutate({ id: video._id, isPublished: !video.isPublished })}>
                {video.isPublished ? 'Unpublish' : 'Publish'}
              </button>
              <button className="danger" disabled={remove.isPending} onClick={() => handleDelete(video)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </Status>
    </main>
  );
}
