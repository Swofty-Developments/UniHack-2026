import { Router } from 'express';
import * as controller from '../controllers/scanController';

export const scanRoutes = Router();

scanRoutes.post('/analyze', controller.analyzeScan);
scanRoutes.post('/complete', controller.completeScan);
scanRoutes.get('/status/:jobId', controller.getScanStatus);
