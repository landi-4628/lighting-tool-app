import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from '@/components/ui/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassButton } from '@/components/ui/glass-button';
import { Colors } from '@/constants/colors';

interface Fixture {
  id: string;
  name: string;
  channels: string;
}

export default function DmxScreen() {
  const router = useRouter();
  const [universe, setUniverse] = useState('1');
  const [fixtures, setFixtures] = useState<Fixture[]>([
    { id: '1', name: '灯具 1', channels: '16' },
  ]);

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
    setFixtures(fixtures.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  const calculateAddresses = () => {
    let currentAddress = 1;
    const results: { name: string; start: number; end: number }[] = [];

    fixtures.forEach((fixture) => {
      const channels = parseInt(fixture.channels) || 0;
      const start = currentAddress;
      const end = start + channels - 1;
      results.push({ name: fixture.name, start, end });
      currentAddress = end + 1;
    });

    return results;
  };

  const results = calculateAddresses();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <PageHeader title="DMX 地址码" subtitle="计算灯具链的起始地址与 DIP 拨码" />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Universe 设置</Text>
          <View style={styles.universeRow}>
            <Text style={styles.universeLabel}>Universe</Text>
            <View style={styles.universeSelector}>
              {[1, 2, 3, 4].map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.universeItem,
                    universe === u.toString() && styles.universeItemActive,
                  ]}
                  onPress={() => setUniverse(u.toString())}
                >
                  <Text
                    style={[
                      styles.universeText,
                      universe === u.toString() && styles.universeTextActive,
                    ]}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.fixturesCard}>
          <View style={styles.fixturesHeader}>
            <Text style={styles.sectionTitle}>灯具列表</Text>
            <GlassButton variant="secondary" size="small" onPress={addFixture}>
              + 添加
            </GlassButton>
          </View>

          {fixtures.map((fixture, index) => (
            <View key={fixture.id} style={styles.fixtureRow}>
              <View style={styles.fixtureIndex}>
                <Text style={styles.fixtureIndexText}>{index + 1}</Text>
              </View>
              <GlassInput
                placeholder="名称"
                value={fixture.name}
                onChangeText={(v) => updateFixture(fixture.id, 'name', v)}
                style={styles.fixtureName}
              />
              <View style={styles.channelsContainer}>
                <GlassInput
                  placeholder="通道"
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
              >
                <Ionicons name="close-circle" size={24} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </GlassCard>

        <GlassCard style={styles.resultsCard}>
          <Text style={styles.sectionTitle}>计算结果</Text>
          {results.map((result, index) => (
            <View key={index} style={styles.resultRow}>
              <Text style={styles.resultName}>{result.name}</Text>
              <View style={styles.resultAddress}>
                <Text style={styles.resultLabel}>地址</Text>
                <Text style={styles.resultValue}>
                  {result.start} - {result.end}
                </Text>
              </View>
            </View>
          ))}
        </GlassCard>

        <GlassCard style={styles.dipCard}>
          <View style={styles.dipHeader}>
            <Ionicons name="git-network-outline" size={20} color={Colors.warning} />
            <Text style={styles.dipTitle}>DIP 拨码对照表</Text>
          </View>
          <View style={styles.dipGrid}>
            {Array.from({ length: 9 }, (_, i) => (
              <View key={i} style={styles.dipItem}>
                <Text style={styles.dipNumber}>{i + 1}</Text>
                <Text style={styles.dipValue}>{Math.pow(2, i)}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.dipHint}>示例：地址 10 = DIP 2 + DIP 4</Text>
        </GlassCard>

        <GlassButton style={styles.exportButton}>
          导出地址表
        </GlassButton>
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
  },
  backButton: {
    padding: 8,
    marginRight: -4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
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
  universeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  universeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 16,
  },
  universeSelector: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: Colors.glass,
    borderRadius: 12,
    padding: 4,
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
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.3)',
  },
  universeText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  universeTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  fixturesCard: {
    padding: 16,
    marginBottom: 12,
  },
  fixturesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  fixtureName: {
    flex: 1,
  },
  channelsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelsInput: {
    width: 60,
    textAlign: 'center',
  },
  channelsLabel: {
    fontSize: 12,
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
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultName: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  resultAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  dipCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  dipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warning,
    marginLeft: 6,
  },
  dipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  dipItem: {
    width: 48,
    paddingVertical: 8,
    backgroundColor: Colors.glass,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dipNumber: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  dipValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'monospace',
  },
  dipHint: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  exportButton: {
    marginBottom: 24,
  },
});
