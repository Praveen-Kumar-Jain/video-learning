import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api.js';
import { Status } from '../../components/Status.jsx';

export function PlayerPage() {
  const { assignmentId } = useParams();
  const query = useQuery({
    queryKey: ['play', assignmentId],
    queryFn: () => api.get(`/assignments/${assignmentId}/play`).then((r) => r.data),
  });

  if (query.isLoading || query.error) {
    return (
      <main>
        <Status loading={query.isLoading} error={query.error} />
      </main>
    );
  }
  return <PlayerExperience assignmentId={assignmentId} data={query.data} />;
}

function PlayerExperience({ assignmentId, data }) {
  const player = useRef(null);
  const client = useQueryClient();
  const lastSavedSecond = useRef(0);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [handled, setHandled] = useState(() => new Set((data.progress?.answeredQuestionIds || []).map(String)));
  const [notice, setNotice] = useState('');
  const [playerError, setPlayerError] = useState('');

  const { video, questions, progress } = data;
  const completed = progress?.status === 'completed' || progress?.completionPercentage >= 100;

  const saveProgress = useMutation({
    mutationFn: (payload) => api.patch(`/assignments/${assignmentId}/progress`, payload),
    onSuccess: () => client.invalidateQueries({ queryKey: ['assignments'] }),
  });

  const saveAnswer = useMutation({
    mutationFn: (payload) => api.post(`/assignments/${assignmentId}/responses`, payload),
    onSuccess: (_, variables) => {
      setHandled((current) => new Set([...current, variables.questionId]));
      setQuestion(null);
      setAnswer('');
      setNotice('Answer saved. Playback resumed.');
      player.current?.play().catch(() => setPlayerError('Select play to continue the video.'));
    },
  });

  useEffect(() => {
    if (progress?.lastWatchedSecond && player.current) player.current.currentTime = progress.lastWatchedSecond;
  }, [progress?.lastWatchedSecond]);

  function persist(currentTime, finished = false) {
    const duration = player.current?.duration || video.durationSeconds;
    saveProgress.mutate({
      lastWatchedSecond: finished ? duration : currentTime,
      completionPercentage: finished ? 100 : Math.min(99, Math.round((currentTime / duration) * 100)),
      status: finished ? 'completed' : 'in_progress',
    });
  }

  function onTimeUpdate() {
    const currentTime = player.current.currentTime;
    const next = questions.find((item) => !handled.has(String(item.id)) && currentTime >= item.timestampSeconds);
    if (next && !question) {
      player.current.pause();
      setQuestion(next);
      setNotice('Video paused for a quick check.');
      return;
    }
    if (currentTime - lastSavedSecond.current >= 5) {
      lastSavedSecond.current = currentTime;
      persist(currentTime);
    }
  }

  function submit(event) {
    event.preventDefault();
    const value =
      question.type === 'multiple'
        ? [...event.currentTarget.querySelectorAll('input:checked')].map((input) => input.value)
        : answer;
    if (!Array.isArray(value) && !value.trim()) return;
    if (Array.isArray(value) && !value.length) return;
    saveAnswer.mutate({ questionId: question.id, answer: value });
  }

  return (
    <main>
      <Link to="/learn">Back to my learning</Link>
      <div className="lesson-heading">
        <div>
          <h1>{video.title}</h1>
          <p>{video.description || 'Complete the video and answer the questions as they appear.'}</p>
        </div>
        {completed && <span className="completion-badge">Completed - 100%</span>}
      </div>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {playerError && (
        <p className="error" role="alert">
          {playerError}
        </p>
      )}
      <video
        ref={player}
        controls
        src={video.videoUrl}
        onTimeUpdate={onTimeUpdate}
        onPause={() => {
          const currentTime = player.current?.currentTime || 0;
          const duration = player.current?.duration || video.durationSeconds;
          if (!question && currentTime < duration - 0.25 && !completed) persist(currentTime);
        }}
        onEnded={() => {
          persist(player.current?.duration || video.durationSeconds, true);
          setNotice('Lesson completed. Great work - this video is now marked 100% complete.');
        }}
        onError={() =>
          setPlayerError(
            'This video could not be played. Ask the admin to use a direct HTTPS MP4 link that allows browser playback.',
          )
        }
      />
      {question && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Video question">
          <form className="card quiz" onSubmit={submit}>
            <span className="pill">Video paused at {Math.floor(question.timestampSeconds)} seconds</span>
            <h2>Quick check</h2>
            <p>{question.prompt}</p>
            {question.type === 'short' ? (
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                required
                aria-label="Your answer"
              />
            ) : (
              question.options.map((option) => (
                <label key={option._id}>
                  <input
                    type={question.type === 'multiple' ? 'checkbox' : 'radio'}
                    name="answer"
                    value={option._id}
                    checked={question.type === 'multiple' ? undefined : answer === option._id}
                    onChange={(event) => setAnswer(event.target.value)}
                  />{' '}
                  {option.text}
                </label>
              ))
            )}
            <button disabled={saveAnswer.isPending}>
              {saveAnswer.isPending ? 'Saving answer...' : 'Submit and continue'}
            </button>
            {saveAnswer.error && <p className="error">Your answer could not be saved. Please try again.</p>}
          </form>
        </div>
      )}
    </main>
  );
}
