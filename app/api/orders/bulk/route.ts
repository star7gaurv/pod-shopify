import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/orders/bulk
 * Creates a bulk / team order from a roster JSON.
 * Used for team jerseys where each player has a name + number.
 *
 * Body:
 * {
 *   designId: string,
 *   productId: string,
 *   templateId: string,
 *   materialId?: string,
 *   customerName: string,
 *   customerPhone: string,
 *   customerEmail?: string,
 *   instructions?: string,
 *   roster: Array<{ name: string; number: string; size?: string; quantity?: number }>
 * }
 */

type RosterEntry = {
  name: string;
  number?: string;
  size?: string;
  quantity?: number;
};

type BulkOrderBody = {
  designId: string;
  productId: string;
  templateId: string;
  materialId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  instructions?: string;
  roster: RosterEntry[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BulkOrderBody;

    if (!body.designId || !body.productId || !body.templateId) {
      return NextResponse.json({ error: "designId, productId, templateId required" }, { status: 400 });
    }
    if (!Array.isArray(body.roster) || body.roster.length === 0) {
      return NextResponse.json({ error: "roster must be a non-empty array" }, { status: 400 });
    }
    if (!body.customerName || !body.customerPhone) {
      return NextResponse.json({ error: "customerName and customerPhone required" }, { status: 400 });
    }

    const [design, product, template] = await Promise.all([
      prisma.design.findUnique({ where: { id: body.designId } }),
      prisma.product.findUnique({ where: { slug: body.productId } }),
      prisma.template.findMany({
        where: { slug: body.templateId },
        include: { materials: { where: { isActive: true } } },
      }),
    ]);

    if (!design) return NextResponse.json({ error: "Design not found" }, { status: 404 });
    if (!product || !template[0]) {
      return NextResponse.json({ error: "Product or template not found" }, { status: 404 });
    }

    const tpl = template[0];
    const selectedMaterial = body.materialId
      ? tpl.materials.find((m) => m.id === body.materialId)
      : null;
    const pricePerItem = selectedMaterial?.price ?? tpl.basePrice;

    const totalQuantity = body.roster.reduce((s, r) => s + (r.quantity ?? 1), 0);
    const totalPrice = Number(pricePerItem) * totalQuantity;

    const rosterNotes = body.roster
      .map((r, i) => `${i + 1}. ${r.name}${r.number ? ` #${r.number}` : ""}${r.size ? ` (${r.size})` : ""} × ${r.quantity ?? 1}`)
      .join("\n");

    const instructions = [body.instructions, "BULK TEAM ORDER ROSTER:", rosterNotes]
      .filter(Boolean)
      .join("\n\n");

    const orderNumber = `BULK-${Date.now()}-${randomBytes(3).toString("hex").toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        designId: design.id,
        productId: product.id,
        templateId: tpl.id,
        materialId: selectedMaterial?.id ?? null,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        customerEmail: body.customerEmail ?? null,
        instructions,
        quantity: totalQuantity,
        pricePerItem,
        totalPrice,
        status: "pending",
      },
    });

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        quantity: order.quantity,
        totalPrice: order.totalPrice,
      },
    });
  } catch (err) {
    console.error("bulk order error:", err);
    return NextResponse.json({ error: "Failed to create bulk order" }, { status: 500 });
  }
}
