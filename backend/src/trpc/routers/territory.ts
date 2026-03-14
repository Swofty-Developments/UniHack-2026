import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { prisma } from '../../config/database';

const coordinateSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const territoryRouter = router({
  getAll: publicProcedure.query(async () => {
    return prisma.territory.findMany({ orderBy: { createdAt: 'desc' } });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const territory = await prisma.territory.findUnique({ where: { id: input.id } });
      if (!territory) throw new Error('Territory not found');
      return territory;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        buildingType: z.string(),
        polygon: z.object({ coordinates: z.array(coordinateSchema) }),
        center: coordinateSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      return prisma.territory.create({
        data: {
          name: input.name,
          description: input.description,
          buildingType: input.buildingType,
          polygon: { coordinates: input.polygon.coordinates },
          center: input.center,
          claimedBy: { userId: ctx.userId, displayName: '' },
          status: 'processing',
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.record(z.string(), z.unknown()),
      })
    )
    .mutation(async ({ input }) => {
      const territory = await prisma.territory.update({
        where: { id: input.id },
        data: input.data as any,
      });
      return territory;
    }),
});
