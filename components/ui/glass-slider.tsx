import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
  Pressable,
} from 'react-native';
import { Colors } from '@/constants/colors';

interface GlassSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  quickValues?: number[];
  onQuickValue?: (value: number) => void;
  disabled?: boolean;
  enableTextInput?: boolean;
}

// Round to nearest step using integer math to avoid float drift (e.g. 28.49999...).
const snapToStep = (raw: number, min: number, step: number): number => {
  if (step <= 0) return raw;
  const k = Math.round((raw - min) / step);
  const snapped = min + k * step;
  // Normalize float artifacts so consecutive equal steps produce equal values.
  return Math.round(snapped * 1e6) / 1e6;
};

export const GlassSlider = React.memo(function GlassSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  formatValue,
  quickValues,
  onQuickValue,
  disabled = false,
  enableTextInput = false,
}: GlassSliderProps) {
  const trackWidthRef = useRef(0);
  const draggingRef = useRef(false);
  const startPageXRef = useRef(0);
  const startValueRef = useRef(0);
  const lastEmittedRef = useRef<number>(value);
  const [localValue, setLocalValue] = React.useState(value);

  const [textEditing, setTextEditing] = useState(false);
  const [textValue, setTextValue] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Keep local mirror in sync when parent value changes externally (e.g. unit toggle, quick chip).
  useEffect(() => {
    if (!draggingRef.current) {
      setLocalValue(value);
      lastEmittedRef.current = value;
    }
  }, [value]);

  // Refs so PanResponder callbacks see latest props without being recreated.
  const minRef = useRef(min);
  const maxRef = useRef(max);
  const stepRef = useRef(step);
  const disabledRef = useRef(disabled);
  const onChangeRef = useRef(onChange);
  const setLocalRef = useRef(setLocalValue);
  minRef.current = min;
  maxRef.current = max;
  stepRef.current = step;
  disabledRef.current = disabled;
  onChangeRef.current = onChange;
  setLocalRef.current = setLocalValue;

  const emit = useCallback((v: number) => {
    const prev = lastEmittedRef.current;
    // Guard: only re-render if value moved more than a tenth of a step.
    // This kills float jitter and identical-event re-emission.
    if (v === prev || Math.abs(v - prev) < stepRef.current / 1000) return;
    lastEmittedRef.current = v;
    setLocalRef.current(v);
    onChangeRef.current(v);
  }, []);

  const valueToRatio = useCallback((v: number): number => {
    const range = maxRef.current - minRef.current;
    if (range <= 0) return 0;
    return Math.max(0, Math.min(1, (v - minRef.current) / range));
  }, []);

  const ratioToValue = useCallback((ratio: number): number => {
    const range = maxRef.current - minRef.current;
    if (range <= 0) return minRef.current;
    const raw = minRef.current + ratio * range;
    const snapped = snapToStep(raw, minRef.current, stepRef.current);
    return Math.max(minRef.current, Math.min(maxRef.current, snapped));
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        draggingRef.current = true;
        // Capture absolute pageX at gesture start; subsequent moves compute dx from this.
        // pageX is reliable because it's anchored to the screen, not to any re-laid-out parent.
        startPageXRef.current = e.nativeEvent.pageX;
        // Anchor: value at the grab point — use locationX if available, else fall back to current value.
        const w = trackWidthRef.current;
        if (w > 0) {
          const initialRatio = Math.max(0, Math.min(1, e.nativeEvent.locationX / w));
          startValueRef.current = ratioToValue(initialRatio);
        } else {
          startValueRef.current = lastEmittedRef.current;
        }
        emit(startValueRef.current);
      },
      onPanResponderMove: (e) => {
        if (!draggingRef.current) return;
        const w = trackWidthRef.current;
        if (w <= 0) return;
        // Use delta-X against the gesture's pageX anchor. Much more stable than
        // raw locationX, which can shift if any ancestor re-layouts mid-drag.
        const dx = e.nativeEvent.pageX - startPageXRef.current;
        const startRatio = valueToRatio(startValueRef.current);
        const newRatio = Math.max(0, Math.min(1, startRatio + dx / w));
        const next = ratioToValue(newRatio);
        emit(next);
      },
      onPanResponderRelease: () => {
        draggingRef.current = false;
      },
      onPanResponderTerminate: () => {
        draggingRef.current = false;
      },
    })
  ).current;

  const percent = valueToRatio(localValue) * 100;
  const displayValue = formatValue ? formatValue(localValue) : String(localValue);

  const handleLayout = (e: LayoutChangeEvent) => {
    // Skip layout updates while dragging — width only matters before/after the gesture.
    if (draggingRef.current) return;
    trackWidthRef.current = e.nativeEvent.layout.width;
  };

  const activeQuickIdx = quickValues
    ? quickValues.findIndex((qv) => Math.abs(localValue - qv) < step / 2)
    : -1;

  const handleSubmit = () => {
    const parsed = parseFloat(textValue);
    if (!isNaN(parsed)) {
      const snapped = snapToStep(parsed, minRef.current, stepRef.current);
      const clamped = Math.max(minRef.current, Math.min(maxRef.current, snapped));
      emit(clamped);
    }
    setTextEditing(false);
  };

  const handleValuePress = () => {
    if (!enableTextInput || disabled) return;
    setTextValue(String(localValue));
    setTextEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleTextChange = (text: string) => {
    const cleaned = text.replace(',', '.');
    if (cleaned === '' || /^-?\d*\.?\d*$/.test(cleaned)) {
      setTextValue(cleaned);
    }
  };

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {enableTextInput ? (
          textEditing ? (
            <View style={styles.inputWrap}>
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                value={textValue}
                onChangeText={handleTextChange}
                onBlur={handleSubmit}
                onSubmitEditing={handleSubmit}
                keyboardType="decimal-pad"
                returnKeyType="done"
                autoSelectAll
              />
              <Text style={styles.unit}>{unit ? ` ${unit}` : ''}</Text>
            </View>
          ) : (
            <Pressable onPress={handleValuePress} disabled={disabled}>
              <Text style={styles.value}>
                {displayValue}
                <Text style={styles.unit}>{unit ? ` ${unit}` : ''}</Text>
              </Text>
            </Pressable>
          )
        ) : (
          <Text style={styles.value}>
            {displayValue}
            <Text style={styles.unit}>{unit ? ` ${unit}` : ''}</Text>
          </Text>
        )}
      </View>

      <View
        style={styles.trackContainer}
        onLayout={handleLayout}
        {...(!enableTextInput ? panResponder.panHandlers : {})}
      >
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${percent}%` }]} />
        </View>
        {!enableTextInput && (
          <View
            pointerEvents="none"
            style={[styles.thumb, { left: `${percent}%` }]}
          >
            <View style={styles.thumbInner} />
          </View>
        )}
      </View>

      {quickValues && quickValues.length > 0 && (
        <View style={styles.quickValues}>
          {quickValues.map((qv, i) => {
            const active = i === activeQuickIdx;
            return (
              <View
                key={qv}
                style={[styles.quickChip, active && styles.quickChipActive]}
                onTouchEnd={() => !disabled && onQuickValue?.(qv)}
              >
                <Text
                  style={[styles.quickChipText, active && styles.quickChipTextActive]}
                >
                  {formatValue ? formatValue(qv) : qv}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
  },
  unit: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '400',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  textInput: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 64,
    textAlign: 'right',
  },
  trackContainer: {
    height: 32,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 6,
    backgroundColor: Colors.glass,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    marginLeft: -11,
    top: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  quickValues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickChipActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.borderActive,
  },
  quickChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  quickChipTextActive: {
    color: Colors.primary,
  },
});
