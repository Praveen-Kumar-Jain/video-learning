export function Status({ error, loading, empty, children }) {
  if (loading) return <p className="state">Loading…</p>;
  if (error) return <p className="state error">{error.message || 'Something went wrong.'}</p>;
  if (empty) return <p className="state">{empty}</p>;
  return children;
}
