import { Request, Response, NextFunction } from 'express';
import { isValidObjectId } from 'mongoose';
import { analyzeImages, summarizeHazards } from '../services/geminiService';
import { Territory } from '../models/Territory';
import { User } from '../models/User';
import { CompleteScanRequest } from '../types/scan';
import {
  buildRectanglePolygon,
  clamp,
  getFillColor,
  resolveScanCenter,
} from '../utils/territoryGeometry';
import { getPrimaryProfile, normalizeSelectedProfiles } from '../utils/profileSelection';

function summarize(hazards: Awaited<ReturnType<typeof analyzeImages>>) {
  return summarizeHazards(hazards);
}

async function resolveScanner(request: CompleteScanRequest) {
  const requestedDisplayName = request.displayName?.trim() || 'Explorer';
  const requestedProfiles = normalizeSelectedProfiles(
    request.selectedProfiles,
    request.selectedProfile
  );

  if (request.userId && isValidObjectId(request.userId)) {
    const existingUser = await User.findById(request.userId);
    if (existingUser) {
      if (request.selectedProfiles || request.selectedProfile) {
        existingUser.selectedProfiles = requestedProfiles;
        existingUser.selectedProfile = getPrimaryProfile(requestedProfiles);
        await existingUser.save();
      }

      const existingProfiles = normalizeSelectedProfiles(
        existingUser.selectedProfiles,
        existingUser.selectedProfile
      );

      return {
        user: existingUser,
        userId: existingUser._id.toString(),
        displayName: existingUser.displayName,
        selectedProfiles: existingProfiles,
      };
    }
  }

  const createdUser = await User.create({
    displayName: requestedDisplayName,
    selectedProfile: getPrimaryProfile(requestedProfiles),
    selectedProfiles: requestedProfiles,
  });

  return {
    user: createdUser,
    userId: createdUser._id.toString(),
    displayName: createdUser.displayName,
    selectedProfiles: requestedProfiles,
  };
}

export async function analyzeScan(req: Request, res: Response, next: NextFunction) {
  try {
    const { territoryId, imageUrls } = req.body;

    const hazards = await analyzeImages((imageUrls || []).map((url: string) => ({ url })));
    const summary = summarize(hazards);

    await Territory.findByIdAndUpdate(territoryId, {
      hazards,
      hazardSummary: summary,
      status: 'active',
    });

    res.json({ status: 'complete', hazards, summary });
  } catch (err) {
    next(err);
  }
}

export async function completeScan(req: Request, res: Response, next: NextFunction) {
  try {
    const request = req.body as CompleteScanRequest;

    if (!request.name?.trim()) {
      res.status(400).json({ error: 'Scan name is required.' });
      return;
    }

    if (!request.buildingType) {
      res.status(400).json({ error: 'Building type is required.' });
      return;
    }

    if (!Array.isArray(request.captures) || request.captures.length === 0) {
      res.status(400).json({ error: 'At least one captured image is required.' });
      return;
    }

    const center = resolveScanCenter(request.location);
    const widthMeters = clamp(Number(request.measurement?.widthMeters || 6), 2, 60);
    const depthMeters = clamp(Number(request.measurement?.depthMeters || 5), 2, 60);
    const estimatedAreaSqMeters = Math.round(
      clamp(
        Number(request.measurement?.estimatedAreaSqMeters || widthMeters * depthMeters),
        8,
        5000
      )
    );

    const { user, userId, displayName, selectedProfiles } = await resolveScanner(request);
    const polygon = buildRectanglePolygon({
      center,
      widthMeters,
      depthMeters,
      headingDegrees: request.location?.heading ?? 0,
    });

    const hazards = await analyzeImages(
      request.captures.slice(0, 4).map((capture) => ({
        base64: capture.base64,
        mimeType: capture.mimeType,
      }))
    );
    const summary = summarize(hazards);

    const territory = await Territory.create({
      name: request.name.trim(),
      description:
        request.description?.trim() ||
        `Camera scan completed on ${new Date().toLocaleString()} with ${request.captures.length} captured views.`,
      buildingType: request.buildingType,
      claimedBy: {
        userId,
        displayName,
      },
      scanDate: new Date(),
      areaSqMeters: estimatedAreaSqMeters,
      polygon,
      center,
      hazards,
      hazardSummary: summary,
      fillColor: getFillColor(request.buildingType),
      status: 'active',
    });

    user.totalAreaScanned += estimatedAreaSqMeters;
    user.territoriesCount += 1;
    if (request.selectedProfiles || request.selectedProfile) {
      user.selectedProfiles = selectedProfiles;
      user.selectedProfile = getPrimaryProfile(selectedProfiles);
    }
    await user.save();

    const persistedProfiles = normalizeSelectedProfiles(
      user.selectedProfiles,
      user.selectedProfile
    );

    res.status(201).json({
      status: 'complete',
      territory,
      hazards,
      summary,
      scanner: {
        id: userId,
        displayName,
        selectedProfile: getPrimaryProfile(persistedProfiles),
        selectedProfiles: persistedProfiles,
      },
      measurement: {
        estimatedAreaSqMeters,
        widthMeters,
        depthMeters,
        depthConfidence: clamp(Number(request.measurement?.depthConfidence || 0.45), 0, 1),
        captureCount: request.captures.length,
        sweepDegrees: Number(request.measurement?.sweepDegrees || 0),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getScanStatus(req: Request, res: Response) {
  res.json({
    jobId: req.params.jobId as string,
    status: 'complete',
    progress: 100,
  });
}
