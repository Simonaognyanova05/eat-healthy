import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, X } from "lucide-react";

export function CameraDialog({ open, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!open) return undefined;
    let active = true;

    async function startCamera() {
      setStatus("loading");
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unsupported");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("ready");
      } catch (error) {
        setStatus(error?.name === "NotAllowedError" ? "denied" : "unavailable");
      }
    }

    startCamera();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [open]);

  function takePhoto() {
    const video = videoRef.current;
    if (!video?.videoWidth || !video?.videoHeight) {
      setStatus("unavailable");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setStatus("unavailable");
        return;
      }
      const file = new File([blob], `fridge-${Date.now()}.jpg`, { type: "image/jpeg" });
      onCapture(file);
      onClose();
    }, "image/jpeg", 0.9);
  }

  if (!open) return null;
  const messages = {
    loading: "Включваме камерата…",
    denied: "Достъпът до камерата е отказан. Разреши го от настройките на браузъра и опитай отново.",
    unsupported: "Този браузър не поддържа директно заснемане. Използвай „Качи снимка“.",
    unavailable: "Камерата не е достъпна или се използва от друго приложение."
  };

  return <div className="camera-overlay" role="dialog" aria-modal="true" aria-labelledby="camera-title">
    <section className="camera-dialog">
      <header>
        <div><p>Камера</p><h2 id="camera-title">Снимай продуктите</h2></div>
        <button className="camera-close" onClick={onClose} aria-label="Затвори камерата"><X /></button>
      </header>
      <div className="camera-stage">
        <video ref={videoRef} playsInline muted aria-label="Преглед от камерата" />
        {status !== "ready" && <div className="camera-state" role="status">
          {status === "loading" ? <Camera className="camera-pulse" /> : <RotateCcw />}
          <p>{messages[status]}</p>
        </div>}
        <span className="camera-guide" aria-hidden="true" />
      </div>
      <footer>
        <p>Дръж камерата стабилно и включи целия рафт в кадъра.</p>
        <button className="shutter-button" onClick={takePhoto} disabled={status !== "ready"}>
          <span aria-hidden="true" /> Заснеми
        </button>
      </footer>
    </section>
  </div>;
}
