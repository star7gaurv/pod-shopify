export type FontCategory =
  | "Sans Serif"
  | "Serif"
  | "Script"
  | "Display"
  | "Sports";

export type StudioFontOption = {
  family: string;
  category: FontCategory;
  source: "google";
};

export const STUDIO_FONT_LIBRARY: StudioFontOption[] = [
  { family: "Inter", category: "Sans Serif", source: "google" },
  { family: "Poppins", category: "Sans Serif", source: "google" },
  { family: "Montserrat", category: "Sans Serif", source: "google" },
  { family: "Manrope", category: "Sans Serif", source: "google" },
  { family: "Raleway", category: "Sans Serif", source: "google" },
  { family: "Barlow", category: "Sans Serif", source: "google" },
  { family: "Bebas Neue", category: "Display", source: "google" },
  { family: "Anton", category: "Display", source: "google" },
  { family: "Oswald", category: "Sports", source: "google" },
  { family: "Teko", category: "Sports", source: "google" },
  { family: "Rajdhani", category: "Sports", source: "google" },
  { family: "Orbitron", category: "Sports", source: "google" },
  { family: "Chakra Petch", category: "Sports", source: "google" },
  { family: "Exo 2", category: "Sports", source: "google" },
  { family: "Archivo Black", category: "Sports", source: "google" },
  { family: "Russo One", category: "Sports", source: "google" },
  { family: "Cormorant Garamond", category: "Serif", source: "google" },
  { family: "Merriweather", category: "Serif", source: "google" },
  { family: "Lora", category: "Serif", source: "google" },
  { family: "Playfair Display", category: "Serif", source: "google" },
  { family: "Libre Baskerville", category: "Serif", source: "google" },
  { family: "DM Serif Display", category: "Serif", source: "google" },
  { family: "Pacifico", category: "Script", source: "google" },
  { family: "Dancing Script", category: "Script", source: "google" },
  { family: "Satisfy", category: "Script", source: "google" },
  { family: "Great Vibes", category: "Script", source: "google" },
  { family: "Kaushan Script", category: "Script", source: "google" },
  { family: "Permanent Marker", category: "Display", source: "google" },
];

const loadedFonts = new Set<string>();
const linkedFonts = new Set<string>();
const fontLinkPromises = new Map<string, Promise<void>>();

function buildGoogleFontsHref(family: string) {
  const familyQuery = family.trim().split(/\s+/).join("+");
  return `https://fonts.googleapis.com/css2?family=${familyQuery}:wght@400;500;600;700;800&display=swap`;
}

export function ensureStudioFontLink(fontFamily: string) {
  if (typeof document === "undefined") {
    return;
  }

  const existingPromise = fontLinkPromises.get(fontFamily);
  if (existingPromise) {
    return;
  }

  const linkId = `studio-font-${fontFamily.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const existing = document.getElementById(linkId) as HTMLLinkElement | null;
  if (existing) {
    linkedFonts.add(fontFamily);
    fontLinkPromises.set(
      fontFamily,
      existing.sheet
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener("error", () => resolve(), { once: true });
          }),
    );
    return;
  }

  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = buildGoogleFontsHref(fontFamily);
  const linkReady = new Promise<void>((resolve) => {
    link.addEventListener("load", () => resolve(), { once: true });
    link.addEventListener("error", () => resolve(), { once: true });
  });
  document.head.appendChild(link);
  linkedFonts.add(fontFamily);
  fontLinkPromises.set(fontFamily, linkReady);
}

export async function ensureStudioFontLoaded(fontFamily: string) {
  ensureStudioFontLink(fontFamily);

  if (
    typeof document === "undefined" ||
    typeof document.fonts === "undefined" ||
    loadedFonts.has(fontFamily)
  ) {
    return;
  }

  try {
    await fontLinkPromises.get(fontFamily);
    await Promise.all([
      document.fonts.load(`400 16px "${fontFamily}"`),
      document.fonts.load(`700 16px "${fontFamily}"`),
    ]);
    await document.fonts.ready;
    loadedFonts.add(fontFamily);
  } catch (error) {
    console.error("Failed to load studio font", { fontFamily, error });
  }
}
