import { useRouter } from "next/navigation";

export default function Navbar({ user }) {
  const router = useRouter();

  function logout() {
    localStorage.removeItem("access");
    router.push("/login");
  }

  return (
    <header className="navbar">
      <div className="container">
        <div className="brand"><span className="logo">CMS</span> Content Manager</div>
        <div className="user">
          <span className="avatar">{user.username[0]}</span>
          <div>
            <strong>{user.username}</strong>
            <div className="muted">{user.role === "admin" ? "Admin" : "Content Writer"}</div>
          </div>
          <button className="ghost" onClick={logout}>Log out</button>
        </div>
      </div>
    </header>
  );
}
