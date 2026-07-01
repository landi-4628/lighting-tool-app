import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { PageHeader } from '@/components/ui/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassTabGroup } from '@/components/ui/glass-tab-group';
import { Colors } from '@/constants/colors';
import { Paths, File as ExpoFile } from 'expo-file-system';

interface Channel {
  id: string;
  name: string;
  type: string;
  subType?: string;
}

interface Preset {
  name: string;
  icon: string;
  channels: Omit<Channel, 'id'>[];
}

const channelTypes = [
  { label: '亮度', value: 'intensity', icon: 'sunny' },
  { label: '颜色', value: 'color', icon: 'color-palette' },
  { label: '位置', value: 'position', icon: 'move' },
  { label: '光束', value: 'beam', icon: 'flash' },
  { label: '控制', value: 'control', icon: 'settings' },
];

const channelSubTypes: Record<string, { label: string; value: string }[]> = {
  intensity: [
    { label: 'Dimmer (调光)', value: 'Dimmer' },
    { label: 'Intensity (亮度)', value: 'Intensity' },
  ],
  color: [
    { label: 'Red (红)', value: 'Red' },
    { label: 'Green (绿)', value: 'Green' },
    { label: 'Blue (蓝)', value: 'Blue' },
    { label: 'White (白)', value: 'White' },
    { label: 'Amber (琥珀)', value: 'Amber' },
    { label: 'UV (紫外)', value: 'UV' },
    { label: 'Cyan (青)', value: 'Cyan' },
    { label: 'Yellow (黄)', value: 'Yellow' },
    { label: 'Color Wheel (色轮)', value: 'Color' },
  ],
  position: [
    { label: 'Pan (X轴)', value: 'Pan' },
    { label: 'Tilt (Y轴)', value: 'Tilt' },
    { label: 'Pan Fine', value: 'Pan Fine' },
    { label: 'Tilt Fine', value: 'Tilt Fine' },
  ],
  beam: [
    { label: 'Shutter (光闸)', value: 'Shutter' },
    { label: 'Strobe (频闪)', value: 'Strobe' },
    { label: 'Focus (聚焦)', value: 'Focus' },
    { label: 'Zoom (缩放)', value: 'Zoom' },
    { label: 'Frost (柔光)', value: 'Frost' },
    { label: 'Prism (棱镜)', value: 'Prism' },
    { label: 'Gobo Wheel (图案轮)', value: 'Gobo' },
    { label: 'Prism Rotation', value: 'Prism Rotation' },
  ],
  control: [
    { label: 'Macro (宏)', value: 'Macro' },
    { label: 'Speed (速度)', value: 'Speed' },
    { label: 'Control (控制)', value: 'Control' },
    { label: 'Auto (自动)', value: 'Auto' },
    { label: 'Sound (声控)', value: 'Sound' },
    { label: 'Reset (复位)', value: 'Reset' },
  ],
};

const presets: Preset[] = [
  {
    name: 'LED Par 灯',
    icon: 'disc',
    channels: [
      { name: 'Dimmer', type: 'intensity' },
      { name: 'Red', type: 'color' },
      { name: 'Green', type: 'color' },
      { name: 'Blue', type: 'color' },
      { name: 'White', type: 'color' },
    ],
  },
  {
    name: '染色灯',
    icon: 'color-palette',
    channels: [
      { name: 'Dimmer', type: 'intensity' },
      { name: 'Shutter', type: 'beam' },
      { name: 'Red', type: 'color' },
      { name: 'Green', type: 'color' },
      { name: 'Blue', type: 'color' },
      { name: 'Color', type: 'color' },
    ],
  },
  {
    name: '光束灯',
    icon: 'flash',
    channels: [
      { name: 'Dimmer', type: 'intensity' },
      { name: 'Shutter', type: 'beam' },
      { name: 'Strobe', type: 'beam' },
      { name: 'Pan', type: 'position' },
      { name: 'Tilt', type: 'position' },
      { name: 'Color', type: 'color' },
      { name: 'Gobo', type: 'beam' },
      { name: 'Prism', type: 'beam' },
      { name: 'Focus', type: 'beam' },
    ],
  },
  {
    name: '图案灯',
    icon: 'image',
    channels: [
      { name: 'Dimmer', type: 'intensity' },
      { name: 'Shutter', type: 'beam' },
      { name: 'Strobe', type: 'beam' },
      { name: 'Pan', type: 'position' },
      { name: 'Tilt', type: 'position' },
      { name: 'Pan Fine', type: 'position' },
      { name: 'Tilt Fine', type: 'position' },
      { name: 'Color', type: 'color' },
      { name: 'Gobo', type: 'beam' },
      { name: 'Gobo Rotation', type: 'beam' },
      { name: 'Focus', type: 'beam' },
      { name: 'Zoom', type: 'beam' },
      { name: 'Prism', type: 'beam' },
      { name: 'Prism Rotation', type: 'beam' },
    ],
  },
];

const formats = [
  { label: 'MA2', value: 'ma2' },
  { label: 'Avolites', value: 'avolites' },
  { label: '金刚 R20', value: 'jingang' },
];

function generateMA2XML(manufacturer: string, model: string, modeName: string, channels: Channel[]): string {
  const safeManufacturer = manufacturer || 'Generic';
  const safeModel = model || 'Fixture';
  const safeModeName = modeName || 'Mode 1';

  let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
  xml += `<Library>\n`;
  xml += `  <Manufacturer>${escapeXml(safeManufacturer)}</Manufacturer>\n`;
  xml += `  <FixtureDefinition>\n`;
  xml += `    <Name>${escapeXml(safeModel)}</Name>\n`;
  xml += `    <Mode>${escapeXml(safeModeName)}</Mode>\n`;
  xml += `    <Channels>\n`;
  channels.forEach((ch) => {
    const channelName = ch.name || `${ch.type} ${ch.id}`;
    xml += `      <Channel>${escapeXml(channelName)}</Channel>\n`;
  });
  xml += `    </Channels>\n`;
  xml += `  </FixtureDefinition>\n`;
  xml += `</Library>`;

  return xml;
}

function generateAvolitesXML(manufacturer: string, model: string, modeName: string, channels: Channel[]): string {
  const safeManufacturer = manufacturer || 'Generic';
  const safeModel = model || 'Fixture';
  const safeModeName = modeName || 'Mode 1';

  let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
  xml += `<TitanManual>\n`;
  xml += `  <Library>\n`;
  xml += `    <Manufacturer>${escapeXml(safeManufacturer)}</Manufacturer>\n`;
  xml += `    <Mode>${escapeXml(safeModeName)}</Mode>\n`;
  xml += `    <Channels>\n`;
  channels.forEach((ch, index) => {
    const channelName = ch.name || `${ch.type} ${index + 1}`;
    const dmx = index + 1;
    xml += `      <Channel Dmx="${dmx}">${escapeXml(channelName)}</Channel>\n`;
  });
  xml += `    </Channels>\n`;
  xml += `    <Types>\n`;
  xml += `      <Type>${escapeXml(safeModel)}</Type>\n`;
  xml += `    </Types>\n`;
  xml += `  </Library>\n`;
  xml += `</TitanManual>`;

  return xml;
}

function generateJingangXML(manufacturer: string, model: string, modeName: string, channels: Channel[]): string {
  const safeManufacturer = manufacturer || 'Generic';
  const safeModel = model || 'Fixture';
  const safeModeName = modeName || 'Mode 1';

  let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
  xml += `<Fixture>\n`;
  xml += `  <Header>\n`;
  xml += `    <Manufacturer>${escapeXml(safeManufacturer)}</Manufacturer>\n`;
  xml += `    <Model>${escapeXml(safeModel)}</Model>\n`;
  xml += `    <Mode>${escapeXml(safeModeName)}</Mode>\n`;
  xml += `  </Header>\n`;
  xml += `  <ChannelList>\n`;
  channels.forEach((ch, index) => {
    const channelName = ch.name || `${ch.type} ${index + 1}`;
    const dmx = index + 1;
    xml += `    <Channel Dmx="${dmx}" Name="${escapeXml(channelName)}" Type="${escapeXml(ch.type)}" />\n`;
  });
  xml += `  </ChannelList>\n`;
  xml += `</Fixture>`;

  return xml;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default function FixtureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeFormat, setActiveFormat] = useState(0);
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [modeName, setModeName] = useState('Mode 1');
  const [channels, setChannels] = useState<Channel[]>([
    { id: '1', name: 'Dimmer', type: 'intensity' },
    { id: '2', name: 'Shutter', type: 'beam' },
    { id: '3', name: 'Red', type: 'color' },
    { id: '4', name: 'Green', type: 'color' },
    { id: '5', name: 'Blue', type: 'color' },
    { id: '6', name: 'Pan', type: 'position' },
    { id: '7', name: 'Tilt', type: 'position' },
  ]);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showSubTypePicker, setShowSubTypePicker] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const addChannel = useCallback(() => {
    const newId = Date.now().toString();
    setChannels([...channels, { id: newId, name: '', type: 'intensity' }]);
  }, [channels]);

  const removeChannel = useCallback((id: string) => {
    setChannels(channels.filter((c) => c.id !== id));
  }, [channels]);

  const updateChannel = useCallback((id: string, field: 'name' | 'type', value: string) => {
    setChannels(channels.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }, [channels]);

  const applyPreset = useCallback((preset: Preset) => {
    const newChannels: Channel[] = preset.channels.map((ch, index) => ({
      ...ch,
      id: (Date.now() + index).toString(),
    }));
    setChannels(newChannels);
  }, []);

  const openTypePicker = useCallback((channelId: string) => {
    setSelectedChannelId(channelId);
    setShowTypePicker(true);
  }, []);

  const selectType = useCallback((type: string) => {
    if (selectedChannelId) {
      updateChannel(selectedChannelId, 'type', type);
    }
    setShowTypePicker(false);
  }, [selectedChannelId, updateChannel]);

  const openSubTypePicker = useCallback((channelId: string) => {
    setSelectedChannelId(channelId);
    setShowSubTypePicker(true);
  }, []);

  const selectSubType = useCallback((subType: string) => {
    if (selectedChannelId) {
      const channel = channels.find((c) => c.id === selectedChannelId);
      if (channel) {
        setChannels(channels.map((c) =>
          c.id === selectedChannelId ? { ...c, name: subType } : c
        ));
      }
    }
    setShowSubTypePicker(false);
  }, [selectedChannelId, channels]);

  const getCurrentChannel = useCallback(() => {
    return channels.find((c) => c.id === selectedChannelId);
  }, [channels, selectedChannelId]);

  const getChannelTypeLabel = (type: string) => {
    const found = channelTypes.find((t) => t.value === type);
    return found?.label || type;
  };

  const generateXML = useCallback(() => {
    const format = formats[activeFormat].value;
    switch (format) {
      case 'avolites':
        return generateAvolitesXML(manufacturer, model, modeName, channels);
      case 'jingang':
        return generateJingangXML(manufacturer, model, modeName, channels);
      default:
        return generateMA2XML(manufacturer, model, modeName, channels);
    }
  }, [activeFormat, manufacturer, model, modeName, channels]);

  const exportFixture = useCallback(async () => {
    if (!model.trim()) {
      Alert.alert('提示', '请输入灯具型号');
      return;
    }

    if (channels.length === 0) {
      Alert.alert('提示', '请至少添加一个通道');
      return;
    }

    setIsExporting(true);

    try {
      const xmlContent = generateXML();
      const fileName = `${model.replace(/\s+/g, '_')}_${formats[activeFormat].label}.xml`;
      const documentsDir = Paths.document;
      const file = documentsDir.createFile(fileName, 'application/xml');
      await file.write(xmlContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/xml',
          dialogTitle: '导出灯库文件',
        });
      } else {
        Alert.alert('成功', `文件已保存到: ${file.uri}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('错误', '导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  }, [generateXML, model, channels.length, activeFormat]);

  const currentChannel = getCurrentChannel();
  const subTypes = currentChannel ? channelSubTypes[currentChannel.type] || [] : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 16 }]}>
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
              value={modeName}
              onChangeText={setModeName}
            />
          </View>
        </GlassCard>

        <GlassCard style={styles.presetsCard}>
          <Text style={styles.sectionTitle}>快速预设</Text>
          <View style={styles.presetGrid}>
            {presets.map((preset, index) => (
              <TouchableOpacity
                key={index}
                style={styles.presetItem}
                onPress={() => applyPreset(preset)}
                activeOpacity={0.7}
              >
                <View style={styles.presetIconContainer}>
                  <Ionicons name={preset.icon as any} size={24} color={Colors.primary} />
                </View>
                <Text style={styles.presetItemText}>{preset.name}</Text>
                <Text style={styles.presetItemCount}>{preset.channels.length} 通道</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        <GlassCard style={styles.channelsCard}>
          <View style={styles.channelsHeader}>
            <View>
              <Text style={styles.sectionTitle}>通道列表</Text>
              <Text style={styles.channelCountText}>共 {channels.length} 个通道</Text>
            </View>
            <GlassButton variant="secondary" size="small" onPress={addChannel}>
              <View style={styles.addButtonContent}>
                <Ionicons name="add" size={16} color={Colors.textSecondary} />
                <Text style={styles.addButtonText}>添加通道</Text>
              </View>
            </GlassButton>
          </View>

          <View style={styles.channelHeader}>
            <Text style={[styles.channelHeaderText, { width: 32 }]}>序号</Text>
            <Text style={[styles.channelHeaderText, { flex: 1 }]}>名称</Text>
            <Text style={[styles.channelHeaderText, { flex: 1 }]}>类型</Text>
            <View style={{ width: 40 }} />
          </View>

          {channels.map((channel, index) => (
            <View key={channel.id} style={styles.channelRow}>
              <View style={styles.channelIndex}>
                <Text style={styles.channelIndexText}>{index + 1}</Text>
              </View>
              <TouchableOpacity
                style={styles.channelNameInput}
                onPress={() => openSubTypePicker(channel.id)}
              >
                <Text
                  style={[
                    styles.channelNameText,
                    !channel.name && styles.channelNamePlaceholder,
                  ]}
                >
                  {channel.name || '点击选择'}
                </Text>
                <Ionicons name="chevron-down" size={14} color={Colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.channelTypeSelector}
                onPress={() => openTypePicker(channel.id)}
              >
                <View style={[styles.typeIndicator, { backgroundColor: getTypeColor(channel.type) }]} />
                <Text style={styles.channelTypeText}>
                  {getChannelTypeLabel(channel.type)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeChannel(channel.id)}
              >
                <Ionicons name="close-circle" size={22} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))}

          {channels.length === 0 && (
            <View style={styles.emptyChannels}>
              <Ionicons name="list-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>暂无通道</Text>
              <Text style={styles.emptySubText}>点击上方按钮添加通道或使用预设</Text>
            </View>
          )}
        </GlassCard>

        <GlassButton
          style={styles.exportButton}
          onPress={exportFixture}
          loading={isExporting}
          size="large"
        >
          <View style={styles.exportButtonContent}>
            <Ionicons name="download-outline" size={20} color="#e0f2fe" />
            <Text style={styles.exportButtonText}>导出灯库文件</Text>
          </View>
        </GlassButton>

        <GlassCard style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="information-circle" size={18} color={Colors.primary} />
            <Text style={styles.tipsTitle}>使用说明</Text>
          </View>
          <Text style={styles.tipsText}>
            {'\u2022'} 填写通道属性（Dimmer/Color/Position/Beam/Control）{'\n'}
            {'\u2022'} 选择输出格式并导出 XML 文件{'\n'}
            {'\u2022'} 将文件导入控台即可使用
          </Text>
        </GlassCard>
      </ScrollView>

      {/* Channel Type Picker Modal */}
      <Modal
        visible={showTypePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTypePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTypePicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择通道类型</Text>
              <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {channelTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeOption,
                    currentChannel?.type === type.value && styles.typeOptionActive,
                  ]}
                  onPress={() => selectType(type.value)}
                >
                  <View style={[styles.typeIndicator, { backgroundColor: getTypeColor(type.value) }]} />
                  <Ionicons name={type.icon as any} size={20} color={Colors.textSecondary} />
                  <Text style={styles.typeOptionText}>{type.label}</Text>
                  {currentChannel?.type === type.value && (
                    <Ionicons name="checkmark" size={20} color={Colors.success} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Channel Sub-Type Picker Modal */}
      <Modal
        visible={showSubTypePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubTypePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSubTypePicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                选择通道名称 ({currentChannel ? getChannelTypeLabel(currentChannel.type) : ''})
              </Text>
              <TouchableOpacity onPress={() => setShowSubTypePicker(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {subTypes.map((subType) => (
                <TouchableOpacity
                  key={subType.value}
                  style={[
                    styles.typeOption,
                    currentChannel?.name === subType.value && styles.typeOptionActive,
                  ]}
                  onPress={() => selectSubType(subType.value)}
                >
                  <Text style={styles.typeOptionText}>{subType.label}</Text>
                  {currentChannel?.name === subType.value && (
                    <Ionicons name="checkmark" size={20} color={Colors.success} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'intensity':
      return '#fbbf24';
    case 'color':
      return '#f472b6';
    case 'position':
      return '#38bdf8';
    case 'beam':
      return '#a78bfa';
    case 'control':
      return '#4ade80';
    default:
      return Colors.textMuted;
  }
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
  presetsCard: {
    padding: 16,
    marginBottom: 12,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 10,
  },
  presetItem: {
    width: '47%',
    backgroundColor: Colors.glass,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  presetIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  presetItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  presetItemCount: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  channelsCard: {
    padding: 16,
    marginBottom: 12,
  },
  channelsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  channelCountText: {
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
    marginBottom: 10,
  },
  channelIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 8,
  },
  channelNameText: {
    fontSize: 14,
    color: Colors.text,
  },
  channelNamePlaceholder: {
    color: Colors.textMuted,
  },
  channelTypeSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  emptyChannels: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  exportButton: {
    marginBottom: 12,
  },
  exportButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e0f2fe',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.glassCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderIce,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  modalScroll: {
    maxHeight: 400,
    padding: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 4,
    gap: 12,
  },
  typeOptionActive: {
    backgroundColor: Colors.glassHover,
  },
  typeOptionText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
});
