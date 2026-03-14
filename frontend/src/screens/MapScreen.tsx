import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '../utils/trpc';
import { Colors } from '../constants/colors';
import { FLOATING_TAB_BAR_HEIGHT } from '../components/navigation/FloatingTabBar';
import {
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_STYLE_URL,
  INITIAL_CENTER,
  INITIAL_ZOOM,
  INITIAL_PITCH,
} from '../constants/mapConfig';
import { coerceToMonashShowcaseLocation, territoryIsInMonashShowcase } from '../constants/showcase';
import { useLocationTracking } from '../hooks/useLocationTracking';
import { Territory } from '../types/territory';
import { TerritorySelectionSheet } from '../components/map/TerritorySelectionSheet';
import { buildTerritoriesGeoJSON, buildCentersGeoJSON } from '../utils/territoryGeoJSON';
import { useFadeIn, usePulse } from '../hooks/useAnimations';

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

function getDistanceMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<Mapbox.Camera | null>(null);
  const { data: rawTerritories = [], isLoading, error: queryError, refetch } = trpc.territory.getAll.useQuery();
  const territories: Territory[] = rawTerritories as Territory[];
  const error = queryError?.message ?? null;
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);
  const { userLocation, locationDenied, isLocating, requestLocation } = useLocationTracking();

  const controlsFade = useFadeIn(300);
  const livePulse = usePulse(2400);

  const showcaseTerritories = useMemo(
    () => territories.filter((t) => territoryIsInMonashShowcase(t)),
    [territories],
  );

  // Auto-request location on mount so the blue dot shows
  useEffect(() => {
    void requestLocation();
  }, []);

  useEffect(() => {
    if (selectedTerritoryId && !showcaseTerritories.some((t) => t.id === selectedTerritoryId)) {
      setSelectedTerritoryId(null);
    }
  }, [selectedTerritoryId, showcaseTerritories]);

  const selectedTerritory = useMemo(
    () => showcaseTerritories.find((t) => t.id === selectedTerritoryId) ?? null,
    [selectedTerritoryId, showcaseTerritories],
  );

  const userDistanceToSelected = useMemo(() => {
    if (!selectedTerritory?.center || !userLocation) return null;
    return getDistanceMeters(
      userLocation.latitude,
      userLocation.longitude,
      selectedTerritory.center.latitude,
      selectedTerritory.center.longitude,
    );
  }, [selectedTerritory, userLocation]);

  const territoriesGeoJSON = useMemo(
    () => buildTerritoriesGeoJSON(showcaseTerritories),
    [showcaseTerritories],
  );

  const centersGeoJSON = useMemo(
    () => buildCentersGeoJSON(showcaseTerritories),
    [showcaseTerritories],
  );

  const handleTerritoryPress = useCallback(
    (event: any) => {
      const id = event.features?.[0]?.properties?.id;
      if (!id) return;
      setSelectedTerritoryId(id);
      const territory = showcaseTerritories.find((t) => t.id === id);
      if (territory?.center) {
        cameraRef.current?.setCamera({
          centerCoordinate: [territory.center.longitude, territory.center.latitude],
          zoomLevel: 17.5,
          animationDuration: 600,
        });
      }
    },
    [showcaseTerritories],
  );

  const handleLocatePress = useCallback(async () => {
    const loc = userLocation ?? (await requestLocation());
    if (!loc) return;
    const coerced = coerceToMonashShowcaseLocation(loc);
    if (coerced) {
      cameraRef.current?.setCamera({
        centerCoordinate: [coerced.longitude, coerced.latitude],
        zoomLevel: 17,
        animationDuration: 600,
      });
    }
  }, [userLocation, requestLocation]);

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={MAPBOX_STYLE_URL}
        onPress={() => setSelectedTerritoryId(null)}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: INITIAL_CENTER,
            zoomLevel: INITIAL_ZOOM,
            pitch: INITIAL_PITCH,
          }}
        />

        <Mapbox.UserLocation
          visible
          animated
          renderMode="native"
          androidRenderMode="compass"
          showsUserHeadingIndicator
        />

        <Mapbox.ShapeSource
          id="territories"
          shape={territoriesGeoJSON}
          onPress={handleTerritoryPress}
        >
          <Mapbox.FillLayer
            id="territory-fills"
            minZoomLevel={0}
            maxZoomLevel={24}
            filter={['!=', ['get', 'id'], selectedTerritoryId ?? '']}
            style={{
              fillColor: ['get', 'fillColor'],
              fillOpacity: 0.35,
            }}
          />
          <Mapbox.FillLayer
            id="selected-fill"
            minZoomLevel={0}
            maxZoomLevel={24}
            filter={['==', ['get', 'id'], selectedTerritoryId ?? '']}
            style={{
              fillColor: ['get', 'fillColor'],
              fillOpacity: 0.6,
            }}
          />
          <Mapbox.LineLayer
            id="territory-outlines"
            style={{
              lineColor: ['get', 'fillColor'],
              lineWidth: 2,
              lineOpacity: 0.8,
            }}
          />
        </Mapbox.ShapeSource>

        <Mapbox.ShapeSource id="territory-centers" shape={centersGeoJSON}>
          <Mapbox.CircleLayer
            id="territory-markers"
            style={{
              circleColor: ['get', 'fillColor'],
              circleRadius: 5,
              circleStrokeColor: 'rgba(255,255,255,0.6)',
              circleStrokeWidth: 1.5,
            }}
          />
        </Mapbox.ShapeSource>
      </Mapbox.MapView>

      {/* Top header overlay */}
      <Animated.View style={[styles.headerOverlay, { top: insets.top + 12 }, controlsFade]}>
        <View style={styles.headerCard}>
          <Ionicons name="map" size={16} color={Colors.primary} />
          <Text style={styles.headerTitle}>AccessAtlas</Text>
          <Animated.View style={[styles.liveDot, livePulse]} />
        </View>
      </Animated.View>

      {error ? (
        <View style={[styles.errorBanner, { top: insets.top + 58 }]}>
          <Ionicons name="alert-circle" size={16} color={Colors.hazardHigh} />
          <Text style={styles.errorText} numberOfLines={2}>{error}</Text>
          <TouchableOpacity
            style={styles.errorAction}
            onPress={() => void refetch()}
            activeOpacity={0.92}
            accessibilityRole="button"
            accessibilityLabel="Retry loading territories"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="refresh" size={14} color={Colors.white} />
          </TouchableOpacity>
        </View>
      ) : null}

      <Animated.View style={[styles.controlStack, { top: insets.top + 12 }, controlsFade]}>
        <TouchableOpacity
          style={[styles.iconButton, locationDenied && styles.iconButtonMuted]}
          onPress={() => void handleLocatePress()}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={locationDenied ? 'Enable location access' : 'Center on my location'}
          accessibilityState={{ disabled: isLocating }}
        >
          {isLocating ? (
            <ActivityIndicator color={Colors.primary} size="small" />
          ) : (
            <Ionicons
              name={locationDenied ? 'location-outline' : 'locate-outline'}
              size={20}
              color={Colors.primary}
            />
          )}
        </TouchableOpacity>
      </Animated.View>

      {selectedTerritory ? (
        <TerritorySelectionSheet
          territory={selectedTerritory}
          userDistance={userDistanceToSelected}
          onClose={() => setSelectedTerritoryId(null)}
          style={{ bottom: insets.bottom + FLOATING_TAB_BAR_HEIGHT + 12 }}
        />
      ) : null}

      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading territories</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  headerOverlay: { position: 'absolute', left: 16 },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.overlay,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  controlStack: { position: 'absolute', right: 16, gap: 10 },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.overlay,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonMuted: { backgroundColor: Colors.overlayMedium },
  errorBanner: {
    position: 'absolute',
    left: 16,
    right: 74,
    backgroundColor: Colors.hazardHigh + '22',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorText: { flex: 1, color: Colors.white, fontSize: 12, fontWeight: '600', lineHeight: 18 },
  errorAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.hazardHigh + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.overlayHeavy,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  loadingText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
});
