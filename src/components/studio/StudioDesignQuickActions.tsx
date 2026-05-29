"use client";

import { useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Check, FilePlus2, Link2, LoaderCircle, Save } from "lucide-react";
import { useStudioStore } from "@/store/studioStore";

export function StudioDesignQuickActions({
  compact = false,
}: {
  compact?: boolean;
}) {
  const searchParams = useSearchParams();
  const currentDesign = useStudioStore((state) => state.currentDesign);
  const currentTemplate = useStudioStore((state) => state.currentTemplate);
  const designStatus = useStudioStore((state) => state.designStatus);
  const saveCurrentDesign = useStudioStore((state) => state.saveCurrentDesign);

  const [copyState, setCopyState] = useState<"idle" | "copying" | "copied" | "error">("idle");
  const [saveLabel, setSaveLabel] = useState("idle");
  const [isSavingDesign, setIsSavingDesign] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const isBusySaving = isSavingDesign || designStatus === "saving";
  const isDisabled = !currentTemplate;
  const hasSavedDesignContext = Boolean(searchParams.get("design") || currentDesign?.shareToken);

  const handleCopyLink = async () => {
    if (copyState === "copying" || isDisabled) {
      return;
    }

    setCopyState("copying");
    try {
      let publicUrl = currentDesign
        ? `${window.location.origin}${currentDesign.publicPath}`
        : "";

      if (!publicUrl) {
        const savedDesign = await saveCurrentDesign();
        if (!savedDesign) {
          throw new Error("Design must be saved before sharing.");
        }

        publicUrl = `${window.location.origin}${savedDesign.publicPath}`;
        window.history.replaceState({}, "", savedDesign.publicPath);
      }

      await navigator.clipboard.writeText(publicUrl);
      setCopyState("copied");
    } catch (error) {
      console.error("Failed to copy link.", error);
      setCopyState("error");
    } finally {
      window.setTimeout(() => {
        setCopyState("idle");
      }, 1800);
    }
  };

  const handleSaveDesign = () => {
    if (isBusySaving || isDisabled) {
      return;
    }

    setIsSavingDesign(true);
    setSaveLabel("saving");
    void saveCurrentDesign()
      .then((savedDesign) => {
        if (!savedDesign) {
          setSaveLabel("error");
          return;
        }

        window.history.replaceState({}, "", savedDesign.publicPath);
        setSaveLabel(savedDesign.isFeatured || savedDesign.parentDesignId ? "copied" : "saved");
      })
      .finally(() => {
        window.setTimeout(() => {
          setSaveLabel("idle");
          setIsSavingDesign(false);
        }, 1800);
      });
  };

  const handleClearDesign = () => {
    window.location.href = "/studio";
  };

  return (
    <>
      <div className="flex w-full flex-wrap items-center gap-2">
        {hasSavedDesignContext ? (
          <IconActionButton
            compactLabel="New"
            compact={compact}
            label="Start New"
            title="Start a new design"
            onClick={() => {
              setShowClearDialog(true);
            }}
          >
            <FilePlus2 className="h-4 w-4" />
          </IconActionButton>
        ) : null}

        <IconActionButton
          compact={compact}
          compactLabel={
            isBusySaving
              ? "Saving"
              : saveLabel === "saved"
                ? "Saved"
                : saveLabel === "copied"
                  ? "Saved Copy"
                  : saveLabel === "error"
                    ? "Save Failed"
                    : "Save"
          }
          label={
            isBusySaving
              ? "Saving design"
              : saveLabel === "saved"
                ? "Design saved"
                : saveLabel === "copied"
                  ? "Saved as copy"
                  : saveLabel === "error"
                    ? "Save failed"
                    : "Save design"
          }
          title="Save design"
          disabled={isDisabled || isBusySaving}
          onClick={handleSaveDesign}
        >
          {isBusySaving ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
        </IconActionButton>

        <IconActionButton
          compact={compact}
          compactLabel={
            copyState === "copying"
              ? "Copying"
              : copyState === "copied"
                ? "Copied"
                : copyState === "error"
                  ? "Copy Failed"
                  : "Copy Link"
          }
          label={
            copyState === "copying"
              ? "Copying link"
              : copyState === "copied"
                ? "Copied"
                : copyState === "error"
                  ? "Copy failed"
                  : "Copy design link"
          }
          title="Copy design link"
          disabled={isDisabled || copyState === "copying"}
          onClick={() => {
            void handleCopyLink();
          }}
        >
          {copyState === "copying" ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : copyState === "copied" ? (
            <Check className="h-4 w-4" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
        </IconActionButton>
      </div>

      {showClearDialog ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/78 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-6 shadow-[0_24px_80px_rgba(2,6,23,0.65)]">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/45">
              Fresh Studio
            </p>
            <h3 className="mt-3 text-2xl font-black tracking-[-0.03em] text-white">
              Clear current design?
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/62">
              Your saved design will remain safe. This will open a fresh studio.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowClearDialog(false);
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/78 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearDesign}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/12 px-4 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-300/18"
              >
                Clear Design
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function IconActionButton({
  children,
  compact = false,
  compactLabel,
  disabled,
  label,
  onClick,
  title,
}: {
  children: ReactNode;
  compact?: boolean;
  compactLabel?: string;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex max-w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] font-semibold text-white/82 shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0",
        compact
          ? "h-10 min-w-0 flex-1 px-3 text-xs sm:h-10 sm:flex-none sm:px-3.5"
          : "h-11 px-3.5 text-sm",
      ].join(" ")}
    >
      {children}
      <span className="truncate">
        {compact ? compactLabel ?? label : label}
      </span>
    </button>
  );
}
