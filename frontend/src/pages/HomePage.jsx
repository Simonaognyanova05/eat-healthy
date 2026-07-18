import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, ImagePlus, Leaf, LogOut, ShieldCheck, Upload } from "lucide-react";
import { BrandMark } from "../components/BrandMark";
import { CameraDialog } from "../components/CameraDialog";
import { logout } from "../services/authApi";
import "../styles/home.css";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function HomePage({ user, onLoggedOut }) {
  const uploadInput = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selection, setSelection] = useState(null);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => () => {
    if (selection?.previewUrl) URL.revokeObjectURL(selection.previewUrl);
  }, [selection]);

  function acceptImage(file, source) {
    if (!file) return;
    if (!ALLOWED_TYPES.has(file.type)) {
      setError("Избери JPG, PNG или WebP изображение.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Снимката трябва да е по-малка от 10 MB.");
      return;
    }
    setError("");
    setSelection({ file, source, previewUrl: URL.createObjectURL(file) });
  }

  function chooseImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    acceptImage(file, "upload");
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      onLoggedOut();
    } catch {
      setError("Не успяхме да излезем. Опитай отново.");
      setLoggingOut(false);
    }
  }

  return <main className="home-page">
    <header className="home-header">
      <BrandMark />
      <div className="home-account">
        <span>{user?.displayName || "Твоята кухня"}</span>
        <button className="logout-button" onClick={handleLogout} disabled={loggingOut}>
          <LogOut size={16} /> {loggingOut ? "Излизане…" : "Изход"}
        </button>
      </div>
    </header>

    <section className="capture-hero">
      <p className="home-eyebrow"><Leaf size={14} /> Започни с това, което имаш</p>
      <h1>Какво има<br />в твоята кухня?</h1>
      <p className="home-intro">Покажи ни хладилника, шкафа или продуктите на масата. Ясната снимка помага да открием повече съставки.</p>

      <div className="capture-actions">
        <button className="capture-card capture-primary" onClick={() => setCameraOpen(true)}>
          <span className="capture-icon"><Camera size={30} /></span>
          <span><strong>Снимай хладилника</strong><small>Отвори камерата</small></span>
          <span className="action-arrow" aria-hidden="true">→</span>
        </button>
        <button className="capture-card" onClick={() => uploadInput.current?.click()}>
          <span className="capture-icon"><Upload size={28} /></span>
          <span><strong>Качи снимка</strong><small>Избери от устройството</small></span>
          <span className="action-arrow" aria-hidden="true">→</span>
        </button>
      </div>

      <input ref={uploadInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} aria-label="Качи снимка от устройството" />

      {error && <p className="home-notice error" role="alert">{error}</p>}
      {selection && <article className="image-selection" aria-live="polite">
        <img src={selection.previewUrl} alt="Преглед на избраната снимка" />
        <div>
          <p><CheckCircle2 size={18} /> Снимката е избрана</p>
          <strong>{selection.file.name}</strong>
          <small>{selection.source === "camera" ? "Заснета с камерата" : "Качена от устройството"}</small>
        </div>
        <ImagePlus size={22} aria-hidden="true" />
      </article>}

      <p className="capture-privacy"><ShieldCheck size={16} /> Снимката още не се изпраща. Ще я обработим едва след твоето потвърждение.</p>
    </section>
    <CameraDialog open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={(file) => acceptImage(file, "camera")} />
  </main>;
}
