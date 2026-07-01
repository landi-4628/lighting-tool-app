import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
  showTopSafeArea?: boolean;
}

export function PageHeader({ title, subtitle, style, showTopSafeArea = true }: PageHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, showTopSafeArea && { paddingTop: insets.top }, style]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
