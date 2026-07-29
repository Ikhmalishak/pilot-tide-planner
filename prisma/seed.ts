import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.ruleProfile.findFirst({ where: { name: 'Default' } });
  if (existing) {
    console.log('Default profile already exists');
    return;
  }

  await prisma.ruleProfile.create({
    data: {
      name: 'Default',
      redDifference: 2.5,
      yellowDifference: 1.5,
      greenDifference: 2.5,
      yellowDisabledStart: new Date('1970-01-01T07:00:00Z'),
      yellowDisabledEnd: new Date('1970-01-01T19:00:00Z'),
      active: true,
    },
  });

  console.log('Default rule profile created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
