import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { prisma } from '../../config/database';
import { analyzeImages, summarizeHazards } from '../../services/geminiService';
import {
  buildRectanglePolygon,
  clamp,
  getFillColor,
  resolveScanCenter,
} from '../../utils/territoryGeometry';
import { getPrimaryProfile, normalizeSelectedProfiles } from '../../utils/profileSelection';

const locationSchema = z
  .object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().nullable().optional(),
    heading: z.number().nullable().optional(),
  })
  .nullable()
  .optional();

export const scanRouter = router({
  analyze: publicProcedure
    .input(
      z.object({
        territoryId: z.string(),
        imageUrls: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const hazards = await analyzeImages(
        (input.imageUrls || []).map((url) => ({ url }))
      );
      const summary = summarizeHazards(hazards);

      await prisma.territory.update({
        where: { id: input.territoryId },
        data: {
          hazards: hazards as any,
          hazardSummary: summary as any,
          status: 'active',
        },
      });

      return { status: 'complete' as const, hazards, summary };
    }),

  /**
   * Complete a scan from an already-uploaded GLB file.
   * The main upload flow goes through the Express POST /api/upload-scan endpoint
   * because tRPC doesn't handle multipart uploads well. This tRPC mutation is
   * provided as an alternative when the file has already been uploaded and we
   * just need to create the territory record.
   */
  completeFromUpload: publicProcedure
    .input(
      z.object({
        fileUrl: z.string().min(1, 'fileUrl is required'),
        name: z.string().min(1, 'Scan name is required'),
        buildingType: z.string(),
        location: locationSchema,
        userId: z.string().nullable().optional(),
        displayName: z.string().nullable().optional(),
        selectedProfiles: z.array(z.string()).optional(),
        areaSqMeters: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const center = resolveScanCenter(input.location);
      const areaSqMeters = clamp(input.areaSqMeters ?? 25, 8, 5000);
      const side = Math.sqrt(areaSqMeters);

      const requestedDisplayName = input.displayName?.trim() || 'Explorer';
      const requestedProfiles = normalizeSelectedProfiles(
        input.selectedProfiles,
        undefined
      );

      // Find or create user
      let user;
      if (input.userId) {
        user = await prisma.user
          .findUnique({ where: { id: input.userId } })
          .catch(() => null);
      }

      if (user) {
        if (input.selectedProfiles) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              selectedProfiles: requestedProfiles,
              selectedProfile: getPrimaryProfile(requestedProfiles),
            },
          });
        }
      } else {
        user = await prisma.user.create({
          data: {
            displayName: requestedDisplayName,
            selectedProfile: getPrimaryProfile(requestedProfiles),
            selectedProfiles: requestedProfiles,
          },
        });
      }

      const userId = user.id;
      const displayName = user.displayName;
      const selectedProfiles = normalizeSelectedProfiles(
        user.selectedProfiles,
        user.selectedProfile
      );

      const polygon = buildRectanglePolygon({
        center,
        widthMeters: side,
        depthMeters: side,
        headingDegrees: input.location?.heading ?? 0,
      });

      // Create territory with no hazard analysis (file already uploaded,
      // caller can trigger analyze separately if needed)
      const territory = await prisma.territory.create({
        data: {
          name: input.name.trim(),
          description: `LiDAR scan uploaded on ${new Date().toLocaleString()}.`,
          buildingType: input.buildingType,
          claimedBy: { userId, displayName },
          scanDate: new Date(),
          areaSqMeters,
          polygon: { coordinates: polygon.coordinates },
          center,
          modelUrl: input.fileUrl,
          hazards: [],
          hazardSummary: { total: 0, bySeverity: { high: 0, medium: 0, low: 0 } },
          fillColor: getFillColor(input.buildingType as any),
          status: 'pending',
        },
      });

      // Update user stats
      user = await prisma.user.update({
        where: { id: userId },
        data: {
          totalAreaScanned: { increment: areaSqMeters },
          territoriesCount: { increment: 1 },
        },
      });

      const persistedProfiles = normalizeSelectedProfiles(
        user.selectedProfiles,
        user.selectedProfile
      );

      return {
        status: 'complete' as const,
        territory,
        scanner: {
          id: userId,
          displayName,
          selectedProfile: getPrimaryProfile(persistedProfiles),
          selectedProfiles: persistedProfiles,
        },
        measurement: {
          estimatedAreaSqMeters: areaSqMeters,
        },
      };
    }),

  status: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .query(({ input }) => ({
      jobId: input.jobId,
      status: 'complete' as const,
      progress: 100,
    })),
});
