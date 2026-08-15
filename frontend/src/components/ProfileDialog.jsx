import { useEffect, useState } from "react";
import { Flame, LoaderCircle, Scale, Sparkles, X } from "lucide-react";
import { getProfile, saveProfile } from "../services/authApi";

const EMPTY = { sex: "female", age: "", heightCm: "", weightKg: "", activity: "moderate", goal: "maintain" };

export function ProfileDialog({ open, onClose }) {
  const [values, setValues] = useState(EMPTY);
  const [targets, setTargets] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setStatus("loading"); setError("");
    getProfile().then(({ profile }) => {
      if (profile) {
        const { targets: savedTargets, ...savedValues } = profile;
        setValues(savedValues); setTargets(savedTargets);
      } else { setValues(EMPTY); setTargets(null); }
      setStatus("ready");
    }).catch((requestError) => { setError(requestError.message); setStatus("error"); });
  }, [open]);

  function update(event) { setValues((current) => ({ ...current, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault(); setStatus("saving"); setError("");
    try {
      const { profile } = await saveProfile(values);
      const { targets: newTargets, ...savedValues } = profile;
      setValues(savedValues); setTargets(newTargets); setStatus("ready");
    } catch (requestError) { setError(requestError.message); setStatus("error"); }
  }

  if (!open) return null;
  return <div className="plans-backdrop" role="presentation">
    <section className="profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-title">
      <button className="plans-close" onClick={onClose} aria-label="Затвори"><X size={20} /></button>
      <span className="plans-kicker"><Sparkles size={15} /> Твоят хранителен ориентир</span>
      <h2 id="profile-title">Профил и цел</h2>
      <p>Въведи актуалните си данни. Ще изчислим ориентировъчна дневна цел, която можеш да обновиш по всяко време.</p>
      {status === "loading" ? <div className="admin-state"><LoaderCircle className="spin" size={20} /> Зареждане…</div> : <form className="profile-form" onSubmit={submit}>
        <fieldset><legend>Основни данни</legend><div className="profile-grid">
          <label>Пол<select name="sex" value={values.sex} onChange={update}><option value="female">Жена</option><option value="male">Мъж</option></select></label>
          <label>Години<input name="age" type="number" inputMode="numeric" min="18" max="80" required value={values.age} onChange={update} /></label>
          <label>Ръст <span>см</span><input name="heightCm" type="number" inputMode="decimal" min="120" max="230" step="0.1" required value={values.heightCm} onChange={update} /></label>
          <label>Тегло <span>кг</span><input name="weightKg" type="number" inputMode="decimal" min="35" max="300" step="0.1" required value={values.weightKg} onChange={update} /></label>
          <label className="wide">Активност<select name="activity" value={values.activity} onChange={update}><option value="low">Ниска · предимно седящо ежедневие</option><option value="moderate">Умерена · движение няколко пъти седмично</option><option value="high">Висока · активно ежедневие</option></select></label>
        </div></fieldset>
        <fieldset><legend>Твоята цел</legend><div className="goal-options">
          {[{ value: "lose", label: "Отслабване" }, { value: "gain", label: "Качване" }, { value: "maintain", label: "Поддържане" }].map((goal) => <label key={goal.value} className={values.goal === goal.value ? "selected" : ""}><input type="radio" name="goal" value={goal.value} checked={values.goal === goal.value} onChange={update} /><span>{goal.label}</span></label>)}
        </div></fieldset>
        {error && <div className="home-notice error" role="alert"><p>{error}</p></div>}
        <button className="profile-save" disabled={status === "saving"}>{status === "saving" ? <><LoaderCircle className="spin" size={18} /> Изчисляване…</> : "Запази и изчисли"}</button>
      </form>}
      {targets && <section className="nutrition-target" aria-live="polite"><header><span><Flame size={18} /></span><div><small>ДНЕВНА ЦЕЛ</small><strong>{targets.calories} kcal</strong></div></header><div><p><b>{targets.proteinGrams} g</b><span>протеин</span></p><p><b>{targets.fatGrams} g</b><span>мазнини</span></p></div><small><Scale size={14} /> Ориентировъчна оценка по Mifflin–St Jeor, не медицинска препоръка.</small></section>}
    </section>
  </div>;
}
