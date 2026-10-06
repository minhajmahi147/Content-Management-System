export default function TeamPanel({ writers, managers, run }) {
  const assign = (w, managerId) => {
    const manager = managers.find((m) => m.id === Number(managerId));
    run(`/api/users/${w.id}/assign_manager/`, { method: "POST", body: { manager_id: managerId || null } },
      manager ? `${w.username} now writes for ${manager.username}.` : `${w.username} is no longer on a team.`);
  };

  return (
    <section className="stack">
      <div className="card">
        <h2>Writers</h2>
        <p className="muted">Pick a content manager for each writer. Content managers can only give work to writers on their team.</p>
        {writers.length === 0 ? <div className="empty">No writers have signed up yet.</div> : (
          <dl className="fields">
            {writers.map((w) => (
              <div key={w.id} style={{ display: "contents" }}>
                <dt>✍️ {w.username} <span className="muted">· {w.assigned_contents_count} tasks</span></dt>
                <dd>
                  <select value={w.managed_by ?? ""} onChange={(e) => assign(w, e.target.value)}>
                    <option value="">No content manager</option>
                    {managers.map((m) => <option key={m.id} value={m.id}>{m.username}</option>)}
                  </select>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="card">
        <h2>Content managers</h2>
        {managers.length === 0 ? <div className="empty">No content managers have signed up yet.</div> : (
          <dl className="fields">
            {managers.map((m) => {
              const team = writers.filter((w) => w.managed_by === m.id);
              return (
                <div key={m.id} style={{ display: "contents" }}>
                  <dt>👤 {m.username}</dt>
                  <dd>{team.length ? team.map((w) => w.username).join(", ") : <span className="muted">No writers yet</span>}</dd>
                </div>
              );
            })}
          </dl>
        )}
      </div>
    </section>
  );
}
