import React, { useRef, useEffect, useState } from "react";

export default function GameCanvas({ onFound, onInsomnia }) {
  const canvasRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const W = Math.min(800, window.innerWidth - 24);
    const H = Math.min(520, window.innerHeight - (isMobile ? 260 : 150)); // espace joystick
    canvas.width = W;
    canvas.height = H;

    const makeSprite = (src) => {
      const img = new Image();
      const state = { img, ready: false };
      img.onload = () => (state.ready = true);
      img.onerror = () => (state.ready = false);
      img.src = src;
      return state;
    };

    const playerSprite = makeSprite("/sprites/player.png");
    const bedSprite = makeSprite("/sprites/bed.png");
    const heartSprite = makeSprite("/sprites/heart.png");
    const ghostSprite = makeSprite("/sprites/ghost.png");

    const player = {
      x: 50,
      y: Math.max(60, H - 100),
      size: 32,
      speed: 2.5,
      lives: 3,
      invincibleUntil: 0,
    };

    const bed = { x: Math.random() * (W - 64), y: Math.random() * (H - 64), size: 48 };
    const rand = (a, b) => a + Math.random() * (b - a);
    let raindrops = [];
    let ghosts = Array.from({ length: 3 }, () => ({
      x: rand(0, W - 40),
      y: rand(0, H - 40),
      size: 40,
      dx: rand(-2, 2),
      dy: rand(-2, 2),
      nextTurn: Date.now() + rand(2000, 4000),
      wanderTimer: 0,
    }));

    const keys = {};
    const kd = (e) => (keys[e.key] = true);
    const ku = (e) => (keys[e.key] = false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    let rafId = null;
    let showMessage = false;
    let messageTimer = 0;
    let messageText = "";

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const spawnRain = () => {
      raindrops.push({
        x: Math.random() * W,
        y: -10,
        size: 4 + Math.random() * 4,
        speed: 1.3 + Math.random() * 2.2,
      });
    };

    function damagePlayer() {
      const now = Date.now();
      if (now < player.invincibleUntil) return;
      player.lives--;
      player.invincibleUntil = now + 2000;
      if (player.lives <= 0) {
        showMessage = true;
        messageText = "insomnie";
        messageTimer = now;
      }
    }

    function update() {
      if (!showMessage) {
        if (keys["ArrowUp"]) player.y -= player.speed;
        if (keys["ArrowDown"]) player.y += player.speed;
        if (keys["ArrowLeft"]) player.x -= player.speed;
        if (keys["ArrowRight"]) player.x += player.speed;

        player.x = clamp(player.x, 0, W - player.size);
        player.y = clamp(player.y, 0, H - player.size);

        if (Math.random() < 0.028) spawnRain();
        raindrops.forEach((r) => (r.y += r.speed));
        raindrops = raindrops.filter((r) => r.y < H + 20);

        raindrops.forEach((r) => {
          if (
            player.x < r.x + r.size &&
            player.x + player.size > r.x &&
            player.y < r.y + r.size &&
            player.y + player.size > r.y
          ) {
            r.y = H + 100;
            damagePlayer();
          }
        });

        const now = Date.now();
        ghosts.forEach((g) => {
          g.wanderTimer += 0.05;
          g.dx += Math.cos(g.wanderTimer) * 0.02 * (Math.random() > 0.5 ? 1 : -1);
          g.dy += Math.sin(g.wanderTimer) * 0.02 * (Math.random() > 0.5 ? 1 : -1);
          const spd = Math.hypot(g.dx, g.dy) || 1;
          const maxSpd = 2.8;
          if (spd > maxSpd) {
            g.dx = (g.dx / spd) * maxSpd;
            g.dy = (g.dy / spd) * maxSpd;
          }
          g.x += g.dx;
          g.y += g.dy;
          if (g.x < 0 || g.x > W - g.size) g.dx *= -1;
          if (g.y < 0 || g.y > H - g.size) g.dy *= -1;

          if (now > g.nextTurn) {
            const ang = rand(0, Math.PI * 2);
            const sp = rand(1.2, 2.6);
            g.dx = Math.cos(ang) * sp;
            g.dy = Math.sin(ang) * sp;
            g.nextTurn = now + rand(2000, 4000);
          }

          if (
            player.x < g.x + g.size &&
            player.x + player.size > g.x &&
            player.y < g.y + g.size &&
            player.y + player.size > g.y
          ) {
            damagePlayer();
            g.x = rand(0, W - g.size);
            g.y = rand(0, H - g.size);
          }
        });

        if (
          player.lives > 0 &&
          player.x < bed.x + bed.size &&
          player.x + player.size > bed.x &&
          player.y < bed.y + bed.size &&
          player.y + player.size > bed.y
        ) {
          onFound && onFound();
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, W, H);

      if (bedSprite.ready) ctx.drawImage(bedSprite.img, bed.x, bed.y, bed.size, bed.size);

      const now = Date.now();
      const invincible = now < player.invincibleUntil;
      const flicker = invincible && Math.floor(now / 200) % 2 === 0;
      if (!flicker && playerSprite.ready)
        ctx.drawImage(playerSprite.img, player.x, player.y, player.size, player.size);

      ctx.fillStyle = "blue";
      raindrops.forEach((r) => ctx.fillRect(r.x, r.y, r.size, r.size));

      ghosts.forEach((g) => {
        if (ghostSprite.ready) ctx.drawImage(ghostSprite.img, g.x, g.y, g.size, g.size);
      });

      for (let i = 0; i < 3; i++) {
        const x = 10 + i * 20,
          y = 10;
        if (heartSprite.ready) {
          ctx.globalAlpha = i < player.lives ? 1 : 0.25;
          ctx.drawImage(heartSprite.img, x, y, 16, 16);
          ctx.globalAlpha = 1;
        }
      }

      if (showMessage) {
        ctx.fillStyle = "#000";
        ctx.font = "28px monospace";
        ctx.textAlign = "center";
        ctx.fillText(messageText, W / 2, H / 2);
        if (Date.now() - messageTimer > 1500) onInsomnia && onInsomnia();
      }
    }

    const loop = () => {
      update();
      draw();
      rafId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, [onFound, onInsomnia, isMobile]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 800,
        margin: "0 auto",
        paddingBottom: isMobile ? "220px" : "0", // espace pour le pavé
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          margin: "0 auto",
        }}
      />
      {isMobile && <TouchControls />}
    </div>
  );
}

/* === Pavé directionnel centré sous le jeu === */
function TouchControls() {
  const [pressed, setPressed] = useState(null);

  const emit = (code, type) =>
    window.dispatchEvent(new KeyboardEvent(type, { key: code, code, bubbles: true }));

  const handleStart = (code) => {
    setPressed(code);
    emit(code, "keydown");
  };
  const handleEnd = (code) => {
    setPressed(null);
    emit(code, "keyup");
  };

  const btn = (code, label) => ({
    width: 60,
    height: 60,
    borderRadius: 10,
    background:
      pressed === code
        ? "linear-gradient(145deg,#777,#555)"
        : "linear-gradient(145deg,#ccc,#888)",
    border: "2px solid #333",
    color: "#111",
    fontWeight: "bold",
    fontSize: 26,
    textShadow: "0 1px 2px #fff",
    boxShadow:
      pressed === code
        ? "inset 0 2px 4px rgba(0,0,0,0.6)"
        : "0 3px 5px rgba(0,0,0,0.4)",
    transform: pressed === code ? "translateY(2px)" : "translateY(0)",
    touchAction: "none",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 10,
        left: "50%",
        transform: "translateX(-50%)",
        width: 220,
        height: 200,
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gridTemplateRows: "repeat(3, 1fr)",
        justifyItems: "center",
        alignItems: "center",
        zIndex: 5,
      }}
    >
      <div></div>
      <button
        style={btn("ArrowUp")}
        onTouchStart={() => handleStart("ArrowUp")}
        onTouchEnd={() => handleEnd("ArrowUp")}
      >
        ↑
      </button>
      <div></div>

      <button
        style={btn("ArrowLeft")}
        onTouchStart={() => handleStart("ArrowLeft")}
        onTouchEnd={() => handleEnd("ArrowLeft")}
      >
        ←
      </button>
      <div></div>
      <button
        style={btn("ArrowRight")}
        onTouchStart={() => handleStart("ArrowRight")}
        onTouchEnd={() => handleEnd("ArrowRight")}
      >
        →
      </button>

      <div></div>
      <button
        style={btn("ArrowDown")}
        onTouchStart={() => handleStart("ArrowDown")}
        onTouchEnd={() => handleEnd("ArrowDown")}
      >
        ↓
      </button>
    </div>
  );
}
