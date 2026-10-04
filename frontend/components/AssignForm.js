export default function AssignForm({ writers, unassigned, run }) {
  async function assign(e) {
    e.preventDefault();
    const form = e.target;
    const ok = await run("/api/users/assign_to_writer/", { method: "POST", body: Object.fromEntries(new FormData(form)) });
    if (ok) form.reset();
  }

  return (
    <form onSubmit={assign} className="card">
      <h2>Assign new content</h2>
      <label>
        Writer
        <select name="writer_id" required defaultValue="">
          <option value="" disabled>
            {writers.length + unassigned.length ? "Select a writer" : "No writers available"}
          </option>
          {writers.length > 0 && (
            <optgroup label="Your writers">
              {writers.map((w) => <option key={w.id} value={w.id}>{w.username}</option>)}
            </optgroup>
          )}
          {unassigned.length > 0 && (
            <optgroup label="Unassigned writers">
              {unassigned.map((w) => <option key={w.id} value={w.id}>{w.username}</option>)}
            </optgroup>
          )}
        </select>
      </label>
      <label>Title<input name="title" required /></label>
      <label>Brief<textarea name="content" placeholder="What should the writer produce?" required /></label>
      <button>Assign content</button>
    </form>
  );
}
