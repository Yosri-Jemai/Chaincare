"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/donate",    label: "Donate" },
  { href: "/donations", label: "Donations" },
  { href: "/feed",      label: "Causes" },
  { href: "/ngo",       label: "NGO" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <nav className={`nav ${open ? "open" : ""}`}>
        <a href="/" className="nav-brand" aria-label="ChainCare">
          <img src="/chaincare.png" alt="ChainCare" className="nav-logo" />
        </a>

        <button
          type="button"
          className="nav-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>

        <div className="nav-links">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={pathname === l.href ? "active" : ""}
            >
              {l.label}
            </a>
          ))}
        </div>
      </nav>

      <div
        className={`nav-overlay ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
    </>
  );
}