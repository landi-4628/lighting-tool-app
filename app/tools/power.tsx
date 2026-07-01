import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { PageHeader } from '@/components/ui/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassTabGroup } from '@/components/ui/glass-tab-group';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { Colors } from '@/constants/colors';

interface FixtureItem {
  id: string;
  name: string;
  power: string;
  quantity: string;
}

interface WireGaugeInfo {
  gauge: number;
  maxCurrent: number;
  description: string;
}

const WIRE_GAUGES: WireGaugeInfo[] = [
  { gauge: 1.5, maxCurrent: 14, description: '照明回路' },
  { gauge: 2.5, maxCurrent: 20, description: '普通插座' },
  { gauge: 4, maxCurrent: 27, description: '空调/热水器' },
  { gauge: 6, maxCurrent: 35, description: '中央空调' },
  { gauge: 10, maxCurrent: 48, description: '总配电' },
  { gauge: 16, maxCurrent: 65, description: '工业配电' },
  { gauge: 25, maxCurrent: 85, description: '主电源' },
];

export default function PowerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState(0);
  const [voltage, setVoltage] = useState(220);
  const [fixtures, setFixtures] = useState<FixtureItem[]>([
    { id: '1', name: '', power: '', quantity: '1' },
  ]);
  const [customPower, setCustomPower] = useState('');

  const tabs = [
    { label: '负载统计', value: 'load' },
    { label: '电流计算', value: 'current' },
    { label: '线径选择', value: 'wire' },
  ];

  const voltageTabs = [
    { label: '220V', value: '220' },
    { label: '380V', value: '380' },
  ];

  // Calculate total power from fixtures
  const totalPowerFromFixtures = useMemo(() => {
    return fixtures.reduce((sum, fixture) => {
      const power = parseFloat(fixture.power) || 0;
      const quantity = parseInt(fixture.quantity, 10) || 1;
      return sum + power * quantity;
    }, 0);
  }, [fixtures]);

  // Get total power (use custom power or calculated from fixtures)
  const totalPower = useMemo(() => {
    if (customPower) {
      return parseFloat(customPower) || 0;
    }
    return totalPowerFromFixtures;
  }, [customPower, totalPowerFromFixtures]);

  // Calculate current
  const calculatedCurrent = useMemo(() => {
    if (totalPower === 0 || voltage === 0) return 0;
    return totalPower / voltage;
  }, [totalPower, voltage]);

  // Calculate three-phase current for 380V
  const threePhaseCurrent = useMemo(() => {
    if (totalPower === 0 || voltage === 0) return 0;
    return totalPower / (voltage * Math.sqrt(3));
  }, [totalPower, voltage]);

  // Recommend wire gauge
  const recommendedWireGauge = useMemo((): WireGaugeInfo | null => {
    const current = voltage === 380 ? threePhaseCurrent : calculatedCurrent;
    if (current === 0) return null;

    for (const wire of WIRE_GAUGES) {
      if (current <= wire.maxCurrent) {
        return wire;
      }
    }
    return WIRE_GAUGES[WIRE_GAUGES.length - 1];
  }, [calculatedCurrent, threePhaseCurrent, voltage]);

  // Generate distribution suggestions
  const distributionSuggestions = useMemo(() => {
    if (totalPower === 0) return [];

    const suggestions: { category: string; power: number; details: string }[] = [];
    const powerPerCircuit = 3000; // 3kW per circuit as general rule

    if (totalPower <= 3000) {
      suggestions.push({
        category: '单回路',
        power: totalPower,
        details: '可直接接入普通照明回路',
      });
    } else if (totalPower <= 10000) {
      suggestions.push({
        category: '专用回路',
        power: totalPower,
        details: '建议设置专用配电回路，使用4mm²以上电线',
      });
    } else if (totalPower <= 30000) {
      const mainPower = Math.ceil(totalPower / powerPerCircuit) * powerPerCircuit;
      const circuitCount = Math.ceil(totalPower / powerPerCircuit);
      suggestions.push({
        category: '分配电箱',
        power: totalPower,
        details: `建议使用分配电箱，设置${circuitCount}个独立回路，每回路${powerPerCircuit / 1000}kW`,
      });
    } else {
      suggestions.push({
        category: '专业配电',
        power: totalPower,
        details: '建议咨询专业电气工程师进行配电设计',
      });
    }

    // Add specific suggestions based on voltage
    if (voltage === 380) {
      suggestions.push({
        category: '三相平衡',
        power: 0,
        details: '建议三相负载均衡分配，避免偏相过载',
      });
    }

    return suggestions;
  }, [totalPower, voltage]);

  // Add new fixture
  const handleAddFixture = useCallback(() => {
    const newId = String(Date.now());
    setFixtures((prev) => [
      ...prev,
      { id: newId, name: '', power: '', quantity: '1' },
    ]);
  }, []);

  // Remove fixture
  const handleRemoveFixture = useCallback((id: string) => {
    if (fixtures.length === 1) {
      Alert.alert('提示', '至少需要保留一行灯具信息');
      return;
    }
    setFixtures((prev) => prev.filter((f) => f.id !== id));
  }, [fixtures.length]);

  // Update fixture
  const handleUpdateFixture = useCallback(
    (id: string, field: keyof FixtureItem, value: string) => {
      setFixtures((prev) =>
        prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
      );
    },
    []
  );

  // Clear all fixtures
  const handleClearFixtures = useCallback(() => {
    Alert.alert(
      '确认清空',
      '确定要清空所有灯具信息吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清空',
          style: 'destructive',
          onPress: () => {
            setFixtures([{ id: '1', name: '', power: '', quantity: '1' }]);
            setCustomPower('');
          },
        },
      ]
    );
  }, []);

  // Calculate and show results
  const handleCalculate = useCallback(() => {
    if (totalPower === 0) {
      Alert.alert('提示', '请输入灯具功率信息');
      return;
    }

    const currentInfo =
      voltage === 380
        ? `三相电流: ${threePhaseCurrent.toFixed(2)}A`
        : `单相电流: ${calculatedCurrent.toFixed(2)}A`;

    Alert.alert(
      '计算结果',
      `总功率: ${totalPower}W\n电压: ${voltage}V\n${currentInfo}${
        recommendedWireGauge
          ? `\n推荐线径: ${recommendedWireGauge.gauge}mm² (${recommendedWireGauge.description})`
          : ''
      }`,
      [{ text: '确定' }]
    );
  }, [
    totalPower,
    voltage,
    calculatedCurrent,
    threePhaseCurrent,
    recommendedWireGauge,
  ]);

  // Render Load Statistics Tab
  const renderLoadTab = () => (
    <>
      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>灯具列表</Text>

        {fixtures.map((fixture, index) => (
          <View key={fixture.id} style={styles.fixtureRow}>
            <View style={styles.fixtureInputs}>
              <GlassInput
                placeholder="灯具名称"
                value={fixture.name}
                onChangeText={(value) => handleUpdateFixture(fixture.id, 'name', value)}
                containerStyle={styles.nameInput}
              />
              <GlassInput
                placeholder="功率(W)"
                value={fixture.power}
                onChangeText={(value) => handleUpdateFixture(fixture.id, 'power', value)}
                keyboardType="numeric"
                containerStyle={styles.powerInput}
              />
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    const qty = parseInt(fixture.quantity, 10) || 1;
                    if (qty > 1) {
                      handleUpdateFixture(fixture.id, 'quantity', String(qty - 1));
                    }
                  }}
                >
                  <Ionicons name="remove" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{fixture.quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    const qty = parseInt(fixture.quantity, 10) || 1;
                    handleUpdateFixture(fixture.id, 'quantity', String(qty + 1));
                  }}
                >
                  <Ionicons name="add" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveFixture(fixture.id)}
            >
              <Ionicons name="close-circle" size={24} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        ))}

        <GlassButton
          variant="secondary"
          size="small"
          onPress={handleAddFixture}
          style={styles.addButton}
        >
          <Ionicons name="add-circle-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.addButtonText}>添加灯具</Text>
        </GlassButton>
      </GlassCard>

      <GlassCard style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>灯具数量</Text>
          <Text style={styles.summaryValue}>{fixtures.length} 个</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>总功率</Text>
          <Text style={styles.summaryValuePrimary}>
            {totalPowerFromFixtures.toFixed(0)} W
          </Text>
        </View>
      </GlassCard>

      <GlassCard style={styles.tipsCard}>
        <View style={styles.tipsHeader}>
          <Ionicons name="information-circle" size={18} color={Colors.primary} />
          <Text style={styles.tipsTitle}>使用说明</Text>
        </View>
        <Text style={styles.tipsText}>
          输入灯具名称、单个功率(W)和数量，系统自动统计总功率。支持添加多个灯具类型。
        </Text>
      </GlassCard>
    </>
  );

  // Render Current Calculation Tab
  const renderCurrentTab = () => (
    <>
      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>电压选择</Text>
        <GlassTabGroup
          tabs={voltageTabs}
          activeIndex={voltage === 220 ? 0 : 1}
          onChange={(index) => setVoltage(index === 0 ? 220 : 380)}
          style={styles.voltageTabs}
        />
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>总功率输入</Text>
        <View style={styles.powerInputRow}>
          <View style={styles.customPowerContainer}>
            <GlassInput
              placeholder="输入总功率 (W)"
              value={customPower}
              onChangeText={setCustomPower}
              keyboardType="numeric"
              containerStyle={styles.customPowerInput}
            />
          </View>
          <Text style={styles.orText}>或</Text>
          <View style={styles.calculatedPower}>
            <Text style={styles.calculatedPowerLabel}>计算值</Text>
            <Text style={styles.calculatedPowerValue}>
              {totalPowerFromFixtures.toFixed(0)} W
            </Text>
          </View>
        </View>
        <Text style={styles.helperText}>
          直接输入总功率，或使用「负载统计」中计算的值
        </Text>
      </GlassCard>

      <GlassCard style={styles.resultCard}>
        <Text style={styles.sectionTitle}>计算结果</Text>

        <View style={styles.resultDisplay}>
          <View style={styles.resultMain}>
            <Text style={styles.resultValue}>
              {totalPower > 0 ? totalPower.toFixed(0) : '--'}
            </Text>
            <Text style={styles.resultUnit}>W</Text>
          </View>
        </View>

        <View style={styles.currentResults}>
          {voltage === 220 ? (
            <View style={styles.currentItem}>
              <Ionicons name="flash" size={24} color={Colors.primary} />
              <View style={styles.currentInfo}>
                <Text style={styles.currentLabel}>单相电流</Text>
                <Text style={styles.currentValue}>
                  {calculatedCurrent > 0 ? calculatedCurrent.toFixed(2) : '--'} A
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.currentItem}>
              <Ionicons name="flash" size={24} color={Colors.warning} />
              <View style={styles.currentInfo}>
                <Text style={styles.currentLabel}>三相电流</Text>
                <Text style={styles.currentValue}>
                  {threePhaseCurrent > 0 ? threePhaseCurrent.toFixed(2) : '--'} A
                </Text>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.formulaText}>
          {voltage === 220
            ? '公式: 电流(A) = 功率(W) ÷ 电压(V)'
            : '公式: 电流(A) = 功率(W) ÷ (电压(V) × √3)'}
        </Text>
      </GlassCard>
    </>
  );

  // Render Wire Gauge Selection Tab
  const renderWireTab = () => (
    <>
      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>当前状态</Text>

        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>功率</Text>
            <Text style={styles.statusValue}>{totalPower.toFixed(0)} W</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>电压</Text>
            <Text style={styles.statusValue}>{voltage} V</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>电流</Text>
            <Text style={styles.statusValue}>
              {(voltage === 380 ? threePhaseCurrent : calculatedCurrent).toFixed(2)} A
            </Text>
          </View>
        </View>
      </GlassCard>

      {recommendedWireGauge && (
        <GlassCard style={styles.recommendationCard} raised>
          <View style={styles.recommendationHeader}>
            <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
            <View style={styles.recommendationInfo}>
              <Text style={styles.recommendationTitle}>推荐线径</Text>
              <Text style={styles.recommendationValue}>
                {recommendedWireGauge.gauge} mm²
              </Text>
            </View>
          </View>
          <Text style={styles.recommendationDesc}>
            适用场景: {recommendedWireGauge.description}
          </Text>
          <Text style={styles.recommendationDetail}>
            最大载流量: {recommendedWireGauge.maxCurrent}A（明敷）
          </Text>
        </GlassCard>
      )}

      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>线径参考表</Text>
        <Text style={styles.tableSubtitle}>根据电流自动匹配最合适的线径</Text>

        <View style={styles.wireTable}>
          <View style={styles.wireTableHeader}>
            <Text style={[styles.wireTableCell, styles.wireTableCellTitle]}>线径</Text>
            <Text style={[styles.wireTableCell, styles.wireTableCellTitle]}>载流量</Text>
            <Text style={[styles.wireTableCell, styles.wireTableCellTitle]}>适用场景</Text>
          </View>

          {WIRE_GAUGES.map((wire, index) => {
            const isRecommended = recommendedWireGauge?.gauge === wire.gauge;
            const isOverCapacity =
              (voltage === 380 ? threePhaseCurrent : calculatedCurrent) > wire.maxCurrent &&
              (voltage === 380 ? threePhaseCurrent : calculatedCurrent) > 0;

            return (
              <View
                key={wire.gauge}
                style={[
                  styles.wireTableRow,
                  isRecommended && styles.wireTableRowRecommended,
                  isOverCapacity && styles.wireTableRowWarning,
                ]}
              >
                <Text
                  style={[
                    styles.wireTableCell,
                    isRecommended && styles.wireTableCellRecommended,
                  ]}
                >
                  {wire.gauge}mm²
                </Text>
                <Text
                  style={[
                    styles.wireTableCell,
                    isRecommended && styles.wireTableCellRecommended,
                  ]}
                >
                  {wire.maxCurrent}A
                </Text>
                <Text
                  style={[
                    styles.wireTableCell,
                    isRecommended && styles.wireTableCellRecommended,
                  ]}
                >
                  {wire.description}
                </Text>
              </View>
            );
          })}
        </View>
      </GlassCard>

      {totalPower > 0 && distributionSuggestions.length > 0 && (
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>配电建议</Text>

          {distributionSuggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <View style={styles.suggestionHeader}>
                <View style={styles.suggestionBadge}>
                  <Ionicons
                    name={
                      suggestion.category === '专业配电'
                        ? 'warning'
                        : suggestion.category === '三相平衡'
                        ? 'sync'
                        : 'leaf'
                    }
                    size={16}
                    color={
                      suggestion.category === '专业配电'
                        ? Colors.warning
                        : Colors.primary
                    }
                  />
                  <Text style={styles.suggestionCategory}>{suggestion.category}</Text>
                </View>
                {suggestion.power > 0 && (
                  <Text style={styles.suggestionPower}>{suggestion.power / 1000}kW</Text>
                )}
              </View>
              <Text style={styles.suggestionDetail}>{suggestion.details}</Text>
            </View>
          ))}
        </GlassCard>
      )}

      <GlassCard style={styles.tipsCard}>
        <View style={styles.tipsHeader}>
          <Ionicons name="shield-checkmark" size={18} color={Colors.success} />
          <Text style={styles.tipsTitle}>安全提示</Text>
        </View>
        <Text style={styles.tipsText}>
          • 线径选择应考虑环境温度、敷设方式等因素{'n'}
          • 建议实际使用电流不超过载流量的80%{'n'}
          • 大功率设备建议使用漏电保护器{'n'}
          • 超过10kW建议咨询专业电工
        </Text>
      </GlassCard>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <PageHeader
          title="功率计算"
          subtitle="负载统计与配电建议"
          showTopSafeArea={false}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GlassTabGroup
          tabs={tabs}
          activeIndex={activeTab}
          onChange={setActiveTab}
          style={styles.tabGroup}
        />

        {activeTab === 0 && renderLoadTab()}
        {activeTab === 1 && renderCurrentTab()}
        {activeTab === 2 && renderWireTab()}

        {totalPower > 0 && (
          <GlassButton
            size="large"
            onPress={handleCalculate}
            style={styles.calculateButton}
          >
            <Ionicons name="calculator" size={20} color="#e0f2fe" />
            <Text style={styles.calculateButtonText}>计算配电方案</Text>
          </GlassButton>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
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
  },
  tabGroup: {
    marginBottom: 20,
  },
  card: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  fixtureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fixtureInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  nameInput: {
    flex: 2,
  },
  powerInput: {
    flex: 1,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass,
    borderRadius: 14,
    paddingHorizontal: 4,
  },
  quantityButton: {
    padding: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    minWidth: 32,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
    marginLeft: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  summaryCard: {
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryValuePrimary: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  tipsCard: {
    padding: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  tipsText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  voltageTabs: {
    marginTop: 8,
  },
  powerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  customPowerContainer: {
    flex: 1,
  },
  customPowerInput: {},
  orText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  calculatedPower: {
    flex: 1,
    backgroundColor: Colors.glass,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  calculatedPowerLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  calculatedPowerValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  resultCard: {
    padding: 16,
    marginBottom: 16,
  },
  resultDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  resultValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  resultUnit: {
    fontSize: 20,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  currentResults: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  currentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.glass,
    padding: 16,
    borderRadius: 12,
  },
  currentInfo: {},
  currentLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  currentValue: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  formulaText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  recommendationCard: {
    padding: 16,
    marginBottom: 16,
    borderColor: Colors.success,
    borderWidth: 1,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  recommendationInfo: {},
  recommendationTitle: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '500',
  },
  recommendationValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.success,
  },
  recommendationDesc: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  recommendationDetail: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  tableSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: -12,
    marginBottom: 12,
  },
  wireTable: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  wireTableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.glass,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  wireTableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  wireTableRowRecommended: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  wireTableRowWarning: {
    opacity: 0.5,
  },
  wireTableCell: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  wireTableCellTitle: {
    fontWeight: '600',
    color: Colors.text,
  },
  wireTableCellRecommended: {
    color: Colors.success,
    fontWeight: '600',
  },
  suggestionItem: {
    backgroundColor: Colors.glass,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestionCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  suggestionPower: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  suggestionDetail: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  calculateButton: {
    marginTop: 8,
    gap: 8,
  },
  calculateButtonText: {
    color: '#e0f2fe',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 32,
  },
});
