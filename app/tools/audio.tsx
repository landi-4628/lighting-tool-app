import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { PageHeader } from '@/components/ui/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassTabGroup } from '@/components/ui/glass-tab-group';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { Colors } from '@/constants/colors';

// 音频标记数据结构
interface AudioMark {
  id: string;
  time: number; // 秒
  frame: number; // 帧（基于30fps）
  note: string;
}

// 音频文件信息
interface AudioFileInfo {
  name: string;
  uri: string;
  size: number;
  type: string;
  duration?: number; // 秒
}

// 波形数据
interface WaveformData {
  bars: number[];
  duration: number;
}

// 格式化时间显示
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

// 格式化 SMPTE 时间码 (30fps)
const formatSMPTE = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 30);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
};

// 获取文件扩展名
const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// 生成唯一ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 生成模拟波形数据
const generateWaveform = (duration: number): number[] => {
  const barCount = 50;
  const bars: number[] = [];
  for (let i = 0; i < barCount; i++) {
    const random = Math.random() * 0.5 + 0.3;
    const wave = Math.sin(i * 0.3) * 0.3 + 0.5;
    bars.push(Math.min(1, Math.max(0.1, random * wave)));
  }
  return bars;
};

export default function AudioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);

  // 通用状态
  const [audioFile, setAudioFile] = useState<AudioFileInfo | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  // 波形裁剪状态
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [startPosition, setStartPosition] = useState(0);
  const [endPosition, setEndPosition] = useState(100);

  // 节拍标记状态
  const [marks, setMarks] = useState<AudioMark[]>([]);
  const [timeFormat, setTimeFormat] = useState<'smpte' | 'ms'>('smpte');
  const [editingMarkId, setEditingMarkId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState('');

  const tabs = [
    { label: '格式转换', value: 'convert' },
    { label: '波形裁剪', value: 'crop' },
    { label: '节拍标记', value: 'mark' },
  ];

  // 加载音频文件
  const loadAudioFile = useCallback(async (uri: string, fileName: string, fileSize: number, fileType: string) => {
    try {
      // 停止并卸载当前音频
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      // 创建新音频实例
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setAudioFile({
        name: fileName,
        uri,
        size: fileSize,
        type: fileType,
      });

      // 生成波形数据
      const durationSec = 180; // 预估时长，实际从状态更新获取
      setWaveformData({
        bars: generateWaveform(durationSec),
        duration: durationSec,
      });

    } catch (error) {
      console.error('加载音频失败:', error);
      Alert.alert('错误', '无法加载音频文件');
    }
  }, [sound]);

  // 播放状态更新回调
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setCurrentPosition(status.positionMillis / 1000);
      setDuration((status.durationMillis || 0) / 1000);
      setIsPlaying(status.isPlaying);

      // 更新波形数据时长
      if (status.durationMillis) {
        setWaveformData(prev => {
          if (prev) {
            return {
              ...prev,
              bars: generateWaveform((status.durationMillis || 0) / 1000),
              duration: (status.durationMillis || 0) / 1000,
            };
          }
          return prev;
        });
      }

      // 播放结束
      if (status.didJustFinish) {
        setIsPlaying(false);
        setCurrentPosition(0);
      }
    }
  };

  // 选择文件
  const pickAudioFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await loadAudioFile(
          asset.uri,
          asset.name,
          asset.size || 0,
          asset.mimeType || 'audio/*'
        );
      }
    } catch (error) {
      console.error('选择文件失败:', error);
      Alert.alert('错误', '无法选择音频文件');
    }
  }, [loadAudioFile]);

  // 播放/暂停
  const togglePlayback = useCallback(async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('播放控制失败:', error);
    }
  }, [sound, isPlaying]);

  // 跳转到指定位置
  const seekTo = useCallback(async (position: number) => {
    if (!sound) return;
    try {
      await sound.setPositionAsync(position * 1000);
      setCurrentPosition(position);
    } catch (error) {
      console.error('跳转失败:', error);
    }
  }, [sound]);

  // 添加标记
  const addMark = useCallback(async () => {
    if (!sound) {
      Alert.alert('提示', '请先选择音频文件');
      return;
    }

    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      const currentTime = status.positionMillis / 1000;
      const newMark: AudioMark = {
        id: generateId(),
        time: currentTime,
        frame: Math.floor((currentTime % 1) * 30),
        note: '',
      };
      setMarks(prev => [...prev, newMark]);
    }
  }, [sound]);

  // 删除标记
  const deleteMark = useCallback((id: string) => {
    Alert.alert(
      '删除标记',
      '确定要删除这个标记吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            setMarks(prev => prev.filter(m => m.id !== id));
          },
        },
      ]
    );
  }, []);

  // 清空所有标记
  const clearAllMarks = useCallback(() => {
    if (marks.length === 0) return;
    Alert.alert(
      '清空标记',
      '确定要清空所有标记吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清空',
          style: 'destructive',
          onPress: () => setMarks([]),
        },
      ]
    );
  }, [marks]);

  // 开始编辑备注
  const startEditNote = (mark: AudioMark) => {
    setEditingMarkId(mark.id);
    setEditingNote(mark.note);
  };

  // 保存备注
  const saveNote = (id: string) => {
    setMarks(prev => prev.map(m => m.id === id ? { ...m, note: editingNote } : m));
    setEditingMarkId(null);
    setEditingNote('');
  };

  // 导出标记列表
  const exportMarks = useCallback(async () => {
    if (marks.length === 0) {
      Alert.alert('提示', '没有可导出的标记');
      return;
    }

    const header = audioFile
      ? `# 音频文件: ${audioFile.name}\n# 时长: ${formatTime(duration)}\n# 采样率: 44100 Hz\n# 格式: SMPTE 30FPS\n# 导出时间: ${new Date().toLocaleString()}\n\n`
      : '';

    const content = marks.map((mark, index) => {
      const timeStr = timeFormat === 'smpte'
        ? formatSMPTE(mark.time)
        : `${mark.time.toFixed(3)}s`;
      const noteStr = mark.note ? ` - ${mark.note}` : '';
      return `${(index + 1).toString().padStart(3, '0')}\t${timeStr}\t帧:${mark.frame}${noteStr}`;
    }).join('\n');

    const fullContent = header + content;

    try {
      const fileName = `marks_${Date.now()}.txt`;
      const filePath = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(filePath, fullContent);

      Alert.alert(
        '导出成功',
        `标记列表已保存到:\n${fileName}`,
        [{ text: '确定' }]
      );
    } catch (error) {
      console.error('导出失败:', error);
      Alert.alert('错误', '导出失败，请重试');
    }
  }, [marks, audioFile, duration, timeFormat]);

  // 导出裁剪片段（模拟）
  const exportCropped = useCallback(() => {
    if (!audioFile) {
      Alert.alert('提示', '请先选择音频文件');
      return;
    }
    Alert.alert(
      '导出裁剪片段',
      `起始点: ${formatTime(startPosition / 100 * duration)}\n结束点: ${formatTime(endPosition / 100 * duration)}\n\n实际音频处理需要原生模块支持。\n当前功能用于预览和记录裁剪参数。`,
      [{ text: '确定' }]
    );
  }, [audioFile, startPosition, endPosition, duration]);

  // 格式转换（模拟）
  const convertFormat = useCallback(() => {
    if (!audioFile) {
      Alert.alert('提示', '请先选择音频文件');
      return;
    }
    Alert.alert(
      '格式转换',
      `正在将 ${audioFile.name} 转换为 16-bit WAV 格式...\n\n实际转换需要原生音频处理模块支持。\n当前功能用于文件信息展示。`,
      [{ text: '确定' }]
    );
  }, [audioFile]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // 渲染波形
  const renderWaveform = () => {
    if (!waveformData || waveformData.bars.length === 0) {
      return (
        <View style={styles.waveformPlaceholder}>
          <Ionicons name="musical-notes" size={64} color={Colors.textMuted} />
          <Text style={styles.waveformText}>上传音频文件以查看波形</Text>
        </View>
      );
    }

    const selectedStart = Math.floor((startPosition / 100) * waveformData.bars.length);
    const selectedEnd = Math.floor((endPosition / 100) * waveformData.bars.length);
    const playPosition = Math.floor((currentPosition / (duration || 1)) * waveformData.bars.length);

    return (
      <View style={styles.waveformContainer}>
        <View style={styles.waveformBars}>
          {waveformData.bars.map((height, index) => {
            const isSelected = index >= selectedStart && index <= selectedEnd;
            const isPlayed = index <= playPosition;
            return (
              <View
                key={index}
                style={[
                  styles.waveformBar,
                  {
                    height: `${height * 100}%`,
                    backgroundColor: isSelected
                      ? isPlayed
                        ? Colors.primary
                        : 'rgba(56, 189, 248, 0.6)'
                      : 'rgba(255, 255, 255, 0.2)',
                  },
                ]}
              />
            );
          })}
        </View>
        <View style={[styles.playhead, { left: `${(currentPosition / (duration || 1)) * 100}%` }]} />
      </View>
    );
  };

  // 渲染标记列表项
  const renderMarkItem = (mark: AudioMark, index: number) => {
    const isEditing = editingMarkId === mark.id;
    const timeStr = timeFormat === 'smpte'
      ? formatSMPTE(mark.time)
      : `${mark.time.toFixed(3)}s`;

    return (
      <View key={mark.id} style={styles.markItem}>
        <View style={styles.markIndex}>
          <Text style={styles.markIndexText}>{index + 1}</Text>
        </View>
        <View style={styles.markContent}>
          <Text style={styles.markTime}>{timeStr}</Text>
          <Text style={styles.markFrame}>帧: {mark.frame}</Text>
          {isEditing ? (
            <View style={styles.markNoteEdit}>
              <GlassInput
                value={editingNote}
                onChangeText={setEditingNote}
                placeholder="添加备注..."
                style={styles.noteInput}
                autoFocus
                onBlur={() => saveNote(mark.id)}
              />
            </View>
          ) : (
            <TouchableOpacity onPress={() => startEditNote(mark)}>
              <Text style={styles.markNote}>
                {mark.note || '点击添加备注'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.markDelete}
          onPress={() => deleteMark(mark.id)}
        >
          <Ionicons name="close-circle" size={20} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <PageHeader title="音频工具" subtitle="格式转换 · 波形裁剪 · 节拍标记" showTopSafeArea={false} />
      </View>

      <View style={styles.content}>
        <GlassTabGroup
          tabs={tabs}
          activeIndex={activeTab}
          onChange={setActiveTab}
          style={styles.tabGroup}
        />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 格式转换 Tab */}
          {activeTab === 0 && (
            <View>
              <GlassCard style={styles.uploadCard}>
                <TouchableOpacity
                  style={styles.uploadArea}
                  activeOpacity={0.7}
                  onPress={pickAudioFile}
                >
                  {audioFile ? (
                    <>
                      <Ionicons name="musical-note" size={48} color={Colors.primary} />
                      <Text style={styles.uploadTitle}>{audioFile.name}</Text>
                      <Text style={styles.uploadSubtitle}>
                        {formatFileSize(audioFile.size)} • {getFileExtension(audioFile.name).toUpperCase()}
                      </Text>
                      {duration > 0 && (
                        <Text style={styles.durationText}>时长: {formatTime(duration)}</Text>
                      )}
                    </>
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={48} color={Colors.textMuted} />
                      <Text style={styles.uploadTitle}>点击上传音频文件</Text>
                      <Text style={styles.uploadSubtitle}>支持 MP3, WAV, FLAC, AAC, M4A 格式</Text>
                    </>
                  )}
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

              <GlassButton
                style={styles.actionButton}
                onPress={convertFormat}
                disabled={!audioFile}
              >
                转换为 WAV
              </GlassButton>
            </View>
          )}

          {/* 波形裁剪 Tab */}
          {activeTab === 1 && (
            <View>
              <GlassCard style={styles.waveformCard}>
                {renderWaveform()}
                <View style={styles.waveformControls}>
                  <View style={styles.waveformSlider}>
                    <Text style={styles.sliderLabel}>起始点</Text>
                    <View style={styles.sliderTrack}>
                      <View
                        style={[
                          styles.sliderThumb,
                          { left: `${startPosition}%` },
                        ]}
                      />
                      <View
                        style={[
                          styles.sliderRange,
                          {
                            left: `${startPosition}%`,
                            width: `${endPosition - startPosition}%`,
                          },
                        ]}
                      />
                    </View>
                    <TouchableOpacity onPress={() => setStartPosition(0)}>
                      <Text style={styles.sliderValue}>
                        {formatTime((startPosition / 100) * duration)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.waveformSlider}>
                    <Text style={styles.sliderLabel}>结束点</Text>
                    <View style={styles.sliderTrack}>
                      <View
                        style={[
                          styles.sliderThumb,
                          { left: `${endPosition}%` },
                        ]}
                      />
                      <View
                        style={[
                          styles.sliderRange,
                          {
                            left: `${startPosition}%`,
                            width: `${endPosition - startPosition}%`,
                          },
                        ]}
                      />
                    </View>
                    <TouchableOpacity onPress={() => setEndPosition(100)}>
                      <Text style={styles.sliderValue}>
                        {formatTime((endPosition / 100) * duration)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </GlassCard>

              <View style={styles.playbackControls}>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={pickAudioFile}
                >
                  <Ionicons name="folder-open" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.playButton, styles.playButtonMain]}
                  onPress={togglePlayback}
                  disabled={!sound}
                >
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={32}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => seekTo(0)}
                  disabled={!sound}
                >
                  <Ionicons name="refresh" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {duration > 0 && (
                <Text style={styles.currentTime}>
                  {formatTime(currentPosition)} / {formatTime(duration)}
                </Text>
              )}

              <GlassButton
                style={styles.actionButton}
                onPress={exportCropped}
                disabled={!audioFile}
              >
                导出裁剪片段
              </GlassButton>
            </View>
          )}

          {/* 节拍标记 Tab */}
          {activeTab === 2 && (
            <View>
              <View style={styles.playbackControls}>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={pickAudioFile}
                >
                  <Ionicons name="folder-open" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.playButton, styles.playButtonMain]}
                  onPress={togglePlayback}
                  disabled={!sound}
                >
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={32}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => seekTo(0)}
                  disabled={!sound}
                >
                  <Ionicons name="refresh" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {duration > 0 && (
                <Text style={styles.currentTime}>
                  {formatTime(currentPosition)} / {formatTime(duration)}
                </Text>
              )}

              <GlassCard style={styles.marksCard}>
                <View style={styles.marksHeader}>
                  <Text style={styles.marksTitle}>
                    节拍标记 ({marks.length})
                  </Text>
                  <GlassButton
                    variant="secondary"
                    size="small"
                    onPress={clearAllMarks}
                    disabled={marks.length === 0}
                  >
                    清空
                  </GlassButton>
                </View>
                <View style={styles.marksList}>
                  {marks.length === 0 ? (
                    <>
                      <Text style={styles.marksEmpty}>暂无标记</Text>
                      <Text style={styles.marksHint}>播放音频时点击下方按钮记录时间戳</Text>
                    </>
                  ) : (
                    marks.map((mark, index) => renderMarkItem(mark, index))
                  )}
                </View>
              </GlassCard>

              <View style={styles.markControls}>
                <TouchableOpacity
                  style={styles.markButton}
                  activeOpacity={0.7}
                  onPress={addMark}
                >
                  <Ionicons name="flag" size={24} color={Colors.primary} />
                  <Text style={styles.markButtonText}>打点</Text>
                  <Text style={styles.markCurrentTime}>
                    {formatTime(currentPosition)}
                  </Text>
                </TouchableOpacity>
              </View>

              <GlassCard style={styles.formatCard}>
                <Text style={styles.formatTitle}>时间码格式</Text>
                <View style={styles.formatOptions}>
                  <TouchableOpacity
                    style={[
                      styles.formatOption,
                      timeFormat === 'smpte' && styles.formatOptionActive,
                    ]}
                    onPress={() => setTimeFormat('smpte')}
                  >
                    <Text
                      style={[
                        styles.formatText,
                        timeFormat === 'smpte' && styles.formatTextActive,
                      ]}
                    >
                      SMPTE 30FPS
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.formatOption,
                      timeFormat === 'ms' && styles.formatOptionActive,
                    ]}
                    onPress={() => setTimeFormat('ms')}
                  >
                    <Text
                      style={[
                        styles.formatText,
                        timeFormat === 'ms' && styles.formatTextActive,
                      ]}
                    >
                      毫秒
                    </Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>

              <GlassButton
                style={styles.actionButton}
                onPress={exportMarks}
                disabled={marks.length === 0}
              >
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
    paddingRight: 16,
  },
  backButton: {
    padding: 8,
    marginRight: -4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 32,
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
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
  },
  durationText: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 8,
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
  waveformCard: {
    padding: 16,
    marginBottom: 12,
  },
  waveformContainer: {
    height: 120,
    marginBottom: 16,
    position: 'relative',
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
  waveformBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.glass,
    borderRadius: 12,
    paddingHorizontal: 4,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.danger,
    borderRadius: 1,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    marginLeft: -12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  sliderRange: {
    position: 'absolute',
    top: 0,
    height: '100%',
    backgroundColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 3,
  },
  sliderValue: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: 'monospace',
    width: 56,
    textAlign: 'right',
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 16,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonMain: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.glassCard,
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  currentTime: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: 'monospace',
    marginBottom: 16,
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
    minHeight: 100,
  },
  marksEmpty: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 24,
  },
  marksHint: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  markItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  markIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  markIndexText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  markContent: {
    flex: 1,
  },
  markTime: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'monospace',
  },
  markFrame: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  markNote: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  markNoteEdit: {
    marginTop: 8,
  },
  noteInput: {
    fontSize: 13,
    paddingVertical: 8,
  },
  markDelete: {
    padding: 4,
    marginLeft: 8,
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
  markCurrentTime: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    marginLeft: 8,
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
  actionButton: {
    marginBottom: 24,
  },
});
