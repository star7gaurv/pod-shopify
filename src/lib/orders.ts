export const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "contacted", label: "Contacted" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_production", label: "In Production" },
  { value: "ready", label: "Ready" },
  { value: "dispatched", label: "Dispatched" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export type OrderStatus = (typeof ORDER_STATUS_OPTIONS)[number]["value"];

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  contacted: "Contacted",
  confirmed: "Confirmed",
  in_production: "In Production",
  ready: "Ready",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const ORDER_STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  pending: "bg-slate-500/16 text-slate-100 border-slate-300/18",
  contacted: "bg-sky-500/16 text-sky-100 border-sky-300/18",
  confirmed: "bg-violet-500/16 text-violet-100 border-violet-300/18",
  in_production: "bg-orange-500/16 text-orange-100 border-orange-300/18",
  ready: "bg-teal-500/16 text-teal-100 border-teal-300/18",
  dispatched: "bg-indigo-500/16 text-indigo-100 border-indigo-300/18",
  delivered: "bg-emerald-500/16 text-emerald-200 border-emerald-300/18",
  cancelled: "bg-rose-500/16 text-rose-100 border-rose-300/18",
};

export function isOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUS_OPTIONS.some((status) => status.value === value);
}

export function getOrderStatusLabel(value: string) {
  return isOrderStatus(value) ? ORDER_STATUS_LABELS[value] : value;
}

export function getOrderStatusBadgeClassName(value: string) {
  return isOrderStatus(value)
    ? ORDER_STATUS_BADGE_CLASSES[value]
    : "bg-white/8 text-white/70 border-white/10";
}
