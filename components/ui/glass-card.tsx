import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  raised?: boolean;
}

export function GlassCard({ children, style, raised = false }: GlassCardProps) {
  return (
    <View style={[raised ? styles.cardRaised : styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.glassCard,
    borderWidth: 1,
    borderColor: Colors.borderIce,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardRaised: {
    backgroundColor: Colors.glassRaised,
    borderWidth: 1,
    borderColor: Colors.borderIce,
    borderRadius: 20,
    overflow: 'hidden',
  },
});
