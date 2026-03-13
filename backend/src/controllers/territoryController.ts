import { Request, Response, NextFunction } from 'express';
import { Territory } from '../models/Territory';

export async function getAllTerritories(_req: Request, res: Response, next: NextFunction) {
  try {
    const territories = await Territory.find().lean();
    res.json(territories);
  } catch (err) {
    next(err);
  }
}

export async function getTerritoryById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const territory = await Territory.findById(id).lean();
    if (!territory) {
      res.status(404).json({ error: 'Territory not found' });
      return;
    }
    res.json(territory);
  } catch (err) {
    next(err);
  }
}

export async function createTerritory(req: Request, res: Response, next: NextFunction) {
  try {
    const territory = await Territory.create({
      name: req.body.name,
      description: req.body.description,
      buildingType: req.body.buildingType,
      polygon: req.body.polygon,
      center: req.body.center,
      claimedBy: {
        userId: req.body.userId,
        displayName: req.body.displayName || '',
      },
      areaSqMeters: req.body.areaSqMeters || 0,
      status: 'processing',
    });
    res.status(201).json(territory);
  } catch (err) {
    next(err);
  }
}

export async function updateTerritory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const territory = await Territory.findByIdAndUpdate(id, req.body, { new: true }).lean();
    if (!territory) {
      res.status(404).json({ error: 'Territory not found' });
      return;
    }
    res.json(territory);
  } catch (err) {
    next(err);
  }
}
