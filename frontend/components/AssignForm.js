export default function AssignForm({ writers, run }) {
  async function assign(e) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    const ok = await run("/api/contents/", { method: "POST", body: data }, `Assigned "${data.title}".`);
    if (ok) form.reset();
  }

  return (
    <form onSubmit={assign} className="card">
      <h2>Assign new content</h2>
      <p className="muted">Give a writer a new task. It will show up as "Not started" until they begin.</p>
      <label>
        Writer
        <select name="writter" required defaultValue="">
          <option value="" disabled>
            {writers.length ? "Select a writer" : "No writers on your team yet"}
          </option>
          {writers.map((w) => <option key={w.id} value={w.id}>{w.username}</option>)}
        </select>
      </label>
      {writers.length === 0 && <p className="hint">💡 Ask an admin to add writers to your team.</p>}
      <label>Title<input name="title" placeholder="e.g. Blog post about summer sale" required /></label>
      <label>Instructions<textarea name="content" placeholder="What should the writer produce?" required /></label>
      <button disabled={!writers.length}>Assign to writer</button>
    </form>
  );
}
