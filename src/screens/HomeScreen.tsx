import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, MediaFilter } from '../types';
import { FilterPill } from '../components/FilterPill';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatTile } from '../components/StatTile';
import { useStats } from '../context/StatsContext';
import { formatBytesToGB, formatStreak } from '../utils/format';
import { colors } from '../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const FILTERS: { key: MediaFilter; label: string }[] = [
  { key: 'photos', label: 'Photos' },
  { key: 'videos', label: 'Videos' },
  { key: 'screenshots', label: 'Screenshots' },
];

export function HomeScreen({ navigation }: Props) {
  const [selectedFilter, setSelectedFilter] = useState<MediaFilter>('photos');
  const { stats } = useStats();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>scrubr</Text>
          <Text style={styles.subtitle}>Clean your camera roll with a swipe.</Text>
        </View>
        <Pressable style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsText}>Settings</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Lifetime Stats</Text>
        <View style={styles.statsRow}>
          <StatTile label="Deleted" value={stats.totalDeletedCount.toLocaleString()} />
          <View style={styles.statSpacer} />
          <StatTile label="Freed" value={`${formatBytesToGB(stats.totalFreedBytes)} GB`} />
        </View>
        <View style={styles.streakRow}>
          <StatTile label="Streak" value={formatStreak(stats.streakCount)} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Filter</Text>
        <View style={styles.filterRow}>
          {FILTERS.map((filter) => (
            <FilterPill
              key={filter.key}
              label={filter.label}
              selected={selectedFilter === filter.key}
              onPress={() => setSelectedFilter(filter.key)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <PrimaryButton
          label="Start Cleaning"
          onPress={() => navigation.navigate('Swipe', { filter: selectedFilter })}
        />
      </View>

      <View style={styles.privacyCard}>
        <Text style={styles.cardTitle}>Privacy first</Text>
        <Text style={styles.cardText}>
          Everything happens on-device. Deleted items go to Recently Deleted / Trash for safety.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: colors.muted,
  },
  settingsButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  settingsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
  },
  section: {
    marginTop: 28,
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#9CA3AF',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  statSpacer: {
    width: 12,
  },
  streakRow: {
    marginTop: 12,
  },
  filterRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  privacyCard: {
    marginTop: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  cardText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.muted,
  },
});
