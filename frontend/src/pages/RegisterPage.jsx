import { useEffect, useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, Leaf, LockKeyhole } from "lucide-react";
import { BrandMark } from "../components/BrandMark.jsx";
import { getSession, oauthUrl, register } from "../services/authApi.js";

const initial = { displayName: "", email: "", password: "" };
const ignoreAuthentication = () => {};
const queryMessage = () => {
  const error = new URLSearchParams(window.location.search).get("error");
  if (error === "provider_unavailable") return "Този начин за регистрация още не е активиран.";
  if (error === "link_required") return "Този имейл вече има профил. Влез с първоначалния начин.";
  if (error === "provider_rejected") return "Google отхвърли заявката. Провери Client secret и точния redirect URI.";
  if (error === "oauth_session_expired") return "Заявката за Google е изтекла или вече е използвана. Започни отново.";
  if (error === "token_invalid") return "Google самоличността не можа да бъде потвърдена. Провери Client ID.";
  if (error) return "Регистрацията не завърши. Можеш да опиташ отново.";
  return "";
};

export function RegisterPage({ onAuthenticated = ignoreAuthentication }) {
  const [values, setValues] = useState(initial);
  const [ready, setReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: queryMessage() ? "error" : "idle", message: queryMessage() });

  useEffect(() => {
    getSession()
      .then(({ user }) => {
        if (user) {
          onAuthenticated(user);
        } else if (new URLSearchParams(window.location.search).get("success")) {
          setStatus({ type: "success", message: `Добре дошъл${user?.displayName ? `, ${user.displayName}` : ""}. Профилът ти е готов.` });
        }
      })
      .catch(() => setStatus({ type: "error", message: "Няма връзка със сървъра. Провери връзката и опитай пак." }))
      .finally(() => setReady(true));
  }, [onAuthenticated]);

  const update = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  async function submit(event) {
    event.preventDefault();
    if (values.password.length < 12) return setStatus({ type: "error", message: "Паролата трябва да е поне 12 знака." });
    setStatus({ type: "loading", message: "Създаваме профила ти…" });
    try {
      const result = await register(values);
      setStatus(result.user
        ? { type: "success", message: `Добре дошъл, ${result.user.displayName}. Профилът ти е готов.`, user: result.user }
        : { type: "success", message: "Заявката е приета. Ако адресът вече има профил, използвай вход." });
      setValues(initial);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  if (!ready) return <main className="boot" aria-live="polite"><BrandMark /><span>Подготвяме FitFridge…</span></main>;
  if (status.type === "success") return <main className="success-page">
    <section className="success-card">
      <span className="success-icon"><Check size={28} /></span><BrandMark />
      <p className="eyebrow">Всичко е готово</p>
      <h1>Твоята кухня,<br />с ново вдъхновение.</h1>
      <p>{status.message}</p>
      <button className="primary-button" onClick={() => status.user && onAuthenticated(status.user)}>Продължи към началото <ArrowRight size={18} /></button>
    </section>
  </main>;

  return <main className="register-shell">
    <section className="story-panel" aria-label="За FitFridge">
      <BrandMark />
      <div className="story-content">
        <p className="eyebrow"><Leaf size={14} /> По-малко разхищение. Повече вкус.</p>
        <h1>Добрата храна<br />започва с това,<br /><em>което вече имаш.</em></h1>
        <p className="story-copy">Снимай продуктите у дома и открий идеи, създадени точно за твоята кухня.</p>
      </div>
      <p className="privacy-note"><LockKeyhole size={16} /> Снимките и данните ти остават поверителни.</p>
    </section>

    <section className="form-panel">
      <div className="mobile-brand"><BrandMark /></div>
      <div className="form-wrap">
        <header><p className="step">01 · Създай профил</p><h2>Добре дошъл</h2><p>Нека започнем с най-лесното.</p></header>
        <div className="social-grid">
          <a className="social-button" href={oauthUrl("google")}><span className="google-g" aria-hidden="true">G</span> Google</a>
        </div>
        <div className="divider"><span>или с имейл</span></div>
        <form onSubmit={submit} noValidate>
          <label>Име<input name="displayName" autoComplete="name" minLength="2" maxLength="80" required value={values.displayName} onChange={update} placeholder="Как да те наричаме?" /></label>
          <label>Имейл<input name="email" type="email" autoComplete="email" maxLength="254" required value={values.email} onChange={update} placeholder="име@пример.бг" /></label>
          <div className="field-group"><label htmlFor="password">Парола</label>
            <span className="password-field"><input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength="12" maxLength="128" required value={values.password} onChange={update} placeholder="Поне 12 знака" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Скрий паролата" : "Покажи паролата"}>{showPassword ? <EyeOff /> : <Eye />}</button>
            </span>
          </div>
          <p className="password-hint">Използвай дълга и уникална фраза.</p>
          {status.message && <p className={`notice ${status.type}`} role="alert">{status.message}</p>}
          <button className="primary-button" disabled={status.type === "loading"}>{status.type === "loading" ? "Създаваме профила…" : <>Създай профил <ArrowRight size={18} /></>}</button>
        </form>
        <p className="terms">Продължавайки, приемаш <a href="/terms">условията</a> и <a href="/privacy">политиката за поверителност</a>.</p>
        <p className="signin">Вече имаш профил? <a href="/login">Влез</a></p>
      </div>
    </section>
  </main>;
}
