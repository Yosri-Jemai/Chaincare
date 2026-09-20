"use client";
import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;

    const onMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
    };

    function loop() {
      cx += (tx - cx) * 0.15;
      cy += (ty - cy) * 0.15;
      el.style.transform = `translate(${cx}px, ${cy}px)`;
      if (Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = 0;
      }
    }

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: -300,
        left: -300,
        width: 600,
        height: 600,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(99,102,241,0.08), transparent 60%)",
        pointerEvents: "none",
        zIndex: 0,
        willChange: "transform",
        mixBlendMode: "screen",
      }}
    />
  );
}