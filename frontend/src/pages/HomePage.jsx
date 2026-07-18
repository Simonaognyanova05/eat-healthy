import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Leaf, LoaderCircle, LogOut, ShieldCheck, Trash2, Upload } from "lucide-react";
import { BrandMark } from "../components/BrandMark";
import { CameraDialog } from "../components/CameraDialog";
import { IngredientReview } from "../components/IngredientReview";
import { ConfirmedIngredients } from "../components/ConfirmedIngredients";
import { RecipeResults } from "../components/RecipeResults";
import { generateRecipes, logout, recognizeIngredients } from "../services/authApi";
import "../styles/home.css";
import "../styles/recognition.css";
import "../styles/recipes.css";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGES = 5;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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

  useEffect(() => { selectionsRef.current = selections; }, [selections]);
  useEffect(() => () => selectionsRef.current.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl)), []);

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
    setStatus("processing"); setError("");
    try {
      const data = await recognizeIngredients(selections.map(({ file }) => file));
      setResult(data); setIngredients(data.ingredients || []); setStatus("review");
    } catch (requestError) { setError(requestError.message); setStatus("error"); }
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

  return <main className="home-page">
    <header className="home-header"><BrandMark /><div className="home-account"><span>{user?.displayName || "Твоята кухня"}</span><button className="logout-button" onClick={handleLogout} disabled={loggingOut}><LogOut size={16} /> {loggingOut ? "Излизане…" : "Изход"}</button></div></header>
    {status === "review" ? <IngredientReview result={result} ingredients={ingredients} onChange={setIngredients} onRestart={restart} onConfirm={() => setStatus("confirmed")} /> : status === "confirmed" ? <ConfirmedIngredients ingredients={ingredients} onEdit={() => setStatus("review")} onGenerate={createRecipes} generating={recipeStatus === "loading"} error={recipeError} /> : status === "recipes" ? <RecipeResults recipes={recipes} onBack={() => setStatus("confirmed")} onRestart={restart} /> : <section className="capture-hero">
      <p className="home-eyebrow"><Leaf size={14} /> Започни с това, което имаш</p><h1>Какво има<br />в твоята кухня?</h1>
      <p className="home-intro">Покажи ни хладилника, шкафа или продуктите на масата. Ясната снимка помага да открием повече съставки.</p>
      <div className="capture-actions"><button className="capture-card capture-primary" onClick={() => setCameraOpen(true)} disabled={status === "processing" || selections.length >= MAX_IMAGES}><span className="capture-icon"><Camera size={30} /></span><span><strong>Снимай продуктите</strong><small>{selections.length ? "Добави още един кадър" : "Отвори камерата"}</small></span><span className="action-arrow">→</span></button><button className="capture-card" onClick={() => uploadInput.current?.click()} disabled={status === "processing" || selections.length >= MAX_IMAGES}><span className="capture-icon"><Upload size={28} /></span><span><strong>Качи снимки</strong><small>Избери до {MAX_IMAGES} изображения</small></span><span className="action-arrow">→</span></button></div>
      <input ref={uploadInput} className="visually-hidden" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={chooseImage} aria-label="Качи снимки от устройството" />
      {error && <div className="home-notice error" role="alert"><p>{error}</p>{status === "error" && <button onClick={analyze}>Опитай отново</button>}</div>}
      {selections.length > 0 && <section className="image-collection" aria-label="Избрани снимки"><header><div><ImagePlus size={18} /><strong>{selections.length} от {MAX_IMAGES} снимки</strong></div><span>AI ще обедини продуктите от всички кадри</span></header><div className="image-preview-grid">{selections.map((selection, index) => <article key={`${selection.file.name}-${selection.file.lastModified}-${index}`}><img src={selection.previewUrl} alt={`Избрана снимка ${index + 1}`} /><div><strong>{selection.file.name}</strong><small>{selection.source === "camera" ? "Камера" : "Устройство"}</small></div><button onClick={() => removeImage(index)} disabled={status === "processing"} aria-label={`Премахни снимка ${index + 1}`}><Trash2 size={16} /></button></article>)}</div><button className="analyze-button collection-analyze" onClick={analyze} disabled={status === "processing"}>{status === "processing" ? <><LoaderCircle className="spin" size={18} /> Анализираме {selections.length} снимки…</> : <>Разпознай от {selections.length === 1 ? "снимката" : "всички снимки"}</>}</button></section>}
      <p className="capture-privacy"><ShieldCheck size={16} /> Снимките се изпращат защитено само за разпознаване и не се запазват.</p>
    </section>}
    <CameraDialog open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={(file) => acceptImages([file], "camera")} />
  </main>;
}
