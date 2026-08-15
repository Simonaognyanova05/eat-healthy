import { useEffect, useRef, useState } from "react";
import { Camera, Crown, ImagePlus, Leaf, LoaderCircle, LogOut, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { BrandMark } from "../components/BrandMark";
import { CameraDialog } from "../components/CameraDialog";
import { IngredientReview } from "../components/IngredientReview";
import { ConfirmedIngredients } from "../components/ConfirmedIngredients";
import { RecipeResults } from "../components/RecipeResults";
import { AdminPlanRequests } from "../components/AdminPlanRequests";
import { createPlanRequest, generateRecipes, getMyPlanRequest, getRecognitionUsage, logout, recognizeIngredients } from "../services/authApi";
import "../styles/home.css";
import "../styles/recognition.css";
import "../styles/recipes.css";
import "../styles/entitlements.css";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGES = 5;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PLAN_NAMES = { free: "Free", starter: "Starter", pro: "Pro" };

export function HomePage({ user, onLoggedOut }) {
  const uploadInput = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selections, setSelections] = useState([]);
  const selectionsRef = useRef([]);
  const [status, setStatus] = useState("capture");
  const [result, setResult] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [recipeStatus, setRecipeStatus] = useState("idle");
  const [recipeError, setRecipeError] = useState("");
  const [usage, setUsage] = useState(null);
  const [plansOpen, setPlansOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [planRequest, setPlanRequest] = useState(null);
  const [requestingPlan, setRequestingPlan] = useState("");

  useEffect(() => { selectionsRef.current = selections; }, [selections]);
  useEffect(() => () => selectionsRef.current.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl)), []);
  useEffect(() => {
    let active = true;
    getRecognitionUsage().then((data) => { if (active) setUsage(data); }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    getMyPlanRequest().then((data) => { if (active) setPlanRequest(data.request); }).catch(() => {});
    return () => { active = false; };
  }, []);

  function acceptImages(files, source) {
    const incoming = Array.from(files || []);
    if (!incoming.length) return;
    if (selections.length + incoming.length > MAX_IMAGES) return setError(`Можеш да добавиш най-много ${MAX_IMAGES} снимки.`);
    if (incoming.some((file) => !ALLOWED_TYPES.has(file.type))) return setError("Избери само JPG, PNG или WebP изображения.");
    if (incoming.some((file) => file.size > MAX_IMAGE_SIZE)) return setError("Всяка снимка трябва да е по-малка от 10 MB.");
    setError(""); setResult(null); setIngredients([]); setStatus("capture");
    setSelections((current) => [...current, ...incoming.map((file) => ({ file, source, previewUrl: URL.createObjectURL(file) }))]);
  }
  function chooseImage(event) { const files = Array.from(event.target.files || []); event.target.value = ""; acceptImages(files, "upload"); }
  function removeImage(index) {
    setSelections((current) => { URL.revokeObjectURL(current[index].previewUrl); return current.filter((_, itemIndex) => itemIndex !== index); });
  }
  async function analyze() {
    if (!selections.length) return;
    if (usage && selections.length > usage.remaining) {
      setError(`Остават ти ${usage.remaining} снимки от месечната квота.`);
      setPlansOpen(true);
      return;
    }
    setStatus("processing"); setError("");
    try {
      const data = await recognizeIngredients(selections.map(({ file }) => file));
      setUsage(data.usage || usage); setResult(data); setIngredients(data.ingredients || []); setStatus("review");
    } catch (requestError) {
      if (requestError.code === "MONTHLY_IMAGE_LIMIT") {
        setUsage(requestError.details?.usage || usage); setPlansOpen(true); setStatus("capture");
      } else { setError(requestError.message); setStatus("error"); }
    }
  }
  function restart() { selections.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl)); setSelections([]); setResult(null); setIngredients([]); setRecipes([]); setRecipeStatus("idle"); setRecipeError(""); setError(""); setStatus("capture"); }
  async function createRecipes() {
    setRecipeStatus("loading"); setRecipeError("");
    try { const data = await generateRecipes(ingredients); setRecipes(data.recipes || []); setRecipeStatus("success"); setStatus("recipes"); }
    catch (requestError) { setRecipeStatus("error"); setRecipeError(requestError.message); }
  }
  async function handleLogout() {
    setLoggingOut(true);
    try { await logout(); onLoggedOut(); }
    catch { setError("Не успяхме да излезем. Опитай отново."); setLoggingOut(false); }
  }
  async function requestPlan(plan) {
    setRequestingPlan(plan); setError("");
    try {
      const data = await createPlanRequest(plan);
      setPlanRequest(data.request);
    } catch (requestError) { setError(requestError.message); }
    finally { setRequestingPlan(""); }
  }

  return <main className="home-page">
    <header className="home-header"><BrandMark /><div className="home-account"><span>{user?.displayName || "Твоята кухня"}</span>{user?.role === "admin" && <button className="admin-link" onClick={() => setAdminOpen(true)}><ShieldCheck size={16} /> Заявки</button>}<button className="logout-button" onClick={handleLogout} disabled={loggingOut}><LogOut size={16} /> {loggingOut ? "Излизане…" : "Изход"}</button></div></header>
    {status === "review" ? <IngredientReview result={result} ingredients={ingredients} onChange={setIngredients} onRestart={restart} onConfirm={() => setStatus("confirmed")} /> : status === "confirmed" ? <ConfirmedIngredients ingredients={ingredients} onEdit={() => setStatus("review")} onGenerate={createRecipes} generating={recipeStatus === "loading"} error={recipeError} /> : status === "recipes" ? <RecipeResults recipes={recipes} onBack={() => setStatus("confirmed")} onRestart={restart} /> : <section className="capture-hero">
      <p className="home-eyebrow"><Leaf size={14} /> Започни с това, което имаш</p><h1>Какво има<br />в твоята кухня?</h1>
      <p className="home-intro">Покажи ни хладилника, шкафа или продуктите на масата. Ясната снимка помага да открием повече съставки.</p>
      {usage && <div className={`usage-card ${usage.plan !== "free" ? "is-pro" : ""}`}>
        <div><span className="usage-icon">{usage.plan !== "free" ? <Crown size={18} /> : <Leaf size={18} />}</span><p><strong>Eat Healthy {PLAN_NAMES[usage.plan]}</strong><small>{usage.remaining} от {usage.limit} снимки остават този месец</small></p></div>
        {usage.plan === "free" && <button onClick={() => setPlansOpen(true)}>Виж плановете</button>}
      </div>}
      <div className="capture-actions"><button className="capture-card capture-primary" onClick={() => setCameraOpen(true)} disabled={status === "processing" || selections.length >= MAX_IMAGES}><span className="capture-icon"><Camera size={30} /></span><span><strong>Снимай продуктите</strong><small>{selections.length ? "Добави още един кадър" : "Отвори камерата"}</small></span><span className="action-arrow">→</span></button><button className="capture-card" onClick={() => uploadInput.current?.click()} disabled={status === "processing" || selections.length >= MAX_IMAGES}><span className="capture-icon"><Upload size={28} /></span><span><strong>Качи снимки</strong><small>Избери до {MAX_IMAGES} изображения</small></span><span className="action-arrow">→</span></button></div>
      <input ref={uploadInput} className="visually-hidden" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={chooseImage} aria-label="Качи снимки от устройството" />
      {error && <div className="home-notice error" role="alert"><p>{error}</p>{status === "error" && <button onClick={analyze}>Опитай отново</button>}</div>}
      {selections.length > 0 && <section className="image-collection" aria-label="Избрани снимки"><header><div><ImagePlus size={18} /><strong>{selections.length} от {MAX_IMAGES} снимки</strong></div><span>AI ще обедини продуктите от всички кадри</span></header><div className="image-preview-grid">{selections.map((selection, index) => <article key={`${selection.file.name}-${selection.file.lastModified}-${index}`}><img src={selection.previewUrl} alt={`Избрана снимка ${index + 1}`} /><div><strong>{selection.file.name}</strong><small>{selection.source === "camera" ? "Камера" : "Устройство"}</small></div><button onClick={() => removeImage(index)} disabled={status === "processing"} aria-label={`Премахни снимка ${index + 1}`}><Trash2 size={16} /></button></article>)}</div><button className="analyze-button collection-analyze" onClick={analyze} disabled={status === "processing"}>{status === "processing" ? <><LoaderCircle className="spin" size={18} /> Анализираме {selections.length} снимки…</> : usage?.remaining === 0 ? <>Дневният лимит е достигнат</> : <>Разпознай от {selections.length === 1 ? "снимката" : "всички снимки"}</>}</button></section>}
      <p className="capture-privacy"><ShieldCheck size={16} /> Снимките се изпращат защитено само за разпознаване и не се запазват.</p>
    </section>}
    <CameraDialog open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={(file) => acceptImages([file], "camera")} />
    {plansOpen && <div className="plans-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPlansOpen(false); }}>
      <section className="plans-dialog" role="dialog" aria-modal="true" aria-labelledby="plans-title">
        <button className="plans-close" onClick={() => setPlansOpen(false)} aria-label="Затвори"><X size={20} /></button>
        <span className="plans-kicker"><Crown size={16} /> Eat Healthy Pro</span>
        <h2 id="plans-title">Избери своя ритъм</h2>
        <p>Във всеки план можеш да изпратиш до 5 снимки наведнъж. Квотата се обновява в началото на всеки календарен месец.</p>
        <div className="plan-comparison">
          <article><small>FREE</small><strong>€0 <em>/ месец</em></strong><b>50 снимки / месец</b><span>За да опознаеш Eat Healthy.</span></article>
          <article><small>STARTER</small><strong>€15 <em>/ месец</em></strong><b>200 снимки / месец</b><span>За редовно планиране у дома.</span><button onClick={() => requestPlan("starter")} disabled={Boolean(requestingPlan) || planRequest?.status === "pending"}>{requestingPlan === "starter" ? "Изпращане…" : planRequest?.status === "pending" ? "Заявката чака" : "Заяви Starter"}</button></article>
          <article className="featured"><small>PRO</small><strong>€49 <em>/ месец</em></strong><b>1000 снимки / месец</b><span>За активно ежедневно използване.</span><button onClick={() => requestPlan("pro")} disabled={Boolean(requestingPlan) || planRequest?.status === "pending"}>{requestingPlan === "pro" ? "Изпращане…" : planRequest?.status === "pending" ? "Заявката чака" : "Заяви Pro"}</button></article>
        </div>
        {planRequest?.status === "pending" && <div className="plan-request-status" role="status">Заявката за {PLAN_NAMES[planRequest.plan]} е изпратена до администратора.</div>}
        <small className="plans-note">Заявката не извършва автоматично плащане. Планът се активира след ръчно одобрение.</small>
      </section>
    </div>}
    <AdminPlanRequests open={adminOpen} onClose={() => setAdminOpen(false)} />
  </main>;
}
