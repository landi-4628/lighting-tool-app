import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from '@/components/ui/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassTabGroup } from '@/components/ui/glass-tab-group';
import { Colors } from '@/constants/colors';

// Unit conversion constants
const METERS_TO_FEET = 3.28084;
const FEET_TO_METERS = 0.3048;
const DEGREES_TO_RADIANS = Math.PI / 180;
const RADIANS_TO_DEGREES = 180 / Math.PI;

// Common beam angles for reference
const COMMON_BEAM_ANGLES = [5, 10, 15, 20, 25, 30, 40, 50, 60, 90];

interface CalculationResult {
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
}

type UnitSystem = 'metric' | 'imperial';
type AngleUnit = 'degrees' | 'radians';

export default function BeamScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Unit settings
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [angleUnit, setAngleUnit] = useState<AngleUnit>('degrees');

  // Distance calculation inputs
  const [height, setHeight] = useState('');
  const [angle, setAngle] = useState('');

  // Spot diameter inputs
  const [distance, setDistance] = useState('');
  const [beamAngle, setBeamAngle] = useState('');

  // Illuminance inputs
  const [lumens, setLumens] = useState('');
  const [illumDistance, setIllumDistance] = useState('');
  const [illumAngle, setIllumAngle] = useState('');

  const tabs = [
    { label: '投射距离', value: 'distance' },
    { label: '光斑直径', value: 'spot' },
    { label: '照度计算', value: 'illuminance' },
  ];

  // Convert input value based on unit system
  const toMeters = useCallback(
    (value: number): number => {
      return unitSystem === 'imperial' ? value * FEET_TO_METERS : value;
    },
    [unitSystem]
  );

  const fromMeters = useCallback(
    (value: number): number => {
      return unitSystem === 'imperial' ? value * METERS_TO_FEET : value;
    },
    [unitSystem]
  );

  // Convert angle based on unit setting
  const toRadians = useCallback(
    (value: number): number => {
      return angleUnit === 'radians' ? value : value * DEGREES_TO_RADIANS;
    },
    [angleUnit]
  );

  const fromRadians = useCallback(
    (value: number): number => {
      return angleUnit === 'radians' ? value : value * RADIANS_TO_DEGREES;
    },
    [angleUnit]
  );

  // Calculate projection distance: d = h / tan(θ)
  const projectionResults = useMemo((): CalculationResult[] => {
    const h = parseFloat(height);
    const a = parseFloat(angle);

    if (isNaN(h) || isNaN(a) || h <= 0 || a === 0) {
      return [];
    }

    const heightMeters = toMeters(h);
    const angleRadians = toRadians(a);

    if (angleRadians <= 0) return [];

    const distanceMeters = heightMeters / Math.tan(angleRadians);
    const distanceDisplay = fromMeters(distanceMeters);
    const horizontalOffset = distanceMeters * Math.sin(angleRadians);

    return [
      {
        label: unitSystem === 'metric' ? '水平距离' : '水平距离',
        value: distanceDisplay.toFixed(2),
        unit: unitSystem === 'metric' ? '米' : '英尺',
      },
      {
        label: '垂直下落',
        value: height.toString(),
        unit: unitSystem === 'metric' ? '米' : '英尺',
      },
      {
        label: '斜边长度',
        value: fromMeters(heightMeters / Math.cos(angleRadians)).toFixed(2),
        unit: unitSystem === 'metric' ? '米' : '英尺',
      },
      {
        label: '水平偏移',
        value: fromMeters(horizontalOffset).toFixed(2),
        unit: unitSystem === 'metric' ? '米' : '英尺',
      },
    ];
  }, [height, angle, unitSystem, angleUnit, toMeters, fromMeters, toRadians, fromRadians]);

  // Calculate spot diameter: diameter = 2 * distance * tan(beamAngle / 2)
  const spotResults = useMemo((): CalculationResult[] => {
    const d = parseFloat(distance);
    const ba = parseFloat(beamAngle);

    if (isNaN(d) || isNaN(ba) || d <= 0 || ba <= 0) {
      return [];
    }

    const distanceMeters = toMeters(d);
    const beamAngleRadians = toRadians(ba);

    const radius = distanceMeters * Math.tan(beamAngleRadians / 2);
    const diameter = radius * 2;
    const area = Math.PI * radius * radius;

    return [
      {
        label: '光斑直径',
        value: fromMeters(diameter).toFixed(2),
        unit: unitSystem === 'metric' ? '米' : '英尺',
        highlight: true,
      },
      {
        label: '光斑半径',
        value: fromMeters(radius).toFixed(2),
        unit: unitSystem === 'metric' ? '米' : '英尺',
      },
      {
        label: '光斑面积',
        value: (area * (unitSystem === 'imperial' ? METERS_TO_FEET * METERS_TO_FEET : 1)).toFixed(2),
        unit: unitSystem === 'metric' ? 'm²' : 'ft²',
      },
      {
        label: '投射距离',
        value: distance,
        unit: unitSystem === 'metric' ? '米' : '英尺',
      },
    ];
  }, [distance, beamAngle, unitSystem, angleUnit, toMeters, fromMeters, toRadians, fromRadians]);

  // Calculate illuminance: E = (Φ / (4πd²)) × cos(θ)
  const illuminanceResults = useMemo((): CalculationResult[] => {
    const lm = parseFloat(lumens);
    const d = parseFloat(illumDistance);
    const a = parseFloat(illumAngle);

    if (isNaN(lm) || isNaN(d) || isNaN(a) || lm <= 0 || d <= 0) {
      return [];
    }

    const distanceMeters = toMeters(d);
    const angleRadians = toRadians(a);
    const cosAngle = Math.cos(angleRadians);

    // Illuminance at the center point
    const illuminance = (lm / (4 * Math.PI * distanceMeters * distanceMeters)) * cosAngle;

    // Effective area for the beam
    const beamArea = Math.PI * Math.pow(distanceMeters * Math.tan(angleRadians / 2), 2);
    const avgIlluminance = illuminance > 0 ? lm / beamArea : 0;

    // Calculate for different distances (inverse square law)
    const distances = [2, 5, 10].map((factor) => factor * distanceMeters);
    const illuminanceAtDistances = distances.map((dist) => {
      return (lm / (4 * Math.PI * dist * dist)) * cosAngle;
    });

    return [
      {
        label: '中心照度',
        value: illuminance >= 1000
          ? (illuminance / 1000).toFixed(2) + ' k'
          : illuminance.toFixed(1),
        unit: 'Lux',
        highlight: true,
      },
      {
        label: '平均照度',
        value: avgIlluminance >= 1000
          ? (avgIlluminance / 1000).toFixed(2) + ' k'
          : avgIlluminance.toFixed(1),
        unit: 'Lux',
      },
      {
        label: '2m 处照度',
        value: illuminanceAtDistances[0] >= 1000
          ? (illuminanceAtDistances[0] / 1000).toFixed(2) + ' k'
          : illuminanceAtDistances[0].toFixed(1),
        unit: 'Lux',
      },
      {
        label: '5m 处照度',
        value: illuminanceAtDistances[1] >= 1000
          ? (illuminanceAtDistances[1] / 1000).toFixed(2) + ' k'
          : illuminanceAtDistances[1].toFixed(1),
        unit: 'Lux',
      },
      {
        label: '10m 处照度',
        value: illuminanceAtDistances[2] >= 1000
          ? (illuminanceAtDistances[2] / 1000).toFixed(2) + ' k'
          : illuminanceAtDistances[2].toFixed(1),
        unit: 'Lux',
      },
    ];
  }, [lumens, illumDistance, illumAngle, unitSystem, angleUnit, toMeters, toRadians]);

  // Share results
  const handleShare = useCallback(async () => {
    let results: CalculationResult[] = [];
    let title = '';

    switch (activeTab) {
      case 0:
        results = projectionResults;
        title = '投射距离计算结果';
        break;
      case 1:
        results = spotResults;
        title = '光斑直径计算结果';
        break;
      case 2:
        results = illuminanceResults;
        title = '照度计算结果';
        break;
    }

    if (results.length === 0) {
      Alert.alert('提示', '请先输入数据进行计算');
      return;
    }

    const message = results.map((r) => `${r.label}: ${r.value} ${r.unit}`).join('\n');

    try {
      await Share.share({
        message: `${title}\n\n${message}`,
        title,
      });
    } catch {
      Alert.alert('错误', '分享失败');
    }
  }, [activeTab, projectionResults, spotResults, illuminanceResults]);

  // Quick set angle
  const handleQuickAngle = useCallback((value: number) => {
    setAngle(value.toString());
  }, []);

  // Quick set beam angle
  const handleQuickBeamAngle = useCallback((value: number) => {
    setBeamAngle(value.toString());
  }, []);

  // Clear all inputs
  const handleClear = useCallback(() => {
    switch (activeTab) {
      case 0:
        setHeight('');
        setAngle('');
        break;
      case 1:
        setDistance('');
        setBeamAngle('');
        break;
      case 2:
        setLumens('');
        setIllumDistance('');
        setIllumAngle('');
        break;
    }
  }, [activeTab]);

  // Render unit toggle
  const renderUnitToggle = () => (
    <View style={styles.unitToggleContainer}>
      <View style={styles.unitToggleGroup}>
        <TouchableOpacity
          style={[
            styles.unitToggleButton,
            unitSystem === 'metric' && styles.unitToggleButtonActive,
          ]}
          onPress={() => setUnitSystem('metric')}
        >
          <Text
            style={[
              styles.unitToggleText,
              unitSystem === 'metric' && styles.unitToggleTextActive,
            ]}
          >
            米
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.unitToggleButton,
            unitSystem === 'imperial' && styles.unitToggleButtonActive,
          ]}
          onPress={() => setUnitSystem('imperial')}
        >
          <Text
            style={[
              styles.unitToggleText,
              unitSystem === 'imperial' && styles.unitToggleTextActive,
            ]}
          >
            英尺
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.unitToggleGroup}>
        <TouchableOpacity
          style={[
            styles.unitToggleButton,
            angleUnit === 'degrees' && styles.unitToggleButtonActive,
          ]}
          onPress={() => setAngleUnit('degrees')}
        >
          <Text
            style={[
              styles.unitToggleText,
              angleUnit === 'degrees' && styles.unitToggleTextActive,
            ]}
          >
            °
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.unitToggleButton,
            angleUnit === 'radians' && styles.unitToggleButtonActive,
          ]}
          onPress={() => setAngleUnit('radians')}
        >
          <Text
            style={[
              styles.unitToggleText,
              angleUnit === 'radians' && styles.unitToggleTextActive,
            ]}
          >
            rad
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render projection distance calculator
  const renderDistanceCalculator = () => (
    <>
      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>输入参数</Text>

        <View style={styles.inputRow}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>高度</Text>
            <GlassInput
              placeholder="0.00"
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Text style={styles.inputUnit}>{unitSystem === 'metric' ? '米' : '英尺'}</Text>
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>角度</Text>
            <GlassInput
              placeholder="0.00"
              value={angle}
              onChangeText={setAngle}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Text style={styles.inputUnit}>{angleUnit === 'degrees' ? '°' : 'rad'}</Text>
          </View>
        </View>

        <View style={styles.quickButtons}>
          <Text style={styles.quickButtonsLabel}>快速选择角度:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.quickButtonsRow}>
              {[15, 30, 45, 60, 75, 90].map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[
                    styles.quickButton,
                    angle === String(a) && styles.quickButtonActive,
                  ]}
                  onPress={() => handleQuickAngle(a)}
                >
                  <Text
                    style={[
                      styles.quickButtonText,
                      angle === String(a) && styles.quickButtonTextActive,
                    ]}
                  >
                    {a}°
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </GlassCard>

      {projectionResults.length > 0 && (
        <GlassCard style={styles.card} raised>
          <Text style={styles.sectionTitle}>计算结果</Text>
          <View style={styles.resultsGrid}>
            {projectionResults.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <Text style={styles.resultLabel}>{result.label}</Text>
                <Text style={styles.resultValue}>{result.value}</Text>
                <Text style={styles.resultUnit}>{result.unit}</Text>
              </View>
            ))}
          </View>
        </GlassCard>
      )}

      <GlassCard style={styles.card}>
        <View style={styles.formulaCard}>
          <Ionicons name="bulb-outline" size={20} color={Colors.primary} />
          <Text style={styles.formulaText}>
            公式: 距离 = 高度 / tan(角度)
          </Text>
        </View>
        <Text style={styles.tipText}>
          输入灯光安装高度和俯仰角度，计算光线投射到地面的落点距离。
        </Text>
      </GlassCard>
    </>
  );

  // Render spot diameter calculator
  const renderSpotCalculator = () => (
    <>
      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>输入参数</Text>

        <View style={styles.inputRow}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>投射距离</Text>
            <GlassInput
              placeholder="0.00"
              value={distance}
              onChangeText={setDistance}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Text style={styles.inputUnit}>{unitSystem === 'metric' ? '米' : '英尺'}</Text>
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>光束角度</Text>
            <GlassInput
              placeholder="0.00"
              value={beamAngle}
              onChangeText={setBeamAngle}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Text style={styles.inputUnit}>{angleUnit === 'degrees' ? '°' : 'rad'}</Text>
          </View>
        </View>

        <View style={styles.quickButtons}>
          <Text style={styles.quickButtonsLabel}>常见光束角度:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.quickButtonsRow}>
              {COMMON_BEAM_ANGLES.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[
                    styles.quickButton,
                    beamAngle === String(a) && styles.quickButtonActive,
                  ]}
                  onPress={() => handleQuickBeamAngle(a)}
                >
                  <Text
                    style={[
                      styles.quickButtonText,
                      beamAngle === String(a) && styles.quickButtonTextActive,
                    ]}
                  >
                    {a}°
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </GlassCard>

      {spotResults.length > 0 && (
        <GlassCard style={styles.card} raised>
          <Text style={styles.sectionTitle}>计算结果</Text>
          <View style={styles.resultsGrid}>
            {spotResults.map((result, index) => (
              <View
                key={index}
                style={[styles.resultItem, result.highlight && styles.resultItemHighlight]}
              >
                <Text style={styles.resultLabel}>{result.label}</Text>
                <Text style={[styles.resultValue, result.highlight && styles.resultValueHighlight]}>
                  {result.value}
                </Text>
                <Text style={styles.resultUnit}>{result.unit}</Text>
              </View>
            ))}
          </View>
        </GlassCard>
      )}

      <GlassCard style={styles.card}>
        <View style={styles.formulaCard}>
          <Ionicons name="bulb-outline" size={20} color={Colors.primary} />
          <Text style={styles.formulaText}>
            公式: 直径 = 2 × 距离 × tan(角度 / 2)
          </Text>
        </View>
        <Text style={styles.tipText}>
          输入投射距离和光束角度，计算光斑的大小尺寸。
        </Text>
      </GlassCard>
    </>
  );

  // Render illuminance calculator
  const renderIlluminanceCalculator = () => (
    <>
      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>输入参数</Text>

        <View style={styles.inputRow}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>光通量</Text>
            <GlassInput
              placeholder="0"
              value={lumens}
              onChangeText={setLumens}
              keyboardType="numeric"
              style={styles.input}
            />
            <Text style={styles.inputUnit}>流明</Text>
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>距离</Text>
            <GlassInput
              placeholder="0.00"
              value={illumDistance}
              onChangeText={setIllumDistance}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Text style={styles.inputUnit}>{unitSystem === 'metric' ? '米' : '英尺'}</Text>
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>角度</Text>
            <GlassInput
              placeholder="0.00"
              value={illumAngle}
              onChangeText={setIllumAngle}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Text style={styles.inputUnit}>{angleUnit === 'degrees' ? '°' : 'rad'}</Text>
          </View>
        </View>

        <View style={styles.referenceValues}>
          <Text style={styles.referenceTitle}>常见参考值:</Text>
          <View style={styles.referenceGrid}>
            <Text style={styles.referenceItem}>蜡烛: ~0.1 Lux</Text>
            <Text style={styles.referenceItem}>满月: ~0.27 Lux</Text>
            <Text style={styles.referenceItem}>办公室: 300-500 Lux</Text>
            <Text style={styles.referenceItem}>手术室: 10000+ Lux</Text>
          </View>
        </View>
      </GlassCard>

      {illuminanceResults.length > 0 && (
        <GlassCard style={styles.card} raised>
          <Text style={styles.sectionTitle}>计算结果</Text>
          <View style={styles.resultsGrid}>
            {illuminanceResults.map((result, index) => (
              <View
                key={index}
                style={[styles.resultItem, result.highlight && styles.resultItemHighlight]}
              >
                <Text style={styles.resultLabel}>{result.label}</Text>
                <Text style={[styles.resultValue, result.highlight && styles.resultValueHighlight]}>
                  {result.value}
                </Text>
                <Text style={styles.resultUnit}>{result.unit}</Text>
              </View>
            ))}
          </View>
        </GlassCard>
      )}

      <GlassCard style={styles.card}>
        <View style={styles.formulaCard}>
          <Ionicons name="bulb-outline" size={20} color={Colors.primary} />
          <Text style={styles.formulaText}>
            公式: E = (Φ / 4πd²) × cos(θ)
          </Text>
        </View>
        <Text style={styles.tipText}>
          输入灯具光通量、投射距离和入射角度，计算目标表面的照度值。
          基于平方反比定律和余弦校正。
        </Text>
      </GlassCard>
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <PageHeader
          title="光束角度计算"
          subtitle="灯光投射计算工具"
          showTopSafeArea={false}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderUnitToggle()}

        <GlassTabGroup
          tabs={tabs}
          activeIndex={activeTab}
          onChange={setActiveTab}
          style={styles.tabGroup}
        />

        {activeTab === 0 && renderDistanceCalculator()}
        {activeTab === 1 && renderSpotCalculator()}
        {activeTab === 2 && renderIlluminanceCalculator()}

        <View style={styles.actions}>
          <GlassButton
            variant="secondary"
            size="small"
            onPress={handleClear}
          >
            清除
          </GlassButton>
          <GlassButton
            size="small"
            onPress={handleShare}
          >
            <View style={styles.shareButtonContent}>
              <Ionicons name="share-outline" size={18} color="#e0f2fe" />
              <Text style={styles.shareButtonText}>分享结果</Text>
            </View>
          </GlassButton>
        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 16,
  },
  backButton: {
    padding: 8,
    marginRight: -4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  tabGroup: {
    marginBottom: 20,
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  unitToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  unitToggleGroup: {
    flexDirection: 'row',
    backgroundColor: Colors.glass,
    borderRadius: 12,
    padding: 4,
    flex: 1,
  },
  unitToggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  unitToggleButtonActive: {
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.borderActive,
  },
  unitToggleText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  unitToggleTextActive: {
    color: Colors.primary,
  },
  inputRow: {
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  inputLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    paddingLeft: 16,
    width: 70,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  inputUnit: {
    fontSize: 13,
    color: Colors.textMuted,
    paddingRight: 16,
    minWidth: 50,
    textAlign: 'right',
  },
  quickButtons: {
    marginTop: 8,
  },
  quickButtonsLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickButtonActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.borderActive,
  },
  quickButtonText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  quickButtonTextActive: {
    color: Colors.primary,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  resultItem: {
    width: '47%',
    backgroundColor: Colors.glass,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  resultItemHighlight: {
    width: '100%',
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.borderActive,
  },
  resultLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  resultValueHighlight: {
    fontSize: 32,
    color: Colors.primary,
  },
  resultUnit: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  formulaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  formulaText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  tipText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  referenceValues: {
    marginTop: 12,
    backgroundColor: Colors.glass,
    borderRadius: 10,
    padding: 12,
  },
  referenceTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  referenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  referenceItem: {
    fontSize: 11,
    color: Colors.textMuted,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  shareButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e0f2fe',
  },
});
