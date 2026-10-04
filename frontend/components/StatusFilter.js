import { STATUSES, label } from "../lib/status";

export default function StatusFilter({ contents, filter, setFilter }) {
  return (
    <div className="stats">
      <button className={`stat ${filter === null ? "active" : ""}`} onClick={() => setFilter(null)}>
        <strong>{contents.length}</strong><span>All content</span>
      </button>
      {STATUSES.map((s) => (
        <button key={s} className={`stat ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>
          <strong>{contents.filter((c) => c.status === s).length}</strong><span>{label(s)}</span>
        </button>
      ))}
    </div>
  );
}
