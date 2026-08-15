import { useEffect, useRef, useState } from "react";
import { ArrowRight, Camera, Check, ImagePlus, Leaf, LoaderCircle, LockKeyhole, Plus, ShieldCheck, Trash2, Upload } from "lucide-react";
import { BrandMark } from "../components/BrandMark";
import { CameraDialog } from "../components/CameraDialog";
import { getSession, recognizeGuestImage } from "../services/authApi";
import "../styles/guest.css";

const EXAMPLE = ["яйца", "домати", "сирене", "спанак"];
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export function GuestPage({ onAuthenticated, onRegister, onLogin }) {
  const inputRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [status, setStatus] = useState("ready");
  const [error, setError] = useState("");

  useEffect(() => {
    getSession().then(({ user }) => { if (user) onAuthenticated(user); }).catch(() => {});
  }, [onAuthenticated]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function selectFile(selected) {
    if (!selected) return;
    if (!ALLOWED.has(selected.type)) return setError("Избери JPG, PNG или WebP изображение.");
    if (selected.size > MAX_BYTES) return setError("Снимката трябва да е по-малка от 10 MB.");
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected); setPreview(URL.createObjectURL(selected)); setIngredients([]); setStatus("ready"); setError("");
  }
  async function analyze() {
    if (!file) return;
    setStatus("loading"); setError("");
    try { const data = await recognizeGuestImage(file); setIngredients(data.ingredients || []); setStatus("result"); }
    catch (requestError) { setError(requestError.message); setStatus("error"); }
  }
  function showExample() { setIngredients(EXAMPLE.map((name) => ({ name, confidence: 0.9 }))); setStatus("example"); setError(""); }
  function addIngredient(event) {
    event.preventDefault();
    const name = newIngredient.trim();
    if (!name || ingredients.some((item) => item.name.toLowerCase() === name.toLowerCase())) return;
    setIngredients((current) => [...current, { name, confidence: null }]); setNewIngredient("");
  }
  const resultVisible = status === "result" || status === "example";

  return <main className="guest-page">
    <header className="guest-header"><BrandMark /><nav><button onClick={onLogin}>Вход</button><button className="guest-register" onClick={onRegister}>Създай профил</button></nav></header>
    <section className="guest-hero">
      <div className="guest-copy"><p className="home-eyebrow"><Leaf size={14} /> Първо опитай. После реши.</p><h1>От снимка до идея<br /><em>за вечеря.</em></h1><p>Покажи продуктите, които имаш. Ще ги разпознаем, без да искаме регистрация предварително.</p><div className="guest-trust"><span><Check size={15} /> 1 безплатна проба</span><span><ShieldCheck size={15} /> Снимката не се запазва</span></div></div>
      <section className="guest-workspace" aria-label="Безплатна проба">
        {resultVisible ? <div className="guest-result"><p className="guest-step">{status === "example" ? "ПРИМЕРЕН РЕЗУЛТАТ" : "РАЗПОЗНАТИ ПРОДУКТИ"}</p><h2>{ingredients.length ? "Ето какво открихме" : "Не открихме сигурни продукти"}</h2><p>{ingredients.length ? "AI може да пропусне или обърка продукт — коригирай списъка преди да продължиш." : "Добави продуктите ръчно или опитай отново с по-ясна и светла снимка."}</p><ul>{ingredients.map((item, index) => <li key={`${item.name}-${index}`}><span>{item.name}</span><button onClick={() => setIngredients((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Премахни ${item.name}`}><Trash2 size={14} /></button></li>)}</ul><form onSubmit={addIngredient}><label htmlFor="guest-ingredient">Липсващ продукт</label><div><input id="guest-ingredient" value={newIngredient} onChange={(event) => setNewIngredient(event.target.value)} maxLength="60" /><button aria-label="Добави продукт"><Plus size={17} /></button></div></form><section className="guest-value"><LockKeyhole size={20} /><div><strong>Искаш рецепти според твоята цел?</strong><p>Създай профил, за да запазим анализа и да персонализираме калориите и макросите.</p></div></section><button className="guest-primary" onClick={onRegister}>Създай профил и продължи <ArrowRight size={18} /></button></div> : <div className="guest-capture"><p className="guest-step">БЕЗ РЕГИСТРАЦИЯ</p><h2>Опитай с една снимка</h2>{preview ? <div className="guest-preview"><img src={preview} alt="Избрана снимка" /><button onClick={() => { URL.revokeObjectURL(preview); setPreview(""); setFile(null); }} aria-label="Премахни снимката"><Trash2 size={16} /></button></div> : <div className="guest-actions"><button onClick={() => setCameraOpen(true)}><Camera size={22} /><span><strong>Снимай</strong><small>Отвори камерата</small></span></button><button onClick={() => inputRef.current?.click()}><Upload size={22} /><span><strong>Качи снимка</strong><small>JPG, PNG или WebP</small></span></button></div>}<input ref={inputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { selectFile(event.target.files?.[0]); event.target.value = ""; }} aria-label="Качи снимка за безплатна проба" />{error && <div className="home-notice error" role="alert"><p>{error}</p></div>}{file && <button className="guest-primary" onClick={analyze} disabled={status === "loading"}>{status === "loading" ? <><LoaderCircle className="spin" size={18} /> Разпознаваме…</> : <>Разпознай продуктите <ArrowRight size={18} /></>}</button>}<button className="guest-example" onClick={showExample}><ImagePlus size={16} /> Или виж примерен резултат</button></div>}
      </section>
    </section>
    <CameraDialog open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={selectFile} />
  </main>;
}
