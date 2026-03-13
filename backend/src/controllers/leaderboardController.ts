import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

export async function getLeaderboard(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await User.find()
      .sort({ totalAreaScanned: -1 })
      .limit(50)
      .lean();
    const ranked = users.map((user, i) => ({
      userId: user._id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      totalAreaScanned: user.totalAreaScanned,
      territoriesCount: user.territoriesCount,
      rank: i + 1,
    }));
    res.json(ranked);
  } catch (err) {
    next(err);
  }
}

export async function getUserRank(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.userId as string;
    const users = await User.find().sort({ totalAreaScanned: -1 }).lean();
    const index = users.findIndex(u => u._id.toString() === userId);
    if (index === -1) {
      res.status(404).json({ error: 'User not found on leaderboard' });
      return;
    }
    const user = users[index];
    res.json({
      userId: user._id,
      displayName: user.displayName,
      totalAreaScanned: user.totalAreaScanned,
      territoriesCount: user.territoriesCount,
      rank: index + 1,
    });
  } catch (err) {
    next(err);
  }
}
