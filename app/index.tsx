import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, Text, View } from 'react-native';
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
];

export default function HomeScreen() {
  const router = useRouter();

  const handleToolPress = (toolId: string) => {
    router.push(toolId as any);
  };

  return (
    <SafeAreaView style={styles.container}>
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
