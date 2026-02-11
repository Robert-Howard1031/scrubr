import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getLocalDayKey, getYesterdayKey } from '../utils/format';

const STORAGE_KEY = 'scrubr:lifetimeStats';

export type LifetimeStats = {
  totalDeletedCount: number;
  totalFreedBytes: number;
  totalSessionsCompleted: number;
  streakCount: number;
  lastDeletionDay: string | null;
};

const defaultStats: LifetimeStats = {
  totalDeletedCount: 0,
  totalFreedBytes: 0,
  totalSessionsCompleted: 0,
  streakCount: 0,
  lastDeletionDay: null,
};

type StatsContextValue = {
  stats: LifetimeStats;
  isLoaded: boolean;
  applyDeletionDelta: (countDelta: number, bytesDelta: number) => void;
  recordDeletionSuccessForToday: () => void;
  incrementSessions: () => void;
};

const StatsContext = createContext<StatsContextValue | null>(null);

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<LifetimeStats>(defaultStats);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && isActive) {
          const parsed = JSON.parse(stored) as LifetimeStats;
          setStats({ ...defaultStats, ...parsed });
        }
      } catch (error) {
        if (isActive) {
          setStats(defaultStats);
        }
      } finally {
        if (isActive) {
          setIsLoaded(true);
        }
      }
    };
    void load();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }, [stats, isLoaded]);

  const applyDeletionDelta = useCallback((countDelta: number, bytesDelta: number) => {
    setStats((prev) => ({
      ...prev,
      totalDeletedCount: Math.max(0, prev.totalDeletedCount + countDelta),
      totalFreedBytes: Math.max(0, prev.totalFreedBytes + bytesDelta),
    }));
  }, []);

  const recordDeletionSuccessForToday = useCallback(() => {
    const todayKey = getLocalDayKey();
    setStats((prev) => {
      if (prev.lastDeletionDay === todayKey) {
        return prev;
      }
      const yesterdayKey = getYesterdayKey(todayKey);
      const nextStreak = prev.lastDeletionDay === yesterdayKey ? prev.streakCount + 1 : 1;
      return {
        ...prev,
        streakCount: nextStreak,
        lastDeletionDay: todayKey,
      };
    });
  }, []);

  const incrementSessions = useCallback(() => {
    setStats((prev) => ({
      ...prev,
      totalSessionsCompleted: prev.totalSessionsCompleted + 1,
    }));
  }, []);

  const value = useMemo(
    () => ({ stats, isLoaded, applyDeletionDelta, recordDeletionSuccessForToday, incrementSessions }),
    [stats, isLoaded, applyDeletionDelta, recordDeletionSuccessForToday, incrementSessions]
  );

  return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>;
}

export function useStats() {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be used within StatsProvider');
  }
  return context;
}
