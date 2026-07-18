import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, ImagePlus, Leaf, LoaderCircle, LogOut, ShieldCheck, Upload } from "lucide-react";
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
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function HomePage({ user, onLoggedOut }) {
  const uploadInput = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selection, setSelection] = useState(null);
  const [status, setStatus] = useState("capture");
  const [result, setResult] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [recipeStatus, setRecipeStatus] = useState("idle");
  const [recipeError, setRecipeError] = useState("");

  useEffect(() => () => { if (selection?.previewUrl) URL.revokeObjectURL(selection.previewUrl); }, [selection]);

  function acceptImage(file, source) {
    if (!file) return;
    if (!ALLOWED_TYPES.has(file.type)) return setError("Избери JPG, PNG или WebP изображение.");
    if (file.size > MAX_IMAGE_SIZE) return setError("Снимката трябва да е по-малка от 10 MB.");
    setError(""); setResult(null); setIngredients([]); setStatus("capture");
    setSelection({ file, source, previewUrl: URL.createObjectURL(file) });
  }
  function chooseImage(event) { const file = event.target.files?.[0]; event.target.value = ""; acceptImage(file, "upload"); }
  async function analyze() {
    if (!selection?.file) return;
    setStatus("processing"); setError("");
    try {
      const data = await recognizeIngredients(selection.file);
      setResult(data); setIngredients(data.ingredients || []); setStatus("review");
    } catch (requestError) { setError(requestError.message); setStatus("error"); }
  }
  function restart() { setSelection(null); setResult(null); setIngredients([]); setRecipes([]); setRecipeStatus("idle"); setRecipeError(""); setError(""); setStatus("capture"); }
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
      <div className="capture-actions"><button className="capture-card capture-primary" onClick={() => setCameraOpen(true)} disabled={status === "processing"}><span className="capture-icon"><Camera size={30} /></span><span><strong>Снимай хладилника</strong><small>Отвори камерата</small></span><span className="action-arrow">→</span></button><button className="capture-card" onClick={() => uploadInput.current?.click()} disabled={status === "processing"}><span className="capture-icon"><Upload size={28} /></span><span><strong>Качи снимка</strong><small>Избери от устройството</small></span><span className="action-arrow">→</span></button></div>
      <input ref={uploadInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} aria-label="Качи снимка от устройството" />
      {error && <div className="home-notice error" role="alert"><p>{error}</p>{status === "error" && <button onClick={analyze}>Опитай отново</button>}</div>}
      {selection && <article className="image-selection"><img src={selection.previewUrl} alt="Преглед на избраната снимка" /><div><p><CheckCircle2 size={18} /> Снимката е избрана</p><strong>{selection.file.name}</strong><small>{selection.source === "camera" ? "Заснета с камерата" : "Качена от устройството"}</small></div><ImagePlus size={22} /><button className="analyze-button" onClick={analyze} disabled={status === "processing"}>{status === "processing" ? <><LoaderCircle className="spin" size={18} /> Разпознаваме продуктите…</> : "Разпознай продуктите"}</button></article>}
      <p className="capture-privacy"><ShieldCheck size={16} /> Снимката се изпраща защитено само за разпознаване и не се запазва.</p>
    </section>}
    <CameraDialog open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={(file) => acceptImage(file, "camera")} />
  </main>;
}
