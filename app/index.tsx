import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from '@/components/ui/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassSlider } from '@/components/ui/glass-slider';
import { Colors } from '@/constants/colors';

const METERS_TO_FEET = 3.28084;
const FEET_TO_METERS = 0.3048;

const COMMON_ANGLES = [5, 10, 15, 20, 30, 45, 60];
const COMMON_DISTANCES_M = [2, 5, 10, 20, 50];

type TabKey = 'diameter' | 'angle';
type Unit = 'metric' | 'imperial';

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'diameter', label: '直径', icon: 'aperture-outline' },
  { key: 'angle', label: '角度', icon: 'triangle-outline' },
];

// ============================================================
// Cone Diagram
// ============================================================
interface ConeDiagramProps {
  angle: number;
  dist: number;
  diameter: number;
  unit: string;
}

const ConeDiagram = React.memo(function ConeDiagram({ angle, dist, diameter, unit }: ConeDiagramProps) {
  const ARENA_W = 240, ARENA_H = 180;
  const lampY = 20, groundY = 155;
  const beamH = groundY - lampY;
  const half = Math.max(8, Math.min(95, 100 * Math.tan((angle * Math.PI) / 360)));
  const CX = ARENA_W / 2;

  return (
    <View style={styles.diagramCard}>
      <Text style={styles.diagramHeader}>光束投射示意</Text>
      <View style={[styles.coneArena, { width: ARENA_W, height: ARENA_H }]}>
        <View style={[styles.lampBody, { left: CX - 10, top: lampY }]} />
        <View
          style={[
            styles.cone,
            {
              top: lampY + 8,
              left: CX - half,
              height: beamH,
              borderLeftWidth: half,
              borderRightWidth: half,
              borderBottomWidth: beamH,
            },
          ]}
        />
        <View style={[styles.axisLine, { left: CX - 0.5, top: lampY + 8, height: beamH }]} />
        <View style={[styles.groundLine, { left: 8, right: 8 }]} />
        <View style={[styles.spot, { left: CX - (half + 9), width: (half + 9) * 2 }]} />
        <View style={[styles.coneEdgeLabel, { left: CX + half + 8, top: lampY + beamH / 2 - 8 }]}>
          <Text style={styles.edgeLabelText}>θ = {angle}°</Text>
        </View>
        <View style={styles.coneBottomLabel}>
          <Text style={styles.coneBottomText}>D = {diameter.toFixed(2)} {unit}</Text>
        </View>
      </View>
    </View>
  );
});

// ============================================================
// Results Cards (stable, memoized)
// ============================================================
interface ResultPairProps {
  label1: string;
  value1: number;
  unit1: string;
  label2: string;
  value2: number;
  unit2: string;
  unit: string;
}

const ResultPair = React.memo(function ResultPair({
  label1, value1, unit1,
  label2, value2, unit2,
}: ResultPairProps) {
  return (
    <GlassCard style={styles.resultCard} raised>
      <View style={styles.resultsRow}>
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>{label1}</Text>
          <Text style={styles.resultValue}>{value1.toFixed(2)}</Text>
          <Text style={styles.resultUnit}>{unit1}</Text>
        </View>
        <View style={styles.resultDivider} />
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>{label2}</Text>
          <Text style={styles.resultValue}>{value2.toFixed(2)}</Text>
          <Text style={styles.resultUnit}>{unit2}</Text>
        </View>
      </View>
    </GlassCard>
  );
});

interface IllumResultProps {
  centerLux: number;
  diameter: number;
  area: number;
  unit: string;
}

const IllumResult = React.memo(function IllumResult({ centerLux, diameter, area, unit }: IllumResultProps) {
  const displayLux = centerLux.toFixed(0);
  const luxUnit = 'lux';
  const showExtras = area > 0;

  return (
    <GlassCard style={styles.resultCard} raised>
      <View style={styles.illumHero}>
        <Text style={styles.resultLabel}>中心照度</Text>
        <Text style={styles.illumHeroValue}>{displayLux}</Text>
        <Text style={styles.illumHeroUnit}>{luxUnit}</Text>
      </View>
      {showExtras && (
        <View style={styles.resultsRow}>
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>光斑直径</Text>
            <Text style={styles.resultValueSmall}>{diameter.toFixed(2)}</Text>
            <Text style={styles.resultUnitSmall}>{unit}</Text>
          </View>
          <View style={styles.resultDivider} />
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>光斑面积</Text>
            <Text style={styles.resultValueSmall}>{area.toFixed(2)}</Text>
            <Text style={styles.resultUnitSmall}>m²</Text>
          </View>
        </View>
      )}
    </GlassCard>
  );
});

// ============================================================
// Main Screen
// ============================================================
export default function HomeScreen() {
  const router = useRouter();
  const [unit, setUnit] = useState<Unit>('metric');
  const [tab, setTab] = useState<TabKey>('diameter');

  // Diameter tab
  const [beamAngle, setBeamAngle] = useState(30);
  const [beamDist, setBeamDist] = useState(10);
  // Angle tab: derive beam angle from desired spot diameter and projection distance
  const [spotDiameter, setSpotDiameter] = useState(5);
  const [beamDistAngle, setBeamDistAngle] = useState(10);
  // Shared across tabs
  const [lumen, setLumen] = useState(5000);

  const toM = useCallback((v: number) => (unit === 'imperial' ? v * FEET_TO_METERS : v), [unit]);
  const fromM = useCallback((v: number) => (unit === 'imperial' ? v * METERS_TO_FEET : v), [unit]);
  const dU = unit === 'metric' ? 'm' : 'ft';

  // Stable memoized calculation results
  const diameterCalc = useMemo(() => {
    if (beamAngle <= 0 || beamDist <= 0) return null;
    const L = toM(beamDist);
    const rad = (beamAngle * Math.PI) / 180;
    const d = 2 * L * Math.tan(rad / 2);
    return { diameter: fromM(d), radius: fromM(d / 2) };
  }, [beamAngle, beamDist, toM, fromM]);

  const angleCalc = useMemo(() => {
    if (spotDiameter <= 0 || beamDistAngle <= 0) return null;
    const D = toM(spotDiameter);
    const L = toM(beamDistAngle);
    // Inverse beam-angle formula: θ = 2 · atan(D / (2L))
    const angle = (2 * Math.atan(D / (2 * L)) * 180) / Math.PI;
    return {
      angle,
      diameter: fromM(D),
      dist: fromM(L),
    };
  }, [spotDiameter, beamDistAngle, toM, fromM]);

  const illumCalc = useMemo(() => {
    if (lumen <= 0) return null;
    // Diameter tab: use beam angle + beam dist
    const dL = toM(beamDist);
    const dRad = (beamAngle * Math.PI) / 180;
    const dR = dL * Math.tan(dRad / 2);
    const dArea = dR > 0 ? Math.PI * dR * dR : 0;
    const diameterLux = dArea > 0 ? lumen / dArea : 0;
    const diameterSpot = fromM(dR * 2);

    // Angle tab: compute beam angle from spot diameter + distance, then spot area
    if (!angleCalc) {
      return { diameterLux, diameterSpot, angleLux: 0, angleSpot: 0 };
    }
    const aL = toM(beamDistAngle);
    const aRad = (angleCalc.angle * Math.PI) / 180;
    const aR = aL * Math.tan(aRad / 2);
    const aArea = aR > 0 ? Math.PI * aR * aR : 0;
    const angleLux = aArea > 0 ? lumen / aArea : 0;
    const angleSpot = fromM(aR * 2);

    return { diameterLux, diameterSpot, angleLux, angleSpot };
  }, [lumen, beamAngle, beamDist, angleCalc, beamDistAngle, toM, fromM]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.push('/menu')} style={styles.moreBtn}>
            <Text style={styles.moreBtnText}>查看更多功能</Text>
            <Ionicons name="grid-outline" size={18} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setTab(t.key)}
                style={[styles.tabItem, active && styles.tabItemActive]}
              >
                <Ionicons
                  name={t.icon}
                  size={16}
                  color={active ? Colors.primary : Colors.textMuted}
                />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {t.label}计算
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.unitBar}>
          {(['metric', 'imperial'] as Unit[]).map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.unitPill, unit === u && styles.unitPillActive]}
              onPress={() => setUnit(u)}
            >
              <Text style={[styles.unitPillText, unit === u && styles.unitPillTextActive]}>
                {u === 'metric' ? '米 (m)' : '英尺 (ft)'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sharedLumenWrap}>
          <GlassSlider
            label="光通量 Φ"
            value={lumen}
            min={100} max={50000} step={100}
            unit="lm"
            onChange={setLumen}
            quickValues={[1000, 3000, 5000, 10000, 20000]}
            onQuickValue={setLumen}
          />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {tab === 'diameter' && (
            <>
              <GlassCard style={styles.inputCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconWrap}>
                    <Ionicons name="aperture-outline" size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.cardTitle}>直径计算</Text>
                  <Text style={styles.cardSubtitle}>D = 2 × L × tan(θ / 2)</Text>
                </View>
                <GlassSlider
                  label="光束角度 θ"
                  value={beamAngle}
                  min={1} max={60} step={0.5}
                  unit="°"
                  onChange={setBeamAngle}
                  quickValues={COMMON_ANGLES}
                  onQuickValue={setBeamAngle}
                />
                <GlassSlider
                  label="投射距离 L"
                  value={beamDist}
                  min={1} max={50} step={0.5}
                  unit={dU}
                  onChange={setBeamDist}
                  quickValues={COMMON_DISTANCES_M}
                  onQuickValue={setBeamDist}
                />
              </GlassCard>

              {diameterCalc && (
                <ConeDiagram
                  angle={beamAngle}
                  dist={beamDist}
                  diameter={diameterCalc.diameter}
                  unit={dU}
                />
              )}
              {diameterCalc && (
                <ResultPair
                  label1="光斑直径" value1={diameterCalc.diameter} unit1={dU}
                  label2="光斑半径" value2={diameterCalc.radius} unit2={dU}
                  unit={dU}
                />
              )}
              {illumCalc && (
                <IllumResult
                  centerLux={illumCalc.diameterLux}
                  diameter={illumCalc.diameterSpot}
                  area={0}
                  unit={dU}
                />
              )}
            </>
          )}

          {tab === 'angle' && (
            <>
              <GlassCard style={styles.inputCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconWrap}>
                    <Ionicons name="triangle-outline" size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.cardTitle}>角度计算</Text>
                  <Text style={styles.cardSubtitle}>θ = 2 · atan(D / (2L))</Text>
                </View>
                <GlassSlider
                  label="光斑直径 D"
                  value={spotDiameter}
                  min={0.5} max={10} step={0.1}
                  unit={dU}
                  onChange={setSpotDiameter}
                  quickValues={[1, 2, 3, 5, 8]}
                  onQuickValue={setSpotDiameter}
                />
                <GlassSlider
                  label="投射距离 L"
                  value={beamDistAngle}
                  min={1} max={50} step={0.5}
                  unit={dU}
                  onChange={setBeamDistAngle}
                  quickValues={COMMON_DISTANCES_M}
                  onQuickValue={setBeamDistAngle}
                />
              </GlassCard>

              {angleCalc && (
                <ConeDiagram
                  angle={angleCalc.angle}
                  dist={angleCalc.dist}
                  diameter={angleCalc.diameter}
                  unit={dU}
                />
              )}
              {angleCalc && (
                <ResultPair
                  label1="所需光束角" value1={angleCalc.angle} unit1="°"
                  label2="光斑直径" value2={angleCalc.diameter} unit2={dU}
                  unit={dU}
                />
              )}
              {illumCalc && (
                <IllumResult
                  centerLux={illumCalc.angleLux}
                  diameter={illumCalc.angleSpot}
                  area={0}
                  unit={dU}
                />
              )}
            </>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================
const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  moreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  moreBtnText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.glass,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginBottom: 12,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.borderActive,
  },
  tabLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  unitBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  sharedLumenWrap: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  unitPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unitPillActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.borderActive,
  },
  unitPillText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  unitPillTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  inputCard: {
    marginBottom: 12,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  cardIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  cardSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 'auto',
    fontVariant: ['tabular-nums'],
  },
  // Diagrams
  diagramCard: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.borderIce,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  diagramHeader: {
    alignSelf: 'flex-start',
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  coneArena: {
    width: 240,
    height: 180,
    position: 'relative',
    alignItems: 'center',
  },
  lampBody: {
    position: 'absolute',
    width: 20,
    height: 8,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  cone: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(255, 200, 100, 0.2)',
    borderTopColor: 'transparent',
  },
  axisLine: {
    position: 'absolute',
    width: 1,
    backgroundColor: 'rgba(255, 200, 100, 0.18)',
  },
  coneEdgeLabel: {
    position: 'absolute',
  },
  coneBottomLabel: {
    position: 'absolute',
    bottom: 22,
    alignItems: 'center',
  },
  coneBottomText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  bottomLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  distLabel: {
    position: 'absolute',
    right: 8,
    top: 75,
  },
  edgeLabelText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  groundLine: {
    position: 'absolute',
    bottom: 16,
    left: 8,
    right: 8,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  spot: {
    position: 'absolute',
    bottom: 12,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 200, 100, 0.55)',
  },
  // Results
  resultCard: {
    marginBottom: 12,
    padding: 12,
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  resultBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  resultDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 6,
  },
  resultLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  resultValueSmall: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  resultUnit: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
    fontWeight: '500',
  },
  resultUnitSmall: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  illumHero: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 14,
    backgroundColor: Colors.primaryGlow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderActive,
  },
  illumHeroValue: {
    fontSize: 44,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: -1,
  },
  illumHeroUnit: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 2,
  },
});
