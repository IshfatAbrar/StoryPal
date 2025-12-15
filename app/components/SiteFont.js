"use client";

import { useState, useEffect } from "react";

export default function SiteFont() {
  const [pendingUiFont, setPendingUiFont] = useState("classic");
  const [fontAppliedAt, setFontAppliedAt] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("sp.uiFont") || "classic";
      setPendingUiFont(saved);
    }
  }, []);

  const handleApplyFont = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sp.uiFont", pendingUiFont);
      document.documentElement.setAttribute("data-ui-font", pendingUiFont);
      window.dispatchEvent(
        new CustomEvent("fontchange", { detail: pendingUiFont })
      );
      setFontAppliedAt(Date.now());
    }
  };

  return (
    <section className="mt-6 rounded-2xl bg-white/80 backdrop-blur p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900">Site Font</h2>
      </div>
      <p className="mt-1 text-sm text-zinc-600">
        Choose the font for both Parent and Child portals. Click Apply to
        confirm.
      </p>
      <div className="mt-3 flex flex-wrap gap-4">
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name="uiFont"
            checked={pendingUiFont === "classic"}
            onChange={() => setPendingUiFont("classic")}
          />
          <span className="text-sm">Epilogue (Classic)</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name="uiFont"
            checked={pendingUiFont === "hand"}
            onChange={() => setPendingUiFont("hand")}
          />
          <span className="text-sm">Shadows Into Light (Handwritten)</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name="uiFont"
            checked={pendingUiFont === "playful"}
            onChange={() => setPendingUiFont("playful")}
          />
          <span className="text-sm">Slackey (Playful)</span>
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleApplyFont}
          className="rounded-xl px-4 py-2 bg-blue-500 text-white hover:bg-blue-600"
        >
          Apply font
        </button>
        {fontAppliedAt ? (
          <span className="text-sm text-emerald-700">Applied</span>
        ) : null}
      </div>
      <div className="mt-4 rounded-xl border border-zinc-200 p-4 bg-white">
        <div className="text-sm text-zinc-500 mb-2">Preview</div>
        <div
          className="text-lg text-zinc-900"
          style={{
            fontFamily:
              pendingUiFont === "hand"
                ? "var(--font-shadows-into-light)"
                : pendingUiFont === "playful"
                ? "var(--font-slackey)"
                : "var(--font-epilogue)",
          }}
        >
          The quick brown fox jumps over the lazy dog.
        </div>
      </div>
    </section>
  );
}

