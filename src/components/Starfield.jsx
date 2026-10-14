import { useEffect, useRef } from "react";

export default function Starfield() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationId;
    let stars = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = Array.from({ length: 220 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.4 + 0.2,
        baseAlpha: Math.random() * 0.6 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.004,
        phase: Math.random() * Math.PI * 2,
        drift: Math.random() * 0.05 + 0.01,
        hue: Math.random() < 0.15 ? (Math.random() < 0.5 ? "purple" : "cyan") : "white",
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        s.phase += s.twinkleSpeed;
        s.y += s.drift;
        if (s.y > canvas.height) s.y = 0;
        const alpha = s.baseAlpha * (0.6 + 0.4 * Math.sin(s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        if (s.hue === "purple") ctx.fillStyle = `rgba(167, 139, 250, ${alpha})`;
        else if (s.hue === "cyan") ctx.fillStyle = `rgba(103, 232, 249, ${alpha})`;
        else ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      }
      animationId = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      />
      {/* Nebula glow blobs */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 20% 15%, rgba(124,58,237,0.14), transparent), radial-gradient(ellipse 50% 40% at 85% 80%, rgba(6,182,212,0.09), transparent), radial-gradient(ellipse 40% 35% at 70% 20%, rgba(124,58,237,0.07), transparent)",
        }}
      />
    </>
  );
}
