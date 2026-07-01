import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from '@/components/ui/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassTabGroup } from '@/components/ui/glass-tab-group';
import { Colors } from '@/constants/colors';

const frameRates = [
  { label: '24 fps', value: 24 },
  { label: '25 fps', value: 25 },
  { label: '30 fps', value: 30 },
  { label: '29.97 DF', value: 29.97 },
  { label: '30 DF', value: 30 },
];

export default function LtcScreen() {
  const router = useRouter();
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const [seconds, setSeconds] = useState('00');
  const [frames, setFrames] = useState('00');
  const [frameRateIndex, setFrameRateIndex] = useState(1);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <PageHeader title="LTC 时码" subtitle="生成立体声 LTC 音频文件" />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.timecodeCard}>
          <Text style={styles.sectionTitle}>时间码设置</Text>

          <View style={styles.timecodeRow}>
            <View style={styles.timecodeUnit}>
              <GlassInput
                value={hours}
                onChangeText={setHours}
                keyboardType="number-pad"
                maxLength={2}
                style={styles.timecodeInput}
                containerStyle={styles.timecodeInputContainer}
              />
              <Text style={styles.timecodeLabel}>时</Text>
            </View>
            <Text style={styles.timecodeSeparator}>:</Text>
            <View style={styles.timecodeUnit}>
              <GlassInput
                value={minutes}
                onChangeText={setMinutes}
                keyboardType="number-pad"
                maxLength={2}
                style={styles.timecodeInput}
                containerStyle={styles.timecodeInputContainer}
              />
              <Text style={styles.timecodeLabel}>分</Text>
            </View>
            <Text style={styles.timecodeSeparator}>:</Text>
            <View style={styles.timecodeUnit}>
              <GlassInput
                value={seconds}
                onChangeText={setSeconds}
                keyboardType="number-pad"
                maxLength={2}
                style={styles.timecodeInput}
                containerStyle={styles.timecodeInputContainer}
              />
              <Text style={styles.timecodeLabel}>秒</Text>
            </View>
            <Text style={styles.timecodeSeparator}>:</Text>
            <View style={styles.timecodeUnit}>
              <GlassInput
                value={frames}
                onChangeText={setFrames}
                keyboardType="number-pad"
                maxLength={2}
                style={styles.timecodeInput}
                containerStyle={styles.timecodeInputContainer}
              />
              <Text style={styles.timecodeLabel}>帧</Text>
            </View>
          </View>

          <View style={styles.presetRow}>
            <TouchableOpacity style={styles.presetButton}>
              <Text style={styles.presetText}>00:00:00:00</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetButton}>
              <Text style={styles.presetText}>01:00:00:00</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetButton}>
              <Text style={styles.presetText}>05:00:00:00</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <GlassCard style={styles.frameRateCard}>
          <Text style={styles.sectionTitle}>帧率</Text>
          <View style={styles.frameRateGrid}>
            {frameRates.map((rate, index) => (
              <TouchableOpacity
                key={rate.value}
                style={[
                  styles.frameRateItem,
                  frameRateIndex === index && styles.frameRateItemActive,
                ]}
                onPress={() => setFrameRateIndex(index)}
              >
                <Text
                  style={[
                    styles.frameRateText,
                    frameRateIndex === index && styles.frameRateTextActive,
                  ]}
                >
                  {rate.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        <GlassCard style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color={Colors.primary} />
            <Text style={styles.infoTitle}>输出说明</Text>
          </View>
          <Text style={styles.infoText}>
            将生成标准 WAV 立体声文件，左声道为 LTC 时间码信号，右声道为静音。
            可直接通过音频接口输出至 MA2/MA3 控台实现音视频与灯光的帧同步触发。
          </Text>
        </GlassCard>

        <View style={styles.actions}>
          <GlassButton variant="secondary" style={styles.actionButton}>
            试听
          </GlassButton>
          <GlassButton style={styles.actionButton}>
            导出 WAV
          </GlassButton>
        </View>

        <GlassCard style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>使用提示</Text>
          <Text style={styles.tipsText}>
            • 支持 SMPTE 标准时间码格式{'\n'}
            • 可选择不同帧率 (24/25/30/29.97 DF/30 DF){'\n'}
            • 导出标准 WAV 立体声文件，左声道为 LTC 信号
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
    marginBottom: 16,
  },
  timecodeCard: {
    padding: 20,
    marginBottom: 12,
  },
  timecodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  timecodeUnit: {
    alignItems: 'center',
  },
  timecodeInputContainer: {
    width: 64,
  },
  timecodeInput: {
    textAlign: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    paddingVertical: 16,
  },
  timecodeLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  timecodeSeparator: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.textMuted,
    marginHorizontal: 8,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: Colors.glass,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetText: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: Colors.textSecondary,
  },
  frameRateCard: {
    padding: 20,
    marginBottom: 12,
  },
  frameRateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frameRateItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.glass,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  frameRateItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(125, 211, 252, 0.3)',
  },
  frameRateText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  frameRateTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  infoCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 6,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
  tipsCard: {
    padding: 16,
    marginBottom: 24,
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
    lineHeight: 22,
  },
});
