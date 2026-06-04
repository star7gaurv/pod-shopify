/**
 * Plan limits, shared between the storefront design-save gate
 * (`app/api/designs/route.ts`) and the embedded Home surface that shows the
 * "x / 3 free designs used" counter. Keep this dependency-free so both
 * server routes and client components can import the number.
 */

/** Saved customer designs a `free`-plan shop may accumulate before paying. */
export const FREE_DESIGN_LIMIT = 3;
