import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { prisma } from '../../config/database';
import { normalizeSelectedProfiles, getPrimaryProfile } from '../../utils/profileSelection';

const JWT_SECRET = process.env.JWT_SECRET || 'accessatlas-dev-secret';

function signToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        displayName: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        selectedProfiles: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(input.password, 10);
      const profiles = normalizeSelectedProfiles(input.selectedProfiles);

      const user = await prisma.user.create({
        data: {
          displayName: input.displayName,
          email: input.email,
          passwordHash,
          selectedProfile: getPrimaryProfile(profiles),
          selectedProfiles: profiles,
        },
      });

      return {
        token: signToken(user.id),
        user: {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          selectedProfiles: profiles,
        },
      };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await prisma.user.findUnique({ where: { email: input.email } });
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
      }

      return {
        token: signToken(user.id),
        user: {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          selectedProfiles: normalizeSelectedProfiles(
            user.selectedProfiles,
            user.selectedProfile
          ),
        },
      };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({ where: { id: ctx.userId } });
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }
    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      totalAreaScanned: user.totalAreaScanned,
      territoriesCount: user.territoriesCount,
      selectedProfile: user.selectedProfile,
      selectedProfiles: user.selectedProfiles,
    };
  }),
});
