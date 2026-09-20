"use client";
import { useEffect } from "react";

/**
 * Reveals any element with class "reveal" when it scrolls into view.
 * Pass deps (e.g. [ngos]) so the observer re-runs when async data loads.
 */
export function useReveal(deps = []) {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal:not(.in)");
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}