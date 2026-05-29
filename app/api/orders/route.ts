import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/r2";
import type { CreateStudioOrderPayload } from "@/types/orders";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const body: ParsedCreateOrderPayload = contentType.includes("multipart/form-data")
      ? await parseMultipartOrderPayload(request)
      : ((await request.json()) as Partial<CreateStudioOrderPayload>);
    const validationError = validateCreateOrderPayload(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const teamFileValidationError = validateTeamFile(body.teamFile ?? null);
    if (teamFileValidationError) {
      return NextResponse.json({ error: teamFileValidationError }, { status: 400 });
    }

    const design = await prisma.design.findUnique({
      where: {
        id: body.designId,
      },
    });

    if (!design) {
      return NextResponse.json({ error: "Saved design not found." }, { status: 404 });
    }

    const product = await prisma.product.findUnique({
      where: {
        slug: body.productId,
      },
    });

    const template = await prisma.template.findUnique({
      where: {
        slug: body.templateId,
      },
      include: {
        materials: {
          where: {
            isActive: true,
          },
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!product || !template) {
      return NextResponse.json(
        { error: "Product or template could not be found." },
        { status: 400 },
      );
    }

    if (template.productId !== product.id) {
      return NextResponse.json(
        { error: "Template does not belong to the selected product." },
        { status: 400 },
      );
    }

    if (design.productId !== product.id || design.templateId !== template.id) {
      return NextResponse.json(
        { error: "Saved design does not match the selected product/template." },
        { status: 400 },
      );
    }

    const selectedMaterial = body.materialId
      ? template.materials.find((material) => material.id === body.materialId)
      : null;

    if (body.materialId && !selectedMaterial) {
      return NextResponse.json(
        { error: "Selected material is not valid for this template." },
        { status: 400 },
      );
    }

    const quantity = Number(body.quantity);
    const pricePerItem = selectedMaterial?.price ?? template.basePrice;
    const totalPrice = pricePerItem.mul(quantity);
    const orderNumber = await generateUniqueOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        designId: design.id,
        productId: product.id,
        templateId: template.id,
        materialId: selectedMaterial?.id ?? null,
        customerName: body.customerName!.trim(),
        customerPhone: body.customerPhone!.trim(),
        customerEmail: normalizeOptionalString(body.customerEmail),
        instructions: normalizeOptionalString(body.instructions),
        quantity,
        pricePerItem,
        totalPrice,
        status: "pending",
      },
    });

    if (body.teamFile) {
      try {
        const uploadedFile = await uploadOrderTeamFile(order.id, orderNumber, body.teamFile);
        await prisma.orderFile.create({
          data: {
            orderId: order.id,
            fileName: uploadedFile.fileName,
            filePath: uploadedFile.filePath,
            mimeType: uploadedFile.mimeType,
            fileSize: uploadedFile.fileSize,
          },
        });
      } catch (error) {
        await prisma.order.delete({
          where: {
            id: order.id,
          },
        });
        throw error;
      }
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
      },
    });
  } catch (error) {
    console.error("POST /api/orders failed", error);
    return NextResponse.json(
      { error: "Failed to place order." },
      { status: 500 },
    );
  }
}

type ParsedCreateOrderPayload = Partial<CreateStudioOrderPayload> & {
  teamFile?: File | null;
};

function validateCreateOrderPayload(body: ParsedCreateOrderPayload) {
  if (!body.designId || typeof body.designId !== "string") {
    return "A saved design is required before placing an order.";
  }

  if (!body.productId || typeof body.productId !== "string") {
    return "Product is required.";
  }

  if (!body.templateId || typeof body.templateId !== "string") {
    return "Template is required.";
  }

  if (!body.customerName || !body.customerName.trim()) {
    return "Customer name is required.";
  }

  if (!body.customerPhone || !body.customerPhone.trim()) {
    return "Customer phone is required.";
  }

  const quantity = Number(body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) {
    return "Quantity must be at least 1.";
  }

  const pricePerItem = Number(body.pricePerItem);
  if (!Number.isFinite(pricePerItem) || pricePerItem < 0) {
    return "Price per item is invalid.";
  }

  const totalPrice = Number(body.totalPrice);
  if (!Number.isFinite(totalPrice) || totalPrice < 0) {
    return "Total price is invalid.";
  }

  return null;
}

async function parseMultipartOrderPayload(request: Request): Promise<ParsedCreateOrderPayload> {
  const formData = await request.formData();
  const teamFileValue = formData.get("teamFile");

  return {
    designId: getOptionalString(formData.get("designId")),
    productId: getOptionalString(formData.get("productId")),
    templateId: getOptionalString(formData.get("templateId")),
    materialId: getOptionalString(formData.get("materialId")),
    customerName: getOptionalString(formData.get("customerName")),
    customerPhone: getOptionalString(formData.get("customerPhone")),
    customerEmail: getOptionalString(formData.get("customerEmail")),
    instructions: getOptionalString(formData.get("instructions")),
    quantity: Number(formData.get("quantity") ?? 0),
    pricePerItem: Number(formData.get("pricePerItem") ?? 0),
    totalPrice: Number(formData.get("totalPrice") ?? 0),
    teamFile: teamFileValue instanceof File && teamFileValue.size > 0 ? teamFileValue : null,
  };
}

async function generateUniqueOrderNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const randomPart = randomBytes(3).toString("hex").toUpperCase();
    const orderNumber = `ORD-${datePart}-${randomPart}`;
    const existingOrder = await prisma.order.findUnique({
      where: {
        orderNumber,
      },
      select: {
        id: true,
      },
    });

    if (!existingOrder) {
      return orderNumber;
    }
  }

  throw new Error("Could not generate a unique order number.");
}

function normalizeOptionalString(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getOptionalString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : undefined;
}

function validateTeamFile(file: File | null) {
  if (!file) {
    return null;
  }

  if (file.size > 10 * 1024 * 1024) {
    return "Team sheet must be 10MB or smaller.";
  }

  const extension = getFileExtension(file.name);
  const allowedExtensions = new Set([
    "xlsx",
    "xls",
    "csv",
    "pdf",
    "png",
    "jpg",
    "jpeg",
    "webp",
  ]);

  if (!allowedExtensions.has(extension)) {
    return "Unsupported team sheet format. Upload Excel, PDF, or image files only.";
  }

  const allowedMimeTypes = new Set([
    "application/pdf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "image/png",
    "image/jpeg",
    "image/webp",
  ]);

  if (file.type && !allowedMimeTypes.has(file.type)) {
    return "Unsupported team sheet format. Upload Excel, PDF, or image files only.";
  }

  return null;
}

async function uploadOrderTeamFile(orderId: string, orderNumber: string, file: File) {
  const extension = getFileExtension(file.name);
  const safeOrderToken = orderNumber.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const fileName = `${safeOrderToken}-${randomBytes(4).toString("hex")}.${extension}`;
  const key = `orders/files/${orderId}/${fileName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = await uploadFile({
    body: buffer,
    key,
    contentType: file.type || undefined,
    cacheControl: "public, max-age=31536000, immutable",
  });

  return {
    fileName: file.name,
    filePath,
    mimeType: file.type || null,
    fileSize: file.size,
  };
}

function getFileExtension(fileName: string) {
  const normalized = fileName.trim().toLowerCase();
  const segments = normalized.split(".");
  return segments.length > 1 ? segments.at(-1) ?? "" : "";
}
