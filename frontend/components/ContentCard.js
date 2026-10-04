import { useState } from "react";
import { label } from "../lib/status";

export default function ContentCard({ c, isAdmin, writerName, run }) {
  const [text, setText] = useState(c.content);
  const [comment, setComment] = useState("");
  const url = `/api/contents/${c.id}/`;
  const editing = !isAdmin && c.status === "in_progress";

  async function sendFeedback(e) {
    e.preventDefault();
    if (await run("/api/feedbacks/", { method: "POST", body: { content: c.id, comment } })) setComment("");
  }

  return (
    <article className="card">
      <div className="row">
        <h3>{c.title}</h3>
        <span className={`status ${c.status}`}>{label(c.status)}</span>
      </div>
      <p className="muted">
        {isAdmin && <>Writer: <strong>{writerName(c.writter)}</strong> · </>}
        Updated {new Date(c.updated_at).toLocaleString()}
      </p>

      {editing ? (
        <textarea value={text} onChange={(e) => setText(e.target.value)} />
      ) : (
        <p className="content-body">{c.content}</p>
      )}

      {c.feedbacks.length > 0 && (
        <div className="feedbacks">
          <strong className="muted">Feedback</strong>
          {c.feedbacks.map((f) => (
            <p key={f.id} className="feedback">
              {f.comment} <span className="muted">· {new Date(f.created_at).toLocaleString()}</span>
            </p>
          ))}
        </div>
      )}

      {!isAdmin && c.status === "assigned" && (
        <div className="actions">
          <button onClick={() => run(`${url}set_in_progress/`)}>Start working</button>
        </div>
      )}
      {editing && (
        <div className="actions">
          <button className="ghost" onClick={() => run(url, { method: "PATCH", body: { content: text } })}>Save draft</button>
          <button onClick={() => run(`${url}submit_for_review/`)}>Submit for review</button>
        </div>
      )}
      {isAdmin && c.status === "pending_review" && (
        <form onSubmit={sendFeedback} className="actions">
          <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Feedback for the writer..." required />
          <button className="ghost">Request changes</button>
          <button type="button" className="success" onClick={() => run(`${url}approve/`)}>Approve</button>
        </form>
      )}
    </article>
  );
}
