import { router } from './trpc';
import { authRouter } from './routers/auth';
import { territoryRouter } from './routers/territory';
import { hazardRouter } from './routers/hazard';
import { scanRouter } from './routers/scan';
import { leaderboardRouter } from './routers/leaderboard';
import { userRouter } from './routers/user';

export const appRouter = router({
  auth: authRouter,
  territory: territoryRouter,
  hazard: hazardRouter,
  scan: scanRouter,
  leaderboard: leaderboardRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
