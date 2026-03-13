import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { getPrimaryProfile, normalizeSelectedProfiles } from '../utils/profileSelection';

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { displayName, selectedProfile, selectedProfiles } = req.body;
    const normalizedProfiles = normalizeSelectedProfiles(selectedProfiles, selectedProfile);
    const user = await User.create({
      displayName,
      selectedProfile: getPrimaryProfile(normalizedProfiles),
      selectedProfiles: normalizedProfiles,
    });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const user = await User.findById(id).lean();
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { selectedProfile, selectedProfiles } = req.body;
    const normalizedProfiles = normalizeSelectedProfiles(selectedProfiles, selectedProfile);
    const user = await User.findByIdAndUpdate(
      id,
      {
        selectedProfile: getPrimaryProfile(normalizedProfiles),
        selectedProfiles: normalizedProfiles,
      },
      { new: true }
    ).lean();
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
}
