"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    localStorage.removeItem("access");
    try {
      const data = await api("/login/", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
      localStorage.setItem("access", data.tokens.access);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth">
      <form onSubmit={submit} className="card">
        <div className="brand"><span className="logo">CMS</span></div>
        <h1>Welcome back</h1>
        <p className="muted subtitle">Log in to manage your content</p>
        <label>Username<input name="username" required autoFocus /></label>
        <label>Password<input name="password" type="password" required /></label>
        {error && <p className="error">{error}</p>}
        <button>Log in</button>
        <p className="muted footer">No account? <Link href="/register">Create one</Link></p>
      </form>
    </div>
  );
}
