import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { territoryRoutes } from './routes/territories';
import { hazardRoutes } from './routes/hazards';
import { leaderboardRoutes } from './routes/leaderboard';
import { scanRoutes } from './routes/scan';
import { userRoutes } from './routes/users';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/territories', territoryRoutes);
app.use('/api/territories', hazardRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/users', userRoutes);

app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`AccessAtlas backend running on port ${PORT}`);
  });
});

export default app;
