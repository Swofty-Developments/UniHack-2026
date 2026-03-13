import { Router } from 'express';
import * as controller from '../controllers/leaderboardController';

export const leaderboardRoutes = Router();

leaderboardRoutes.get('/', controller.getLeaderboard);
leaderboardRoutes.get('/:userId', controller.getUserRank);
