import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { prisma } from '../../config/database';
import { getPrimaryProfile, normalizeSelectedProfiles } from '../../utils/profileSelection';

export const userRouter = router({
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({ where: { id: input.id } });
      if (!user) throw new Error('User not found');
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

  updateProfile: protectedProcedure
    .input(
      z.object({
        selectedProfiles: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const normalizedProfiles = normalizeSelectedProfiles(input.selectedProfiles);
      const user = await prisma.user.update({
        where: { id: ctx.userId },
        data: {
          selectedProfile: getPrimaryProfile(normalizedProfiles),
          selectedProfiles: normalizedProfiles,
        },
      });
      return {
        id: user.id,
        displayName: user.displayName,
        selectedProfile: user.selectedProfile,
        selectedProfiles: user.selectedProfiles,
      };
    }),
});
