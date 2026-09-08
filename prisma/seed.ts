import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const owner = await prisma.user.upsert({
    where: { email: "owner@example.ee" },
    update: {},
    create: { email: "owner@example.ee", name: "Owner Demo", passwordHash },
  });

  const business = await prisma.business.upsert({
    where: { id: "demo-business" },
    update: {},
    create: {
      id: "demo-business",
      name: "Demo OÜ",
      registryCode: "12345678",
      vatNumber: "EE123456789",
      country: "EE",
      memberships: { create: { userId: owner.id, role: "OWNER" } },
    },
  });

  console.log(`Seeded demo business "${business.name}" — log in as owner@example.ee / password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
