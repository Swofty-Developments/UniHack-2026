import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useTerritoryStore } from '../stores/useTerritoryStore';
import { Colors } from '../constants/colors';
import { Territory } from '../types/territory';
import { formatArea } from '../utils/formatArea';
import { FLOATING_TAB_BAR_HEIGHT } from '../components/navigation/FloatingTabBar';
import {
  coerceToMonashShowcaseLocation,
  territoryIsInMonashShowcase,
} from '../constants/showcase';

type ViewerMessage =
  | { type: 'MAP_READY' }
  | { type: 'SELECT_TERRITORY'; territoryId: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'MAP_ERROR'; message?: string };

interface UserMapLocation {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  heading?: number | null;
}

const mapViewerHtml = require('../../assets/territory-map-viewer.html');

function formatBuildingType(buildingType: Territory['buildingType']) {
  return buildingType.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatHazardSummary(total: number) {
  return total === 1 ? '1 barrier' : `${total} barriers`;
}

function formatStatus(status: Territory['status']) {
  return status.replace(/\b\w/g, (character) => character.toUpperCase());
}

function toUserMapLocation(coords: Location.LocationObjectCoords): UserMapLocation {
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy,
    heading: coords.heading,
  };
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const headingSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const { territories, isLoading, error, fetchTerritories } = useTerritoryStore();
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserMapLocation | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    void fetchTerritories();
  }, [fetchTerritories]);

  const showcaseTerritories = useMemo(
    () => territories.filter((territory) => territoryIsInMonashShowcase(territory)),
    [territories]
  );

  const showcaseLocation = useMemo(
    () => coerceToMonashShowcaseLocation(userLocation),
    [userLocation]
  );

  useEffect(() => {
    if (
      selectedTerritoryId &&
      !showcaseTerritories.some((territory) => territory.id === selectedTerritoryId)
    ) {
      setSelectedTerritoryId(null);
    }
  }, [selectedTerritoryId, showcaseTerritories]);

  const selectedTerritory = useMemo(
    () => showcaseTerritories.find((territory) => territory.id === selectedTerritoryId) ?? null,
    [selectedTerritoryId, showcaseTerritories]
  );

  const postToViewer = useCallback(
    (message: Record<string, unknown>) => {
      if (!viewerReady || !webViewRef.current) {
        return;
      }

      webViewRef.current.postMessage(JSON.stringify(message));
    },
    [viewerReady]
  );

  const bootstrapLocationTracking = useCallback(async () => {
    setIsLocating(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationDenied(true);
        return;
      }

      setLocationDenied(false);

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation(toUserMapLocation(currentPosition.coords));

      headingSubscriptionRef.current?.remove();
      headingSubscriptionRef.current = await Location.watchHeadingAsync((heading) => {
        const resolvedHeading =
          heading.trueHeading >= 0 && Number.isFinite(heading.trueHeading)
            ? heading.trueHeading
            : heading.magHeading;

        if (!Number.isFinite(resolvedHeading)) {
          return;
        }

        setUserLocation((currentLocation) => {
          if (!currentLocation) {
            return currentLocation;
          }

          return {
            ...currentLocation,
            heading: resolvedHeading,
          };
        });
      });

      locationSubscriptionRef.current?.remove();
      locationSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 15,
          timeInterval: 15000,
        },
        (position) => {
          setUserLocation(toUserMapLocation(position.coords));
        }
      );
    } catch {
      setLocationDenied(true);
    } finally {
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    void bootstrapLocationTracking();

    return () => {
      locationSubscriptionRef.current?.remove();
      locationSubscriptionRef.current = null;
      headingSubscriptionRef.current?.remove();
      headingSubscriptionRef.current = null;
    };
  }, [bootstrapLocationTracking]);

  useEffect(() => {
    if (!viewerReady) {
      return;
    }

    postToViewer({
      type: 'SET_TERRITORIES',
      territories: showcaseTerritories.map((territory) => ({
        id: territory.id,
        name: territory.name,
        buildingType: territory.buildingType,
        fillColor: territory.fillColor,
        areaSqMeters: territory.areaSqMeters,
        center: territory.center,
        polygon: territory.polygon,
        claimedByName: territory.claimedBy.displayName,
        hazardTotal: territory.hazardSummary.total,
        status: territory.status,
      })),
    });
  }, [postToViewer, showcaseTerritories, viewerReady]);

  useEffect(() => {
    if (!viewerReady) {
      return;
    }

    postToViewer({
      type: 'SET_USER_LOCATION',
      location: showcaseLocation,
    });
  }, [postToViewer, showcaseLocation, viewerReady]);

  useEffect(() => {
    if (!viewerReady) {
      return;
    }

    if (selectedTerritoryId) {
      postToViewer({
        type: 'SELECT_TERRITORY',
        territoryId: selectedTerritoryId,
      });
      return;
    }

    postToViewer({ type: 'CLEAR_SELECTION' });
  }, [postToViewer, selectedTerritoryId, viewerReady]);

  const onWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    let payload: ViewerMessage;

    try {
      payload = JSON.parse(event.nativeEvent.data) as ViewerMessage;
    } catch {
      return;
    }

    if (payload.type === 'MAP_READY') {
      setViewerReady(true);
      setViewerError(null);
      return;
    }

    if (payload.type === 'SELECT_TERRITORY') {
      setSelectedTerritoryId(payload.territoryId);
      return;
    }

    if (payload.type === 'CLEAR_SELECTION') {
      setSelectedTerritoryId(null);
      return;
    }

    if (payload.type === 'MAP_ERROR') {
      setViewerError(payload.message || 'Map renderer failed to load.');
    }
  }, []);

  const handleLocatePress = useCallback(async () => {
    if (showcaseLocation) {
      postToViewer({ type: 'FOCUS_USER_LOCATION' });
      return;
    }

    setIsLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationDenied(true);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const nextLocation = toUserMapLocation(position.coords);
      setLocationDenied(false);
      setUserLocation(nextLocation);

      if (viewerReady) {
        postToViewer({
          type: 'SET_USER_LOCATION',
          location: coerceToMonashShowcaseLocation(nextLocation),
        });
        postToViewer({ type: 'FOCUS_USER_LOCATION' });
      }
    } catch {
      setLocationDenied(true);
    } finally {
      setIsLocating(false);
    }
  }, [postToViewer, showcaseLocation, viewerReady]);

  const handleCloseSelection = useCallback(() => {
    setSelectedTerritoryId(null);
    postToViewer({ type: 'CLEAR_SELECTION' });
  }, [postToViewer]);

  const errorMessage = viewerError || error;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={mapViewerHtml}
        style={styles.webview}
        onMessage={onWebViewMessage}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        originWhitelist={['*']}
      />

      <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
        {errorMessage ? (
          <View style={[styles.errorBanner, { top: insets.top + 14 }]}>
            <Text style={styles.errorText} numberOfLines={2}>
              {errorMessage}
            </Text>
            <TouchableOpacity
              style={styles.errorAction}
              onPress={() => {
                setViewerError(null);
                setViewerReady(false);
                webViewRef.current?.reload();
                void fetchTerritories();
              }}
              activeOpacity={0.92}
            >
              <Ionicons name="refresh" size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={[styles.controlStack, { top: insets.top + 18 }]}>
          <TouchableOpacity
            style={[styles.iconButton, locationDenied && styles.iconButtonMuted]}
            onPress={() => void handleLocatePress()}
            activeOpacity={0.92}
          >
            {isLocating ? (
              <ActivityIndicator color={Colors.text} />
            ) : (
              <Ionicons
                name={locationDenied ? 'location-outline' : 'locate-outline'}
                size={20}
                color={Colors.text}
              />
            )}
          </TouchableOpacity>
        </View>

        {selectedTerritory ? (
          <View style={[styles.selectionSheet, { bottom: insets.bottom + FLOATING_TAB_BAR_HEIGHT + 12 }]}>
            <View style={styles.selectionHeader}>
              <View style={styles.selectionTitleBlock}>
                <Text style={styles.selectionTitle}>{selectedTerritory.name}</Text>
                <Text style={styles.selectionSubtitle}>
                  {formatBuildingType(selectedTerritory.buildingType)} | {formatArea(selectedTerritory.areaSqMeters)}
                </Text>
              </View>
              <View style={styles.selectionHeaderRight}>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{formatStatus(selectedTerritory.status)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCloseSelection}
                  activeOpacity={0.92}
                >
                  <Ionicons name="close" size={16} color={Colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.selectionDescription} numberOfLines={2}>
              {selectedTerritory.description}
            </Text>

            <View style={styles.selectionMetaRow}>
              <View style={styles.metaPill}>
                <Ionicons name="warning-outline" size={14} color={Colors.primaryLight} />
                <Text style={styles.metaText}>
                  {formatHazardSummary(selectedTerritory.hazardSummary.total)}
                </Text>
              </View>
              <View style={styles.metaPill}>
                <Ionicons name="person-outline" size={14} color={Colors.primaryLight} />
                <Text style={styles.metaText}>{selectedTerritory.claimedBy.displayName}</Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>

      {(isLoading || !viewerReady) && !viewerError ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1, backgroundColor: Colors.background },
  controlStack: {
    position: 'absolute',
    right: 16,
    gap: 10,
  },
  iconButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonMuted: {
    backgroundColor: 'rgba(30, 41, 59, 0.92)',
  },
  errorBanner: {
    position: 'absolute',
    left: 16,
    right: 74,
    backgroundColor: 'rgba(127, 29, 29, 0.94)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    flex: 1,
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  errorAction: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(239, 68, 68, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionSheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.22)',
    padding: 18,
    gap: 14,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  selectionTitleBlock: {
    flex: 1,
    gap: 4,
  },
  selectionTitle: {
    color: Colors.text,
    fontSize: 21,
    fontWeight: '700',
  },
  selectionSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  selectionHeaderRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillText: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.96)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionDescription: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  selectionMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.94)',
  },
  metaText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.24)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
