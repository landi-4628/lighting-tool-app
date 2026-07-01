import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';

interface TabItem {
  label: string;
  value: string;
}

interface GlassTabGroupProps {
  tabs: TabItem[];
  activeIndex: number;
  onChange: (index: number) => void;
  style?: ViewStyle;
}

export function GlassTabGroup({ tabs, activeIndex, onChange, style }: GlassTabGroupProps) {
  return (
    <View style={[styles.container, style]}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={tab.value}
          style={[
            styles.tab,
            activeIndex === index && styles.tabActive,
          ]}
          onPress={() => onChange(index)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeIndex === index && styles.tabTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 4,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.25)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
  },
});
