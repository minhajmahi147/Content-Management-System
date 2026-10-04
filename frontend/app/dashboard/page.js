"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { label } from "../../lib/status";
import Navbar from "../../components/Navbar";
import StatusFilter from "../../components/StatusFilter";
import AssignForm from "../../components/AssignForm";
import ContentCard from "../../components/ContentCard";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [contents, setContents] = useState([]);
  const [writers, setWriters] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [filter, setFilter] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    const me = await api("/api/users/current/");
    setUser(me);
    setContents(await api("/api/contents/"));
    if (me.role === "admin") {
      setWriters(await api("/api/users/writers/"));
      setUnassigned(await api("/api/users/unassigned_writers/"));
    }
  }

  async function run(path, options = { method: "POST" }) {
    setError("");
    try {
      await api(path, options);
      await load();
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

  const isAdmin = user.role === "admin";
  const writerName = (id) => writers.find((w) => w.id === id)?.username ?? `#${id}`;
  const visible = filter ? contents.filter((c) => c.status === filter) : contents;

  return (
    <>
      <Navbar user={user} />

      <main className="container">
        <div className="greeting">
          <h1>Hi, {user.username} 👋</h1>
          <p className="muted">{isAdmin ? "Assign work and review submissions from your writers." : "Here is the content assigned to you."}</p>
        </div>

        <StatusFilter contents={contents} filter={filter} setFilter={setFilter} />

        {error && <p className="error" style={{ marginBottom: "1rem" }}>{error}</p>}

        <div className={`layout ${isAdmin ? "with-sidebar" : ""}`}>
          {isAdmin && <AssignForm writers={writers} unassigned={unassigned} run={run} />}

          <section className="stack">
            {visible.length === 0 && (
              <div className="empty">{filter ? `No ${label(filter)} content.` : "No content yet."}</div>
            )}
            {visible.map((c) => (
              <ContentCard key={c.id} c={c} isAdmin={isAdmin} writerName={writerName} run={run} />
            ))}
          </section>
        </div>
      </main>
    </>
  );
}
