import { useState } from "react";
import { STATUSES, ICONS, label, hint } from "../lib/status";

export default function ContentCard({ c, role, writerName, run }) {
  const [text, setText] = useState(c.content);
  const [comment, setComment] = useState("");
  const url = `/api/contents/${c.id}/`;
  const isManager = role === "manager";
  const editing = !isManager && c.status === "in_progress";

  async function sendFeedback(e) {
    e.preventDefault();
    const ok = await run("/api/feedbacks/", { method: "POST", body: { content: c.id, comment } }, `Sent "${c.title}" back to ${writerName(c.writter)}.`);
    if (ok) setComment("");
  }

  return (
    <article className={`card content-card ${c.status} ${isManager && c.status === "pending_review" ? "needs-action" : ""}`}>
      <dl className="fields">
        <dt>Content subject</dt><dd><strong>{c.title}</strong></dd>
        <dt>Current status</dt><dd><span className={`status ${c.status}`}>{ICONS[c.status]} {label(c.status, role)}</span></dd>
        {isManager && <><dt>Writer</dt><dd>👤 {writerName(c.writter)}</dd></>}
        <dt>Last updated</dt><dd>🕒 {new Date(c.updated_at).toLocaleString()}</dd>
      </dl>

      <ol className="steps">
        {STATUSES.map((s, i) => (
          <li key={s} className={i < STATUSES.indexOf(c.status) ? "done" : s === c.status ? "current" : ""}>{label(s, role)}</li>
        ))}
      </ol>

      <p className="hint">💡 {hint(c.status, role)}</p>

      <span className="field">Main content:</span>
      {editing ? (
        <textarea value={text} onChange={(e) => setText(e.target.value)} />
      ) : (
        <p className="content-body">{c.content}</p>
      )}

      {c.feedbacks.length > 0 && (
        <div className="feedbacks">
          <strong className="muted">{isManager ? "Feedback you sent" : "Feedback from your content manager"}</strong>
          {c.feedbacks.map((f) => (
            <p key={f.id} className="feedback">
              {f.comment} <span className="muted">· {new Date(f.created_at).toLocaleString()}</span>
            </p>
          ))}
        </div>
      )}

      {c.history.length > 0 && (
        <details className="history">
          <summary>🕘 History ({c.history.length})</summary>
          <ul>
            {c.history.map((h) => (
              <li key={h.id}>
                <strong>{h.changed_by ?? "Deleted user"}</strong> changed it to <span className={`status ${h.to_status}`}>{label(h.to_status, role)}</span>
                <span className="muted"> · {new Date(h.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {!isManager && c.status === "assigned" && (
        <div className="actions">
          <button onClick={() => run(`${url}set_in_progress/`, undefined, `Started "${c.title}".`)}>Start working</button>
        </div>
      )}
      {editing && (
        <div className="actions">
          <button className="ghost" onClick={() => run(url, { method: "PATCH", body: { content: text } }, "Draft saved.")}>Save draft</button>
          <button onClick={() => run(`${url}submit_for_review/`, undefined, `Submitted "${c.title}" for review.`)}>Submit for review</button>
        </div>
      )}
      {isManager && c.status === "pending_review" && (
        <form onSubmit={sendFeedback} className="actions">
          <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What should the writer change?" required />
          <button className="ghost">Send back with feedback</button>
          <button type="button" className="success" onClick={() => run(`${url}approve/`, undefined, `Approved "${c.title}".`)}>Approve</button>
        </form>
      )}
    </article>
  );
}
