import { useRouter } from "next/navigation";

export default function Navbar({ user, view, setView }) {
  const router = useRouter();

  function logout() {
    localStorage.removeItem("access");
    router.push("/login");
  }

  return (
    <header className="navbar">
      <div className="container">
        <div className="brand"><span className="logo">CMS</span> Content Manager</div>
        {setView && (
          <div className="views">
            <button className={view === "list" ? "" : "ghost"} onClick={() => setView("list")}>☰ List</button>
            <button className={view === "kanban" ? "" : "ghost"} onClick={() => setView("kanban")}>▦ Kanban</button>
          </div>
        )}
        <div className="user">
          <span className="avatar">{user.username[0]}</span>
          <div>
            <strong>{user.username}</strong>
            <div className="muted">{{ admin: "Admin", manager: "Content Manager", writer: "Content Writer" }[user.role]}</div>
          </div>
          <button className="ghost" onClick={logout}>Log out</button>
        </div>
      </div>
    </header>
  );
}
