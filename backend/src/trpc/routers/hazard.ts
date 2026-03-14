import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { prisma } from '../../config/database';

export const hazardRouter = router({
  getByTerritory: publicProcedure
    .input(z.object({ territoryId: z.string() }))
    .query(async ({ input }) => {
      const territory = await prisma.territory.findUnique({ where: { id: input.territoryId } });
      if (!territory) throw new Error('Territory not found');
      return territory.hazards || [];
    }),

  getByProfile: publicProcedure
    .input(z.object({ territoryId: z.string(), profile: z.string() }))
    .query(async ({ input }) => {
      const territory = await prisma.territory.findUnique({ where: { id: input.territoryId } });
      if (!territory) throw new Error('Territory not found');
      return (territory.hazards || []).filter(
        (h) => h.affectsProfiles?.includes(input.profile)
      );
    }),
});
