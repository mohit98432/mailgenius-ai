import React, { useEffect, useState } from "react";
import { Clock, X, Loader2 } from "lucide-react";
import { api } from "../api";

export default function Scheduled() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api.listScheduled();
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCancel(id) {
    setCancellingId(id);
    try {
      await api.cancelScheduled(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setCancellingId("");
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-medium mb-1">Scheduled Emails</h1>
      <p className="text-sm text-slate-400 mb-6">
        A background job checks every minute and sends anything due.
      </p>

      {error && <div className="mb-4 text-sm bg-red-500/10 border border-red-500 text-red-400 rounded-lg px-3 py-2">{error}</div>}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={14} className="animate-spin" /> Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-slate-500 text-sm italic">Nothing scheduled yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-surface border border-border rounded-xl p-4 flex justify-between items-start gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-amber mb-1">
                  <Clock size={12} />
                  {new Date(item.scheduled_for).toLocaleString()}
                </div>
                <div className="font-medium text-sm truncate">{item.subject}</div>
                <div className="text-xs text-slate-400 truncate">To: {item.recipient_email}</div>
                <div className="text-xs text-slate-500 mt-1 line-clamp-2">{item.body}</div>
              </div>
              <button
                onClick={() => handleCancel(item.id)}
                disabled={cancellingId === item.id}
                className="shrink-0 text-xs border border-border rounded-lg px-2.5 py-1.5 hover:border-red-500 hover:text-red-400 flex items-center gap-1"
              >
                {cancellingId === item.id ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
