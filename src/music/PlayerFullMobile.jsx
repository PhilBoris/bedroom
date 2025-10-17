import React, { useEffect, useRef, useState } from "react";
import { getEngine } from "../audio/engine";

export default function PlayerFullMobile({
  tracks,
  startIndex,
  onClose,
  insomnia = false,
  speed = 1,
  bass = 0,
  onSpeedChange,
  onBassChange,
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const engine = useRef(getEngine()).current;

  const [index, setIndex] = useState(startIndex);
  const [mode, setMode] = useState("spectrogram");
  const [isPlaying, setIsPlaying] = useState(false);
  const modes = ["spectrogram", "galaxy", "camera"];

  // 🎵 Gestion fiable play/pause
  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        engine.pause();
        setIsPlaying(false);
      } else {
        await engine.play();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error("Erreur play/pause :", e);
    }
  };

  // Vitesse & bass
  useEffect(() => { engine.setPlaybackRate(speed); }, [speed]);
  useEffect(() => { engine.setBassGain(bass); }, [bass]);

  // === Canvas principal ===
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
      speed: 0.001 + Math.random() * 0.003,
    }));
    let attractor = null;
    let galaxyTrail = [];

    const onDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      attractor = { x, y };
    };
    const onMove = (e) => {
      if (!attractor) return;
      const rect = canvas.getBoundingClientRect();
      attractor.x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      attractor.y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    };
    const onUp = () => (attractor = null);

    wrap.addEventListener("mousedown", onDown);
    wrap.addEventListener("mousemove", onMove);
    wrap.addEventListener("mouseup", onUp);
    wrap.addEventListener("touchstart", onDown);
    wrap.addEventListener("touchmove", onMove);
    wrap.addEventListener("touchend", onUp);

    // === Animation ===
    function draw() {
      requestAnimationFrame(draw);
      const an = engine.analyser;
      if (!an) return;

      const freq = new Uint8Array(an.frequencyBinCount);
      an.getByteFrequencyData(freq);
      ctx.fillStyle = insomnia ? "#000" : "#fff";
      ctx.fillRect(0, 0, w, h);

      if (mode === "spectrogram") {
        const imgData = sctx.getImageData(1, 0, specCanvas.width - 1, specCanvas.height);
        sctx.putImageData(imgData, 0, 0);
        for (let y = 0; y < specCanvas.height; y++) {
          const fi = Math.floor((1 - y / specCanvas.height) * (freq.length - 1));
          const v = freq[fi] / 255;
          sctx.fillStyle = `hsl(${v * 270}, 100%, 50%)`;
          sctx.fillRect(specCanvas.width - 1, y, 1, 1);
        }
        ctx.drawImage(specCanvas, 0, 0, w, h);
      } else if (mode === "galaxy") {
        ctx.fillStyle = insomnia ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
        ctx.fillRect(0, 0, w, h);

        const trebBand = freq.slice(200, 400);
        const treb = trebBand.reduce((a, b) => a + b, 0) / trebBand.length;
        const hue = 200 + (treb / 255) * 160;

        if (attractor) {
          galaxyTrail.push({ x: attractor.x, y: attractor.y, r: 5, life: 1.0 });
          if (galaxyTrail.length > 300) galaxyTrail.shift();
        } else {
          particles.forEach((p) => {
            p.angle += p.speed * 2;
            const x = w / 2 + Math.cos(p.angle) * p.r;
            const y = h / 2 + Math.sin(p.angle) * p.r;
            ctx.fillStyle = `hsla(${hue},100%,60%,0.7)`;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
          });
        }

        galaxyTrail.forEach((p) => {
          ctx.fillStyle = `hsla(${hue},100%,60%,${p.life * 0.9})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          p.life -= 0.02;
        });
        galaxyTrail = galaxyTrail.filter((p) => p.life > 0);
      } else if (mode === "camera") {
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, w, h);
          const img = ctx.getImageData(0, 0, w, h);
          const d = img.data;
          for (let i = 0; i < d.length; i += 4) {
            const gray = (d[i] + d[i + 1] + d[i + 2]) / 3;
            d[i] = d[i + 1] = d[i + 2] = insomnia ? 255 - gray : gray > 128 ? 230 : 30;
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
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [mode, insomnia]);

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
    return () => video.srcObject?.getTracks?.().forEach((t) => t.stop());
  }, [mode]);

  // === Chargement audio ===
useEffect(() => {
  setMode("spectrogram");
  engine.load(tracks[index].file);
  setIsPlaying(true); // ✅ démarre en mode lecture active
  engine.play(); // ✅ lance le son automatiquement


    engine.setOnEnded(() => {
      setIsPlaying(false);
      let next = index + 1;
      while (next < tracks.length && !tracks[next].file) next++;
      if (next < tracks.length) setIndex(next);
      else onClose && onClose();
    });
  }, [index]);

  return (
    <div
      ref={wrapRef}
      style={{
        position: "fixed",
        inset: 0,
        background: insomnia ? "#000" : "#fff",
        color: insomnia ? "#fff" : "#000",
        fontFamily: "monospace",
      }}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", position: "absolute" }} />

      {/* --- HAUT --- */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => {
            engine.pause();
            onClose && onClose();
          }}
          style={{
            position: "absolute",
            left: 16,
            background: "none",
            border: "none",
            color: insomnia ? "#fff" : "#000",
            fontSize: 22,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          ←
        </button>
        <div style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>
          {tracks[index]?.title || tracks[index]?.name || tracks[index]?.file}
        </div>

        {/* bouton rond changer d’effet */}
        <button
          onClick={() => setMode((m) => modes[(modes.indexOf(m) + 1) % modes.length])}
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: insomnia ? "#2b2b2b" : "#d0d0d0",
            border: `2px solid ${insomnia ? "#8a8a8a" : "#333"}`,
            boxShadow: insomnia
              ? "inset 0 0 0 1px #000"
              : "inset 0 0 0 1px #fff",
            cursor: "pointer",
          }}
          title="Changer d’animation"
        />
      </div>

      {/* --- BAS --- */}
      <div
        style={{
          position: "absolute",
          bottom: 25,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <button onClick={() => setIndex((i) => Math.max(i - 1, 0))} style={btnStyle(insomnia)}>
            |◁
          </button>

          {/* 🟠 BOUTON SOUND-CLOUD STYLE */}
          <button
            onClick={handlePlayPause}
            style={{
              background: isPlaying ? "transparent" : (insomnia ? "#fff" : "#000"),
              color: isPlaying ? (insomnia ? "#fff" : "#000") : (insomnia ? "#000" : "#fff"),
              border: `1.5px solid ${insomnia ? "#fff" : "#000"}`,
              width: 60,
              height: 60,
              borderRadius: "50%",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
          >
            {isPlaying ? "▮▮" : "▶"}
          </button>

          <button onClick={() => setIndex((i) => Math.min(i + 1, tracks.length - 1))} style={btnStyle(insomnia)}>
            ▷|
          </button>
        </div>

        {/* Curseurs mode insomnie */}
        {insomnia && (
          <div
            style={{
              display: "flex",
              gap: 20,
              border: `1px dashed ${insomnia ? "#555" : "#ccc"}`,
              padding: "6px 10px",
              borderRadius: 6,
            }}
          >
            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: 11 }}>
              vitesse/pitch
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.01"
                value={speed}
                onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                style={{ width: 110, accentColor: insomnia ? "#fff" : "#000" }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: 11 }}>
              bass boost (dB)
              <input
                type="range"
                min="-10"
                max="20"
                step="1"
                value={bass}
                onChange={(e) => onBassChange(parseInt(e.target.value))}
                style={{ width: 110, accentColor: insomnia ? "#fff" : "#000" }}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

function btnStyle(insomnia) {
  return {
    background: "transparent",
    border: `1.5px solid ${insomnia ? "#fff" : "#000"}`,
    color: insomnia ? "#fff" : "#000",
    width: 50,
    height: 32,
    borderRadius: 3,
    cursor: "pointer",
    transition: "all 0.2s ease",
  };
}
