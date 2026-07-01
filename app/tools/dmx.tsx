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
    { id: '3', name: '帕灯 1', channels: '4' },
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
    setFixtures(fixtures.filter(f => f.id !== id));
  };

  const updateFixture = (id: string, field: 'name' | 'channels', value: string) => {
    setFixtures(fixtures.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const calculations: CalculationResult[] = useMemo(() => {
    let currentAddress = 1;
    let currentUniverse = 1;

    return fixtures.map(fixture => {
      const channels = parseInt(fixture.channels) || 0;
      const start = currentAddress;
      const end = start + channels - 1;

      const result: CalculationResult = {
        name: fixture.name || `灯具 ${fixtures.indexOf(fixture) + 1}`,
        channels,
        start,
        end,
        universe: currentUniverse,
        overflow: end > DMX_ADDRESSES_PER_UNIVERSE,
      };

      currentAddress = end + 1;
      if (currentAddress > DMX_ADDRESSES_PER_UNIVERSE) {
        currentAddress = 1;
        currentUniverse++;
      }

      return result;
    });
  }, [fixtures]);

  const totalChannels = useMemo(() => {
    return fixtures.reduce((sum, f) => sum + (parseInt(f.channels) || 0), 0);
  }, [fixtures]);

  const hasOverflow = calculations.some(c => c.overflow);

  const handleUniverseChange = (newUniverse: number) => {
    if (newUniverse >= 1 && newUniverse <= MAX_UNIVERSES) {
      setUniverse(newUniverse);
    }
  };

  const exportToText = async () => {
    let content = `DMX 地址表\n`;
    content += `Universe: ${universe}\n`;
    content += `灯具总数: ${fixtures.length}\n`;
    content += `总通道数: ${totalChannels}\n\n`;
    content += `序号\t名称\t通道数\t起始地址\t结束地址\tUniverse\n`;

    calculations.forEach((calc, index) => {
      content += `${index + 1}\t${calc.name}\t${calc.channels}\t${calc.start}\t${calc.end}\t${calc.universe}\n`;
    });

    try {
      await Share.share({
        message: content,
        title: 'DMX 地址表',
      });
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const exportToCSV = async () => {
    let content = `序号,名称,通道数,起始地址,结束地址,Universe\n`;

    calculations.forEach((calc, index) => {
      content += `${index + 1},"${calc.name}",${calc.channels},${calc.start},${calc.end},${calc.universe}\n`;
    });

    try {
      await Share.share({
        message: content,
        title: 'DMX 地址表 CSV',
      });
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const getDIPValue = (bit: number): number => {
    return Math.pow(2, bit - 1);
  };

  const getAddressFromDIP = (dipSwitches: boolean[]): number => {
    return dipSwitches.reduce((sum, on, index) => sum + (on ? getDIPValue(index + 1) : 0), 0);
  };

  const getDIPForAddress = (address: number): boolean[] => {
    const switches = [];
    for (let i = 0; i < 9; i++) {
      switches.push((address & getDIPValue(i + 1)) !== 0);
    }
    return switches;
  };

  const renderDIPSwitch = (switches: boolean[], address: number) => {
    return (
      <View style={styles.dipSwitchContainer}>
        <View style={styles.dipSwitchRow}>
          {switches.map((on, index) => (
            <View
              key={index}
              style={[
                styles.dipSwitch,
                on ? styles.dipSwitchOn : styles.dipSwitchOff,
              ]}
            >
              <Text style={[styles.dipSwitchNumber, on && styles.dipSwitchTextOn]}>
                {index + 1}
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.dipAddress}>地址: {address}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>DMX 地址码</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <GlassTabGroup
          tabs={tabs.map(t => t.label)}
          activeIndex={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 0 && (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>Universe 设置</Text>
              <View style={styles.universeSelector}>
                <TouchableOpacity
                  style={styles.universeButton}
                  onPress={() => handleUniverseChange(universe - 1)}
                >
                  <Ionicons name="remove" size={20} color={Colors.text} />
                </TouchableOpacity>
                <View style={styles.universeDisplay}>
                  <Text style={styles.universeLabel}>Universe</Text>
                  <Text style={styles.universeValue}>{universe}</Text>
                </View>
                <TouchableOpacity
                  style={styles.universeButton}
                  onPress={() => handleUniverseChange(universe + 1)}
                >
                  <Ionicons name="add" size={20} color={Colors.text} />
                </TouchableOpacity>
              </View>
            </GlassCard>

            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.sectionTitle}>灯具列表</Text>
                <TouchableOpacity style={styles.addButton} onPress={addFixture}>
                  <Ionicons name="add" size={20} color={Colors.primary} />
                  <Text style={styles.addButtonText}>添加</Text>
                </TouchableOpacity>
              </View>

              {fixtures.map((fixture, index) => (
                <View key={fixture.id} style={styles.fixtureRow}>
                  <Text style={styles.fixtureIndex}>{index + 1}</Text>
                  <GlassInput
                    placeholder="名称"
                    value={fixture.name}
                    onChangeText={(v) => updateFixture(fixture.id, 'name', v)}
                    style={styles.nameInput}
                  />
                  <View style={styles.channelsInputWrapper}>
                    <GlassInput
                      placeholder="通道"
                      value={fixture.channels}
                      onChangeText={(v) => updateFixture(fixture.id, 'channels', v)}
                      keyboardType="numeric"
                      style={styles.channelsInput}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => removeFixture(fixture.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>计算结果</Text>

              {hasOverflow && (
                <View style={styles.warningContainer}>
                  <Ionicons name="warning" size={18} color={Colors.warning} />
                  <Text style={styles.warningText}>通道数超出 512 范围，请调整或分 Universe</Text>
                </View>
              )}

              <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>灯具数量</Text>
                  <Text style={styles.summaryValue}>{fixtures.length}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>总通道数</Text>
                  <Text style={styles.summaryValue}>{totalChannels}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>占用 Universe</Text>
                  <Text style={styles.summaryValue}>
                    {Math.ceil((calculations[calculations.length - 1]?.end || 0) / DMX_ADDRESSES_PER_UNIVERSE) || 1}
                  </Text>
                </View>
              </View>

              <View style={styles.resultTable}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, styles.colIndex]}>序号</Text>
                  <Text style={[styles.tableHeaderCell, styles.colName]}>名称</Text>
                  <Text style={[styles.tableHeaderCell, styles.colChannels]}>通道</Text>
                  <Text style={[styles.tableHeaderCell, styles.colAddress]}>地址</Text>
                  <Text style={[styles.tableHeaderCell, styles.colUniverse]}>Uni</Text>
                </View>

                {calculations.map((calc, index) => (
                  <View
                    key={index}
                    style={[styles.tableRow, calc.overflow && styles.tableRowOverflow]}
                  >
                    <Text style={[styles.tableCell, styles.colIndex]}>{index + 1}</Text>
                    <Text style={[styles.tableCell, styles.colName]} numberOfLines={1}>
                      {calc.name}
                    </Text>
                    <Text style={[styles.tableCell, styles.colChannels]}>
                      {calc.channels}
                    </Text>
                    <Text style={[styles.tableCell, styles.colAddress]}>
                      {calc.start}-{calc.end}
                    </Text>
                    <Text style={[styles.tableCell, styles.colUniverse]}>
                      {calc.universe}
                    </Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            <View style={styles.exportButtons}>
              <GlassButton
                title="导出 TXT"
                onPress={exportToText}
                icon="document-text-outline"
                style={styles.exportButton}
              />
              <GlassButton
                title="导出 CSV"
                onPress={exportToCSV}
                icon="grid-outline"
                style={styles.exportButton}
              />
            </View>
          </ScrollView>
        )}

        {activeTab === 1 && (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>DIP 拨码对照表</Text>
              <Text style={styles.dipDescription}>
                每个 DIP 开关代表 2 的 n-1 次方（n 为开关编号）
              </Text>

              <View style={styles.dipTable}>
                <View style={styles.dipTableHeader}>
                  <Text style={styles.dipTableHeaderCell}>开关位</Text>
                  <Text style={styles.dipTableHeaderCell}>数值</Text>
                </View>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((bit) => (
                  <View key={bit} style={styles.dipTableRow}>
                    <Text style={styles.dipTableCell}>DIP {bit}</Text>
                    <Text style={styles.dipTableCell}>{getDIPValue(bit)}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>常见地址拨码示例</Text>

              {[1, 10, 15, 100, 256, 512].map((address) => (
                <View key={address} style={styles.dipExample}>
                  {renderDIPSwitch(getDIPForAddress(address), address)}
                </View>
              ))}
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>DIP 计算器</Text>
              <Text style={styles.dipDescription}>
                选择要开启的开关，计算总地址
              </Text>

              <View style={styles.calculator}>
                <View style={styles.calculatorSwitches}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((bit) => {
                    const [enabled, setEnabled] = useState(false);
                    return (
                      <TouchableOpacity
                        key={bit}
                        style={[
                          styles.calculatorSwitch,
                          enabled ? styles.calculatorSwitchOn : styles.calculatorSwitchOff,
                        ]}
                        onPress={() => setEnabled(!enabled)}
                      >
                        <Text
                          style={[
                            styles.calculatorSwitchNumber,
                            enabled && styles.calculatorSwitchTextOn,
                          ]}
                        >
                          {bit}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <DIPCalculator />
            </GlassCard>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

function DIPCalculator() {
  const [switches, setSwitches] = useState<boolean[]>(Array(9).fill(false));

  const toggleSwitch = (index: number) => {
    const newSwitches = [...switches];
    newSwitches[index] = !newSwitches[index];
    setSwitches(newSwitches);
  };

  const calculateAddress = (): number => {
    return switches.reduce((sum, on, index) => {
      return sum + (on ? Math.pow(2, index) : 0);
    }, 0);
  };

  const reset = () => {
    setSwitches(Array(9).fill(false));
  };

  return (
    <View style={styles.calculatorContainer}>
      <View style={styles.calculatorSwitchRow}>
        {switches.map((on, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.calculatorSwitch,
              on ? styles.calculatorSwitchOn : styles.calculatorSwitchOff,
            ]}
            onPress={() => toggleSwitch(index)}
          >
            <Text
              style={[
                styles.calculatorSwitchNumber,
                on && styles.calculatorSwitchTextOn,
              ]}
            >
              {index + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.calculatorResult}>
        <Text style={styles.calculatorResultLabel}>计算结果:</Text>
        <Text style={styles.calculatorResultValue}>{calculateAddress()}</Text>
      </View>

      <GlassButton title="重置" onPress={reset} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
    marginTop: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: Colors.primary,
    fontSize: 14,
  },
  universeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  universeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  universeDisplay: {
    alignItems: 'center',
  },
  universeLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  universeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  fixtureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  fixtureIndex: {
    width: 24,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  nameInput: {
    flex: 1,
  },
  channelsInputWrapper: {
    width: 60,
  },
  channelsInput: {
    textAlign: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 183, 77, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  warningText: {
    flex: 1,
    color: Colors.warning,
    fontSize: 13,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.glassBorder,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  resultTable: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.glassBg,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  tableRowOverflow: {
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
  },
  tableCell: {
    fontSize: 13,
    color: Colors.text,
    textAlign: 'center',
  },
  colIndex: {
    width: 32,
  },
  colName: {
    flex: 1,
  },
  colChannels: {
    width: 40,
  },
  colAddress: {
    width: 70,
  },
  colUniverse: {
    width: 32,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  exportButton: {
    flex: 1,
  },
  dipDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  dipTable: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  dipTableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.glassBg,
    paddingVertical: 8,
  },
  dipTableHeaderCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  dipTableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  dipTableCell: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
  },
  dipExample: {
    marginBottom: 16,
  },
  dipSwitchContainer: {
    alignItems: 'center',
  },
  dipSwitchRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  dipSwitch: {
    width: 32,
    height: 48,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  dipSwitchOn: {
    backgroundColor: Colors.primary,
  },
  dipSwitchOff: {
    backgroundColor: Colors.glassBg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  dipSwitchNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dipSwitchTextOn: {
    color: Colors.background,
  },
  dipAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  calculatorContainer: {
    marginTop: 16,
  },
  calculator: {
    marginVertical: 16,
  },
  calculatorSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  calculatorSwitch: {
    width: 36,
    height: 56,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  calculatorSwitchOn: {
    backgroundColor: Colors.primary,
  },
  calculatorSwitchOff: {
    backgroundColor: Colors.glassBg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  calculatorSwitchNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  calculatorSwitchTextOn: {
    color: Colors.background,
  },
  calculatorResult: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors.glassBg,
    borderRadius: 8,
  },
  calculatorResultLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  calculatorResultValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
  },
});
