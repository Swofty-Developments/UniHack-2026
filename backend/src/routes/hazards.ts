import { Router } from 'express';
import * as controller from '../controllers/hazardController';

export const hazardRoutes = Router();

hazardRoutes.get('/:id/hazards', controller.getHazardsByTerritory);
hazardRoutes.get('/:id/hazards/by-profile/:profile', controller.getHazardsByProfile);
