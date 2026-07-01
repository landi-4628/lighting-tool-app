import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Audio from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { PageHeader } from '@/components/ui/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassTabGroup } from '@/components/ui/glass-tab-group';
import { GlassButton } from '@/components/ui/glass-button';
import { Colors } from '@/constants/colors';

type TabValue = 'tap' | 'audio' | 'mic';

interface TapData {
  timestamps: number[];
  bpm: number | null;
  avgInterval: number | null;
}

interface AudioData {
  uri: string | null;
  filename: string;
  duration: number;
  bpmInput: string;
  calculatedBpm: number | null;
  isPlaying: boolean;
  position: number;
}

interface MicData {
  isListening: boolean;
  timestamps: number[];
  currentBpm: number | null;
  energy: number;
  permissionGranted: boolean;
}

export default function BpmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Manual tap state
  const [tapData, setTapData] = useState<TapData>({
    timestamps: [],
    bpm: null,
    avgInterval: null,
  });

  // Audio analysis state
  const [audioData, setAudioData] = useState<AudioData>({
    uri: null,
    filename: '',
    duration: 0,
    bpmInput: '',
    calculatedBpm: null,
    isPlaying: false,
    position: 0,
  });
  const soundRef = useRef<Audio.Sound | null>(null);

  // Microphone state
  const [micData, setMicData] = useState<MicData>({
    isListening: false,
    timestamps: [],
    currentBpm: null,
    energy: 0,
    permissionGranted: false,
  });
  const micStreamRef = useRef<Audio.AudioStreamer | null>(null);
  const micIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tabs = [
    { label: '手动打拍', value: 'tap' },
    { label: '音频分析', value: 'audio' },
    { label: '麦克风', value: 'mic' },
  ];

  // Calculate BPM from tap timestamps
  const calculateBpm = useCallback((timestamps: number[]) => {
    if (timestamps.length < 4) return null;

    const intervals: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = Math.round(60000 / avgInterval);

    return { bpm, avgInterval: Math.round(avgInterval) };
  }, []);

  // Manual tap handler
  const handleTap = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics may not be available
    }

    const now = Date.now();
    setTapData((prev) => {
      const newTimestamps = [...prev.timestamps, now];
      const result = calculateBpm(newTimestamps);

      return {
        timestamps: newTimestamps,
        bpm: result?.bpm ?? null,
        avgInterval: result?.avgInterval ?? null,
      };
    });
  }, [calculateBpm]);

  // Reset tap data
  const handleResetTap = useCallback(() => {
    setTapData({
      timestamps: [],
      bpm: null,
      avgInterval: null,
    });
  }, []);

  // Save tap result
  const handleSaveTap = useCallback(() => {
    if (tapData.bpm === null) return;
    Alert.alert(
      '保存成功',
      `BPM: ${tapData.bpm}\n打拍次数: ${tapData.timestamps.length}\n平均间隔: ${tapData.avgInterval}ms`,
      [{ text: '确定' }]
    );
  }, [tapData]);

  // Pick audio file
  const handlePickAudio = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setAudioData((prev) => ({
          ...prev,
          uri: asset.uri,
          filename: asset.name,
          duration: 0,
          calculatedBpm: null,
          position: 0,
        }));

        // Unload previous sound
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
      }
    } catch (error) {
      Alert.alert('错误', '无法选择音频文件');
    }
  }, []);

  // Load and play audio
  const handlePlayAudio = useCallback(async () => {
    if (!audioData.uri) return;

    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await soundRef.current.pauseAsync();
            setAudioData((prev) => ({ ...prev, isPlaying: false }));
          } else {
            await soundRef.current.playAsync();
            setAudioData((prev) => ({ ...prev, isPlaying: true }));
          }
          return;
        }
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioData.uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setAudioData((prev) => ({
              ...prev,
              duration: status.durationMillis ?? 0,
              position: status.positionMillis ?? 0,
              isPlaying: status.isPlaying,
            }));

            if (status.didJustFinish) {
              setAudioData((prev) => ({
                ...prev,
                isPlaying: false,
                position: 0,
              }));
            }
          }
        }
      );

      soundRef.current = sound;
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        setAudioData((prev) => ({
          ...prev,
          duration: status.durationMillis ?? 0,
          isPlaying: true,
        }));
      }
    } catch (error) {
      Alert.alert('错误', '无法播放音频');
    }
  }, [audioData.uri]);

  // Calculate BPM from audio
  const handleCalculateAudioBpm = useCallback(() => {
    const bpmValue = parseInt(audioData.bpmInput, 10);
    if (isNaN(bpmValue) || bpmValue < 20 || bpmValue > 300) {
      Alert.alert('无效 BPM', '请输入 20-300 之间的 BPM 值');
      return;
    }

    const beatDuration = 60000 / bpmValue;
    const beatsPerSong = Math.round((audioData.duration / 1000) * (bpmValue / 60));

    setAudioData((prev) => ({
      ...prev,
      calculatedBpm: bpmValue,
    }));

    Alert.alert(
      '计算结果',
      `BPM: ${bpmValue}\n每拍时长: ${beatDuration.toFixed(1)}ms\n总节拍数: ${beatsPerSong}`,
      [{ text: '确定' }]
    );
  }, [audioData.bpmInput, audioData.duration]);

  // Stop audio playback
  const handleStopAudio = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.setPositionAsync(0);
      setAudioData((prev) => ({
        ...prev,
        isPlaying: false,
        position: 0,
      }));
    }
  }, []);

  // Request microphone permission
  const requestMicPermission = useCallback(async () => {
    try {
      const { status } = await Audio.requestRecordingPermissionsAsync();
      setMicData((prev) => ({
        ...prev,
        permissionGranted: status === 'granted',
      }));
      return status === 'granted';
    } catch {
      setMicData((prev) => ({
        ...prev,
        permissionGranted: false,
      }));
      return false;
    }
  }, []);

  // Start microphone listening
  const handleStartMic = useCallback(async () => {
    const hasPermission = micData.permissionGranted || (await requestMicPermission());
    if (!hasPermission) {
      Alert.alert('权限不足', '需要麦克风权限才能使用此功能');
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // Create audio stream for real-time analysis
      const stream = await Audio.createAudioStreamer({
        sampleRate: 44100,
        numberOfChannels: 1,
        audioQuality: Audio.AudioQuality.High,
      });

      micStreamRef.current = stream;
      setMicData((prev) => ({
        ...prev,
        isListening: true,
        timestamps: [],
        currentBpm: null,
      }));

      // Monitor audio levels and detect beats
      micIntervalRef.current = setInterval(async () => {
        try {
          const status = await stream.getStatusAsync();
          if (status.isLoaded && status.audioSampleBuffer) {
            // Simple energy detection
            const samples = status.audioSampleBuffer;
            let sum = 0;
            for (let i = 0; i < samples.length; i++) {
              sum += Math.abs(samples[i]);
            }
            const energy = sum / samples.length;

            // Threshold-based beat detection
            const threshold = 0.1;
            if (energy > threshold) {
              setMicData((prev) => {
                const now = Date.now();
                const newTimestamps = [...prev.timestamps, now];

                // Remove old timestamps (older than 5 seconds)
                const filteredTimestamps = newTimestamps.filter(
                  (t) => now - t < 5000
                );

                const result = calculateBpm(filteredTimestamps);

                return {
                  ...prev,
                  timestamps: filteredTimestamps,
                  currentBpm: result?.bpm ?? prev.currentBpm,
                  energy: energy,
                };
              });
            } else {
              setMicData((prev) => ({
                ...prev,
                energy: energy,
              }));
            }
          }
        } catch {
          // Stream may not be ready yet
        }
      }, 50); // Check every 50ms
    } catch (error) {
      Alert.alert('错误', '无法启动麦克风');
    }
  }, [micData.permissionGranted, requestMicPermission, calculateBpm]);

  // Stop microphone listening
  const handleStopMic = useCallback(async () => {
    if (micIntervalRef.current) {
      clearInterval(micIntervalRef.current);
      micIntervalRef.current = null;
    }

    if (micStreamRef.current) {
      try {
        await micStreamRef.current.stop();
      } catch {
        // Ignore errors
      }
      micStreamRef.current = null;
    }

    await Audio.setAudioModeAsync({
      allowsRecording: false,
    });

    setMicData((prev) => ({
      ...prev,
      isListening: false,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (micIntervalRef.current) {
        clearInterval(micIntervalRef.current);
      }
      if (micStreamRef.current) {
        micStreamRef.current.stop().catch(() => {});
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // Format time
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Render Manual Tap Mode
  const renderTapMode = () => (
    <>
      <GlassCard style={styles.bpmDisplay}>
        <Text style={styles.bpmLabel}>当前 BPM</Text>
        <Text style={styles.bpmValue}>
          {tapData.bpm !== null ? tapData.bpm : '--'}
        </Text>
        <Text style={styles.bpmUnit}>拍/分钟</Text>
      </GlassCard>

      <View style={styles.tapArea}>
        <TouchableOpacity
          style={styles.tapButton}
          onPress={handleTap}
          activeOpacity={0.7}
        >
          <View style={styles.tapButtonInner}>
            <Ionicons name="hand-left" size={48} color={Colors.primary} />
            <Text style={styles.tapText}>点击打拍</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <GlassCard style={styles.statCard}>
          <Text style={styles.statLabel}>打拍次数</Text>
          <Text style={styles.statValue}>{tapData.timestamps.length}</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <Text style={styles.statLabel}>平均间隔</Text>
          <Text style={styles.statValue}>
            {tapData.avgInterval !== null ? `${tapData.avgInterval} ms` : '--'}
          </Text>
        </GlassCard>
      </View>

      <View style={styles.actions}>
        <GlassButton
          variant="secondary"
          size="small"
          onPress={handleResetTap}
        >
          重置
        </GlassButton>
        <GlassButton
          size="small"
          onPress={handleSaveTap}
          disabled={tapData.bpm === null}
        >
          保存结果
        </GlassButton>
      </View>

      <GlassCard style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>使用说明</Text>
        <Text style={styles.tipsText}>
          跟随音乐节奏持续点击「点击打拍」按钮，至少点击 4 次后自动计算 BPM。
        </Text>
      </GlassCard>
    </>
  );

  // Render Audio Analysis Mode
  const renderAudioMode = () => (
    <>
      <GlassCard style={styles.audioCard}>
        <Text style={styles.sectionTitle}>选择音频文件</Text>
        <Text style={styles.fileName}>
          {audioData.filename || '未选择文件'}
        </Text>
        <GlassButton
          variant="secondary"
          size="small"
          onPress={handlePickAudio}
          style={styles.fileButton}
        >
          选择文件
        </GlassButton>
      </GlassCard>

      {audioData.uri && (
        <>
          <GlassCard style={styles.audioCard}>
            <Text style={styles.sectionTitle}>音频播放</Text>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width:
                        audioData.duration > 0
                          ? `${(audioData.position / audioData.duration) * 100}%`
                          : '0%',
                    },
                  ]}
                />
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>
                  {formatTime(audioData.position)}
                </Text>
                <Text style={styles.timeText}>
                  {formatTime(audioData.duration)}
                </Text>
              </View>
            </View>

            <View style={styles.playbackControls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleStopAudio}
              >
                <Ionicons name="stop" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, styles.playButton]}
                onPress={handlePlayAudio}
              >
                <Ionicons
                  name={audioData.isPlaying ? 'pause' : 'play'}
                  size={32}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            </View>
          </GlassCard>

          <GlassCard style={styles.audioCard}>
            <Text style={styles.sectionTitle}>BPM 计算</Text>
            <View style={styles.bpmInputRow}>
              <View style={styles.bpmInputContainer}>
                <Ionicons
                  name="musical-notes"
                  size={20}
                  color={Colors.textMuted}
                  style={styles.bpmInputIcon}
                />
                <View style={styles.bpmInput}>
                  <Text style={styles.bpmInputLabel}>输入 BPM</Text>
                  <Text style={styles.bpmInputValue}>
                    {audioData.bpmInput || '--'}
                  </Text>
                </View>
              </View>

              <View style={styles.bpmButtons}>
                <TouchableOpacity
                  style={styles.bpmButton}
                  onPress={() =>
                    setAudioData((prev) => ({
                      ...prev,
                      bpmInput: String(parseInt(prev.bpmInput || '0', 10) + 1),
                    }))
                  }
                >
                  <Ionicons name="add" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bpmButton}
                  onPress={() =>
                    setAudioData((prev) => ({
                      ...prev,
                      bpmInput: String(parseInt(prev.bpmInput || '0', 10) - 1),
                    }))
                  }
                >
                  <Ionicons name="remove" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.quickBpmRow}>
              {[80, 100, 120, 140].map((bpm) => (
                <TouchableOpacity
                  key={bpm}
                  style={[
                    styles.quickBpmButton,
                    audioData.bpmInput === String(bpm) && styles.quickBpmButtonActive,
                  ]}
                  onPress={() =>
                    setAudioData((prev) => ({
                      ...prev,
                      bpmInput: String(bpm),
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.quickBpmText,
                      audioData.bpmInput === String(bpm) &&
                        styles.quickBpmTextActive,
                    ]}
                  >
                    {bpm}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <GlassButton
              size="small"
              onPress={handleCalculateAudioBpm}
              style={styles.calculateButton}
            >
              计算节拍信息
            </GlassButton>

            {audioData.calculatedBpm !== null && (
              <View style={styles.resultContainer}>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>每拍时长</Text>
                  <Text style={styles.resultValue}>
                    {(60000 / audioData.calculatedBpm).toFixed(1)} ms
                  </Text>
                </View>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>总节拍数</Text>
                  <Text style={styles.resultValue}>
                    {Math.round(
                      (audioData.duration / 1000) * (audioData.calculatedBpm / 60)
                    )}
                  </Text>
                </View>
              </View>
            )}
          </GlassCard>
        </>
      )}

      {!audioData.uri && (
        <GlassCard style={styles.audioCard}>
          <View style={styles.emptyState}>
            <Ionicons name="musical-notes" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>请先选择一个音频文件</Text>
            <Text style={styles.emptySubtext}>
              支持 MP3、WAV、M4A 等格式
            </Text>
          </View>
        </GlassCard>
      )}
    </>
  );

  // Render Microphone Mode
  const renderMicMode = () => (
    <>
      <GlassCard style={styles.bpmDisplay}>
        <Text style={styles.bpmLabel}>实时 BPM</Text>
        <Text style={styles.bpmValue}>
          {micData.currentBpm !== null ? micData.currentBpm : '--'}
        </Text>
        <Text style={styles.bpmUnit}>拍/分钟</Text>
      </GlassCard>

      <View style={styles.micArea}>
        <TouchableOpacity
          style={[
            styles.micButton,
            micData.isListening && styles.micButtonActive,
          ]}
          onPress={micData.isListening ? handleStopMic : handleStartMic}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.micButtonInner,
              micData.isListening && styles.micButtonInnerActive,
            ]}
          >
            <Ionicons
              name={micData.isListening ? 'mic' : 'mic-outline'}
              size={48}
              color={micData.isListening ? Colors.danger : Colors.primary}
            />
            <Text
              style={[
                styles.micText,
                micData.isListening && styles.micTextActive,
              ]}
            >
              {micData.isListening ? '停止检测' : '开始检测'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {micData.isListening && (
        <GlassCard style={styles.audioCard}>
          <Text style={styles.sectionTitle}>实时能量</Text>
          <View style={styles.energyBar}>
            <View
              style={[
                styles.energyFill,
                { width: `${Math.min(micData.energy * 100, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.energyText}>
            检测到 {micData.timestamps.length} 次节拍
          </Text>
        </GlassCard>
      )}

      <GlassCard style={styles.audioCard}>
        <Text style={styles.sectionTitle}>状态</Text>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: micData.permissionGranted
                    ? Colors.success
                    : Colors.warning,
                },
              ]}
            />
            <Text style={styles.statusText}>
              麦克风权限: {micData.permissionGranted ? '已授权' : '未授权'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: micData.isListening
                    ? Colors.success
                    : Colors.textMuted,
                },
              ]}
            />
            <Text style={styles.statusText}>
              检测状态: {micData.isListening ? '运行中' : '已停止'}
            </Text>
          </View>
        </View>
      </GlassCard>

      <GlassCard style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>使用说明</Text>
        <Text style={styles.tipsText}>
          点击「开始检测」后，播放音乐或制造节拍声音，App
          会自动检测音频能量变化并计算 BPM。
          首次使用需要授权麦克风权限。
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
          title="BPM 检测"
          subtitle="跟随音乐节奏检测节拍速度"
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

        {activeTab === 0 && renderTapMode()}
        {activeTab === 1 && renderAudioMode()}
        {activeTab === 2 && renderMicMode()}
      </ScrollView>
    </SafeAreaView>
  );
}

import { StatusBar } from 'expo-status-bar';

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
    paddingBottom: 32,
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
  // Audio mode styles
  audioCard: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  fileName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  fileButton: {
    alignSelf: 'flex-start',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.glass,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  controlButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: Colors.glass,
  },
  playButton: {
    backgroundColor: Colors.primaryGlow,
  },
  bpmInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bpmInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bpmInputIcon: {
    marginRight: 8,
  },
  bpmInput: {
    backgroundColor: Colors.glass,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
  },
  bpmInputLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  bpmInputValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  bpmButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  bpmButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBpmRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickBpmButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.glass,
    alignItems: 'center',
  },
  quickBpmButtonActive: {
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.borderActive,
  },
  quickBpmText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  quickBpmTextActive: {
    color: Colors.primary,
  },
  calculateButton: {
    marginTop: 8,
  },
  resultContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  resultItem: {
    flex: 1,
    backgroundColor: Colors.glass,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  // Mic mode styles
  micArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  micButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.glassCard,
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonActive: {
    borderColor: 'rgba(248, 113, 113, 0.5)',
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
  },
  micButtonInner: {
    alignItems: 'center',
  },
  micButtonInnerActive: {
    opacity: 1,
  },
  micText: {
    fontSize: 14,
    color: Colors.primary,
    marginTop: 8,
    fontWeight: '600',
  },
  micTextActive: {
    color: Colors.danger,
  },
  energyBar: {
    height: 8,
    backgroundColor: Colors.glass,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  energyFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  energyText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  statusRow: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
