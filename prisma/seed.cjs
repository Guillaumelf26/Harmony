require("dotenv").config({ path: ".env" });
const { PrismaClient, Role } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.ADMIN },
    create: { email, passwordHash, role: Role.ADMIN },
  });

  // eslint-disable-next-line no-console
  console.log(`Seeded admin user: ${email}`);
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

