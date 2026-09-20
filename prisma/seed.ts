import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.language.upsert({
    where: { code: "zh" },
    update: {},
    create: {
      code: "zh",
      name: "Chinese",
      defaultVoiceId: "zf_xiaobei",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
