import { useEffect, useState } from "react";
import { Check, LoaderCircle, X } from "lucide-react";
import { decidePlanRequest, getAdminPlanRequests } from "../services/authApi";

export function AdminPlanRequests({ open, onClose }) {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [deciding, setDeciding] = useState("");

  useEffect(() => {
    if (!open) return;
    setStatus("loading"); setError("");
    getAdminPlanRequests()
      .then((data) => { setRequests(data.requests || []); setStatus("ready"); })
      .catch((requestError) => { setError(requestError.message); setStatus("error"); });
  }, [open]);

  async function decide(id, decision) {
    setDeciding(id); setError("");
    try {
      await decidePlanRequest(id, decision);
      setRequests((current) => current.filter((item) => item.id !== id));
    } catch (requestError) { setError(requestError.message); }
    finally { setDeciding(""); }
  }

  if (!open) return null;
  return <div className="plans-backdrop" role="presentation">
    <section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-title">
      <button className="plans-close" onClick={onClose} aria-label="Затвори"><X size={20} /></button>
      <span className="plans-kicker">Администрация</span>
      <h2 id="admin-title">Заявки за платен план</h2>
      <p>Одобрявай само след потвърдено плащане. Одобрението активира плана за един месец.</p>
      {status === "loading" && <div className="admin-state"><LoaderCircle className="spin" size={20} /> Зареждане…</div>}
      {error && <div className="home-notice error" role="alert"><p>{error}</p></div>}
      {status === "ready" && !requests.length && <div className="admin-state">Няма чакащи заявки.</div>}
      <div className="admin-request-list">{requests.map((item) => <article key={item.id}>
        <div><strong>{item.owner?.displayName || "Потребител"}</strong><span>{item.owner?.email}</span><small>{new Date(item.createdAt).toLocaleString("bg-BG")}</small></div>
        <p><b>{item.plan === "starter" ? "Starter" : "Pro"}</b><span>€{(item.priceCents / 100).toFixed(0)} / месец</span><small>Основание: {item.payment?.reference}</small></p>
        <div className="admin-actions"><button className="reject" onClick={() => decide(item.id, "rejected")} disabled={deciding === item.id}><X size={16} /> Откажи</button><button onClick={() => decide(item.id, "approved")} disabled={deciding === item.id}><Check size={16} /> Одобри</button></div>
      </article>)}</div>
    </section>
  </div>;
}
