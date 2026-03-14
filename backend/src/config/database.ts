import 'dotenv/config';
import { PrismaClient } from '../generated/prisma';

export const prisma = new PrismaClient();

export async function connectDB() {
  await prisma.$connect();
  console.log('Connected to MongoDB via Prisma');
}
