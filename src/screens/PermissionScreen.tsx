import React, { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as MediaLibrary from 'expo-media-library';
import { RootStackParamList } from '../types';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Permission'>;

export function PermissionScreen({ navigation }: Props) {
  const [permission, requestPermission] = MediaLibrary.usePermissions();
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (!permission) return;
    if (permission.status === 'granted' || permission.accessPrivileges === 'limited') {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }
  }, [permission, navigation]);

  const handleRequest = async () => {
    try {
      setIsRequesting(true);
      await requestPermission();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleOpenSettings = () => {
    void Linking.openSettings();
  };

  const isDenied = permission?.status === 'denied';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to scrubr</Text>
      <Text style={styles.subtitle}>
        We need access to your photo library so you can review and clean up items.
      </Text>

      <View style={styles.cardStack}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Why access is required</Text>
          <Text style={styles.cardText}>
            scrubr shows your photos, videos, and screenshots so you can decide what to keep or delete.
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>On-device privacy</Text>
          <Text style={styles.cardText}>
            All processing happens on your device. There are no accounts, cloud sync, or backend services.
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Safe deletions</Text>
          <Text style={styles.cardText}>
            Deleted items go to Recently Deleted / Trash so you can recover them if needed.
          </Text>
        </View>
      </View>

      <View style={styles.buttonWrap}>
        <PrimaryButton label="Continue" onPress={handleRequest} disabled={isRequesting} />
      </View>

      {isDenied ? (
        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>Access is off</Text>
          <Text style={styles.dangerText}>
            Enable photo access in system settings to start cleaning your camera roll.
          </Text>
          <Pressable onPress={handleOpenSettings}>
            <Text style={styles.dangerLink}>Open Settings</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.footer}>Paid download ($0.99) - No subscriptions - No ads</Text>
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
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    color: colors.muted,
  },
  cardStack: {
    marginTop: 28,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 16,
    marginBottom: 12,
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
  buttonWrap: {
    marginTop: 24,
  },
  dangerCard: {
    marginTop: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    padding: 16,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B91C1C',
  },
  dangerText: {
    marginTop: 8,
    fontSize: 14,
    color: '#B91C1C',
  },
  dangerLink: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
  },
  footer: {
    marginTop: 'auto',
    fontSize: 12,
    color: '#9CA3AF',
  },
});
