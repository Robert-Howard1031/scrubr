import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../utils/theme';

type UndoToastProps = {
  visible: boolean;
  message: string;
  onUndo?: () => void;
  showUndo?: boolean;
};

export function UndoToast({ visible, message, onUndo, showUndo = true }: UndoToastProps) {
  if (!visible) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {showUndo ? (
        <Pressable onPress={onUndo} style={styles.undoButton}>
          <Text style={styles.undoText}>Undo</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  message: {
    fontSize: 14,
    color: colors.text,
  },
  undoButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  undoText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
});
