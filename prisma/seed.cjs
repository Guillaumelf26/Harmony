require("dotenv").config({ path: ".env" });
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "admin1234";

async function main() {
  const isProd = process.env.NODE_ENV === "production";
  const email = process.env.SEED_ADMIN_EMAIL ?? (isProd ? null : "admin@example.com");
  const password = process.env.SEED_ADMIN_PASSWORD ?? (isProd ? null : DEFAULT_PASSWORD);

  if (isProd) {
    if (!email || !password || password === DEFAULT_PASSWORD) {
      // eslint-disable-next-line no-console
      console.error(
        "ERREUR: En production, définis SEED_ADMIN_EMAIL et SEED_ADMIN_PASSWORD (différent de admin1234)."
      );
      process.exit(1);
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  // S'assurer qu'une bibliothèque par défaut existe pour cet utilisateur
  const existingLibrary = await prisma.library.findFirst({
    where: { ownerId: user.id },
  });
  if (!existingLibrary) {
    await prisma.library.create({
      data: {
        name: "Mes chants",
        ownerId: user.id,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded user: ${email}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
