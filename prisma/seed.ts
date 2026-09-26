import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = 'rhrakib044@gmail.com';
  const adminPassword = '123456';

  console.log('Seeding database...');

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`Admin user ${adminEmail} already exists.`);
  } else {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        fullName: 'System Admin',
        role: 'ADMIN',
        isEmailVerified: true,
        isActive: true,
        subscription: {
          create: {
            planName: 'FREE',
            status: 'ACTIVE',
            requestLimit: 999999, // Admins get unlimited basically
            requestsUsed: 0,
          }
        }
      },
    });

    console.log(`Admin user ${adminEmail} created successfully.`);
  }

  // Seed Default AI Provider
  const defaultAiProviderKey = process.env.DEFAULT_AI_PROVIDER;
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (defaultAiProviderKey && encryptionKey) {
    const existingProvider = await prisma.provider.findFirst({
      where: { isDefault: true },
    });

    if (!existingProvider) {
      const { encrypt } = await import('../src/common/utils/encryption.util.js');
      const encryptedKey = encrypt(defaultAiProviderKey, encryptionKey);

      await prisma.provider.create({
        data: {
          name: 'OpenAI', // Can be changed later in Admin Panel
          baseUrl: 'https://api.openai.com/v1',
          apiKey: encryptedKey,
          isDefault: true,
          isActive: true,
        },
      });
      console.log('Default AI Provider seeded successfully.');
    } else {
      console.log('Default AI Provider already exists.');
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
