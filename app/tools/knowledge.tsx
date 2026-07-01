import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from '@/components/ui/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { Colors } from '@/constants/colors';

interface Category {
  id: string;
  name: string;
  icon: string;
  cards: KnowledgeCard[];
}

interface KnowledgeCard {
  id: string;
  title: string;
  summary: string;
  detail: string;
}

const categories: Category[] = [
  {
    id: 'fixtures',
    name: '灯具分类',
    icon: '💡',
    cards: [
      {
        id: 'spotlight',
        title: '电脑灯 (Spotlight)',
        summary: '具有可调光束、可更换图案和颜色的专业舞台灯具。',
        detail: '电脑灯是现代舞台灯光的核心设备，分为 Spot（图案灯）和 Beam（光束灯）。\n\n关键参数：\n- 功率：200W-1200W\n- 光束角度：5-50°可调\n- 通道数：8-32通道\n- 典型品牌：Martin、Robe、Clay Paky\n\nSpot 特点：宽角度、可变图案盘、可旋转颜色盘\nBeam 特点：窄角度、远距离投射、锐利光束',
      },
      {
        id: 'wash',
        title: '染色灯 (Wash)',
        summary: '用于大面积染色铺光的泛光照明灯具。',
        detail: '染色灯主要功能是大面积铺光和颜色渲染。\n\n常见类型：\n- LED Par：RGB/RGBW/六色，功耗低、寿命长\n- 菲涅尔染色灯：均匀柔和光斑\n- 电池灯：无线移动染色\n\n典型配置：每 4-8 台一组，串联 DMX 控制。',
      },
      {
        id: 'strobe',
        title: '频闪灯 (Strobe)',
        summary: '产生快速闪光效果的舞台特效灯具。',
        detail: '频闪灯通过快速闪烁创造视觉冲击效果。\n\n关键参数：\n- 闪光频率：1-30Hz\n- 占空比可调\n- 高功率频闪单次可达 150000 流明\n\n注意事项：\n- 可能诱发光敏性癫痫\n- 高功率频闪配电需使用 D 型空开\n- DMX 通常占用 1-3 通道',
      },
    ],
  },
  {
    id: 'positions',
    name: '灯位布局',
    icon: '📐',
    cards: [
      {
        id: 'front',
        title: '面光 (Front Light)',
        summary: '位于观众席正前方的主照明灯位。',
        detail: '面光是舞台灯光的基础，提供演员正面照明。\n\n位置：观众厅前沿上方，与中线夹角 45-60°\n高度角：35-45°\n\n设计要点：\n- 左右各一组保证立体感\n- 加柔光纸柔化光影\n- 覆盖全部表演区',
      },
      {
        id: 'back',
        title: '逆光 (Back Light)',
        summary: '位于演员身后上方的轮廓光。',
        detail: '逆光勾勒人物轮廓，增加视觉层次。\n\n位置：演员后方上方 55-70° 高度角\n\n典型配置：\n- 每 2-3m 一盏\n- 沿舞台深度分布 2-3 排\n- DMX 分组控制区域变化',
      },
      {
        id: 'side',
        title: '侧光 (Side Light)',
        summary: '位于舞台两侧的立体照明。',
        detail: '侧光塑造人物立体感和空间感。\n\n高度：低位 1.5-3m / 高位 3-6m\n\n配置要点：\n- 左/右侧各一组\n- 高度分上下两层\n- 按排 × 色彩分组 DMX',
      },
    ],
  },
  {
    id: 'color',
    name: '色彩理论',
    icon: '🎨',
    cards: [
      {
        id: 'temp',
        title: '色温 (Color Temperature)',
        summary: '衡量光源颜色偏暖或偏冷的物理量。',
        detail: '色温基于黑体辐射理论，单位为开尔文(K)。\n\n舞台常用：\n- 3200K：暖白（面光）\n- 5600-6000K：日光（追光）\n\n高低色温混合可产生丰富的空间层次。',
      },
      {
        id: 'cri',
        title: '显色指数 CRI',
        summary: '衡量灯光还原物体真实色彩能力的指标。',
        detail: 'CRI（Color Rendering Index）以 0-100 评分。\n\n标准：\n- Ra > 90：优秀（博物馆/影视级）\n- Ra 80-90：良好（一般舞台）\n- Ra < 80：差（仅效果用）\n\nLED 需关注 R9（红）和 R12（蓝）指标。',
      },
      {
        id: 'additive',
        title: '加色混合 vs 减色混合',
        summary: 'LED 使用加色混合，颜色纸使用减色混合。',
        detail: '加色混合（Additive）：\nRGB 三原色光叠加\nR+G=黄, R+B=品红, G+B=青, 全加=白\n\n减色混合（Subtractive）：\n颜色纸吸收部分光谱\n是滤色片的工作原理',
      },
    ],
  },
  {
    id: 'dmx',
    name: 'DMX 协议',
    icon: '🔌',
    cards: [
      {
        id: 'basics',
        title: 'DMX512 协议基础',
        summary: '舞台灯光数字控制协议。',
        detail: 'DMX512 物理层：\n- RS-485 差分信号\n- 3 芯或 5 芯 XLR 连接器\n- 每 Universe 最多 512 通道\n\n连接：\n控台 → 放大器 → 灯具\n每链路最多 32 台设备',
      },
      {
        id: 'address',
        title: 'DMX 地址码设置',
        summary: '为每台灯具分配唯一的起始通道。',
        detail: '地址设置步骤：\n1. 确定灯具通道数\n2. 计算起始地址\n3. 通过灯具菜单或 DIP 拨码设置\n\n规则：\n- 地址 = 前一台地址 + 前一台通道数 + 1\n- 同一链路地址不能重叠',
      },
      {
        id: 'artnet',
        title: 'Art-Net 与 sACN',
        summary: '通过以太网传输 DMX 数据。',
        detail: 'Art-Net：\n- 基于 UDP\n- 10.x.x.x 网段\n- 每端口最多 32768 个 Universe\n\nsACN (E1.31)：\n- 行业标准\n- 支持多播\n- 兼容性好\n\n突破传统 DMX 512 通道限制。',
      },
    ],
  },
  {
    id: 'console',
    name: '控台操作',
    icon: '🎛️',
    cards: [
      {
        id: 'ma2',
        title: 'grandMA2 操作哲学',
        summary: '以 Cue/Sequence/Executor 三层结构组织灯光。',
        detail: '核心概念：\n- Cue：单个灯光状态快照\n- Sequence：多个 Cue 的序列\n- Executor：物理或虚拟回放键\n\n关键原则：\n一切皆可存储，大量使用 Preset 减少重复工作。',
      },
      {
        id: 'timing',
        title: 'Cue 时间与过渡曲线',
        summary: '控制灯光状态切换的速度和方式。',
        detail: '核心时间参数：\n- In-Time：淡入时间\n- Out-Time：淡出时间\n\n曲线类型：\n- Linear：线性过渡\n- S 曲线：平滑过渡\n- In/Out：先慢后快/先快后慢',
      },
      {
        id: 'timecode',
        title: '时间码演出',
        summary: '将灯光 Cue 与音视频时间码同步。',
        detail: '时间码类型：\n- LTC：嵌入音频信号\n- MIDI Timecode\n- 内置时间码\n\n工作流程：\n1. 生成时间码音频\n2. 输入控台\n3. 录制 Cue\n4. 回放时自动触发',
      },
    ],
  },
  {
    id: 'workflow',
    name: '演出流程',
    icon: '🎭',
    cards: [
      {
        id: 'loadin',
        title: '装台流程 (Load-In)',
        summary: '从设备进场到灯光就绪的规范化操作。',
        detail: '标准流程：\n1. 设备进场卸货\n2. 桁架吊挂安装\n3. 灯具安装接线\n4. 控台编程\n5. 技术彩排\n\n安全要点：高空作业必须使用安全带，灯具必须挂安全绳。',
      },
      {
        id: 'tech',
        title: '技术彩排 (Tech Rehearsal)',
        summary: '灯光、音响、视频全系统联调。',
        detail: '彩排步骤：\n1. Dry Tech：无演员检查 Cue\n2. Cue-to-Cue：演员就位逐 Cue 运行\n3. Full Run：完整演出时长\n4. Dress Rehearsal：带妆彩排\n\n灯光师需携带：CueList 打印稿、手电筒、备用通话耳麦。',
      },
      {
        id: 'emergency',
        title: '应急预案',
        summary: '设备故障或突发情况的应急处理。',
        detail: '常见故障应对：\n- 灯具灭灯：切换备份 Cue\n- 控台死机：切换备份控台\n- 某区断电：调整配电\n\n建议准备：\n- UPS 不间断电源\n- 备份 Cue 随时可用\n- 对讲机保持通讯',
      },
    ],
  },
];

export default function KnowledgeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const currentCategory = categories[activeCategory];
  const filteredCards = searchQuery.trim()
    ? currentCategory.cards.filter(
        (card) =>
          card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.summary.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentCategory.cards;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 16}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <PageHeader title="灯光理论知识库" subtitle="灯具 · 灯位 · 色彩 · DMX · 配电 · 控台" showTopSafeArea={false} />
      </View>

      <View style={styles.searchContainer}>
        <GlassInput
          placeholder="搜索知识条目..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category, index) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryTab,
              activeCategory === index && styles.categoryTabActive,
            ]}
            onPress={() => {
              setActiveCategory(index);
              setSearchQuery('');
              setExpandedCard(null);
            }}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text
              style={[
                styles.categoryText,
                activeCategory === index && styles.categoryTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredCards.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="search" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>未找到匹配条目</Text>
            <Text style={styles.emptyHint}>尝试其他关键词或切换分类</Text>
          </GlassCard>
        ) : (
          filteredCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              activeOpacity={0.8}
              onPress={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
            >
              <GlassCard style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Ionicons
                    name={expandedCard === card.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={Colors.textMuted}
                  />
                </View>
                <Text style={styles.cardSummary}>{card.summary}</Text>
                {expandedCard === card.id && (
                  <View style={styles.cardDetail}>
                    <View style={styles.divider} />
                    <Text style={styles.detailText}>{card.detail}</Text>
                  </View>
                )}
              </GlassCard>
            </TouchableOpacity>
          ))
        )}
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
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: -4,
    marginBottom: 12,
  },
  searchInput: {
    marginTop: 0,
  },
  categoryScroll: {
    maxHeight: 56,
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 12,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  categoryTabActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(125, 211, 252, 0.3)',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: Colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 48,
    marginTop: 24,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textMuted,
    marginTop: 16,
  },
  emptyHint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  cardSummary: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
    lineHeight: 20,
  },
  cardDetail: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
