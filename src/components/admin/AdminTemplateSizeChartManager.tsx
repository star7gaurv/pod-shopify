"use client";

import { useActionState, useState } from "react";
import {
  createSizeChartAction,
  deleteSizeChartAction,
  updateSizeChartAction,
} from "@/actions/admin-template-size-charts";
import {
  INITIAL_TEMPLATE_SIZE_CHART_FORM_STATE,
  type AdminTemplateSizeChartEntry,
  type TemplateSizeChartFormState,
} from "@/lib/admin/template-size-chart-form";

type AdminTemplateSizeChartManagerProps = {
  templateId: string;
  entries: AdminTemplateSizeChartEntry[];
};

export function AdminTemplateSizeChartManager({
  templateId,
  entries,
}: AdminTemplateSizeChartManagerProps) {
  const boundCreateSizeChartAction = createSizeChartAction.bind(null, templateId);
  const [createState, createFormAction, createPending] = useActionState<
    TemplateSizeChartFormState,
    FormData
  >(boundCreateSizeChartAction, INITIAL_TEMPLATE_SIZE_CHART_FORM_STATE);

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-white/10 bg-white/3 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Size Chart</h2>
            <p className="mt-1 text-sm leading-6 text-white/62">
              Add sizing guidance for this template so the studio and order flow
              can display consistent fit information.
            </p>
          </div>
          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        <form action={createFormAction} className="mt-6 grid gap-4">
          <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1.3fr)_140px]">
            <label className="block">
              <span className="text-sm text-white/78">Size Name</span>
              <input
                type="text"
                name="name"
                required
                className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-white/20"
                placeholder="M"
              />
            </label>

            <label className="block">
              <span className="text-sm text-white/78">Description</span>
              <input
                type="text"
                name="description"
                required
                className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-white/20"
                placeholder="Chest: 40 in, Length: 28 in"
              />
            </label>

            <label className="block">
              <span className="text-sm text-white/78">Sort Order</span>
              <input
                type="number"
                name="sortOrder"
                required
                step="1"
                className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-white/20"
                placeholder="0"
              />
            </label>
          </div>

          {createState.message ? (
            <div className="rounded-2xl border border-red-400/25 bg-red-950/20 px-4 py-3 text-sm text-red-100">
              {createState.message}
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createPending}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-linear-to-b from-[var(--accent-soft)] to-[var(--accent)] px-6 py-3 font-semibold text-white shadow-[0_18px_40px_rgba(255,74,61,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {createPending ? "Adding..." : "Add Size"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/3 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Existing Size Chart</h3>
        </div>

        {entries.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/3 px-5 py-8 text-sm text-white/58">
            No size chart entries have been added yet. Add your first size row
            above to help customers choose the right fit.
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {entries.map((entry) => (
              <EditableSizeChartCard
                key={entry.id}
                templateId={templateId}
                entry={entry}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EditableSizeChartCard({
  templateId,
  entry,
}: {
  templateId: string;
  entry: AdminTemplateSizeChartEntry;
}) {
  const boundUpdateSizeChartAction = updateSizeChartAction.bind(
    null,
    templateId,
    entry.id,
  );
  const boundDeleteSizeChartAction = deleteSizeChartAction.bind(
    null,
    templateId,
    entry.id,
  );
  const [state, formAction, pending] = useActionState<
    TemplateSizeChartFormState,
    FormData
  >(boundUpdateSizeChartAction, INITIAL_TEMPLATE_SIZE_CHART_FORM_STATE);
  const [name, setName] = useState(entry.name);
  const [description, setDescription] = useState(entry.description);
  const [sortOrder, setSortOrder] = useState(String(entry.sortOrder));
  const [activeAction, setActiveAction] = useState<"save" | "delete" | null>(null);

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-white/10 bg-black/10 p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-semibold text-white">{entry.name}</h4>
            <span className="inline-flex rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
              Sort {entry.sortOrder}
            </span>
          </div>
          <p className="mt-2 text-sm text-white/58">
            Update the size label, fit description, and ordering for this chart
            row.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            onClick={() => setActiveAction("save")}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/7 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending && activeAction === "save" ? "Saving..." : "Save"}
          </button>
          <button
            type="submit"
            formAction={boundDeleteSizeChartAction}
            disabled={pending}
            onClick={() => setActiveAction("delete")}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-400/20 bg-red-950/15 px-4 py-2 text-sm font-semibold text-red-100 transition hover:border-red-300/35 hover:bg-red-900/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending && activeAction === "delete" ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[180px_minmax(0,1.3fr)_140px]">
        <label className="block">
          <span className="text-sm text-white/78">Size Name</span>
          <input
            type="text"
            name="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-white/20"
          />
        </label>

        <label className="block">
          <span className="text-sm text-white/78">Description</span>
          <input
            type="text"
            name="description"
            required
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-white/20"
          />
        </label>

        <label className="block">
          <span className="text-sm text-white/78">Sort Order</span>
          <input
            type="number"
            name="sortOrder"
            required
            step="1"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-white/20"
          />
        </label>
      </div>

      {state.message ? (
        <div className="mt-4 rounded-2xl border border-red-400/25 bg-red-950/20 px-4 py-3 text-sm text-red-100">
          {state.message}
        </div>
      ) : null}
    </form>
  );
}
