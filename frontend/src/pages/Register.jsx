import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { useAuth } from "../AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, fullName);
      navigate("/compose");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8">
        <div className="flex items-center gap-2 justify-center mb-6 text-xl font-semibold">
          <Mail className="text-amber" /> MailGenius
        </div>
        {error && (
          <div className="mb-4 text-sm bg-red-500/10 border border-red-500 text-red-400 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Full name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 mb-4 text-sm outline-amber"
        />
        <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 mb-4 text-sm outline-amber"
        />
        <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Password</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 mb-6 text-sm outline-amber"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber text-ink font-semibold rounded-lg py-2.5 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
        <p className="text-sm text-slate-400 mt-4 text-center">
          Already have an account? <Link to="/login" className="text-amber">Log in</Link>
        </p>
      </form>
    </div>
  );
}
