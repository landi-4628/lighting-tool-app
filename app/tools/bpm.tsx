import { useRouter } from 'expo-router';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from '@/components/ui/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassTabGroup } from '@/components/ui/glass-tab-group';
import { GlassButton } from '@/components/ui/glass-button';
import { Colors } from '@/constants/colors';

export default function BpmScreen() {
  const router = useRouter();

  const tabs = [
    { label: '手动打拍', value: 'tap' },
    { label: '音频分析', value: 'audio' },
    { label: '麦克风', value: 'mic' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <PageHeader title="BPM 检测" subtitle="跟随音乐节奏检测节拍速度" />
      </View>

      <View style={styles.content}>
        <GlassTabGroup
          tabs={tabs}
          activeIndex={0}
          onChange={(index) => console.log('Tab changed:', index)}
          style={styles.tabGroup}
        />

        <GlassCard style={styles.bpmDisplay}>
          <Text style={styles.bpmLabel}>当前 BPM</Text>
          <Text style={styles.bpmValue}>--</Text>
          <Text style={styles.bpmUnit}>拍/分钟</Text>
        </GlassCard>

        <View style={styles.tapArea}>
          <TouchableOpacity style={styles.tapButton} activeOpacity={0.7}>
            <View style={styles.tapButtonInner}>
              <Ionicons name="hand-left" size={48} color={Colors.primary} />
              <Text style={styles.tapText}>点击打拍</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statLabel}>打拍次数</Text>
            <Text style={styles.statValue}>0</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statLabel}>平均间隔</Text>
            <Text style={styles.statValue}>-- ms</Text>
          </GlassCard>
        </View>

        <View style={styles.actions}>
          <GlassButton variant="secondary" size="small" onPress={() => console.log('Reset')}>
            重置
          </GlassButton>
          <GlassButton size="small" onPress={() => console.log('Save')}>
            保存结果
          </GlassButton>
        </View>

        <GlassCard style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>使用说明</Text>
          <Text style={styles.tipsText}>
            跟随音乐节奏持续点击「点击打拍」按钮，至少点击 4 次后自动计算 BPM。
          </Text>
        </GlassCard>
      </View>
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
  tabGroup: {
    marginBottom: 20,
  },
  bpmDisplay: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 20,
  },
  bpmLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  bpmValue: {
    fontSize: 72,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: -2,
  },
  bpmUnit: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  tapArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  tapButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.glassCard,
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapButtonInner: {
    alignItems: 'center',
  },
  tapText: {
    fontSize: 14,
    color: Colors.primary,
    marginTop: 8,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  tipsCard: {
    padding: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
  },
});
