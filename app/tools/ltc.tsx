import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { PageHeader } from '@/components/ui/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassButton } from '@/components/ui/glass-button';
import { Colors } from '@/constants/colors';

interface FrameRate {
  label: string;
  value: number;
  isDropFrame: boolean;
}

const frameRates: FrameRate[] = [
  { label: '24 fps', value: 24, isDropFrame: false },
  { label: '25 fps', value: 25, isDropFrame: false },
  { label: '30 fps', value: 30, isDropFrame: false },
  { label: '29.97 DF', value: 29.97, isDropFrame: true },
  { label: '30 DF', value: 30, isDropFrame: true },
];

interface Timecode {
  hours: number;
  minutes: number;
  seconds: number;
  frames: number;
}

interface LtcBit {
  value: 0 | 1;
  phase: number;
}

const presets = [
  { label: '00:00:00:00', tc: { hours: 0, minutes: 0, seconds: 0, frames: 0 } },
  { label: '01:00:00:00', tc: { hours: 1, minutes: 0, seconds: 0, frames: 0 } },
  { label: '05:00:00:00', tc: { hours: 5, minutes: 0, seconds: 0, frames: 0 } },
  { label: '10:00:00:00', tc: { hours: 10, minutes: 0, seconds: 0, frames: 0 } },
];

function parseTimecodeField(value: string, max: number): number {
  const num = parseInt(value, 10);
  if (isNaN(num)) return 0;
  return Math.min(Math.max(num, 0), max);
}

function getMaxFrames(frameRate: number): number {
  return Math.floor(frameRate);
}

function validateTimecode(
  hours: string,
  minutes: string,
  seconds: string,
  frames: string,
  frameRate: number
): Timecode | null {
  const h = parseTimecodeField(hours, 23);
  const m = parseTimecodeField(minutes, 59);
  const s = parseTimecodeField(seconds, 59);
  const maxF = getMaxFrames(frameRate);
  const f = parseTimecodeField(frames, maxF);

  if (isNaN(parseInt(hours, 10)) || isNaN(parseInt(minutes, 10)) || 
      isNaN(parseInt(seconds, 10)) || isNaN(parseInt(frames, 10))) {
    return null;
  }

  return { hours: h, minutes: m, seconds: s, frames: f };
}

function encodeTimecodeToBits(tc: Timecode, frameRate: FrameRate): LtcBit[] {
  const bits: LtcBit[] = [];
  
  const tcWords = [
    (tc.units) % 10,
    Math.floor(tc.frames / 10) % 6,
    (tc.seconds) % 10,
    Math.floor(tc.seconds / 10) % 6,
    (tc.minutes) % 10,
    Math.floor(tc.minutes / 10) % 6,
    (tc.hours) % 10,
    Math.floor(tc.hours / 10) % 3,
  ];

  const bitStream: number[] = [];
  
  for (let i = 0; i < tcWords.length; i++) {
    const bcd = tcWords[i];
    for (let j = 0; j < 4; j++) {
      bitStream.push((bcd >> (3 - j)) & 1);
    }
  }

  const syncWord = [0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0];

  const fullBitStream = [...bitStream, ...syncWord];

  for (let i = 0; i < fullBitStream.length; i++) {
    const bitValue: 0 | 1 = fullBitStream[i] as 0 | 1;
    const phaseOffset = bitValue === 1 ? Math.PI : 0;
    bits.push({ value: bitValue, phase: phaseOffset });
  }

  return bits;
}

function generateLtcAudioSamples(
  tc: Timecode,
  frameRate: FrameRate,
  sampleRate: number = 48000,
  durationSeconds: number = 10
): Float32Array {
  const bits = encodeTimecodeToBits(tc, frameRate);
  const framesPerBit = Math.floor(sampleRate / frameRate.value);
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const samples = new Float32Array(totalSamples);

  const freqHigh = 3300;
  const freqLow = 3000;
  
  let currentBitIndex = 0;
  const totalBits = bits.length;

  for (let i = 0; i < totalSamples; i++) {
    const timeInSeconds = i / sampleRate;
    const currentFrame = Math.floor(timeInSeconds * frameRate.value);
    const bitPositionInFrame = (timeInSeconds * frameRate.value) % 1;
    
    const bitIndex = Math.floor(bitPositionInFrame * totalBits) % totalBits;
    const currentBit = bits[bitIndex];
    
    let freq = freqLow;
    if (currentBit.value === 1) {
      freq = freqHigh;
    }
    
    const phase = (i / sampleRate) * freq * 2 * Math.PI + currentBit.phase;
    const amplitude = 0.5;
    samples[i] = amplitude * Math.sin(phase);
  }

  return samples;
}

function float32ArrayToWav(samples: Float32Array, sampleRate: number = 48000, numChannels: number = 2): ArrayBuffer {
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * numChannels * bytesPerSample;
  const fileSize = 44 + dataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, fileSize - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const leftSample = samples[i];
    const rightSample = 0;

    const leftInt = Math.max(-32768, Math.min(32767, Math.floor(leftSample * 32767)));
    const rightInt = Math.max(-32768, Math.min(32767, Math.floor(rightSample * 32767)));

    view.setInt16(offset, leftInt, true);
    view.setInt16(offset + 2, rightInt, true);
    offset += 4;
  }

  return buffer;
}

function formatTimecodeString(tc: Timecode): string {
  const pad = (n: number, len: number = 2) => n.toString().padStart(len, '0');
  return `${pad(tc.hours)}:${pad(tc.minutes)}:${pad(tc.seconds)}:${pad(tc.frames)}`;
}

export default function LtcScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [soundUri, setSoundUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewDuration, setPreviewDuration] = useState(5);

  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const [seconds, setSeconds] = useState('00');
  const [frames, setFrames] = useState('00');
  const [frameRateIndex, setFrameRateIndex] = useState(1);

  const currentFrameRate = frameRates[frameRateIndex];

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const handlePresetPress = useCallback((preset: typeof presets[0]) => {
    setHours(preset.tc.hours.toString().padStart(2, '0'));
    setMinutes(preset.tc.minutes.toString().padStart(2, '0'));
    setSeconds(preset.tc.seconds.toString().padStart(2, '0'));
    setFrames(preset.tc.frames.toString().padStart(2, '0'));
  }, []);

  const handleInputChange = useCallback((
    value: string,
    setter: (val: string) => void,
    max: number
  ) => {
    const filtered = value.replace(/[^0-9]/g, '');
    if (filtered.length <= 2) {
      const num = parseInt(filtered, 10);
      if (filtered === '' || (num <= max && num >= 0)) {
        setter(filtered === '' ? '' : filtered);
      } else if (num > max) {
        setter(max.toString());
      }
    }
  }, []);

  const generateLtcAudio = useCallback(async (): Promise<string | null> => {
    const tc = validateTimecode(hours, minutes, seconds, frames, currentFrameRate.value);
    if (!tc) {
      Alert.alert('错误', '请输入有效的时间码值');
      return null;
    }

    setIsGenerating(true);

    try {
      const samples = generateLtcAudioSamples(tc, currentFrameRate, 48000, previewDuration);
      const wavBuffer = float32ArrayToWav(samples, 48000, 2);
      
      const base64Data = arrayBufferToBase64(wavBuffer);
      const localUri = FileSystem.documentDirectory + 'ltc_audio.wav';
      
      await FileSystem.writeAsStringAsync(localUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return localUri;
    } catch (error) {
      console.error('生成 LTC 音频失败:', error);
      Alert.alert('错误', '生成 LTC 音频失败');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [hours, minutes, seconds, frames, currentFrameRate, previewDuration]);

  const handlePreview = useCallback(async () => {
    if (isPlaying && soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      setIsPlaying(false);
      setSoundUri(null);
      return;
    }

    setIsPlaying(true);

    try {
      const audioUri = await generateLtcAudio();
      if (!audioUri) {
        setIsPlaying(false);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
        (status: AVPlaybackStatus) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        }
      );

      soundRef.current = sound;
      setSoundUri(audioUri);
    } catch (error) {
      console.error('预览失败:', error);
      Alert.alert('错误', '预览失败，请检查音频文件');
      setIsPlaying(false);
    }
  }, [isPlaying, generateLtcAudio]);

  const handleExport = useCallback(async () => {
    const tc = validateTimecode(hours, minutes, seconds, frames, currentFrameRate.value);
    if (!tc) {
      Alert.alert('错误', '请输入有效的时间码值');
      return;
    }

    setIsExporting(true);

    try {
      const samples = generateLtcAudioSamples(tc, currentFrameRate, 48000, 10);
      const wavBuffer = float32ArrayToWav(samples, 48000, 2);
      
      const base64Data = arrayBufferToBase64(wavBuffer);
      const tcString = formatTimecodeString(tc);
      const frameRateStr = currentFrameRate.label.replace(' ', '_').replace('.', '_');
      const fileName = `LTC_${tcString}_${frameRateStr}.wav`;
      
      const localUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(localUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(localUri, {
          mimeType: 'audio/wav',
          dialogTitle: '导出 LTC 音频文件',
        });
      } else {
        Alert.alert('成功', `文件已保存至: ${fileName}`);
      }
    } catch (error) {
      console.error('导出失败:', error);
      Alert.alert('错误', '导出 LTC 音频文件失败');
    } finally {
      setIsExporting(false);
    }
  }, [hours, minutes, seconds, frames, currentFrameRate]);

  const handlePreviewDurationChange = useCallback((value: string) => {
    const num = parseInt(value, 10);
    if (value === '' || (!isNaN(num) && num >= 1 && num <= 60)) {
      setPreviewDuration(num || 5);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 16}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <PageHeader title="LTC 时码" subtitle="生成立体声 LTC 音频文件" showTopSafeArea={false} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.timecodeCard}>
          <Text style={styles.sectionTitle}>时间码设置</Text>

          <View style={styles.timecodeRow}>
            <View style={styles.timecodeUnit}>
              <GlassInput
                value={hours}
                onChangeText={(v) => handleInputChange(v, setHours, 23)}
                keyboardType="number-pad"
                maxLength={2}
                style={styles.timecodeInput}
                containerStyle={styles.timecodeInputContainer}
                placeholder="00"
              />
              <Text style={styles.timecodeLabel}>时</Text>
            </View>
            <Text style={styles.timecodeSeparator}>:</Text>
            <View style={styles.timecodeUnit}>
              <GlassInput
                value={minutes}
                onChangeText={(v) => handleInputChange(v, setMinutes, 59)}
                keyboardType="number-pad"
                maxLength={2}
                style={styles.timecodeInput}
                containerStyle={styles.timecodeInputContainer}
                placeholder="00"
              />
              <Text style={styles.timecodeLabel}>分</Text>
            </View>
            <Text style={styles.timecodeSeparator}>:</Text>
            <View style={styles.timecodeUnit}>
              <GlassInput
                value={seconds}
                onChangeText={(v) => handleInputChange(v, setSeconds, 59)}
                keyboardType="number-pad"
                maxLength={2}
                style={styles.timecodeInput}
                containerStyle={styles.timecodeInputContainer}
                placeholder="00"
              />
              <Text style={styles.timecodeLabel}>秒</Text>
            </View>
            <Text style={styles.timecodeSeparator}>:</Text>
            <View style={styles.timecodeUnit}>
              <GlassInput
                value={frames}
                onChangeText={(v) => handleInputChange(v, setFrames, getMaxFrames(currentFrameRate.value))}
                keyboardType="number-pad"
                maxLength={2}
                style={styles.timecodeInput}
                containerStyle={styles.timecodeInputContainer}
                placeholder="00"
              />
              <Text style={styles.timecodeLabel}>帧</Text>
            </View>
          </View>

          <View style={styles.presetRow}>
            {presets.map((preset) => (
              <TouchableOpacity
                key={preset.label}
                style={styles.presetButton}
                onPress={() => handlePresetPress(preset)}
              >
                <Text style={styles.presetText}>{preset.label}</Text>
              </TouchableOpacity>
            ))}
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
                {rate.isDropFrame && (
                  <Text style={styles.dropFrameBadge}>DF</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        <GlassCard style={styles.previewCard}>
          <Text style={styles.sectionTitle}>预览设置</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>预览时长</Text>
            <View style={styles.previewDurationControl}>
              <TouchableOpacity
                style={styles.durationButton}
                onPress={() => setPreviewDuration(Math.max(1, previewDuration - 1))}
              >
                <Ionicons name="remove" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.durationValue}>{previewDuration}s</Text>
              <TouchableOpacity
                style={styles.durationButton}
                onPress={() => setPreviewDuration(Math.min(60, previewDuration + 1))}
              >
                <Ionicons name="add" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
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
          <GlassButton
            variant="secondary"
            style={styles.actionButton}
            onPress={handlePreview}
            loading={isGenerating}
            disabled={isExporting}
          >
            <View style={styles.buttonContent}>
              <Ionicons
                name={isPlaying ? 'stop' : 'play'}
                size={20}
                color={Colors.textSecondary}
                style={styles.buttonIcon}
              />
              <Text style={styles.buttonTextSecondary}>{isPlaying ? '停止' : '试听'}</Text>
            </View>
          </GlassButton>
          <GlassButton
            style={styles.actionButton}
            onPress={handleExport}
            loading={isExporting}
            disabled={isGenerating || isPlaying}
          >
            <View style={styles.buttonContent}>
              <Ionicons
                name="download"
                size={20}
                color="#e0f2fe"
                style={styles.buttonIcon}
              />
              <Text style={styles.buttonTextPrimary}>导出 WAV</Text>
            </View>
          </GlassButton>
        </View>

        <GlassCard style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>使用提示</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.tipText}>支持 SMPTE 标准时间码格式</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.tipText}>可选择不同帧率 (24/25/30/29.97 DF/30 DF)</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.tipText}>导出标准 WAV 立体声文件，左声道为 LTC 信号</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.tipText}>LTC 频率范围: 3000Hz (0) / 3300Hz (1)</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.currentTcCard}>
          <View style={styles.currentTcHeader}>
            <Ionicons name="time" size={18} color={Colors.primary} />
            <Text style={styles.currentTcTitle}>当前时间码</Text>
          </View>
          <Text style={styles.currentTcValue}>
            {hours.padStart(2, '0')}:{minutes.padStart(2, '0')}:{seconds.padStart(2, '0')}:{frames.padStart(2, '0')}
          </Text>
          <Text style={styles.currentTcFrameRate}>
            帧率: {currentFrameRate.label} | 最大帧号: 00-{getMaxFrames(currentFrameRate.value).toString().padStart(2, '0')}
          </Text>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.glass,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
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
  dropFrameBadge: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  previewCard: {
    padding: 20,
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  previewDurationControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 4,
  },
  durationButton: {
    padding: 8,
  },
  durationValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    minWidth: 50,
    textAlign: 'center',
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
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonTextPrimary: {
    color: '#e0f2fe',
    fontWeight: '600',
    fontSize: 15,
  },
  buttonTextSecondary: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  tipsCard: {
    padding: 16,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipText: {
    fontSize: 13,
    color: Colors.textMuted,
    flex: 1,
  },
  currentTcCard: {
    padding: 16,
    marginBottom: 24,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  currentTcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentTcTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 6,
  },
  currentTcValue: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  currentTcFrameRate: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
