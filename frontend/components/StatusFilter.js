import { STATUSES, ICONS, label } from "../lib/status";

export default function StatusFilter({ contents, filter, setFilter, role }) {
  return (
    <div className="stats">
      <button className={`stat ${filter === null ? "active" : ""}`} onClick={() => setFilter(null)}>
        <em>📚</em><strong>{contents.length}</strong><span>All content</span>
      </button>
      {STATUSES.map((s) => (
        <button key={s} className={`stat ${s} ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>
          <em>{ICONS[s]}</em><strong>{contents.filter((c) => c.status === s).length}</strong><span>{label(s, role)}</span>
        </button>
      ))}
    </div>
  );
}
