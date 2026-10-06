"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { STATUSES, COLUMNS, ICONS, label } from "../../lib/status";
import Navbar from "../../components/Navbar";
import StatusFilter from "../../components/StatusFilter";
import AssignForm from "../../components/AssignForm";
import ContentCard from "../../components/ContentCard";
import TeamPanel from "../../components/TeamPanel";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [contents, setContents] = useState([]);
  const [writers, setWriters] = useState([]);
  const [managers, setManagers] = useState([]);
  const [filter, setFilter] = useState(null);
  const [view, setView] = useState("list");
  const [dragged, setDragged] = useState(null);
  const [over, setOver] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const me = await api("/api/users/current/");
    setUser(me);
    if (me.role !== "writer") setWriters(await api("/api/users/writers/"));
    if (me.role === "admin") setManagers(await api("/api/users/managers/"));
    else setContents(await api("/api/contents/"));
  }

  async function run(path, options = { method: "POST" }, success = "") {
    setError("");
    setNotice("");
    try {
      await api(path, options);
      await load();
      setNotice(success);
      return true;
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (!localStorage.getItem("access")) return router.replace("/login");
    load().catch((err) => setError(err.message));
  }, []);

  if (!user) return <div className="container muted">{error || "Loading..."}</div>;

  if (user.role === "admin") {
    return (
      <>
        <Navbar user={user} />
        <main className="container">
          <div className="greeting">
            <h1>Hi, {user.username} 👋</h1>
            <p>Build each content manager's team by assigning writers to them.</p>
          </div>
          {error && <p className="error" style={{ marginBottom: "1rem" }}>{error}</p>}
          {notice && <p className="notice" style={{ marginBottom: "1rem" }}>{notice}</p>}
          <TeamPanel writers={writers} managers={managers} run={run} />
        </main>
      </>
    );
  }

  const isManager = user.role === "manager";
  const writerName = (id) => writers.find((w) => w.id === id)?.username ?? `#${id}`;
  const toReview = contents.filter((c) => c.status === "pending_review").length;
  const canDrag = (c) => isManager || c.status === "in_progress";
  const canDrop = (status) => dragged && dragged.status !== status && (isManager || status === "pending_review");

  function drop(status) {
    const c = dragged;
    setDragged(null);
    setOver(null);
    if (!canDrop(status)) return;
    if (isManager) run(`/api/contents/${c.id}/move/`, { method: "POST", body: { status } }, `Moved "${c.title}" to ${COLUMNS[status]}.`);
    else run(`/api/contents/${c.id}/submit_for_review/`, undefined, `Submitted "${c.title}" for review.`);
  }

  const visible = (filter ? contents.filter((c) => c.status === filter) : contents)
    .toSorted((a, b) => (b.status === "pending_review") - (a.status === "pending_review"));

  return (
    <>
      <Navbar user={user} view={view} setView={setView} />

      <main className={`container ${view === "kanban" ? "wide" : ""}`}>
        <div className="greeting">
          <h1>Hi, {user.username} 👋</h1>
          <p>
            {isManager
              ? toReview ? `${toReview} item${toReview > 1 ? "s" : ""} waiting for your review.` : "Nothing to review right now. Assign new work on the left."
              : "Here is the content assigned to you."}
          </p>
        </div>

        {view === "list" && <StatusFilter contents={contents} filter={filter} setFilter={setFilter} role={user.role} />}

        {error && <p className="error" style={{ marginBottom: "1rem" }}>{error}</p>}
        {notice && <p className="notice" style={{ marginBottom: "1rem" }}>{notice}</p>}

        {view === "list" ? (
          <div className={`layout ${isManager ? "with-sidebar" : ""}`}>
            {isManager && <AssignForm writers={writers} run={run} />}

            <section className="stack">
              {visible.length === 0 && (
                <div className="empty">{filter ? `Nothing in "${label(filter, user.role)}".` : isManager ? "No content yet. Use the form to assign your first task." : "No content assigned to you yet."}</div>
              )}
              {visible.map((c) => (
                <ContentCard key={c.id} c={c} role={user.role} writerName={writerName} run={run} />
              ))}
            </section>
          </div>
        ) : (
          <>
            <p className="muted" style={{ marginBottom: "1rem" }}>
              {isManager ? "Drag cards between columns to change their status. Switch to List view to assign new content." : "Drag a card from Writing to Review to submit it."}
            </p>

            <div className="board">
              {STATUSES.map((s) => {
                const cards = contents.filter((c) => c.status === s);
                return (
                  <section
                    key={s}
                    className={`column ${s} ${over === s && canDrop(s) ? "over" : ""}`}
                    onDragOver={(e) => { if (canDrop(s)) { e.preventDefault(); setOver(s); } }}
                    onDragLeave={() => setOver(null)}
                    onDrop={() => drop(s)}
                  >
                    <h2>{ICONS[s]} {COLUMNS[s]} <span className="muted">{cards.length}</span></h2>
                    {cards.map((c) => (
                      <div
                        key={c.id}
                        draggable={canDrag(c)}
                        onDragStart={() => setDragged(c)}
                        onDragEnd={() => { setDragged(null); setOver(null); }}
                      >
                        <ContentCard c={c} role={user.role} writerName={writerName} run={run} />
                      </div>
                    ))}
                  </section>
                );
              })}
            </div>
          </>
        )}
      </main>
    </>
  );
}
