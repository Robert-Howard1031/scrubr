import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Video } from 'expo-av';
import { RootStackParamList } from '../types';
import { PrimaryButton } from '../components/PrimaryButton';
import { UndoToast } from '../components/UndoToast';
import { formatBytesToGB, formatDuration } from '../utils/format';
import { getAssetSizeBytes } from '../utils/media';
import { useStats } from '../context/StatsContext';
import { colors } from '../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Swipe'>;

const PAGE_SIZE = 40;
const UNDO_WINDOW_MS = 7000;

const noop = () => {};

type PendingDeletion = {
  id: string;
  asset: MediaLibrary.Asset;
  sizeBytes: number;
  index: number;
  timer: ReturnType<typeof setTimeout>;
};

export function SwipeScreen({ navigation, route }: Props) {
  const { filter } = route.params;
  const { width } = useWindowDimensions();
  const { applyDeletionDelta, recordDeletionSuccessForToday, incrementSessions } = useStats();
  const [deck, setDeck] = useState<MediaLibrary.Asset[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [videoPlaybackUri, setVideoPlaybackUri] = useState<string | null>(null);
  const [videoThumbnailUri, setVideoThumbnailUri] = useState<string | null>(null);
  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);
  const [sessionDeletedCount, setSessionDeletedCount] = useState(0);
  const [sessionFreedBytes, setSessionFreedBytes] = useState(0);
  const [toastId, setToastId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('Deleted - Undo');
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const sizeCache = useRef(new Map<string, number>());
  const pendingRef = useRef(new Map<string, PendingDeletion>());
  const videoThumbnailCache = useRef(new Map<string, string>());
  const screenshotAlbumRef = useRef<MediaLibrary.Album | null>(null);
  const isMountedRef = useRef(true);

  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const swipeThreshold = width * 0.25;

  const currentAsset = deck[currentIndex];
  const nextAsset = deck[currentIndex + 1];

  const filterLabel = filter === 'photos' ? 'Photos' : filter === 'videos' ? 'Videos' : 'Screenshots';

  useEffect(() => {
    let isActive = true;
    if (currentAsset?.mediaType === 'photo') {
      MediaLibrary.getAssetInfoAsync(currentAsset)
        .then((info) => {
          if (!isActive) return;
          const uri = info.localUri ?? info.uri ?? currentAsset.uri;
          setImagePreviewUri(uri);
        })
        .catch(() => {
          if (!isActive) return;
          setImagePreviewUri(currentAsset?.uri ?? null);
        });
    } else {
      setImagePreviewUri(null);
    }

    if (currentAsset?.mediaType === 'video') {
      const cached = videoThumbnailCache.current.get(currentAsset.id);
      if (cached) {
        setVideoThumbnailUri(cached);
        return;
      }
      VideoThumbnails.getThumbnailAsync(currentAsset.uri, { time: 1000 })
        .then(({ uri }) => {
          if (!isActive) return;
          videoThumbnailCache.current.set(currentAsset.id, uri);
          setVideoThumbnailUri(uri);
        })
        .catch(() => {
          if (!isActive) return;
          setVideoThumbnailUri(null);
        });
    } else {
      setVideoThumbnailUri(null);
    }

    return () => {
      isActive = false;
    };
  }, [currentAsset]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      const pendingItems = Array.from(pendingRef.current.values());
      pendingItems.forEach((pending) => {
        clearTimeout(pending.timer);
        MediaLibrary.deleteAssetsAsync([pending.asset])
          .then((success) => {
            if (success) {
              recordDeletionSuccessForToday();
            } else {
              applyDeletionDelta(-1, -pending.sizeBytes);
            }
          })
          .catch(() => {
            applyDeletionDelta(-1, -pending.sizeBytes);
          });
      });
      pendingRef.current.clear();
    };
  }, [applyDeletionDelta, recordDeletionSuccessForToday]);

  const preloadSize = useCallback(async (asset?: MediaLibrary.Asset) => {
    if (!asset) return;
    if (sizeCache.current.has(asset.id)) return;
    const size = await getAssetSizeBytes(asset);
    sizeCache.current.set(asset.id, size);
  }, []);

  useEffect(() => {
    void preloadSize(currentAsset);
    void preloadSize(nextAsset);
  }, [currentAsset, nextAsset, preloadSize]);

  const resolveScreenshotAlbum = useCallback(async () => {
    const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
    return albums.find((album) => album.title.toLowerCase().includes('screenshot')) ?? null;
  }, []);

  const fetchAssets = useCallback(
    async (after?: string | null) => {
      if (isLoading) return;
      setIsLoading(true);
      try {
        let album: MediaLibrary.Album | null = null;
        const options: MediaLibrary.AssetsOptions = {
          first: PAGE_SIZE,
          after: after ?? undefined,
          sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        };

        if (filter === 'videos') {
          options.mediaType = [MediaLibrary.MediaType.video];
        } else {
          options.mediaType = [MediaLibrary.MediaType.photo];
        }

        if (filter === 'screenshots') {
          if (Platform.OS === 'ios') {
            options.mediaSubtypes = ['screenshot'];
          }
          if (!screenshotAlbumRef.current) {
            screenshotAlbumRef.current = await resolveScreenshotAlbum();
          }
          album = screenshotAlbumRef.current;
          if (album) options.album = album;
        }

        const result = await MediaLibrary.getAssetsAsync(options);
        setDeck((prev) => (after ? [...prev, ...result.assets] : result.assets));
        setCursor(result.endCursor);
        setHasNextPage(result.hasNextPage);
      } finally {
        setIsLoading(false);
      }
    },
    [filter, isLoading, resolveScreenshotAlbum]
  );

  useEffect(() => {
    setDeck([]);
    setCurrentIndex(0);
    setCursor(null);
    setHasNextPage(true);
    setSessionDeletedCount(0);
    setSessionFreedBytes(0);
    setSessionCompleted(false);
    void fetchAssets(null);
  }, [fetchAssets]);

  useEffect(() => {
    if (deck.length - currentIndex <= 5 && hasNextPage && !isLoading) {
      void fetchAssets(cursor);
    }
  }, [deck.length, currentIndex, hasNextPage, isLoading, cursor, fetchAssets]);

  useEffect(() => {
    if (!hasNextPage && deck.length === 0 && !sessionCompleted) {
      setSessionCompleted(true);
      incrementSessions();
    }
  }, [deck.length, hasNextPage, incrementSessions, sessionCompleted]);

  const removeFromDeck = (index: number) => {
    setDeck((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      if (index >= next.length) {
        setCurrentIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const restoreToDeck = (asset: MediaLibrary.Asset, index: number) => {
    setDeck((prev) => {
      const next = [...prev];
      const targetIndex = Math.min(index, next.length);
      next.splice(targetIndex, 0, asset);
      setCurrentIndex(targetIndex);
      return next;
    });
  };

  const updateSessionStats = useCallback((countDelta: number, bytesDelta: number) => {
    setSessionDeletedCount((prev) => Math.max(0, prev + countDelta));
    setSessionFreedBytes((prev) => Math.max(0, prev + bytesDelta));
  }, []);

  const scheduleDeletionCommit = useCallback(
    (pending: PendingDeletion) => {
      const timer = setTimeout(async () => {
        pendingRef.current.delete(pending.id);
        if (isMountedRef.current) {
          setToastId((current) => (current === pending.id ? null : current));
        }
        try {
          const success = await MediaLibrary.deleteAssetsAsync([pending.asset]);
          if (success) {
            recordDeletionSuccessForToday();
          } else {
            applyDeletionDelta(-1, -pending.sizeBytes);
            if (isMountedRef.current) {
              updateSessionStats(-1, -pending.sizeBytes);
              setToastMessage('Delete failed - Stats restored');
              setToastId(`${pending.id}-error`);
              setTimeout(() => setToastId(null), 2500);
            }
          }
        } catch (error) {
          applyDeletionDelta(-1, -pending.sizeBytes);
          if (isMountedRef.current) {
            updateSessionStats(-1, -pending.sizeBytes);
            setToastMessage('Delete failed - Stats restored');
            setToastId(`${pending.id}-error`);
            setTimeout(() => setToastId(null), 2500);
          }
        }
      }, UNDO_WINDOW_MS);

      pendingRef.current.set(pending.id, { ...pending, timer });
    },
    [applyDeletionDelta, recordDeletionSuccessForToday, updateSessionStats]
  );

  const handleDelete = useCallback(
    async (asset: MediaLibrary.Asset, index: number) => {
      removeFromDeck(index);
      position.setValue({ x: 0, y: 0 });
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        noop();
      }

      const cachedSize = sizeCache.current.get(asset.id);
      const initialSize = cachedSize ?? 0;

      updateSessionStats(1, initialSize);
      applyDeletionDelta(1, initialSize);

      const pending: PendingDeletion = {
        id: asset.id,
        asset,
        sizeBytes: initialSize,
        index,
        timer: setTimeout(noop, 0),
      };

      setToastMessage('Deleted - Undo');
      setToastId(asset.id);
      scheduleDeletionCommit(pending);

      if (cachedSize == null) {
        const actualSize = await getAssetSizeBytes(asset);
        sizeCache.current.set(asset.id, actualSize);
        const diff = actualSize - initialSize;
        if (diff !== 0) {
          applyDeletionDelta(0, diff);
          const existing = pendingRef.current.get(asset.id);
          if (existing) {
            pendingRef.current.set(asset.id, { ...existing, sizeBytes: actualSize });
          }
          if (isMountedRef.current) {
            updateSessionStats(0, diff);
          }
        }
      }
    },
    [applyDeletionDelta, position, scheduleDeletionCommit, updateSessionStats]
  );

  const handleKeep = useCallback(
    async (asset: MediaLibrary.Asset, index: number) => {
      removeFromDeck(index);
      position.setValue({ x: 0, y: 0 });
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        noop();
      }
    },
    [position]
  );

  const animateOffScreen = useCallback(
    (direction: 'left' | 'right') => {
      if (!currentAsset) return;
      const toValue = direction === 'right' ? width * 1.2 : -width * 1.2;
      Animated.timing(position, {
        toValue: { x: toValue, y: 0 },
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        if (direction === 'right') {
          void handleKeep(currentAsset, currentIndex);
        } else {
          void handleDelete(currentAsset, currentIndex);
        }
      });
    },
    [currentAsset, currentIndex, handleDelete, handleKeep, position, width]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !isVideoOpen,
        onMoveShouldSetPanResponder: () => !isVideoOpen,
        onPanResponderMove: (_, gesture) => {
          position.setValue({ x: gesture.dx, y: gesture.dy });
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > swipeThreshold) {
            animateOffScreen('right');
          } else if (gesture.dx < -swipeThreshold) {
            animateOffScreen('left');
          } else {
            Animated.spring(position, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [animateOffScreen, isVideoOpen, position, swipeThreshold]
  );

  const handleUndo = () => {
    if (!toastId) return;
    const pending = pendingRef.current.get(toastId);
    if (!pending) {
      return;
    }
    clearTimeout(pending.timer);
    pendingRef.current.delete(pending.id);
    restoreToDeck(pending.asset, pending.index);
    updateSessionStats(-1, -pending.sizeBytes);
    applyDeletionDelta(-1, -pending.sizeBytes);
    setToastId(null);
  };

  const openVideo = useCallback(async () => {
    if (!currentAsset || currentAsset.mediaType !== 'video') return;
    setVideoPlaybackUri(null);
    setIsVideoOpen(true);
    try {
      const info = await MediaLibrary.getAssetInfoAsync(currentAsset);
      const uri = info.localUri ?? info.uri ?? currentAsset.uri;
      if (isMountedRef.current) {
        setVideoPlaybackUri(uri);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setVideoPlaybackUri(currentAsset.uri);
      }
    }
  }, [currentAsset]);

  const isEmpty = !isLoading && deck.length === 0 && !hasNextPage;
  const isLoadingInitial = isLoading && deck.length === 0;
  const canUndo = toastId ? pendingRef.current.has(toastId) : false;

  const rotate = position.x.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  const animatedCardStyle = {
    transform: [...position.getTranslateTransform(), { rotate }],
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.filterLabel}>{filterLabel}</Text>
          <Text style={styles.sessionText}>
            {sessionDeletedCount} deleted - {formatBytesToGB(sessionFreedBytes)} GB
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.deckArea}>
        {isLoadingInitial ? <Text style={styles.loadingText}>Loading your library...</Text> : null}

        {isEmpty ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyText}>You have no more items in this filter.</Text>
            <View style={styles.emptyButton}>
              <PrimaryButton label="Back to Home" onPress={() => navigation.goBack()} variant="neutral" />
            </View>
          </View>
        ) : null}

        {!isEmpty && currentAsset ? (
          <View style={styles.cardStack}>
            {nextAsset ? <View style={styles.cardShadow} /> : null}
            <Animated.View style={[styles.card, animatedCardStyle]} {...panResponder.panHandlers}>
              <Pressable style={styles.cardPress} onPress={openVideo}>
                {(() => {
                  const previewUri =
                    currentAsset.mediaType === 'video' ? videoThumbnailUri : imagePreviewUri;
                  if (previewUri) {
                    return (
                      <Animated.Image
                        source={{ uri: previewUri }}
                        resizeMode="cover"
                        style={styles.cardImage}
                      />
                    );
                  }
                  return (
                    <View style={styles.previewFallback}>
                      <Text style={styles.previewText}>Preview unavailable</Text>
                    </View>
                  );
                })()}
              </Pressable>
              {currentAsset.mediaType === 'video' ? (
                <View style={styles.videoOverlay}>
                  <View style={styles.playPill}>
                    <Text style={styles.playText}>Play</Text>
                  </View>
                  <View style={styles.durationPill}>
                    <Text style={styles.durationText}>{formatDuration(currentAsset.duration)}</Text>
                  </View>
                </View>
              ) : null}
            </Animated.View>
          </View>
        ) : null}
      </View>

      {!isEmpty && currentAsset ? (
        <Text style={styles.hintText}>Swipe left to delete - Swipe right to keep</Text>
      ) : null}

      {!isEmpty && currentAsset ? (
        <View style={styles.actionRow}>
          <View style={styles.actionButton}>
            <PrimaryButton
              label="Delete"
              onPress={() => animateOffScreen('left')}
              variant="danger"
              disabled={isVideoOpen}
            />
          </View>
          <View style={styles.actionSpacer} />
          <View style={styles.actionButton}>
            <PrimaryButton
              label="Keep"
              onPress={() => animateOffScreen('right')}
              variant="primary"
              disabled={isVideoOpen}
            />
          </View>
        </View>
      ) : null}

      <UndoToast visible={Boolean(toastId)} message={toastMessage} onUndo={handleUndo} showUndo={canUndo} />

      <Modal
        visible={isVideoOpen}
        animationType="slide"
        onRequestClose={() => {
          setIsVideoOpen(false);
          setVideoPlaybackUri(null);
        }}
      >
        <View style={styles.videoContainer}>
          {videoPlaybackUri ? (
            <Video
              source={{ uri: videoPlaybackUri }}
              style={styles.videoPlayer}
              useNativeControls
              resizeMode="contain"
              shouldPlay
            />
          ) : (
            <View style={styles.videoLoading}>
              <Text style={styles.videoLoadingText}>Loading video...</Text>
            </View>
          )}
          <Pressable
            onPress={() => {
              setIsVideoOpen(false);
              setVideoPlaybackUri(null);
            }}
            style={styles.videoClose}
          >
            <Text style={styles.videoCloseText}>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
  },
  headerCenter: {
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#9CA3AF',
  },
  sessionText: {
    marginTop: 4,
    fontSize: 14,
    color: colors.muted,
  },
  headerSpacer: {
    width: 50,
  },
  deckArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.muted,
  },
  cardStack: {
    width: '100%',
    alignItems: 'center',
  },
  cardShadow: {
    position: 'absolute',
    width: '100%',
    maxWidth: 380,
    height: '62%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    transform: [{ scale: 0.97 }],
  },
  card: {
    width: '100%',
    maxWidth: 380,
    height: '64%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  cardPress: {
    flex: 1,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  previewFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  previewText: {
    fontSize: 14,
    color: colors.muted,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPill: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  playText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  durationPill: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  hintText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
  },
  actionSpacer: {
    width: 12,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.muted,
  },
  emptyButton: {
    marginTop: 20,
    width: '100%',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoPlayer: {
    flex: 1,
  },
  videoLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLoadingText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  videoClose: {
    position: 'absolute',
    top: 48,
    right: 20,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  videoCloseText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
