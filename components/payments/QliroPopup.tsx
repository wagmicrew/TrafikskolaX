"use client";
import React from "react";

export default function QliroPopup({ url, open, onClose }: { url: string | null; open: boolean; onClose: () => void }) {
  if (!open || !url) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70">
      <div className="relative w-[95vw] max-w-3xl h-[85vh] rounded-2xl overflow-hidden border border-white/20 bg-slate-900 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
        >
          Stäng
        </button>
        <iframe src={url} className="w-full h-full bg-white" title="Qliro Checkout" />
      </div>
    </div>
  );
}


