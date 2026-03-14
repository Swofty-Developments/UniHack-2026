import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { prisma } from '../../config/database';

export const leaderboardRouter = router({
  getAll: publicProcedure.query(async () => {
    const users = await prisma.user.findMany({
      orderBy: { totalAreaScanned: 'desc' },
      take: 50,
    });
    return users.map((user, i) => ({
      userId: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      totalAreaScanned: user.totalAreaScanned,
      territoriesCount: user.territoriesCount,
      rank: i + 1,
    }));
  }),

  getUserRank: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const users = await prisma.user.findMany({
        orderBy: { totalAreaScanned: 'desc' },
      });
      const index = users.findIndex((u) => u.id === input.userId);
      if (index === -1) throw new Error('User not found on leaderboard');
      const user = users[index];
      return {
        userId: user.id,
        displayName: user.displayName,
        totalAreaScanned: user.totalAreaScanned,
        territoriesCount: user.territoriesCount,
        rank: index + 1,
      };
    }),
});
