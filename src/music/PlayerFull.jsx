import React, { useEffect, useRef, useState, memo } from "react";
import { getEngine } from "../audio/engine";

function PlayerFull({
  tracks,
  startIndex,
  onClose,
  insomnia = false,
  speed = 1,
  bass = 0,
  onSpeedChange,
  onBassChange
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const engine = useRef(getEngine()).current;
  const [index, setIndex] = useState(startIndex);
  const modes = ["spectrogram", "galaxy", "camera"];
  const [mode, setMode] = useState(modes[0]);

  // Appliquer vitesse et bass boost
  useEffect(() => { engine.setPlaybackRate(speed); }, [speed]);
  useEffect(() => { engine.setBassGain(bass); }, [bass]);

  // === Animation principale ===
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);

    // === Spectrogramme ===
    const specCanvas = document.createElement("canvas");
    const sctx = specCanvas.getContext("2d", { willReadFrequently: true });
    specCanvas.width = 768;
    specCanvas.height = 256;

    // === Galaxie interactive ===
    const particles = Array.from({ length: 320 }, () => ({
      r: Math.random() * 300,
      angle: Math.random() * Math.PI * 2,
      speed: 0.001 + Math.random() * 0.003
    }));
    let attractor = null;
    let galaxyTrail = [];

    function onDown(e) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      attractor = { x, y };
    }
    function onMove(e) {
      if (!attractor) return;
      const rect = canvas.getBoundingClientRect();
      attractor.x =
        (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      attractor.y =
        (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    }
    function onUp() {
      attractor = null;
    }

    wrap.addEventListener("mousedown", onDown);
    wrap.addEventListener("mousemove", onMove);
    wrap.addEventListener("mouseup", onUp);
    wrap.addEventListener("touchstart", onDown);
    wrap.addEventListener("touchmove", onMove);
    wrap.addEventListener("touchend", onUp);

    function draw() {
      requestAnimationFrame(draw);
      const an = engine.analyser;
      if (!an) return;
      const freq = new Uint8Array(an.frequencyBinCount);
      an.getByteFrequencyData(freq);
      ctx.fillStyle = insomnia ? "#000" : "#fff";
      ctx.fillRect(0, 0, w, h);

      const trebBand = freq.slice(200, 400);
      const treb = trebBand.reduce((a, b) => a + b, 0) / trebBand.length;

      if (mode === "spectrogram") {
        // === Spectrogramme scientifique ===
        const imgData = sctx.getImageData(1, 0, specCanvas.width - 1, specCanvas.height);
        sctx.putImageData(imgData, 0, 0);
        for (let y = 0; y < specCanvas.height; y++) {
          const fi = Math.floor((1 - y / specCanvas.height) * (freq.length - 1));
          const v = freq[fi] / 255;
          sctx.fillStyle = `hsl(${v * 270}, 100%, 50%)`;
          sctx.fillRect(specCanvas.width - 1, y, 1, 1);
        }
        ctx.drawImage(specCanvas, 0, 0, specCanvas.width, specCanvas.height, 0, 0, w, h);
      } 
      else if (mode === "galaxy") {
        // === Galaxie interactive ===
        ctx.fillStyle = insomnia ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
        ctx.fillRect(0, 0, w, h);

        const hue = 200 + (treb / 255) * 160;
        const bassBand = freq.slice(0, 60);
        const bassAvg = bassBand.reduce((a, b) => a + b, 0) / bassBand.length;
        const bassFactor = 1 + (bassAvg / 255) * 1.5;

        if (attractor) {
          galaxyTrail.push({
            x: attractor.x,
            y: attractor.y,
            r: Math.max(1, 18 * bassFactor),
            life: 1.0
          });
          if (galaxyTrail.length > 300) galaxyTrail.shift();
        } else {
          particles.forEach((p) => {
            p.angle += p.speed * 2;
            const r = p.r;
            const x = w / 2 + Math.cos(p.angle) * r;
            const y = h / 2 + Math.sin(p.angle) * r;
            ctx.fillStyle = `hsla(${hue},100%,60%,0.7)`;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
          });
        }

        galaxyTrail.forEach((p) => {
          const rad = Math.max(0.5, p.r);
          ctx.fillStyle = `hsla(${hue},100%,60%,${p.life * 0.9})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
          ctx.fill();
          p.life -= 0.02;
        });
        galaxyTrail = galaxyTrail.filter((p) => p.life > 0);
      } 
      else if (mode === "camera") {
        // === Caméra ===
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, w, h);
          const img = ctx.getImageData(0, 0, w, h);
          const d = img.data;
          for (let i = 0; i < d.length; i += 4) {
            const gray = (d[i] + d[i + 1] + d[i + 2]) / 3;
            if (insomnia) {
              const inv = 255 - gray; // négatif
              d[i] = d[i + 1] = d[i + 2] = inv;
            } else {
              const v = gray > 128 ? 230 : 30;
              d[i] = d[i + 1] = d[i + 2] = v;
            }
          }
          ctx.putImageData(img, 0, 0);
        } else {
          ctx.fillStyle = insomnia ? "#fff" : "#000";
          ctx.font = "18px monospace";
          ctx.fillText("Autorise la caméra pour le mode caméra", 20, 40);
        }
      }
    }

    draw();

    // === Gestion clavier / tactile ===
    const key = (e) => {
      if (e.code === "Space") { e.preventDefault(); engine.toggle(); }
      if (e.key === "b") setMode((m) => modes[(modes.indexOf(m) + 1) % modes.length]);
      if (e.key === "Escape") { engine.pause(); onClose && onClose(); }
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, tracks.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    const tap = () => {
      try { engine.play(); } catch (_) {}
      setMode((m) => modes[(modes.indexOf(m) + 1) % modes.length]);
    };
    window.addEventListener("keydown", key);
    window.addEventListener("touchstart", tap, { passive: true });

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", key);
      window.removeEventListener("touchstart", tap);
      wrap.removeEventListener("mousedown", onDown);
      wrap.removeEventListener("mousemove", onMove);
      wrap.removeEventListener("mouseup", onUp);
      wrap.removeEventListener("touchstart", onDown);
      wrap.removeEventListener("touchmove", onMove);
      wrap.removeEventListener("touchend", onUp);
    };
  }, [mode, insomnia, onClose, tracks.length]);

  // === Chargement audio ===
  useEffect(() => {
    setMode(modes[0]);
    engine.load(tracks[index].file);
    engine.setOnEnded(() => {
      let next = index + 1;
      while (next < tracks.length && !tracks[next].file) next++;
      if (next < tracks.length) setIndex(next);
      else onClose && onClose();
    });
  }, [index]);

  // === Caméra ===
  useEffect(() => {
    if (mode !== "camera") return;
    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    videoRef.current = video;
    navigator.mediaDevices
      ?.getUserMedia?.({ video: { facingMode: "user" } })
      .then((stream) => {
        video.srcObject = stream;
        video.play();
      })
      .catch(console.error);
    return () => {
      const tracks = video.srcObject?.getTracks?.();
      tracks && tracks.forEach((t) => t.stop());
    };
  }, [mode]);

  return (
    <div
      ref={wrapRef}
      className="player-wrap"
      style={{
        position: "fixed",
        inset: 0,
        background: insomnia ? "#000" : "#fff"
      }}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />

      {/* --- Haut --- */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: insomnia ? "#fff" : "#000"
        }}
      >
        <button
          onClick={() => { engine.pause(); onClose && onClose(); }}
          style={{
            position: "absolute",
            left: 10,
            background: "rgba(0,0,0,0.5)",
            color: "#fff",
            border: "none",
            padding: "6px 10px",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          ⬅ Retour
        </button>
        <div style={{ fontWeight: "bold", fontSize: 18 }}>
          {tracks[index]?.title || tracks[index]?.name || tracks[index]?.file}
        </div>
      </div>

      {/* --- Bas --- */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10
        }}
      >
        {/* Boutons de contrôle */}
        <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
          <button onClick={() => setIndex((i) => Math.max(i - 1, 0))}>⏮</button>
          <button onClick={() => engine.toggle()}>⏯</button>
          <button onClick={() => setIndex((i) => Math.min(i + 1, tracks.length - 1))}>⏭</button>
        </div>

        {/* Curseurs en ligne sous les boutons (insomnie uniquement) */}
        {insomnia && (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 20,
              background: "rgba(0,0,0,0.5)",
              padding: "8px 12px",
              borderRadius: "8px",
              color: "#fff"
            }}
          >
            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: 12 }}>
              vitesse/pitch
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.01"
                value={speed}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  clearTimeout(window._speedTimeout);
                  window._speedTimeout = setTimeout(() => onSpeedChange(val), 100);
                }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: 12 }}>
              bass boost (dB)
              <input
                type="range"
                min="-10"
                max="20"
                step="1"
                value={bass}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  clearTimeout(window._bassTimeout);
                  window._bassTimeout = setTimeout(() => onBassChange(val), 100);
                }}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

// 🧠 Empêche React de recharger le composant inutilement
export default memo(PlayerFull, (prev, next) => {
  return (
    prev.tracks === next.tracks &&
    prev.startIndex === next.startIndex &&
    prev.onClose === next.onClose &&
    prev.insomnia === next.insomnia
  );
});
