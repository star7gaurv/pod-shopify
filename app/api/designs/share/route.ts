import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/designs/share
 * Generates a shareable link for a design.
 * Returns the full URL that anyone can open to see + remix the design.
 */
export async function POST(request: Request) {
  try {
    const { designId } = (await request.json()) as { designId?: string };
    if (!designId) {
      return NextResponse.json({ error: "designId required" }, { status: 400 });
    }

    const design = await prisma.design.findUnique({
      where: { id: designId },
      select: { id: true, shareToken: true },
    });

    if (!design) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pod.star7gaurav.in";
    const shareUrl = `${siteUrl}/studio?design=${design.shareToken}`;

    return NextResponse.json({ shareUrl, shareToken: design.shareToken });
  } catch (err) {
    console.error("design share error:", err);
    return NextResponse.json({ error: "Failed to generate share link" }, { status: 500 });
  }
}
