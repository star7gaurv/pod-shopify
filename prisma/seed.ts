import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await hash("admin123456", 12);

  await prisma.user.upsert({
    where: { email: "admin@pod.star7gaurav.in" },
    update: { name: "Admin", role: "SUPER_ADMIN", password: adminPasswordHash },
    create: {
      email: "admin@pod.star7gaurav.in",
      password: adminPasswordHash,
      name: "Admin",
      role: "SUPER_ADMIN",
    },
  });

  const product = await prisma.product.upsert({
    where: { slug: "shirts" },
    update: {},
    create: { name: "Shirts", slug: "shirts", isActive: true },
  });

  const template = await prisma.template.upsert({
    where: { slug: "round-neck-half-sleeves-shirt" },
    update: {},
    create: {
      productId: product.id,
      name: "Round Neck Half Sleeves Shirt",
      slug: "round-neck-half-sleeves-shirt",
      basePrice: 89,
      baseColor: "#f8fafc",
      modelPath: "/assets/models/basic_t-shirt.glb",
      uvLayoutPath: "/assets/garments/uv-layout.png",
      isActive: true,
    },
  });

  await prisma.templateMaterial.createMany({
    data: [
      { templateId: template.id, name: "Standard Polyester", price: 89, isDefault: true, isActive: true },
      { templateId: template.id, name: "Premium Dry Fit", price: 109, isDefault: false, isActive: true },
    ],
    skipDuplicates: true,
  });

  await prisma.templateSizeChart.createMany({
    data: [
      { templateId: template.id, name: "S", description: "Chest: 38 in, Length: 27 in", sortOrder: 1 },
      { templateId: template.id, name: "M", description: "Chest: 40 in, Length: 28 in", sortOrder: 2 },
      { templateId: template.id, name: "L", description: "Chest: 42 in, Length: 29 in", sortOrder: 3 },
      { templateId: template.id, name: "XL", description: "Chest: 44 in, Length: 30 in", sortOrder: 4 },
      { templateId: template.id, name: "XXL", description: "Chest: 46 in, Length: 31 in", sortOrder: 5 },
    ],
    skipDuplicates: true,
  });

  console.log("Seed complete. Admin login: admin@pod.star7gaurav.in / admin123456");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
