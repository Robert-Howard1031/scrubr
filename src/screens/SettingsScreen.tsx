import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors } from '../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.sectionLabel}>Privacy</Text>
      <Pressable style={styles.card} onPress={() => navigation.navigate('Privacy')}>
        <Text style={styles.cardTitle}>Privacy info</Text>
        <Text style={styles.cardText}>Learn how scrubr handles your media.</Text>
      </Pressable>

      <View style={styles.noticeCard}>
        <Text style={styles.cardTitle}>Theme</Text>
        <Text style={styles.cardText}>scrubr uses a clean light theme to keep focus on your library.</Text>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  sectionLabel: {
    marginTop: 28,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#9CA3AF',
  },
  card: {
    marginTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 16,
  },
  noticeCard: {
    marginTop: 16,
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
    marginTop: 6,
    fontSize: 14,
    color: colors.muted,
  },
});
