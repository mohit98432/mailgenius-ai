import React, { useState } from "react";
import { Sparkles, Loader2, Copy, Check, Send, CalendarClock } from "lucide-react";
import { api } from "../api";

const TONES = ["Professional", "Friendly", "Formal", "Persuasive", "Sales", "Apology", "Thank You"];
const LENGTHS = ["Short", "Medium", "Long"];
const LANGUAGES = ["English", "Spanish", "French", "German", "Hindi", "Portuguese"];

export default function Compose() {
  const [form, setForm] = useState({
    recipient_name: "",
    recipient_company: "",
    purpose: "",
    tone: "Professional",
    length: "Medium",
    language: "English",
    extra_instructions: "",
  });
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleGenerate() {
    if (!form.purpose.trim() || loading) return;
    setLoading(true);
    setLoadingAction("generate");
    setError("");
    try {
      const res = await api.generate(form);
      setBody(res.body);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  }

  async function handleRewrite(action) {
    if (!body || loading) return;
    setLoading(true);
    setLoadingAction(action);
    setError("");
    try {
      const res = await api.rewrite({ body, action, language: form.language });
      setBody(res.body);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  }

  async function handleSubjects() {
    if (!body || loading) return;
    setLoading(true);
    setLoadingAction("subjects");
    setError("");
    try {
      const res = await api.subjects({ body });
      setSubjects(res.subjects);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  }

  async function handleSendNow() {
    if (!body || !recipientEmail || !subject) {
      setError("Recipient email, subject and body are all required to send.");
      return;
    }
    setLoading(true);
    setLoadingAction("send");
    setError("");
    setNotice("");
    try {
      await api.sendNow({ recipient_email: recipientEmail, subject, body });
      setNotice("Email sent.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  }

  async function handleScheduleSend() {
    if (!body || !recipientEmail || !subject || !scheduleAt) {
      setError("Recipient email, subject, body and a send time are required to schedule.");
      return;
    }
    setLoading(true);
    setLoadingAction("schedule");
    setError("");
    setNotice("");
    try {
      const iso = new Date(scheduleAt).toISOString();
      await api.schedule({ recipient_email: recipientEmail, subject, body, send_at: iso });
      setNotice("Email scheduled.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const rewriteBtns = [
    { key: "shorter", label: "Shorter" },
    { key: "longer", label: "Longer" },
    { key: "professional", label: "More Professional" },
    { key: "friendly", label: "More Friendly" },
    { key: "grammar", label: "Fix Grammar" },
    { key: "translate", label: `Translate → ${form.language}` },
  ];

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-2xl font-medium mb-1">Compose with AI</h1>
      <p className="text-sm text-slate-400 mb-6">Fill in the brief, generate, refine, then send or schedule.</p>

      {error && <div className="mb-4 text-sm bg-red-500/10 border border-red-500 text-red-400 rounded-lg px-3 py-2">{error}</div>}
      {notice && <div className="mb-4 text-sm bg-green-500/10 border border-green-500 text-green-400 rounded-lg px-3 py-2">{notice}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-2xl p-5">
          <Field label="Recipient name">
            <input className="mg-in" value={form.recipient_name} onChange={(e) => update("recipient_name", e.target.value)} />
          </Field>
          <Field label="Recipient company">
            <input className="mg-in" value={form.recipient_company} onChange={(e) => update("recipient_company", e.target.value)} />
          </Field>
          <Field label="Purpose *">
            <textarea className="mg-in min-h-[70px]" value={form.purpose} onChange={(e) => update("purpose", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tone">
              <select className="mg-in" value={form.tone} onChange={(e) => update("tone", e.target.value)}>
                {TONES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Length">
              <select className="mg-in" value={form.length} onChange={(e) => update("length", e.target.value)}>
                {LENGTHS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Language">
            <select className="mg-in" value={form.language} onChange={(e) => update("language", e.target.value)}>
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Extra instructions">
            <textarea className="mg-in min-h-[60px]" value={form.extra_instructions} onChange={(e) => update("extra_instructions", e.target.value)} />
          </Field>
          <button
            onClick={handleGenerate}
            disabled={!form.purpose.trim() || loading}
            className="w-full bg-amber text-ink font-semibold rounded-lg py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && loadingAction === "generate" ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Generate Email
          </button>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5">
          <Field label="Recipient email">
            <input type="email" className="mg-in" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="name@example.com" />
          </Field>
          <Field label="Subject">
            <input className="mg-in" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line" />
          </Field>
          {subjects.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {subjects.map((s, i) => (
                <button key={i} onClick={() => setSubject(s)} className="text-xs bg-surface2 border border-border rounded-full px-3 py-1 hover:border-amber hover:text-amber">
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="bg-surface2 border border-border rounded-lg p-4 min-h-[220px] whitespace-pre-wrap text-sm mb-3">
            {body || <span className="text-slate-500 italic">Your generated email will appear here.</span>}
          </div>

          {body && (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                {rewriteBtns.map((b) => (
                  <button
                    key={b.key}
                    onClick={() => handleRewrite(b.key)}
                    disabled={loading}
                    className="text-xs border border-border rounded-full px-3 py-1.5 hover:border-amber hover:text-amber disabled:opacity-40 flex items-center gap-1"
                  >
                    {loading && loadingAction === b.key ? <Loader2 size={11} className="animate-spin" /> : null}
                    {b.label}
                  </button>
                ))}
                <button onClick={handleSubjects} disabled={loading} className="text-xs border border-border rounded-full px-3 py-1.5 hover:border-amber hover:text-amber disabled:opacity-40">
                  Suggest subjects
                </button>
                <button onClick={handleCopy} className="text-xs border border-border rounded-full px-3 py-1.5 hover:border-amber hover:text-amber flex items-center gap-1">
                  {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="border-t border-border pt-3 flex flex-wrap items-center gap-2">
                <button onClick={handleSendNow} disabled={loading} className="bg-amber text-ink text-sm font-semibold rounded-lg px-4 py-2 flex items-center gap-2 disabled:opacity-50">
                  {loading && loadingAction === "send" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send now
                </button>
                <input
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                  className="mg-in !mb-0 w-auto"
                />
                <button onClick={handleScheduleSend} disabled={loading} className="border border-border text-sm rounded-lg px-4 py-2 flex items-center gap-2 hover:border-amber hover:text-amber disabled:opacity-50">
                  {loading && loadingAction === "schedule" ? <Loader2 size={14} className="animate-spin" /> : <CalendarClock size={14} />} Schedule
                </button>
              </div>
            </>
          )}
        </div>
      </div>
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
