'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ensureStudioFontLink,
  STUDIO_FONT_LIBRARY,
  type StudioFontOption,
} from "@/lib/fonts/fontLibrary";

export type FloatingToolbarKind = 'text' | 'shape' | 'image';

export type FloatingToolbarState = {
  visible: boolean;
  kind: FloatingToolbarKind;
  left: number;
  top: number;
  fill: string;
  fontSize: number;
  fontFamily: string;
};

type FloatingObjectToolbarProps = {
  toolbar: FloatingToolbarState | null;
  onChangeFill: (value: string) => void;
  onChangeFontSize: (value: number) => void;
  onChangeFontFamily: (value: string) => void | Promise<void>;
  onDuplicate: () => void;
  onDelete: () => void;
};

export function FloatingObjectToolbar({
  toolbar,
  onChangeFill,
  onChangeFontSize,
  onChangeFontFamily,
  onDuplicate,
  onDelete,
}: FloatingObjectToolbarProps) {
  if (!toolbar?.visible) {
    return null;
  }

  return (
    <div
      className="absolute z-30 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/12 bg-slate-950/95 px-3 py-2 text-xs text-white shadow-[0_18px_44px_rgba(0,0,0,0.42)] backdrop-blur"
      style={{
        left: toolbar.left,
        top: toolbar.top,
      }}
    >
      {toolbar.kind !== 'image' ? (
        <label className="flex items-center gap-2">
          <span className="text-white/55">Color</span>
          <input
            type="color"
            value={toolbar.fill}
            onChange={(event) => onChangeFill(event.target.value)}
            className="h-7 w-8 cursor-pointer rounded border border-white/10 bg-transparent p-0"
          />
        </label>
      ) : null}

      {toolbar.kind === 'text' ? (
        <>
          <label className="flex items-center gap-2">
            <span className="text-white/55">Size</span>
            <input
              type="number"
              min={8}
              max={220}
              value={toolbar.fontSize}
              onChange={(event) => onChangeFontSize(Number(event.target.value))}
              className="h-8 w-16 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none"
            />
          </label>

          <FontPicker
            value={toolbar.fontFamily}
            onChange={onChangeFontFamily}
          />
        </>
      ) : null}

      <button
        type="button"
        onClick={onDuplicate}
        className="h-8 rounded-lg border border-white/10 bg-white/5 px-3 font-medium text-white/82 transition hover:bg-white/10"
      >
        Duplicate
      </button>

      <button
        type="button"
        onClick={onDelete}
        className="h-8 rounded-lg border border-red-400/30 bg-red-500/15 px-3 font-medium text-red-100 transition hover:bg-red-500/25"
      >
        Delete
      </button>
    </div>
  );
}

function FontPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void | Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const filteredFonts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return STUDIO_FONT_LIBRARY;
    }

    return STUDIO_FONT_LIBRARY.filter((font) => {
      const searchableText = `${font.family} ${font.category}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [query]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previewFonts = filteredFonts.slice(0, 12);
    for (const font of previewFonts) {
      ensureStudioFontLink(font.family);
    }
  }, [filteredFonts, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  const selectedFont =
    STUDIO_FONT_LIBRARY.find((font) => font.family === value) ?? filteredFonts[0];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-8 min-w-44 items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-900 px-3 text-white outline-none transition hover:border-white/20"
      >
        <span
          className="truncate text-left text-sm"
          style={{ fontFamily: `"${selectedFont?.family ?? value}", sans-serif` }}
        >
          {selectedFont?.family ?? value}
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/45">
          Font
        </span>
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-10 z-40 w-72 rounded-2xl border border-white/10 bg-slate-950/98 p-3 shadow-[0_24px_54px_rgba(0,0,0,0.52)] backdrop-blur">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search fonts"
            className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20"
          />

          <div className="mt-3 max-h-72 overflow-y-auto pr-1">
            {filteredFonts.length > 0 ? (
              <div className="grid gap-1.5">
                {filteredFonts.map((font) => (
                  <FontPickerOption
                    key={font.family}
                    font={font}
                    isSelected={font.family === value}
                    onSelect={async () => {
                      await onChange(font.family);
                      setIsOpen(false);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/3 px-3 py-4 text-sm text-white/55">
                No fonts match your search.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FontPickerOption({
  font,
  isSelected,
  onSelect,
}: {
  font: StudioFontOption;
  isSelected: boolean;
  onSelect: () => void | Promise<void>;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        void onSelect();
      }}
      className={[
        "w-full rounded-xl border px-3 py-2 text-left transition",
        isSelected
          ? "border-[var(--accent)]/60 bg-white/8"
          : "border-white/8 bg-white/[0.03] hover:border-white/16 hover:bg-white/[0.06]",
      ].join(" ")}
    >
      <div
        className="truncate text-sm text-white"
        style={{ fontFamily: `"${font.family}", sans-serif` }}
      >
        {font.family}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/40">
        {font.category}
      </div>
    </button>
  );
}
