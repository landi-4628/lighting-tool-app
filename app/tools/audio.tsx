import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from '@/components/ui/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassTabGroup } from '@/components/ui/glass-tab-group';
import { GlassButton } from '@/components/ui/glass-button';
import { Colors } from '@/constants/colors';

export default function AudioScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { label: '格式转换', value: 'convert' },
    { label: '波形裁剪', value: 'crop' },
    { label: '节拍标记', value: 'mark' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <PageHeader title="音频工具" subtitle="格式转换 · 波形裁剪 · 节拍标记" />
      </View>

      <View style={styles.content}>
        <GlassTabGroup
          tabs={tabs}
          activeIndex={activeTab}
          onChange={setActiveTab}
          style={styles.tabGroup}
        />

        <ScrollView showsVerticalScrollIndicator={false}>
          {activeTab === 0 && (
            <View>
              <GlassCard style={styles.uploadCard}>
                <TouchableOpacity style={styles.uploadArea} activeOpacity={0.7}>
                  <Ionicons name="cloud-upload-outline" size={48} color={Colors.textMuted} />
                  <Text style={styles.uploadTitle}>点击上传音频文件</Text>
                  <Text style={styles.uploadSubtitle}>支持 MP3, WAV, FLAC, AAC, M4A 格式</Text>
                </TouchableOpacity>
              </GlassCard>

              <GlassCard style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
                  <Text style={styles.infoTitle}>格式转换</Text>
                </View>
                <Text style={styles.infoText}>
                  将音频文件转换为 16-bit WAV 格式，适合灯光控台使用的时间码参考。
                </Text>
              </GlassCard>
            </View>
          )}

          {activeTab === 1 && (
            <View>
              <GlassCard style={styles.waveformCard}>
                <View style={styles.waveformPlaceholder}>
                  <Ionicons name="musical-notes" size={64} color={Colors.textMuted} />
                  <Text style={styles.waveformText}>上传音频文件以查看波形</Text>
                </View>
                <View style={styles.waveformControls}>
                  <View style={styles.waveformSlider}>
                    <Text style={styles.sliderLabel}>起始点</Text>
                    <View style={styles.sliderTrack}>
                      <View style={styles.sliderThumb} />
                    </View>
                    <Text style={styles.sliderValue}>00:00</Text>
                  </View>
                  <View style={styles.waveformSlider}>
                    <Text style={styles.sliderLabel}>结束点</Text>
                    <View style={styles.sliderTrack}>
                      <View style={[styles.sliderThumb, { left: '80%' }]} />
                    </View>
                    <Text style={styles.sliderValue}>03:45</Text>
                  </View>
                </View>
              </GlassCard>

              <View style={styles.playbackControls}>
                <TouchableOpacity style={styles.playButton}>
                  <Ionicons name="play" size={32} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              <GlassButton style={styles.exportButton}>
                导出裁剪片段
              </GlassButton>
            </View>
          )}

          {activeTab === 2 && (
            <View>
              <GlassCard style={styles.marksCard}>
                <View style={styles.marksHeader}>
                  <Text style={styles.marksTitle}>节拍标记</Text>
                  <GlassButton variant="secondary" size="small">
                    清空
                  </GlassButton>
                </View>
                <View style={styles.marksList}>
                  <Text style={styles.marksEmpty}>暂无标记</Text>
                  <Text style={styles.marksHint}>播放音频时点击下方按钮记录时间戳</Text>
                </View>
              </GlassCard>

              <View style={styles.markControls}>
                <TouchableOpacity style={styles.markButton} activeOpacity={0.7}>
                  <Ionicons name="flag" size={24} color={Colors.primary} />
                  <Text style={styles.markButtonText}>打点</Text>
                </TouchableOpacity>
              </View>

              <GlassCard style={styles.formatCard}>
                <Text style={styles.formatTitle}>时间码格式</Text>
                <View style={styles.formatOptions}>
                  <TouchableOpacity style={[styles.formatOption, styles.formatOptionActive]}>
                    <Text style={[styles.formatText, styles.formatTextActive]}>SMPTE 30FPS</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.formatOption}>
                    <Text style={styles.formatText}>毫秒</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>

              <GlassButton style={styles.exportButton}>
                导出标记列表
              </GlassButton>
            </View>
          )}
        </ScrollView>
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
  },
  tabGroup: {
    marginVertical: 12,
  },
  uploadCard: {
    marginBottom: 12,
  },
  uploadArea: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  uploadSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
  },
  infoCard: {
    padding: 16,
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
  waveformCard: {
    padding: 16,
    marginBottom: 12,
  },
  waveformPlaceholder: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.glass,
    borderRadius: 12,
    marginBottom: 16,
  },
  waveformText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 12,
  },
  waveformControls: {
    gap: 16,
  },
  waveformSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    width: 48,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.glass,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sliderThumb: {
    position: 'absolute',
    top: -9,
    left: '20%',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  sliderValue: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: 'monospace',
    width: 48,
    textAlign: 'right',
  },
  playbackControls: {
    alignItems: 'center',
    marginBottom: 16,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.glassCard,
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  marksCard: {
    padding: 16,
    marginBottom: 12,
  },
  marksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  marksTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  marksList: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  marksEmpty: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  marksHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
  },
  markControls: {
    alignItems: 'center',
    marginBottom: 16,
  },
  markButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.3)',
    borderRadius: 14,
    gap: 8,
  },
  markButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  formatCard: {
    padding: 16,
    marginBottom: 16,
  },
  formatTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  formatOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  formatOption: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: Colors.glass,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formatOptionActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(125, 211, 252, 0.3)',
  },
  formatText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  formatTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  exportButton: {
    marginBottom: 24,
  },
});
