import { Router } from 'express';
import * as controller from '../controllers/territoryController';

export const territoryRoutes = Router();

territoryRoutes.get('/', controller.getAllTerritories);
territoryRoutes.get('/:id', controller.getTerritoryById);
territoryRoutes.post('/', controller.createTerritory);
territoryRoutes.patch('/:id', controller.updateTerritory);
