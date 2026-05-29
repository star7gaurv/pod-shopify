"use client";

import { useActionState, useState } from "react";
import {
  createMaterialAction,
  deleteMaterialAction,
  updateMaterialAction,
} from "@/actions/admin-template-materials";
import {
  INITIAL_TEMPLATE_MATERIAL_FORM_STATE,
  type AdminTemplateMaterial,
  type TemplateMaterialFormState,
} from "@/lib/admin/template-material-form";

type AdminTemplateMaterialsManagerProps = {
  templateId: string;
  materials: AdminTemplateMaterial[];
};

export function AdminTemplateMaterialsManager({
  templateId,
  materials,
}: AdminTemplateMaterialsManagerProps) {
  const boundCreateMaterialAction = createMaterialAction.bind(null, templateId);
  const [createState, createFormAction, createPending] = useActionState<
    TemplateMaterialFormState,
    FormData
  >(boundCreateMaterialAction, INITIAL_TEMPLATE_MATERIAL_FORM_STATE);

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-white/10 bg-white/3 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Materials</h2>
            <p className="mt-1 text-sm leading-6 text-white/62">
              Add pricing options for this template, mark one as the default, and
              keep inactive materials hidden from the studio without deleting
              them.
            </p>
          </div>
          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
            {materials.length} {materials.length === 1 ? "material" : "materials"}
          </span>
        </div>

        <form action={createFormAction} className="mt-6 grid gap-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_180px]">
            <label className="block">
              <span className="text-sm text-white/78">Material Name</span>
              <input
                type="text"
                name="name"
                required
                className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-white/20"
                placeholder="Standard Polyester"
              />
            </label>

            <label className="block">
              <span className="text-sm text-white/78">Price</span>
              <input
                type="number"
                name="price"
                required
                min="0"
                step="0.01"
                className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-white/20"
                placeholder="89"
              />
            </label>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/3 px-4 py-3">
              <input
                type="checkbox"
                name="isDefault"
                className="h-4 w-4 rounded border-white/20 bg-white/10 text-[var(--accent)]"
              />
              <span className="text-sm text-white/78">Set as default material</span>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/3 px-4 py-3">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked
                className="h-4 w-4 rounded border-white/20 bg-white/10 text-[var(--accent)]"
              />
              <span className="text-sm text-white/78">Active in studio</span>
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
              {createPending ? "Adding..." : "Add Material"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/3 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Existing Materials</h3>
        </div>

        {materials.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/3 px-5 py-8 text-sm text-white/58">
            No materials have been added yet. Add your first material above to
            start offering pricing options in the studio.
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {materials.map((material) => (
              <EditableMaterialCard
                key={material.id}
                templateId={templateId}
                material={material}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EditableMaterialCard({
  templateId,
  material,
}: {
  templateId: string;
  material: AdminTemplateMaterial;
}) {
  const boundUpdateMaterialAction = updateMaterialAction.bind(
    null,
    templateId,
    material.id,
  );
  const boundDeleteMaterialAction = deleteMaterialAction.bind(
    null,
    templateId,
    material.id,
  );
  const [state, formAction, pending] = useActionState<
    TemplateMaterialFormState,
    FormData
  >(boundUpdateMaterialAction, INITIAL_TEMPLATE_MATERIAL_FORM_STATE);
  const [name, setName] = useState(material.name);
  const [price, setPrice] = useState(material.price);
  const [isDefault, setIsDefault] = useState(material.isDefault);
  const [isActive, setIsActive] = useState(material.isActive);
  const [activeAction, setActiveAction] = useState<"save" | "delete" | null>(null);

  return (
    <form action={formAction} className="rounded-2xl border border-white/10 bg-black/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-semibold text-white">{material.name}</h4>
            {material.isDefault ? (
              <span className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-500/14 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Default
              </span>
            ) : null}
            <span
              className={[
                "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                material.isActive
                  ? "border border-white/10 bg-white/8 text-white/70"
                  : "border border-white/6 bg-white/4 text-white/45",
              ].join(" ")}
            >
              {material.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="mt-2 text-sm text-white/58">
            Update the label, pricing, and default status for this material.
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
            formAction={boundDeleteMaterialAction}
            disabled={pending}
            onClick={() => setActiveAction("delete")}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-400/20 bg-red-950/15 px-4 py-2 text-sm font-semibold text-red-100 transition hover:border-red-300/35 hover:bg-red-900/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending && activeAction === "delete" ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_180px]">
        <label className="block">
          <span className="text-sm text-white/78">Material Name</span>
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
          <span className="text-sm text-white/78">Price</span>
          <input
            type="number"
            name="price"
            required
            min="0"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-white/20"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/3 px-4 py-3">
          <input
            type="checkbox"
            name="isDefault"
            checked={isDefault}
            onChange={(event) => setIsDefault(event.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/10 text-[var(--accent)]"
          />
          <span className="text-sm text-white/78">Default material</span>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/3 px-4 py-3">
          <input
            type="checkbox"
            name="isActive"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/10 text-[var(--accent)]"
          />
          <span className="text-sm text-white/78">Active in studio</span>
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
