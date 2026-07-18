import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Leaf, LockKeyhole } from "lucide-react";
import { BrandMark } from "../components/BrandMark";
import { getSession, login, oauthUrl } from "../services/authApi";

export function LoginPage({ onAuthenticated, onGoToRegister }) {
  const [values, setValues] = useState({ email: "", password: "" });
  const [ready, setReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: "idle", message: "" });

  useEffect(() => {
    getSession().then(({ user }) => { if (user) onAuthenticated(user); })
      .catch(() => setStatus({ type: "error", message: "Няма връзка със сървъра. Опитай отново." }))
      .finally(() => setReady(true));
  }, [onAuthenticated]);

  async function submit(event) {
    event.preventDefault(); setStatus({ type: "loading", message: "Влизаме в профила ти…" });
    try { const result = await login(values); onAuthenticated(result.user); }
    catch (error) { setStatus({ type: "error", message: error.message }); }
  }
  if (!ready) return <main className="boot" aria-live="polite"><BrandMark /><span>Подготвяме FitFridge…</span></main>;
  return <main className="register-shell">
    <section className="story-panel" aria-label="За FitFridge"><BrandMark /><div className="story-content"><p className="eyebrow"><Leaf size={14} /> Добре дошъл отново</p><h1>Твоята кухня<br />те очаква.</h1><p className="story-copy">Влез, добави продуктите, които имаш, и продължи към нови идеи за хранене.</p></div><p className="privacy-note"><LockKeyhole size={16} /> Сесията ти е защитена и се съхранява сигурно.</p></section>
    <section className="form-panel"><div className="mobile-brand"><BrandMark /></div><div className="form-wrap">
      <header><p className="step">Вход</p><h2>Влез в профила си</h2><p>Продължи оттам, докъдето стигна.</p></header>
      <div className="social-grid"><a className="social-button" href={oauthUrl("google")}><span className="google-g" aria-hidden="true">G</span> Влез с Google</a></div>
      <div className="divider"><span>или с имейл</span></div>
      <form onSubmit={submit} noValidate>
        <label>Имейл<input name="email" type="email" autoComplete="email" required maxLength="254" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} placeholder="име@пример.бг" /></label>
        <div className="field-group"><label htmlFor="login-password">Парола</label><span className="password-field"><input id="login-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required maxLength="128" value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Скрий паролата" : "Покажи паролата"}>{showPassword ? <EyeOff /> : <Eye />}</button></span></div>
        {status.message && <p className={`notice ${status.type}`} role="alert">{status.message}</p>}
        <button className="primary-button" disabled={status.type === "loading"}>{status.type === "loading" ? "Влизане…" : <>Влез в профила си <ArrowRight size={18} /></>}</button>
      </form>
      <p className="signin">Нямаш профил? <button className="text-link-button" onClick={onGoToRegister}>Създай профил</button></p>
    </div></section>
  </main>;
}
