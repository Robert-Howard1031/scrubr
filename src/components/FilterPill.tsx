import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../utils/theme';

type FilterPillProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function FilterPill({ label, selected, onPress }: FilterPillProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, selected ? styles.selected : styles.unselected]}
    >
      <Text style={[styles.label, selected ? styles.labelSelected : styles.labelUnselected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    marginRight: 10,
  },
  selected: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  unselected: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  labelSelected: {
    color: '#FFFFFF',
  },
  labelUnselected: {
    color: colors.muted,
  },
});
