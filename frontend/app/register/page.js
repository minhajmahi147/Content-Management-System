"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

export default function Register() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    localStorage.removeItem("access");
    try {
      await api("/api/users/", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
      router.push("/login");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth">
      <form onSubmit={submit} className="card">
        <div className="brand"><span className="logo">CMS</span></div>
        <h1>Create an account</h1>
        <p className="muted subtitle">Join as a writer or an admin</p>
        <label>Username<input name="username" required autoFocus /></label>
        <label>Email<input name="email" type="email" required /></label>
        <label>Password<input name="password" type="password" required /></label>
        <label>Confirm password<input name="password_confirm" type="password" required /></label>
        <label>
          Role
          <select name="role" defaultValue="writer">
            <option value="writer">Content Writer</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        {error && <p className="error">{error}</p>}
        <button>Create account</button>
        <p className="muted footer">Already have an account? <Link href="/login">Log in</Link></p>
      </form>
    </div>
  );
}
