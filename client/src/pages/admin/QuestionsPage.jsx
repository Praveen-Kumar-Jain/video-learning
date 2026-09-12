import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api.js';
import { Status } from '../../components/Status.jsx';

const QUESTION_TYPES = [
  { value: 'single', label: 'Single choice' },
  { value: 'multiple', label: 'Multiple choice' },
  { value: 'short', label: 'Short answer' },
];

let optionKeySequence = 0;
function emptyOption() {
  optionKeySequence += 1;
  return { key: `new-${optionKeySequence}`, text: '', isCorrect: false };
}

function blankForm() {
  return {
    id: null,
    timestampSeconds: '',
    type: 'single',
    prompt: '',
    options: [emptyOption(), emptyOption()],
    acceptedAnswers: '',
  };
}

function formFromQuestion(question) {
  const correctIds = new Set((question.correctOptionIds || []).map(String));
  return {
    id: question._id,
    timestampSeconds: question.timestampSeconds,
    type: question.type,
    prompt: question.prompt,
    options: question.options.length
      ? question.options.map((option) => ({
          key: option._id,
          text: option.text,
          isCorrect: correctIds.has(String(option._id)),
        }))
      : [emptyOption(), emptyOption()],
    acceptedAnswers: (question.acceptedAnswers || []).join('\n'),
  };
}

export function QuestionsPage() {
  const { videoId } = useParams();
  const client = useQueryClient();
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState('');

  const query = useQuery({
    queryKey: ['questions', videoId],
    queryFn: () => api.get(`/videos/${videoId}/questions`).then((r) => r.data.questions),
  });

  const invalidate = () => client.invalidateQueries({ queryKey: ['questions', videoId] });

  const save = useMutation({
    mutationFn: (payload) =>
      form.id ? api.patch(`/videos/questions/${form.id}`, payload) : api.post(`/videos/${videoId}/questions`, payload),
    onSuccess: () => {
      invalidate();
      setForm(null);
      setFormError('');
    },
    onError: (error) => setFormError(error.response?.data?.message || 'Unable to save question'),
  });

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/videos/questions/${id}`),
    onSuccess: invalidate,
  });

  function updateOption(index, changes) {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, i) => (i === index ? { ...option, ...changes } : option)),
    }));
  }

  function setSingleCorrectOption(index) {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, i) => ({ ...option, isCorrect: i === index })),
    }));
  }

  function addOption() {
    setForm((current) => ({ ...current, options: [...current.options, emptyOption()] }));
  }

  function removeOption(index) {
    setForm((current) => ({ ...current, options: current.options.filter((_, i) => i !== index) }));
  }

  function submit(event) {
    event.preventDefault();
    setFormError('');
    const payload = {
      timestampSeconds: Number(form.timestampSeconds),
      type: form.type,
      prompt: form.prompt,
      options:
        form.type === 'short'
          ? []
          : form.options
              .filter((option) => option.text.trim())
              .map((option) => ({ text: option.text.trim(), isCorrect: option.isCorrect })),
      acceptedAnswers:
        form.type === 'short'
          ? form.acceptedAnswers
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
          : [],
    };
    save.mutate(payload);
  }

  function closeForm() {
    setForm(null);
    setFormError('');
  }

  return (
    <main>
      <Link to="/admin/videos">← Back to videos</Link>
      <div className="page-title">
        <div>
          <h1>Timestamp questions</h1>
          <p>Pause the video at a timestamp and ask a question, with an answer key for grading.</p>
        </div>
        {!form && <button onClick={() => setForm(blankForm())}>Add question</button>}
      </div>

      {form && (
        <form className="card form-grid" onSubmit={submit}>
          <h2 className="wide">{form.id ? 'Edit question' : 'New question'}</h2>
          <label>
            Timestamp (seconds)
            <input
              type="number"
              min="0"
              required
              value={form.timestampSeconds}
              onChange={(event) => setForm({ ...form, timestampSeconds: event.target.value })}
            />
          </label>
          <label>
            Type
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
              {QUESTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className="wide">
            Question
            <textarea
              required
              value={form.prompt}
              onChange={(event) => setForm({ ...form, prompt: event.target.value })}
            />
          </label>

          {form.type !== 'short' && (
            <div className="wide">
              <span className="options-label">
                Options (check the correct answer{form.type === 'multiple' ? '(s)' : ''})
              </span>
              {form.options.map((option, index) => (
                <div className="option-row" key={option.key}>
                  <input
                    type={form.type === 'multiple' ? 'checkbox' : 'radio'}
                    name="correct-option"
                    checked={option.isCorrect}
                    onChange={(event) =>
                      form.type === 'multiple'
                        ? updateOption(index, { isCorrect: event.target.checked })
                        : setSingleCorrectOption(index)
                    }
                    aria-label={`Option ${index + 1} is correct`}
                  />
                  <input
                    required
                    placeholder={`Option ${index + 1}`}
                    value={option.text}
                    onChange={(event) => updateOption(index, { text: event.target.value })}
                  />
                  <button
                    type="button"
                    className="secondary"
                    disabled={form.options.length <= 2}
                    onClick={() => removeOption(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" className="secondary" onClick={addOption}>
                Add option
              </button>
            </div>
          )}

          {form.type === 'short' && (
            <label className="wide">
              Accepted answers (one per line)
              <textarea
                required
                value={form.acceptedAnswers}
                onChange={(event) => setForm({ ...form, acceptedAnswers: event.target.value })}
              />
            </label>
          )}

          <div>
            <button disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save question'}</button>
            <button type="button" className="secondary" onClick={closeForm}>
              Cancel
            </button>
          </div>
          {formError && <p className="error wide">{formError}</p>}
        </form>
      )}

      <Status loading={query.isLoading} error={query.error} empty={!query.data?.length && 'No questions yet.'}>
        {query.data?.map((question) => (
          <article className="card row" key={question._id}>
            <div>
              <strong>
                {question.timestampSeconds}s · {QUESTION_TYPES.find((type) => type.value === question.type)?.label}
              </strong>
              <p>{question.prompt}</p>
            </div>
            <div className="actions">
              <button className="secondary" onClick={() => setForm(formFromQuestion(question))}>
                Edit
              </button>
              <button
                className="danger"
                disabled={remove.isPending}
                onClick={() => window.confirm('Delete this question?') && remove.mutate(question._id)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </Status>
    </main>
  );
}
