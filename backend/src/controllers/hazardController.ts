import { Request, Response, NextFunction } from 'express';
import { Territory } from '../models/Territory';

export async function getHazardsByTerritory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const territory = await Territory.findById(id).lean();
    if (!territory) {
      res.status(404).json({ error: 'Territory not found' });
      return;
    }
    res.json(territory.hazards || []);
  } catch (err) {
    next(err);
  }
}

export async function getHazardsByProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const profile = req.params.profile as string;
    const territory = await Territory.findById(id).lean();
    if (!territory) {
      res.status(404).json({ error: 'Territory not found' });
      return;
    }
    const filtered = (territory.hazards || []).filter(
      (h: any) => h.affectsProfiles?.includes(profile)
    );
    res.json(filtered);
  } catch (err) {
    next(err);
  }
}
