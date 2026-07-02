import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '@/components/ui/glass-card';
import { PageHeader } from '@/components/ui/page-header';
import { Colors } from '@/constants/colors';

interface ToolItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
}

const tools: ToolItem[] = [
  {
    id: 'bpm',
    title: 'BPM 检测',
    description: '手动打拍 / 音频分析 / 麦克风',
    icon: '🎵',
    color: '#f472b6',
    gradientFrom: 'rgba(244, 114, 182, 0.1)',
    gradientTo: 'rgba(244, 114, 182, 0.02)',
  },
  {
    id: 'ltc',
    title: 'LTC 时码',
    description: '生成立体声 LTC 音频文件',
    icon: '⏱️',
    color: '#a78bfa',
    gradientFrom: 'rgba(167, 139, 250, 0.1)',
    gradientTo: 'rgba(167, 139, 250, 0.02)',
  },
  {
    id: 'audio',
    title: '音频工具',
    description: '格式转换 / 波形裁剪 / 节拍标记',
    icon: '🎼',
    color: '#38bdf8',
    gradientFrom: 'rgba(56, 189, 248, 0.1)',
    gradientTo: 'rgba(56, 189, 248, 0.02)',
  },
  {
    id: 'dmx',
    title: 'DMX 地址码',
    description: '计算起始地址与 DIP 拨码',
    icon: '🔢',
    color: '#fbbf24',
    gradientFrom: 'rgba(251, 191, 36, 0.1)',
    gradientTo: 'rgba(251, 191, 36, 0.02)',
  },
  {
    id: 'fixture',
    title: '灯库制作',
    description: '生成 MA2 / Avolites / 金刚灯库',
    icon: '💡',
    color: '#4ade80',
    gradientFrom: 'rgba(74, 222, 128, 0.1)',
    gradientTo: 'rgba(74, 222, 128, 0.02)',
  },
  {
    id: 'knowledge',
    title: '灯光理论知识库',
    description: '灯具 / 灯位 / 色彩 / DMX / 配电',
    icon: '📚',
    color: '#fb923c',
    gradientFrom: 'rgba(251, 146, 60, 0.1)',
    gradientTo: 'rgba(251, 146, 60, 0.02)',
  },
  {
    id: 'power',
    title: '功率计算',
    description: '负载统计 / 电流计算 / 线径选择',
    icon: '⚡',
    color: '#fbbf24',
    gradientFrom: 'rgba(251, 191, 36, 0.15)',
    gradientTo: 'rgba(251, 191, 36, 0.03)',
  },
  {
    id: 'troubleshoot',
    title: '故障分析',
    description: '诊断问题 / 排查故障 / 解决方案',
    icon: '🔧',
    color: '#f43f5e',
    gradientFrom: 'rgba(244, 63, 94, 0.1)',
    gradientTo: 'rgba(244, 63, 94, 0.02)',
  },
  {
    id: 'beam',
    title: '光束角度',
    description: '投射距离 / 光斑计算 / 照度',
    icon: '📐',
    color: '#8b5cf6',
    gradientFrom: 'rgba(139, 92, 246, 0.1)',
    gradientTo: 'rgba(139, 92, 246, 0.02)',
  },
  {
    id: 'glossary',
    title: '术语翻译',
    description: '中英对照 / 行业术语 / 缩略语',
    icon: '📖',
    color: '#06b6d4',
    gradientFrom: 'rgba(6, 182, 212, 0.1)',
    gradientTo: 'rgba(6, 182, 212, 0.02)',
  },
  {
    id: 'ma-commands',
    title: 'MA 宏命令',
    description: 'MA2/MA3 语法 / 分类速查',
    icon: '🎮',
    color: '#ec4899',
    gradientFrom: 'rgba(236, 72, 153, 0.1)',
    gradientTo: 'rgba(236, 72, 153, 0.02)',
  },
  {
    id: 'illuminance',
    title: '照度色温',
    description: '环境照度 / 光源色温 / CRI',
    icon: '💡',
    color: '#f97316',
    gradientFrom: 'rgba(249, 115, 22, 0.1)',
    gradientTo: 'rgba(249, 115, 22, 0.02)',
  },
  {
    id: 'color',
    title: '调色配色',
    description: 'RGB 调色 / 色温换算 / 配色方案',
    icon: '🎨',
    color: '#14b8a6',
    gradientFrom: 'rgba(20, 184, 166, 0.1)',
    gradientTo: 'rgba(20, 184, 166, 0.02)',
  },
];

export default function MenuScreen() {
  const router = useRouter();

  const handleToolPress = (toolId: string) => {
    router.push(`/tools/${toolId}` as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title="灯光大师"
          subtitle="舞台灯光师专业工具"
          style={styles.header}
        />

        <View style={styles.toolsGrid}>
          {tools.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={styles.toolWrapper}
              onPress={() => handleToolPress(tool.id)}
              activeOpacity={0.8}
            >
              <GlassCard style={styles.toolCard}>
                <View
                  style={[
                    styles.toolCardInner,
                    {
                      backgroundColor: tool.gradientFrom,
                    },
                  ]}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${tool.color}20` }]}>
                    <Text style={styles.icon}>{tool.icon}</Text>
                  </View>
                  <View style={styles.toolInfo}>
                    <Text style={styles.toolTitle}>{tool.title}</Text>
                    <Text style={styles.toolDesc}>{tool.description}</Text>
                  </View>
                  <Text style={styles.arrow}>›</Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>灯光大师 v1.0</Text>
          <Text style={styles.footerSubtext}>为舞台灯光师打造的专业工具</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 20,
    marginBottom: 16,
  },
  toolsGrid: {
    paddingHorizontal: 16,
    gap: 12,
  },
  toolWrapper: {
    marginBottom: 4,
  },
  toolCard: {
    overflow: 'hidden',
  },
  toolCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  icon: {
    fontSize: 26,
  },
  toolInfo: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  toolDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  arrow: {
    fontSize: 24,
    color: Colors.textMuted,
    fontWeight: '300',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  footerSubtext: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
