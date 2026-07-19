import React, { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { api } from "../api";

export default function Settings() {
  const [form, setForm] = useState({ smtp_host: "smtp.gmail.com", smtp_port: "587", smtp_email: "", smtp_password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [existing, setExisting] = useState(false);

  useEffect(() => {
    api.getSmtp()
      .then((cfg) => {
        setForm((f) => ({ ...f, smtp_host: cfg.smtp_host, smtp_port: cfg.smtp_port, smtp_email: cfg.smtp_email }));
        setExisting(true);
      })
      .catch(() => {});
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      await api.saveSmtp(form);
      setNotice("SMTP settings saved.");
      setExisting(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-medium mb-1">SMTP Settings</h1>
      <p className="text-sm text-slate-400 mb-6">
        Used to send and schedule emails on your behalf. For Gmail, use an{" "}
        <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-amber underline">
          app password
        </a>
        , not your normal password. Stored encrypted server-side.
      </p>

      {error && <div className="mb-4 text-sm bg-red-500/10 border border-red-500 text-red-400 rounded-lg px-3 py-2">{error}</div>}
      {notice && <div className="mb-4 text-sm bg-green-500/10 border border-green-500 text-green-400 rounded-lg px-3 py-2">{notice}</div>}

      <form onSubmit={handleSave} className="bg-surface border border-border rounded-2xl p-5">
        <Field label="SMTP host">
          <input className="mg-in" value={form.smtp_host} onChange={(e) => update("smtp_host", e.target.value)} required />
        </Field>
        <Field label="SMTP port">
          <input className="mg-in" value={form.smtp_port} onChange={(e) => update("smtp_port", e.target.value)} required />
        </Field>
        <Field label="Email">
          <input type="email" className="mg-in" value={form.smtp_email} onChange={(e) => update("smtp_email", e.target.value)} required />
        </Field>
        <Field label={existing ? "App password (leave blank to keep current)" : "App password"}>
          <input
            type="password"
            className="mg-in"
            value={form.smtp_password}
            onChange={(e) => update("smtp_password", e.target.value)}
            required={!existing}
          />
        </Field>
        <button type="submit" disabled={loading} className="bg-amber text-ink font-semibold rounded-lg px-4 py-2 flex items-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="block text-[11px] uppercase tracking-wide text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
