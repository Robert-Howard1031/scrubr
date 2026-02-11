import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../utils/theme';

export function PrivacyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Privacy</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>No accounts</Text>
        <Text style={styles.cardText}>scrubr works without logins, cloud storage, or backend services.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>On-device processing</Text>
        <Text style={styles.cardText}>
          Media never leaves your device. Thumbnails are used for browsing to keep performance smooth.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Safe deletions</Text>
        <Text style={styles.cardText}>
          Deleted items are sent to Recently Deleted / Trash so you can recover them if needed.
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  card: {
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
