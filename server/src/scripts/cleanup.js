import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clean() {
  console.log('Cleaning test users from Supabase database...');
  const keepEmails = ['kigadget.blog@gmail.com', 'dev@cuttrack.app'];

  const result = await prisma.user.deleteMany({
    where: {
      email: {
        notIn: keepEmails
      }
    }
  });

  console.log(`Successfully deleted ${result.count} test user(s).`);

  const remaining = await prisma.user.findMany({ select: { id: true, email: true, createdAt: true } });
  console.log('Remaining users in database:', remaining);

  await prisma.$disconnect();
}

clean().catch((err) => {
  console.error('Cleanup error:', err);
  prisma.$disconnect();
  process.exit(1);
});
