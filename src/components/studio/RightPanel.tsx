"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { ThreeDPreview } from "@/components/studio/ThreeDPreview";
import { useStudioStore } from "@/store/studioStore";
import type { CreateStudioOrderResponse } from "@/types/orders";
import { StudioDesignQuickActions } from "@/components/studio/StudioDesignQuickActions";
export function RightPanel() {
  const { status: authStatus } = useSession();
  const products = useStudioStore((state) => state.products);
  const selectedProduct = useStudioStore((state) => state.selectedProduct);
  const selectedTemplate = useStudioStore((state) => state.selectedTemplate);
  const selectedMaterialId = useStudioStore((state) => state.selectedMaterialId);
  const currentTemplate = useStudioStore((state) => state.currentTemplate);
  const currentDesign = useStudioStore((state) => state.currentDesign);
  const templateStatus = useStudioStore((state) => state.templateStatus);
  const designError = useStudioStore((state) => state.designError);
  const setSelectedMaterialId = useStudioStore((state) => state.setSelectedMaterialId);
  const exportDesign = useStudioStore((state) => state.exportDesign);
  const saveCurrentDesign = useStudioStore((state) => state.saveCurrentDesign);
  const baseColor = useStudioStore((state) => state.baseColor);
  const uploadedAssets = useStudioStore((state) => state.uploadedAssets);
  const frontCanvasJson = useStudioStore((state) => state.frontCanvasJson);
  const backCanvasJson = useStudioStore((state) => state.backCanvasJson);
  const sleevesCanvasJson = useStudioStore((state) => state.sleevesCanvasJson);
  const canExportDesign = Boolean(currentTemplate) && Boolean(exportDesign);
  const canViewExportDesign = authStatus === "authenticated";
  const product = products.find((item) => item.id === selectedProduct);
  const materials = currentTemplate?.materials ?? [];
  const sizeChart = currentTemplate?.sizeChart ?? [];
  const selectedMaterial =
    materials.find((material) => material.id === selectedMaterialId) ??
    materials[0];
  const displayedPrice = selectedMaterial?.price ?? currentTemplate?.basePrice;

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isSizeChartModalOpen, setIsSizeChartModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState("");
  const [teamFile, setTeamFile] = useState<File | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState<string | null>(null);
  const [hasPlacedOrder, setHasPlacedOrder] = useState(false);
  const placedDesignSnapshotRef = useRef<string | null>(null);

  const totalPrice = (displayedPrice ?? 0) * quantity;
  const isAnyModalOpen =
    isOrderModalOpen || isSuccessModalOpen || isSizeChartModalOpen;
  const designChangeSignature = JSON.stringify({
    selectedProduct,
    selectedTemplate,
    selectedMaterialId,
    baseColor,
    frontCanvasJson,
    backCanvasJson,
    sleevesCanvasJson,
    uploadedAssets: uploadedAssets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      url: asset.url,
      type: asset.type,
      r2Key: asset.r2Key ?? null,
    })),
  });

  useEffect(() => {
    if (!isAnyModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isAnyModalOpen]);

  useEffect(() => {
    if (!hasPlacedOrder) {
      return;
    }

    if (!placedDesignSnapshotRef.current) {
      return;
    }

    if (placedDesignSnapshotRef.current !== designChangeSignature) {
      setHasPlacedOrder(false);
      setSubmittedOrderNumber(null);
      placedDesignSnapshotRef.current = null;
    }
  }, [designChangeSignature, hasPlacedOrder]);

  const resetOrderForm = () => {
    setQuantity(1);
    setInstructions("");
    setTeamFile(null);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setOrderError(null);
  };

  const openOrderModal = () => {
    setOrderError(null);
    setIsOrderModalOpen(true);
  };

  const closeOrderModal = () => {
    setOrderError(null);
    setIsOrderModalOpen(false);
  };

  const closeSuccessModal = () => {
    setSubmittedOrderNumber(null);
    setIsSuccessModalOpen(false);
  };

  const handleExportDesign = async () => {
    if (!exportDesign || isExporting) {
      return;
    }

    setIsExporting(true);
    try {
      await Promise.resolve(exportDesign());
    } finally {
      window.setTimeout(() => {
        setIsExporting(false);
      }, 500);
    }
  };

  const handleOrderSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmittingOrder) {
      return;
    }

    setIsSubmittingOrder(true);
    setOrderError(null);
    try {
      const savedDesign = await saveCurrentDesign();
      if (!savedDesign) {
        throw new Error("Please save your design before placing the order.");
      }

      const formData = new FormData();
      formData.set("designId", savedDesign.id);
      formData.set("productId", savedDesign.productId);
      formData.set("templateId", savedDesign.templateId);
      formData.set("materialId", selectedMaterial?.id ?? "");
      formData.set("customerName", customerName);
      formData.set("customerPhone", customerPhone);
      formData.set("customerEmail", customerEmail.trim());
      formData.set("instructions", instructions.trim());
      formData.set("quantity", String(quantity));
      formData.set(
        "pricePerItem",
        String(displayedPrice ?? currentTemplate?.basePrice ?? 0),
      );
      formData.set("totalPrice", String(totalPrice));
      if (teamFile) {
        formData.set("teamFile", teamFile);
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(errorPayload?.error || "Failed to place order.");
      }

      const result = (await response.json()) as CreateStudioOrderResponse;
      placedDesignSnapshotRef.current = designChangeSignature;
      setHasPlacedOrder(true);
      setSubmittedOrderNumber(result.order.orderNumber);
      setIsOrderModalOpen(false);
      setIsSuccessModalOpen(true);
      resetOrderForm();
      setTeamFile(null);
    } catch (error) {
      console.error("Failed to place order.", error);
      setOrderError(
        error instanceof Error
          ? error.message
          : "We couldn't place your order. Please try again.",
      );
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <>
      <aside className="border border-white/8 bg-linear-to-b from-[rgba(8,17,28,0.98)] to-[rgba(4,10,17,0.96)] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] sm:p-5 lg:p-6">
        <div
          data-tour="save-share"
          className="mb-4 rounded-2xl border border-white/8 bg-white/[0.03] p-2.5 sm:p-3"
        >
          <div className="min-w-0">
            <StudioDesignQuickActions compact />
          </div>
        </div>
        <div data-tour="preview-3d">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-white/55">
            3D Preview
          </p>
          <ThreeDPreview />
        </div>

        <div data-tour="order-panel">
          <p className="mb-5 mt-6 font-mono text-xs uppercase tracking-[0.3em] text-white/55">
            Order Panel
          </p>

        <div className="rounded-xl border border-white/8 bg-white/3 p-5">
          <p className="text-sm text-white/62">Base Price</p>
          <p className="mt-2 text-4xl font-black text-white">
            {displayedPrice ? `$${displayedPrice}` : "--"}
          </p>
        </div>

        {currentDesign ? (
          <div className="mt-4 rounded-xl border border-white/8 bg-white/3 px-4 py-3 text-sm text-white/68">
            <p className="font-semibold text-white">Saved Design Link Ready</p>
            <p className="mt-1 break-all text-xs text-white/55">
              {currentDesign.publicPath}
            </p>
            {currentDesign.isFeatured || currentDesign.isLocked ? (
              <p className="mt-2 text-xs text-amber-200/75">
                This design is protected. Saving changes will create a new copy.
              </p>
            ) : null}
          </div>
        ) : null}

        {designError ? (
          <div className="mt-4 rounded-xl border border-red-400/25 bg-red-950/20 px-4 py-3 text-sm text-red-100">
            {designError}
          </div>
        ) : null}

        {materials.length > 0 ? (
          <div className="mt-5">
            <label className="mb-2 block text-sm text-white/78">Material</label>
            <select
              value={selectedMaterial?.id ?? ""}
              disabled={templateStatus === "loading"}
              onChange={(event) => setSelectedMaterialId(event.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-sm text-white outline-none transition focus:border-white/20 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {materials.map((material) => (
                <option
                  key={material.id}
                  value={material.id}
                  className="bg-slate-900 text-white"
                >
                  {material.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {sizeChart.length > 0 ? (
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setIsSizeChartModalOpen(true)}
              className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-left transition hover:border-white/16 hover:bg-white/[0.05]"
            >
              <p className="text-sm font-semibold text-white">View Size Chart</p>
              <p className="mt-1 text-sm text-white/58">
                Check available sizes
              </p>
            </button>
          </div>
        ) : null}

          <div className="mt-6 grid gap-3">
          {canViewExportDesign ? (
            <button
              type="button"
              onClick={() => {
                void handleExportDesign();
              }}
              disabled={!canExportDesign || isExporting}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/4 px-5 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/7 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isExporting ? "Exporting..." : "Export Design"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={openOrderModal}
            disabled={
              !currentTemplate || templateStatus === "loading" || hasPlacedOrder
            }
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-linear-to-b from-[var(--accent-soft)] to-[var(--accent)] px-5 py-3 font-semibold text-white shadow-[0_18px_40px_var(--brand-accent-shadow)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {hasPlacedOrder
              ? submittedOrderNumber
                ? `Placed · ${submittedOrderNumber}`
                : "Placed"
              : "Place Order"}
          </button>
          </div>
        </div>
      </aside>

      {isOrderModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,6,23,0.78)] px-4 py-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(9,17,28,0.98),rgba(4,10,17,0.98))] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/8 bg-[linear-gradient(180deg,rgba(9,17,28,0.98),rgba(4,10,17,0.98))] px-6 py-5 lg:px-7">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/55">
                  Place Order
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  Complete Your Order
                </h2>
              </div>
              <button
                type="button"
                onClick={closeOrderModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/4 text-white/80 transition hover:bg-white/8"
              >
                x
              </button>
            </div>

            <form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={handleOrderSubmit}
            >
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 lg:px-7">
                <div className="grid gap-6 pb-6">
                  <section className="rounded-2xl border border-white/8 bg-white/3 p-5">
                    <p className="text-sm font-semibold text-white">
                      Order Summary
                    </p>
                    <div className="mt-4 grid gap-3 text-sm text-white/78 md:grid-cols-2">
                      <div>
                        <p className="text-white/48">Product</p>
                        <p className="mt-1 text-white">
                          {product?.name ?? selectedProduct ?? "--"}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/48">Template</p>
                        <p className="mt-1 text-white">
                          {currentTemplate?.templateName ?? selectedTemplate ?? "--"}
                        </p>
                      </div>
                      {selectedMaterial ? (
                        <div>
                          <p className="text-white/48">Selected Material</p>
                          <p className="mt-1 text-white">{selectedMaterial.name}</p>
                        </div>
                      ) : null}
                      <div>
                        <p className="text-white/48">Price Per Item</p>
                        <p className="mt-1 text-white">
                          {displayedPrice ? `$${displayedPrice}` : "--"}
                        </p>
                      </div>
                      <label className="block">
                        <span className="text-white/48">Quantity</span>
                        <input
                          type="number"
                          min={1}
                          value={quantity}
                          onChange={(event) =>
                            setQuantity(Math.max(1, Number(event.target.value) || 1))
                          }
                          className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-white/20"
                        />
                      </label>
                      <div>
                        <p className="text-white/48">Total Price</p>
                        <p className="mt-2 text-2xl font-black text-white">
                          ${totalPrice}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-white/8 bg-white/3 p-5">
                    <label className="block text-sm font-semibold text-white">
                      Instructions (optional)
                    </label>
                    <textarea
                      value={instructions}
                      onChange={(event) => setInstructions(event.target.value)}
                      placeholder="Add any notes for printing, names, placements..."
                      rows={4}
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/20"
                    />
                  </section>

                  <section className="rounded-2xl border border-white/8 bg-white/3 p-5">
                    <label className="block text-sm font-semibold text-white">
                      Upload Team Sheet (Optional)
                    </label>
                    <p className="mt-2 text-sm text-white/58">
                      You can upload player names, numbers, or size sheet
                      (Excel, PDF, Image)
                    </p>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg,.webp"
                      onChange={(event) => setTeamFile(event.target.files?.[0] ?? null)}
                      className="mt-4 block w-full rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                    />
                    {teamFile ? (
                      <p className="mt-2 text-sm text-white/68">{teamFile.name}</p>
                    ) : null}
                  </section>

                  <section className="rounded-2xl border border-white/8 bg-white/3 p-5">
                    <p className="text-sm font-semibold text-white">
                      Contact Info
                    </p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="text-sm text-white/78">Name</span>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(event) => setCustomerName(event.target.value)}
                          className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-white/20"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm text-white/78">
                          Phone / WhatsApp
                        </span>
                        <input
                          type="text"
                          required
                          value={customerPhone}
                          onChange={(event) => setCustomerPhone(event.target.value)}
                          className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-white/20"
                        />
                      </label>
                      <label className="block md:col-span-2">
                        <span className="text-sm text-white/78">
                          Email (optional)
                        </span>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(event) => setCustomerEmail(event.target.value)}
                          className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-white/20"
                        />
                      </label>
                    </div>
                  </section>

                  {orderError ? (
                    <div className="rounded-2xl border border-red-400/25 bg-red-950/20 px-4 py-3 text-sm text-red-100">
                      {orderError}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="sticky bottom-0 z-10 flex flex-col gap-3 border-t border-white/8 bg-[linear-gradient(180deg,rgba(9,17,28,0.98),rgba(4,10,17,0.98))] px-6 py-5 sm:flex-row sm:justify-end lg:px-7">
                <button
                  type="button"
                  onClick={closeOrderModal}
                  disabled={isSubmittingOrder}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/4 px-5 py-3 font-semibold text-white transition hover:border-white/20 hover:bg-white/7"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-linear-to-b from-[var(--accent-soft)] to-[var(--accent)] px-5 py-3 font-semibold text-white shadow-[0_18px_40px_var(--brand-accent-shadow)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {isSubmittingOrder ? "Submitting..." : "Complete Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isSizeChartModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,6,23,0.78)] px-4 py-6"
          onClick={() => setIsSizeChartModalOpen(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(9,17,28,0.98),rgba(4,10,17,0.98))] shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-5 sm:px-6">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/55">
                  Size Chart
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  Available Sizes
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsSizeChartModalOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/4 text-white/80 transition hover:bg-white/8"
              >
                x
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-5 sm:px-6">
              <div className="grid gap-3">
                {sizeChart.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-white/8 bg-white/3 px-4 py-4"
                  >
                    <p className="text-sm font-semibold text-white">
                      {entry.name}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-white/68">
                      {entry.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/8 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setIsSizeChartModalOpen(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/4 px-5 py-3 font-semibold text-white transition hover:border-white/20 hover:bg-white/7"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isSuccessModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,6,23,0.78)] px-4 py-8">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(9,17,28,0.98),rgba(4,10,17,0.98))] p-6 text-center shadow-[0_30px_80px_rgba(0,0,0,0.45)] lg:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/55">
              Order Received
            </p>
            <h2 className="mt-3 text-3xl font-black text-white">
              Order Received Successfully
            </h2>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/4 px-4 py-4 text-left text-base leading-7 text-white/72">
              <p>Your order has been placed successfully.</p>
              <p className="mt-2 font-semibold text-white">
                Order ID: {submittedOrderNumber ?? "--"}
              </p>
              <p className="mt-2">
                Our team will contact you shortly via WhatsApp or phone to
                confirm details.
              </p>
            </div>
            <button
              type="button"
              onClick={closeSuccessModal}
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-linear-to-b from-[var(--accent-soft)] to-[var(--accent)] px-6 py-3 font-semibold text-white shadow-[0_18px_40px_var(--brand-accent-shadow)] transition hover:-translate-y-0.5"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
