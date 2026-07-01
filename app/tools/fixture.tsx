import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from '@/components/ui/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassTabGroup } from '@/components/ui/glass-tab-group';
import { Colors } from '@/constants/colors';

interface Channel {
  id: string;
  name: string;
  type: string;
}

const channelTypes = [
  { label: '亮度 (Intensity)', value: 'intensity' },
  { label: '颜色 (Color)', value: 'color' },
  { label: '位置 (Position)', value: 'position' },
  { label: '光束 (Beam)', value: 'beam' },
  { label: '控制 (Control)', value: 'control' },
];

export default function FixtureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeFormat, setActiveFormat] = useState(0);
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [channels, setChannels] = useState<Channel[]>([
    { id: '1', name: 'Dimmer', type: 'intensity' },
    { id: '2', name: 'Shutter', type: 'beam' },
    { id: '3', name: 'Red', type: 'color' },
    { id: '4', name: 'Green', type: 'color' },
    { id: '5', name: 'Blue', type: 'color' },
    { id: '6', name: 'Pan', type: 'position' },
    { id: '7', name: 'Tilt', type: 'position' },
  ]);

  const formats = [
    { label: 'MA2', value: 'ma2' },
    { label: 'Avolites', value: 'avolites' },
    { label: '金刚 R20', value: 'jingang' },
  ];

  const addChannel = () => {
    const newId = Date.now().toString();
    setChannels([...channels, { id: newId, name: '', type: 'intensity' }]);
  };

  const removeChannel = (id: string) => {
    setChannels(channels.filter((c) => c.id !== id));
  };

  const updateChannel = (id: string, field: 'name' | 'type', value: string) => {
    setChannels(channels.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 16}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <PageHeader title="灯库制作" subtitle="生成 MA2 / Avolites / 金刚灯库" showTopSafeArea={false} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="bulb-outline" size={20} color={Colors.success} />
            <Text style={styles.infoTitle}>灯库格式</Text>
          </View>
          <Text style={styles.infoText}>
            生成 Avolites Tiger Touch D4、金刚 R20 及 MA2 控台 XML 格式的灯具库文件，快速创建自定义灯库。
          </Text>
        </GlassCard>

        <GlassCard style={styles.formatCard}>
          <Text style={styles.sectionTitle}>输出格式</Text>
          <GlassTabGroup
            tabs={formats}
            activeIndex={activeFormat}
            onChange={setActiveFormat}
            style={styles.formatTabs}
          />
        </GlassCard>

        <GlassCard style={styles.fixturesCard}>
          <Text style={styles.sectionTitle}>灯具信息</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>制造商</Text>
            <GlassInput
              placeholder="如：Ayrton"
              value={manufacturer}
              onChangeText={setManufacturer}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>型号</Text>
            <GlassInput
              placeholder="如：Ghibli"
              value={model}
              onChangeText={setModel}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>模式名称</Text>
            <GlassInput
              placeholder="如：Mode 1"
              defaultValue="Mode 1"
            />
          </View>
        </GlassCard>

        <GlassCard style={styles.channelsCard}>
          <View style={styles.channelsHeader}>
            <Text style={styles.sectionTitle}>通道列表</Text>
            <GlassButton variant="secondary" size="small" onPress={addChannel}>
              + 添加通道
            </GlassButton>
          </View>

          <View style={styles.channelHeader}>
            <Text style={[styles.channelHeaderText, { flex: 1 }]}>序号</Text>
            <Text style={[styles.channelHeaderText, { flex: 2 }]}>名称</Text>
            <Text style={[styles.channelHeaderText, { flex: 2 }]}>类型</Text>
            <View style={{ width: 40 }} />
          </View>

          {channels.map((channel, index) => (
            <View key={channel.id} style={styles.channelRow}>
              <View style={styles.channelIndex}>
                <Text style={styles.channelIndexText}>{index + 1}</Text>
              </View>
              <GlassInput
                placeholder="通道名"
                value={channel.name}
                onChangeText={(v) => updateChannel(channel.id, 'name', v)}
                style={styles.channelNameInput}
              />
              <TouchableOpacity style={styles.channelTypeSelector}>
                <Text style={styles.channelTypeText}>
                  {channelTypes.find((t) => t.value === channel.type)?.label.split(' ')[0] || '选择'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeChannel(channel.id)}
              >
                <Ionicons name="close-circle" size={20} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.channelSummary}>
            <Text style={styles.channelSummaryText}>
              共 {channels.length} 个通道
            </Text>
          </View>
        </GlassCard>

        <View style={styles.presetButtons}>
          <TouchableOpacity style={styles.presetChip}>
            <Text style={styles.presetChipText}>LED Par 灯</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.presetChip}>
            <Text style={styles.presetChipText}>染色灯</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.presetChip}>
            <Text style={styles.presetChipText}>光束灯</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.presetChip}>
            <Text style={styles.presetChipText}>图案灯</Text>
          </TouchableOpacity>
        </View>

        <GlassButton style={styles.exportButton}>
          导出灯库文件
        </GlassButton>

        <GlassCard style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="information-circle" size={18} color={Colors.primary} />
            <Text style={styles.tipsTitle}>使用说明</Text>
          </View>
          <Text style={styles.tipsText}>
            • 填写通道属性（Dimmer/Color/Position/Beam/Control）{'\n'}
            • 选择输出格式并导出 XML 文件{'\n'}
            • 将文件导入控台即可使用
          </Text>
        </GlassCard>
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
    paddingTop: 8,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  infoCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(74, 222, 128, 0.05)',
    borderColor: 'rgba(74, 222, 128, 0.2)',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
    marginLeft: 6,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  formatCard: {
    padding: 16,
    marginBottom: 12,
  },
  formatTabs: {
    marginTop: 12,
  },
  fixturesCard: {
    padding: 16,
    marginBottom: 12,
  },
  inputGroup: {
    marginTop: 12,
  },
  inputLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  channelsCard: {
    padding: 16,
    marginBottom: 12,
  },
  channelsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 8,
  },
  channelHeaderText: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  channelIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  channelIndexText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  channelNameInput: {
    flex: 2,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  channelTypeSelector: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  channelTypeText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  removeButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelSummary: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 4,
  },
  channelSummaryText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  presetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  exportButton: {
    marginBottom: 12,
  },
  tipsCard: {
    padding: 16,
    marginBottom: 24,
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
