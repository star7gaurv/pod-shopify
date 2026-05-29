"use client";

import { useActionState, useMemo, useState } from "react";
import {
  INITIAL_ORDER_STATUS_FORM_STATE,
  type OrderStatusFormState,
} from "@/lib/admin/order-status-form";
import {
  ORDER_STATUS_OPTIONS,
  type OrderStatus,
} from "@/lib/orders";

type AdminOrderStatusFormProps = {
  action: (
    state: OrderStatusFormState,
    formData: FormData,
  ) => Promise<OrderStatusFormState>;
  currentStatus: OrderStatus;
};

export function AdminOrderStatusForm({
  action,
  currentStatus,
}: AdminOrderStatusFormProps) {
  const [state, formAction, pending] = useActionState<OrderStatusFormState, FormData>(
    action,
    INITIAL_ORDER_STATUS_FORM_STATE,
  );
  const [status, setStatus] = useState<OrderStatus>(currentStatus);

  const feedbackClassName = useMemo(() => {
    if (!state.message) {
      return "";
    }

    return state.success
      ? "border-emerald-400/25 bg-emerald-950/20 text-emerald-100"
      : "border-red-400/25 bg-red-950/20 text-red-100";
  }, [state.message, state.success]);

  return (
    <form action={formAction} className="mt-5 grid gap-4">
      <label className="block">
        <span className="text-sm text-white/78">Update Status</span>
        <select
          name="status"
          value={status}
          onChange={(event) => setStatus(event.target.value as OrderStatus)}
          className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-sm text-white outline-none transition focus:border-white/20"
        >
          {ORDER_STATUS_OPTIONS.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-slate-900 text-white"
            >
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {state.message ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${feedbackClassName}`}>
          {state.message}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-linear-to-b from-[var(--accent-soft)] to-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(255,74,61,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {pending ? "Updating..." : "Update Status"}
        </button>
      </div>
    </form>
  );
}
