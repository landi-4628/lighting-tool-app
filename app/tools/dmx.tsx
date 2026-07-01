import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Share } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from '@/components/ui/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassTabGroup } from '@/components/ui/glass-tab-group';
import { Colors } from '@/constants/colors';

interface Fixture {
  id: string;
  name: string;
  channels: string;
}

interface CalculationResult {
  name: string;
  channels: number;
  start: number;
  end: number;
  universe: number;
  overflow: boolean;
}

const DMX_ADDRESSES_PER_UNIVERSE = 512;
const MAX_UNIVERSES = 64;

export default function DmxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [universe, setUniverse] = useState(1);
  const [fixtures, setFixtures] = useState<Fixture[]>([
    { id: '1', name: '染色灯 1', channels: '16' },
    { id: '2', name: '光束灯 1', channels: '8' },
    { id: '3', name: '帕灯组', channels: '4' },
  ]);
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { label: '地址计算', value: 'calc' },
    { label: 'DIP 对照表', value: 'dip' },
  ];

  const addFixture = () => {
    const newId = Date.now().toString();
    setFixtures([...fixtures, { id: newId, name: `灯具 ${fixtures.length + 1}`, channels: '16' }]);
  };

  const removeFixture = (id: string) => {
    if (fixtures.length > 1) {
      setFixtures(fixtures.filter((f) => f.id !== id));
    }
  };

  const updateFixture = (id: string, field: 'name' | 'channels', value: string) => {
    if (field === 'channels') {
      const num = parseInt(value);
      if (value !== '' && (isNaN(num) || num < 0)) return;
    }
    setFixtures(fixtures.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  const calculateAddresses = useMemo((): CalculationResult[] => {
    const results: CalculationResult[] = [];
    let currentAddress = 1;
    let currentUniverse = 1;

    fixtures.forEach((fixture) => {
      const channels = parseInt(fixture.channels) || 0;
      if (channels <= 0) {
        results.push({
          name: fixture.name,
          channels: 0,
          start: 0,
          end: 0,
          universe: currentUniverse,
          overflow: false,
        });
        return;
      }

      let start = currentAddress;
      let end = start + channels - 1;

      // Handle overflow to next universes
      while (end > DMX_ADDRESSES_PER_UNIVERSE) {
        const overflowChannels = end - DMX_ADDRESSES_PER_UNIVERSE;
        results.push({
          name: `${fixture.name} (U${currentUniverse})`,
          channels: DMX_ADDRESSES_PER_UNIVERSE - start + 1,
          start: start,
          end: DMX_ADDRESSES_PER_UNIVERSE,
          universe: currentUniverse,
          overflow: true,
        });
        currentUniverse++;
        start = 1;
        end = overflowChannels;
      }

      results.push({
        name: fixture.name,
        channels,
        start,
        end,
        universe: currentUniverse,
        overflow: false,
      });

      currentAddress = end + 1;
      if (currentAddress > DMX_ADDRESSES_PER_UNIVERSE) {
        currentAddress = 1;
        currentUniverse++;
      }
    });

    return results;
  }, [fixtures]);

  const totalChannels = fixtures.reduce((sum, f) => sum + (parseInt(f.channels) || 0), 0);
  const hasOverflow = calculateAddresses.some((r) => r.overflow);
  const lastResult = calculateAddresses[calculateAddresses.length - 1];

  // DIP switch calculations
  const getDipValue = (address: number): { dip: number; value: number }[] => {
    const result: { dip: number; value: number }[] = [];
    let remaining = address;

    for (let i = 8; i >= 0; i--) {
      const power = Math.pow(2, i);
      if (remaining >= power) {
        result.push({ dip: i + 1, value: power });
        remaining -= power;
      }
      if (remaining === 0) break;
    }

    return result;
  };

  const generateExportText = () => {
    const lines: string[] = [
      'DMX 地址分配表',
      `Universe: ${universe}`,
      `生成时间: ${new Date().toLocaleString()}`,
      '',
      '序号\t灯具名称\t通道数\t起始地址\t结束地址\tUniverse',
      '----------------------------------------------',
    ];

    calculateAddresses.forEach((result, index) => {
      lines.push(
        `${index + 1}\t${result.name}\t${result.channels}\t${result.start}\t${result.end}\t${result.universe}`
      );
    });

    lines.push('');
    lines.push(`总通道数: ${totalChannels}`);
    if (hasOverflow) {
      lines.push('警告: 部分地址超出 DMX512 范围!');
    }

    return lines.join('\n');
  };

  const generateCsv = () => {
    const lines: string[] = ['序号,灯具名称,通道数,起始地址,结束地址,Universe'];

    calculateAddresses.forEach((result, index) => {
      lines.push(`${index + 1},"${result.name}",${result.channels},${result.start},${result.end},${result.universe}`);
    });

    return lines.join('\n');
  };

  const handleExport = () => {
    const text = generateExportText();
    const csv = generateCsv();

    Alert.alert('导出地址表', '选择导出格式', [
      {
        text: '文本格式',
        onPress: async () => {
          try {
            await Share.share({
              message: text,
              title: 'DMX 地址分配表',
            });
          } catch (error) {
            console.error('Share error:', error);
          }
        },
      },
      {
        text: 'CSV 格式',
        onPress: async () => {
          try {
            await Share.share({
              message: csv,
              title: 'DMX 地址分配表.csv',
            });
          } catch (error) {
            console.error('Share error:', error);
          }
        },
      },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const universeOptions = Array.from({ length: MAX_UNIVERSES }, (_, i) => ({
    label: String(i + 1),
    value: String(i + 1),
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <PageHeader
          title="DMX 地址码"
          subtitle="计算灯具链的起始地址与 DIP 拨码"
          showTopSafeArea={false}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <GlassTabGroup
          tabs={tabs}
          activeIndex={activeTab}
          onChange={setActiveTab}
          style={styles.tabGroup}
        />

        {activeTab === 0 ? (
          <>
            {/* Universe Settings */}
            <GlassCard style={styles.settingsCard}>
              <View style={styles.settingsHeader}>
                <Ionicons name="git-network-outline" size={18} color={Colors.primary} />
                <Text style={styles.settingsTitle}>Universe 设置</Text>
              </View>
              <Text style={styles.settingsSubtitle}>起始 Universe，当前支持 1-64</Text>
              <View style={styles.universeSelector}>
                {Array.from({ length: 8 }, (_, i) => i + 1).map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[
                      styles.universeItem,
                      universe === u && styles.universeItemActive,
                    ]}
                    onPress={() => setUniverse(u)}
                  >
                    <Text
                      style={[
                        styles.universeText,
                        universe === u && styles.universeTextActive,
                      ]}
                    >
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {MAX_UNIVERSES > 8 && (
                <View style={styles.universeSelector}>
                  {Array.from({ length: 8 }, (_, i) => i + 9).map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[
                        styles.universeItem,
                        universe === u && styles.universeItemActive,
                      ]}
                      onPress={() => setUniverse(u)}
                    >
                      <Text
                        style={[
                          styles.universeText,
                          universe === u && styles.universeTextActive,
                        ]}
                      >
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={styles.currentUniverse}>
                <Text style={styles.currentUniverseLabel}>当前选择:</Text>
                <View style={styles.currentUniverseBadge}>
                  <Text style={styles.currentUniverseValue}>Universe {universe}</Text>
                </View>
              </View>
            </GlassCard>

            {/* Fixture List */}
            <GlassCard style={styles.fixturesCard}>
              <View style={styles.fixturesHeader}>
                <View>
                  <Text style={styles.sectionTitle}>灯具列表</Text>
                  <Text style={styles.fixtureCount}>共 {fixtures.length} 台灯具</Text>
                </View>
                <GlassButton variant="secondary" size="small" onPress={addFixture}>
                  <View style={styles.addButtonContent}>
                    <Ionicons name="add" size={16} color={Colors.textSecondary} />
                    <Text style={styles.addButtonText}>添加</Text>
                  </View>
                </GlassButton>
              </View>

              <View style={styles.fixtureHeaderRow}>
                <Text style={[styles.fixtureHeaderText, { width: 32 }]}>序号</Text>
                <Text style={[styles.fixtureHeaderText, { flex: 1 }]}>名称</Text>
                <Text style={[styles.fixtureHeaderText, { width: 80 }]}>通道</Text>
                <View style={{ width: 40 }} />
              </View>

              {fixtures.map((fixture, index) => (
                <View key={fixture.id} style={styles.fixtureRow}>
                  <View style={styles.fixtureIndex}>
                    <Text style={styles.fixtureIndexText}>{index + 1}</Text>
                  </View>
                  <GlassInput
                    placeholder="灯具名称"
                    value={fixture.name}
                    onChangeText={(v) => updateFixture(fixture.id, 'name', v)}
                    style={styles.fixtureNameInput}
                  />
                  <View style={styles.channelsContainer}>
                    <GlassInput
                      placeholder="16"
                      value={fixture.channels}
                      onChangeText={(v) => updateFixture(fixture.id, 'channels', v)}
                      keyboardType="number-pad"
                      style={styles.channelsInput}
                    />
                    <Text style={styles.channelsLabel}>CH</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFixture(fixture.id)}
                    disabled={fixtures.length <= 1}
                  >
                    <Ionicons
                      name="close-circle"
                      size={22}
                      color={fixtures.length <= 1 ? Colors.textMuted : Colors.danger}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </GlassCard>

            {/* Calculation Results */}
            <GlassCard style={styles.resultsCard}>
              <View style={styles.resultsHeader}>
                <Text style={styles.sectionTitle}>计算结果</Text>
                {hasOverflow && (
                  <View style={styles.overflowBadge}>
                    <Ionicons name="warning" size={14} color={Colors.warning} />
                    <Text style={styles.overflowText}>超出范围</Text>
                  </View>
                )}
              </View>

              <View style={styles.resultHeaderRow}>
                <Text style={[styles.resultHeaderText, { flex: 1 }]}>灯具</Text>
                <Text style={[styles.resultHeaderText, { textAlign: 'right' }]}>地址</Text>
              </View>

              {calculateAddresses.map((result, index) => (
                <View
                  key={index}
                  style={[
                    styles.resultRow,
                    result.overflow && styles.resultRowOverflow,
                  ]}
                >
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{result.name}</Text>
                    <Text style={styles.resultChannels}>{result.channels} 通道</Text>
                  </View>
                  <View style={styles.resultAddressContainer}>
                    <View style={styles.resultAddressBadge}>
                      <Text style={styles.resultAddress}>
                        {result.start === 0 ? '--' : `${result.start}-${result.end}`}
                      </Text>
                    </View>
                    {result.universe > 1 && (
                      <Text style={styles.resultUniverse}>U{result.universe}</Text>
                    )}
                  </View>
                </View>
              ))}

              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>总通道数</Text>
                  <Text style={styles.summaryValue}>{totalChannels}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>占用 Universe</Text>
                  <Text style={styles.summaryValue}>
                    {Math.ceil(
                      calculateAddresses.reduce((sum, r) => {
                        if (r.overflow) return sum;
                        return sum + r.channels;
                      }, 0) / DMX_ADDRESSES_PER_UNIVERSE
                    ) || 1}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>最后地址</Text>
                  <Text style={styles.summaryValue}>
                    {lastResult ? lastResult.end || '--' : '--'}
                  </Text>
                </View>
              </View>
            </GlassCard>

            {/* Export Button */}
            <GlassButton style={styles.exportButton} onPress={handleExport}>
              <View style={styles.exportButtonContent}>
                <Ionicons name="download-outline" size={18} color="#e0f2fe" />
                <Text style={styles.exportButtonText}>导出地址表</Text>
              </View>
            </GlassButton>

            {/* Quick Reference */}
            <GlassCard style={styles.quickRefCard}>
              <View style={styles.quickRefHeader}>
                <Ionicons name="flash" size={18} color={Colors.warning} />
                <Text style={styles.quickRefTitle}>快速参考</Text>
              </View>
              <View style={styles.quickRefContent}>
                <View style={styles.quickRefItem}>
                  <Text style={styles.quickRefLabel}>地址计算公式</Text>
                  <Text style={styles.quickRefValue}>灯具N起始 = 上一台结束 + 1</Text>
                </View>
                <View style={styles.quickRefItem}>
                  <Text style={styles.quickRefLabel}>DMX 范围</Text>
                  <Text style={styles.quickRefValue}>每个 Universe: 1-512</Text>
                </View>
                <View style={styles.quickRefItem}>
                  <Text style={styles.quickRefLabel}>DIP 拨码</Text>
                  <Text style={styles.quickRefValue}>2^0=1, 2^1=2, 2^2=4...</Text>
                </View>
              </View>
            </GlassCard>
          </>
        ) : (
          <>
            {/* DIP Reference Table */}
            <GlassCard style={styles.dipCard}>
              <View style={styles.dipHeader}>
                <Ionicons name="git-network-outline" size={20} color={Colors.warning} />
                <Text style={styles.dipTitle}>DIP 拨码对照表</Text>
              </View>
              <Text style={styles.dipDescription}>
                DIP 拨码开关用于设置 DMX 起始地址。每个开关代表 2 的幂次方值。
              </Text>

              <View style={styles.dipGrid}>
                {Array.from({ length: 9 }, (_, i) => (
                  <View key={i} style={styles.dipItem}>
                    <View style={styles.dipSwitch}>
                      <Text style={styles.dipSwitchNum}>{i + 1}</Text>
                    </View>
                    <Text style={styles.dipEquals}>=</Text>
                    <Text style={styles.dipValue}>2^{i}</Text>
                    <Text style={styles.dipResult}>{Math.pow(2, i)}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            {/* DIP Examples */}
            <GlassCard style={styles.dipExamplesCard}>
              <Text style={styles.examplesTitle}>拨码示例</Text>
              <Text style={styles.examplesSubtitle}>常见地址的 DIP 拨码方式</Text>

              {[
                { address: 1, desc: '只拨 ON 1' },
                { address: 10, desc: 'ON 2 + ON 4' },
                { address: 15, desc: 'ON 1+2+3+4' },
                { address: 100, desc: 'ON 3+6+7' },
                { address: 256, desc: '只拨 ON 9' },
                { address: 512, desc: 'ON 9+1 (进位)' },
              ].map((example, index) => (
                <View key={index} style={styles.exampleRow}>
                  <View style={styles.exampleAddress}>
                    <Text style={styles.exampleAddressValue}>{example.address}</Text>
                  </View>
                  <View style={styles.dipVisual}>
                    {Array.from({ length: 9 }, (_, i) => {
                      const dips = getDipValue(example.address);
                      const isOn = dips.some((d) => d.dip === i + 1);
                      return (
                        <View
                          key={i}
                          style={[styles.dipVisualBit, isOn && styles.dipVisualBitOn]}
                        >
                          <Text
                            style={[
                              styles.dipVisualNum,
                              isOn && styles.dipVisualNumOn,
                            ]}
                          >
                            {i + 1}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                  <Text style={styles.exampleDesc}>{example.desc}</Text>
                </View>
              ))}
            </GlassCard>

            {/* DIP Calculator */}
            <GlassCard style={styles.calculatorCard}>
              <Text style={styles.calculatorTitle}>DIP 计算器</Text>
              <Text style={styles.calculatorSubtitle}>输入地址查看对应的 DIP 拨码</Text>

              <View style={styles.calculatorInput}>
                <Text style={styles.calculatorLabel}>DMX 地址</Text>
                <View style={styles.calculatorInputRow}>
                  <GlassInput
                    placeholder="1-512"
                    keyboardType="number-pad"
                    style={styles.calculatorInputField}
                  />
                  <GlassButton
                    variant="secondary"
                    size="small"
                    onPress={() => {}}
                    style={styles.calcButton}
                  >
                    计算
                  </GlassButton>
                </View>
              </View>

              <View style={styles.calculatorResult}>
                <Text style={styles.calcResultLabel}>需要拨动的开关:</Text>
                <Text style={styles.calcResultValue}>
                  <Text style={styles.calcResultHint}>在地址计算页面点击具体灯具查看</Text>
                </Text>
              </View>
            </GlassCard>

            {/* DIP Tips */}
            <GlassCard style={styles.tipsCard}>
              <View style={styles.tipsHeader}>
                <Ionicons name="information-circle" size={18} color={Colors.primary} />
                <Text style={styles.tipsTitle}>使用提示</Text>
              </View>
              <Text style={styles.tipsText}>
                • 地址 1 = 开关 1 拨到 ON{'\n'}
                • 地址 2 = 开关 2 拨到 ON{'\n'}
                • 地址 3 = 开关 1 + 开关 2 都拨到 ON{'\n'}
                • 地址 512 = 开关 9 拨到 ON{'\n'}
                • 向下拨为 ON，向上拨为 OFF{'\n'}
                • 多台设备地址不能重叠
              </Text>
            </GlassCard>
          </>
        )}

        <View style={{ height: 32 }} />
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabGroup: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  settingsCard: {
    padding: 16,
    marginBottom: 12,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 6,
  },
  settingsSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  universeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.glass,
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  universeItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  universeItemActive: {
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.borderActive,
  },
  universeText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  universeTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  currentUniverse: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  currentUniverseLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginRight: 8,
  },
  currentUniverseBadge: {
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderActive,
  },
  currentUniverseValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  fixturesCard: {
    padding: 16,
    marginBottom: 12,
  },
  fixturesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  fixtureCount: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  fixtureHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 8,
  },
  fixtureHeaderText: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fixtureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  fixtureIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fixtureIndexText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  fixtureNameInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  channelsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  channelsInput: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  channelsLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  removeButton: {
    padding: 4,
  },
  resultsCard: {
    padding: 16,
    marginBottom: 12,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  overflowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  overflowText: {
    fontSize: 11,
    color: Colors.warning,
    fontWeight: '500',
  },
  resultHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 4,
  },
  resultHeaderText: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultRowOverflow: {
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderBottomWidth: 0,
    marginBottom: 4,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  resultChannels: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  resultAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultAddressBadge: {
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderActive,
  },
  resultAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  resultUniverse: {
    fontSize: 11,
    color: Colors.textMuted,
    backgroundColor: Colors.glass,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  exportButton: {
    marginBottom: 12,
  },
  exportButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  exportButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e0f2fe',
  },
  quickRefCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  quickRefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickRefTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warning,
    marginLeft: 6,
  },
  quickRefContent: {
    gap: 10,
  },
  quickRefItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickRefLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  quickRefValue: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: 'monospace',
  },
  // DIP Tab Styles
  dipCard: {
    padding: 16,
    marginBottom: 12,
  },
  dipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 6,
  },
  dipDescription: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: 16,
  },
  dipGrid: {
    backgroundColor: Colors.glass,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dipSwitch: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.glassRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dipSwitchNum: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  dipEquals: {
    fontSize: 14,
    color: Colors.textMuted,
    marginHorizontal: 12,
  },
  dipValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    flex: 1,
  },
  dipResult: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: 'monospace',
    minWidth: 50,
    textAlign: 'right',
  },
  dipExamplesCard: {
    padding: 16,
    marginBottom: 12,
  },
  examplesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  examplesSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  exampleAddress: {
    width: 48,
    backgroundColor: Colors.glass,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 12,
  },
  exampleAddressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'monospace',
  },
  dipVisual: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
    marginRight: 12,
  },
  dipVisualBit: {
    width: 24,
    height: 32,
    borderRadius: 4,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dipVisualBitOn: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.borderActive,
  },
  dipVisualNum: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  dipVisualNumOn: {
    color: Colors.primary,
    fontWeight: '600',
  },
  exampleDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    minWidth: 80,
    textAlign: 'right',
  },
  calculatorCard: {
    padding: 16,
    marginBottom: 12,
  },
  calculatorTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  calculatorSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  calculatorInput: {
    marginBottom: 16,
  },
  calculatorLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  calculatorInputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  calculatorInputField: {
    flex: 1,
  },
  calcButton: {
    minWidth: 80,
  },
  calculatorResult: {
    backgroundColor: Colors.glass,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  calcResultLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  calcResultValue: {
    fontSize: 14,
    color: Colors.text,
  },
  calcResultHint: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  tipsCard: {
    padding: 16,
    marginBottom: 12,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 6,
  },
  tipsText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 22,
  },
});
