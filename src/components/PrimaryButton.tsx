import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../utils/theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'neutral';
  disabled?: boolean;
  icon?: React.ReactNode;
};

export function PrimaryButton({ label, onPress, variant = 'primary', disabled, icon }: PrimaryButtonProps) {
  const backgroundColor =
    variant === 'danger' ? colors.danger : variant === 'neutral' ? '#E5E7EB' : colors.primary;
  const textColor = variant === 'neutral' ? colors.text : '#FFFFFF';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, { backgroundColor }, disabled && styles.disabled]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  icon: {
    marginRight: 8,
  },
  disabled: {
    opacity: 0.6,
  },
});
