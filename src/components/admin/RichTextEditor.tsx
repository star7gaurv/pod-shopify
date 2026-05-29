"use client";

import { useEffect, useRef, useState } from "react";

type RichTextEditorProps = {
  name: string;
  label: string;
  value: string;
  placeholder?: string;
  helpText?: string;
  onChange: (value: string) => void;
};

type ToolbarAction =
  | { label: string; type: "command"; command: "bold" | "italic" | "underline" | "insertUnorderedList" | "insertOrderedList" | "formatBlock"; value?: string }
  | { label: string; type: "link" }
  | { label: string; type: "source" };

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { label: "Bold", type: "command", command: "bold" },
  { label: "Italic", type: "command", command: "italic" },
  { label: "Underline", type: "command", command: "underline" },
  { label: "Paragraph", type: "command", command: "formatBlock", value: "<p>" },
  { label: "H2", type: "command", command: "formatBlock", value: "<h2>" },
  { label: "Bullet List", type: "command", command: "insertUnorderedList" },
  { label: "Numbered List", type: "command", command: "insertOrderedList" },
  { label: "Link", type: "link" },
  { label: "HTML", type: "source" },
];

export function RichTextEditor({
  name,
  label,
  value,
  placeholder,
  helpText,
  onChange,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [isSourceMode, setIsSourceMode] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || isSourceMode) {
      return;
    }

    if (editor.innerHTML !== value) {
      editor.innerHTML = value;
    }
  }, [isSourceMode, value]);

  return (
    <label className="block md:col-span-2">
      <span className="text-sm text-white/78">{label}</span>
      {helpText ? <p className="mt-1 text-xs text-white/55">{helpText}</p> : null}

      <div className="mt-2 rounded-2xl border border-white/10 bg-white/4 p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {TOOLBAR_ACTIONS.map((action) => {
            const isSourceToggle = action.type === "source";
            const isDisabled = isSourceMode && !isSourceToggle;

            return (
              <button
                key={action.label}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                disabled={isDisabled}
                onClick={() => {
                  if (action.type === "source") {
                    setIsSourceMode((current) => !current);
                    return;
                  }

                  const editor = editorRef.current;
                  if (!editor) {
                    return;
                  }

                  editor.focus();

                  if (action.type === "link") {
                    const nextUrl = window.prompt("Enter a URL", "https://");
                    if (!nextUrl) {
                      return;
                    }

                    document.execCommand("createLink", false, nextUrl);
                  } else {
                    document.execCommand(action.command, false, action.value);
                  }

                  onChange(normalizeEditorHtml(editor.innerHTML));
                }}
                className={[
                  "inline-flex min-h-10 items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition",
                  isSourceToggle && isSourceMode
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-white"
                    : "border-white/10 bg-white/5 text-white/72 hover:border-white/20 hover:bg-white/8 hover:text-white",
                  isDisabled ? "cursor-not-allowed opacity-45 hover:border-white/10 hover:bg-white/5 hover:text-white/72" : "",
                ].join(" ")}
              >
                {action.label}
              </button>
            );
          })}
        </div>

        {isSourceMode ? (
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="min-h-56 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-sm text-white outline-none transition focus:border-white/20"
            placeholder={placeholder}
            spellCheck={false}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            data-placeholder={placeholder ?? ""}
            onInput={(event) => {
              onChange(normalizeEditorHtml(event.currentTarget.innerHTML));
            }}
            onPaste={(event) => {
              event.preventDefault();
              const plainText = event.clipboardData.getData("text/plain");
              insertPlainTextAtCursor(plainText);

              const editor = editorRef.current;
              if (!editor) {
                return;
              }

              onChange(normalizeEditorHtml(editor.innerHTML));
            }}
            className="rich-text-editor min-h-56 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-white/20"
          />
        )}

        <input type="hidden" name={name} value={value} />

        <p className="mt-3 text-xs text-white/45">
          Visual mode pastes plain text by default for predictable formatting.
          Public rendering should sanitize or carefully render trusted admin HTML later.
        </p>
      </div>
    </label>
  );
}

function insertPlainTextAtCursor(value: string) {
  if (document.queryCommandSupported("insertText")) {
    document.execCommand("insertText", false, value);
    return;
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const fragment = document.createDocumentFragment();
  const lines = value.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (index > 0) {
      fragment.appendChild(document.createElement("br"));
    }
    fragment.appendChild(document.createTextNode(line));
  });

  range.insertNode(fragment);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function normalizeEditorHtml(value: string) {
  const normalized = value.trim();

  if (
    normalized === "<br>" ||
    normalized === "<div><br></div>" ||
    normalized === "<p><br></p>"
  ) {
    return "";
  }

  return normalized;
}
