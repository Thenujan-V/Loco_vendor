import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const STATUS_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  PENDING: { backgroundColor: '#FFF1E8', color: '#D95D1A' },
  ACCEPTED: { backgroundColor: '#E7F7EE', color: '#1F8B4C' },
  REJECTED: { backgroundColor: '#FDECEC', color: '#C62828' },
  ASSIGNED: { backgroundColor: '#EEF4FF', color: '#2F6FE4' },
  DELIVERED: { backgroundColor: '#EAFBF4', color: '#127C54' },
  CANCELLED: { backgroundColor: '#F3F4F6', color: '#5F6368' },
};

export default function StatusBadge({ status }: { status?: string }) {
  const normalizedStatus = String(status || 'PENDING').toUpperCase();
  const palette = STATUS_STYLES[normalizedStatus] || STATUS_STYLES.PENDING;

  return (
    <View style={[styles.badge, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.label, { color: palette.color }]}>{normalizedStatus}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
