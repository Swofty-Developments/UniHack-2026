import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '../generated/prisma';
import territoriesData from './territories.json';

const prisma = new PrismaClient({} as any);

const demoUsers = [
  { displayName: 'Alex M.', totalAreaScanned: 2350, territoriesCount: 5 },
  { displayName: 'Sarah K.', totalAreaScanned: 1800, territoriesCount: 3 },
  { displayName: 'James L.', totalAreaScanned: 1200, territoriesCount: 4 },
  { displayName: 'Priya S.', totalAreaScanned: 980, territoriesCount: 2 },
  { displayName: 'Tom W.', totalAreaScanned: 750, territoriesCount: 2 },
  { displayName: 'Emma R.', totalAreaScanned: 620, territoriesCount: 1 },
  { displayName: 'Liam C.', totalAreaScanned: 500, territoriesCount: 1 },
  { displayName: 'Zara H.', totalAreaScanned: 450, territoriesCount: 1 },
  { displayName: 'Noah B.', totalAreaScanned: 340, territoriesCount: 1 },
  { displayName: 'Olivia P.', totalAreaScanned: 280, territoriesCount: 1 },
];

async function seed() {
  console.log('Connecting to MongoDB via Prisma...');

  // Clear existing data
  await prisma.territory.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Cleared existing data.');

  // Seed users
  const users = [];
  for (const u of demoUsers) {
    const user = await prisma.user.create({
      data: {
        ...u,
        selectedProfile: 'wheelchair',
        selectedProfiles: ['wheelchair', 'limited_mobility'],
      },
    });
    users.push(user);
  }
  console.log(`Seeded ${users.length} users.`);

  // Seed territories
  for (let i = 0; i < territoriesData.length; i++) {
    const t = territoriesData[i];
    const assignedUser = users[i % users.length];

    const hazards = t.hazards.map((h: any) => ({
      ...h,
      position2D: t.center,
      detectedBy: 'ai',
    }));

    await prisma.territory.create({
      data: {
        name: t.name,
        description: t.description,
        buildingType: t.buildingType,
        areaSqMeters: t.areaSqMeters,
        polygon: t.polygon as any,
        center: t.center,
        fillColor: t.fillColor,
        claimedBy: {
          userId: assignedUser.id,
          displayName: assignedUser.displayName,
        },
        scanDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        hazards: hazards as any,
        hazardSummary: {
          total: hazards.length,
          bySeverity: {
            high: hazards.filter((h: any) => h.severity === 'high').length,
            medium: hazards.filter((h: any) => h.severity === 'medium').length,
            low: hazards.filter((h: any) => h.severity === 'low').length,
          },
        },
        status: 'active',
      },
    });

    console.log(`  Created territory: ${t.name} (${hazards.length} hazards)`);
  }

  console.log('\nSeeding complete!');
  await prisma.$disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
