import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from '@/components/ui/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassTabGroup } from '@/components/ui/glass-tab-group';
import { Colors } from '@/constants/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type TermCategory = 'all' | 'basic' | 'fixture' | 'console' | 'protocol' | 'stage';

interface Term {
  id: string;
  en: string;
  zh: string;
  category: TermCategory;
  definition?: string;
}

const glossaryTerms: Term[] = [
  // 基础术语 (Basic Terms)
  { id: 'channel', en: 'Channel', zh: '通道', category: 'basic', definition: '灯光控制信号的基本单元，每个通道控制一个参数（如亮度、颜色、位置等）' },
  { id: 'dimmer', en: 'Dimmer', zh: '调光器', category: 'basic', definition: '控制灯光亮度输出的设备，通过调节电压或PWM信号来实现' },
  { id: 'fixture', en: 'Fixture', zh: '灯具', category: 'basic', definition: '舞台灯光设备，接收DMX信号并产生相应的灯光效果' },
  { id: 'gobo', en: 'Gobo', zh: '图案片', category: 'basic', definition: '安装在灯具内部的金属或玻璃图案模板，用于投射各种形状的图案' },
  { id: 'focus', en: 'Focus', zh: '焦距/对焦', category: 'basic', definition: '调整灯具光斑的清晰度和边缘锐利程度' },
  { id: 'beam', en: 'Beam', zh: '光束', category: 'basic', definition: '灯具发出的可见光柱效果' },
  { id: 'spot', en: 'Spot', zh: '定点/图案模式', category: 'basic', definition: '灯具的图案投射模式，产生清晰的光斑' },
  { id: 'wash', en: 'Wash', zh: '染色', category: 'basic', definition: '大面积泛光照明，用于铺色和氛围营造' },
  { id: 'intensity', en: 'Intensity', zh: '亮度', category: 'basic', definition: '灯光的发光强度或亮度值' },
  { id: 'color-wheel', en: 'Color Wheel', zh: '颜色轮', category: 'basic', definition: '灯具内可旋转的颜色选择机构' },
  { id: 'color-mixing', en: 'Color Mixing', zh: '混色', category: 'basic', definition: '通过叠加不同颜色光源来产生新颜色的技术' },
  { id: 'strobe', en: 'Strobe', zh: '频闪', category: 'basic', definition: '快速闪烁的灯光效果' },
  { id: 'shutter', en: 'Shutter', zh: '快门', category: 'basic', definition: '控制光线是否投射到舞台上的机械装置' },
  { id: 'lamp', en: 'Lamp', zh: '灯泡/光源', category: 'basic', definition: '灯具内部的发光元件，如HMI、钨丝灯、LED等' },
  { id: 'ballast', en: 'Ballast', zh: '镇流器', category: 'basic', definition: '为气体放电灯提供启动和工作电压的设备' },
  { id: 'frost', en: 'Frost', zh: '柔光片', category: 'basic', definition: '用于柔化光斑边缘的扩散材料' },
  { id: 'iris', en: 'Iris', zh: '光圈', category: 'basic', definition: '调节光斑大小的机械装置' },
  { id: 'barndoor', en: 'Barndoor', zh: '挡光板', category: 'basic', definition: '安装在灯具前用于遮挡多余光线的金属叶片' },
  { id: 'cable', en: 'Cable', zh: '线缆', category: 'basic', definition: '用于传输电力或DMX信号的线材' },
  { id: 'connector', en: 'Connector', zh: '接头', category: 'basic', definition: '线缆两端的连接装置，如XLR、PowerCon等' },

  // 灯具类型 (Fixture Types)
  { id: 'par', en: 'PAR', zh: 'Par灯', category: 'fixture', definition: '抛物面反光碗灯具，常用于染色照明' },
  { id: 'fresnel', en: 'Fresnel', zh: '菲涅尔灯', category: 'fixture', definition: '使用菲涅尔透镜的聚光灯具，光斑均匀柔和' },
  { id: 'profile', en: 'Profile', zh: '轮廓灯', category: 'fixture', definition: '使用图案片和挡光板的精细成像灯具' },
  { id: 'ellipsoidal', en: 'Ellipsoidal', zh: '椭球灯', category: 'fixture', definition: '美国对Profile的称呼，ETC等品牌常用' },
  { id: 'moving-head', en: 'Moving Head', zh: '摇头灯', category: 'fixture', definition: '可水平/垂直旋转的智能灯具' },
  { id: 'led', en: 'LED Fixture', zh: 'LED灯具', category: 'fixture', definition: '使用LED作为光源的灯具，功耗低寿命长' },
  { id: 'spotlight', en: 'Spotlight', zh: '聚光灯', category: 'fixture', definition: '产生集中光束的灯具，可调角度' },
  { id: 'floodlight', en: 'Floodlight', zh: '泛光灯', category: 'fixture', definition: '产生大面积均匀照明的灯具' },
  { id: 'followspot', en: 'Followspot', zh: '追光灯', category: 'fixture', definition: '手动或自动跟踪演员的聚光灯具' },
  { id: 'laser', en: 'Laser', zh: '激光灯', category: 'fixture', definition: '产生高能量相干光束的灯具' },
  { id: 'strobe-light', en: 'Strobe Light', zh: '频闪灯', category: 'fixture', definition: '专门产生频闪效果的灯具' },
  { id: 'cyc-light', en: 'Cyc Light', zh: '天幕灯', category: 'fixture', definition: '专门用于照明天幕背景的泛光灯具' },
  { id: 'borderlight', en: 'Borderlight', zh: '顶排灯', category: 'fixture', definition: '多灯泡横向排列的顶光灯具' },
  { id: 'batten', en: 'Batten', zh: '灯排', category: 'fixture', definition: '一排小型泛光灯组成的灯具' },
  { id: 'strip-light', en: 'Strip Light', zh: '条形灯', category: 'fixture', definition: '细长条形的多灯泡灯具' },
  { id: 'pixol', en: 'Pixol', zh: '像素条', category: 'fixture', definition: '可独立控制每个像素段的LED条形灯具' },
  { id: 'blinder', en: 'Blinder', zh: '观众席灯', category: 'fixture', definition: '面向观众席的强烈泛光灯具' },
  { id: 'clight', en: 'C Light', zh: '色光', category: 'fixture', definition: '色纸配合灯具产生的彩色灯光' },
  { id: 'actinic', en: 'Actinic', zh: '紫外灯', category: 'fixture', definition: '产生紫外线的灯具，用于特殊效果' },

  // 控台操作 (Console Operations)
  { id: 'cue', en: 'Cue', zh: '场/Cue', category: 'console', definition: '存储灯光状态的记忆单元' },
  { id: 'group', en: 'Group', zh: '组', category: 'console', definition: '将多个灯具编组的预设' },
  { id: 'palette', en: 'Palette', zh: '调色板', category: 'console', definition: '存储常用参数值的预设，如颜色组、位置组' },
  { id: 'preset', en: 'Preset', zh: '预设', category: 'console', definition: '预先存储的参数配置' },
  { id: 'effect', en: 'Effect', zh: '效果', category: 'console', definition: '灯光动态变化程序，如脉冲、彩虹等' },
  { id: 'chase', en: 'Chase', zh: '追逐', category: 'console', definition: '按顺序循环触发的灯位序列' },
  { id: 'sequence', en: 'Sequence', zh: '序列', category: 'console', definition: '按顺序播放的Cue列表' },
  { id: 'executor', en: 'Executor', zh: '执行器', category: 'console', definition: '控台上触发Cue的物理或虚拟推子/按钮' },
  { id: 'fader', en: 'Fader', zh: '推子', category: 'console', definition: '控台上的滑杆控制器' },
  { id: 'button', en: 'Button', zh: '按键', category: 'console', definition: '控台上的控制按钮' },
  { id: 'submaster', en: 'Submaster', zh: '辅助推子', category: 'console', definition: '控制一组通道输出的辅助推子' },
  { id: 'master', en: 'Master', zh: '主推', category: 'console', definition: '总控所有亮度的推子' },
  { id: 'blackout', en: 'Blackout', zh: '黑场', category: 'console', definition: '关闭所有灯光的命令或按钮' },
  { id: 'flash', en: 'Flash', zh: '闪切', category: 'console', definition: '瞬间触发指定通道到全亮' },
  { id: 'solo', en: 'Solo', zh: '独奏', category: 'console', definition: '只显示选中的灯具' },
  { id: 'highlight', en: 'Highlight', zh: '高亮', category: 'console', definition: '临时提升选中灯具亮度以便识别' },
  { id: 'record', en: 'Record', zh: '记录', category: 'console', definition: '将当前状态保存为Cue的操作' },
  { id: 'update', en: 'Update', zh: '更新', category: 'console', definition: '修改已存在的Cue' },
  { id: 'copy', en: 'Copy', zh: '复制', category: 'console', definition: '复制Cue或参数到新位置' },
  { id: 'delete', en: 'Delete', zh: '删除', category: 'console', definition: '删除Cue或预设' },

  // 信号协议 (Signal Protocols)
  { id: 'dmx', en: 'DMX512', zh: 'DMX512', category: 'protocol', definition: '数字多路传输协议，舞台灯光行业标准' },
  { id: 'artnet', en: 'Art-Net', zh: 'Art-Net', category: 'protocol', definition: '基于以太网的DMX传输协议' },
  { id: 'sacn', en: 'sACN', zh: 'sACN', category: 'protocol', definition: '流式ACN，以太网DMX传输标准协议' },
  { id: 'rdm', en: 'RDM', zh: 'RDM', category: 'protocol', definition: '远程设备管理，DMX的双向扩展协议' },
  { id: 'klingnet', en: 'Kling-Net', zh: 'Kling-Net', category: 'protocol', definition: '专门用于LED视频屏控制的协议' },
  { id: 'opendmx', en: 'OpenDMX', zh: 'OpenDMX', category: 'protocol', definition: 'USB转DMX接口的开放标准' },
  { id: 'enttec', en: 'ENTTEC', zh: 'ENTTEC', category: 'protocol', definition: '知名的DMX设备品牌和协议' },
  { id: 'universe', en: 'Universe', zh: 'Universe', category: 'protocol', definition: 'DMX512的一个完整512通道组' },
  { id: 'address', en: 'DMX Address', zh: 'DMX地址', category: 'protocol', definition: '灯具在DMX链路中的起始通道号' },
  { id: 'patch', en: 'Patch', zh: '配接', category: 'protocol', definition: '将控台通道映射到实际DMX地址' },
  { id: 'network', en: 'Network', zh: '网络', category: 'protocol', definition: '连接控台和灯具的数据通信系统' },
  { id: 'node', en: 'Node', zh: '节点', category: 'protocol', definition: '网络协议转换设备，如DMX节点' },
  { id: 'splitter', en: 'Splitter', zh: '分配器', category: 'protocol', definition: '将一路DMX信号分成多路的设备' },
  { id: 'repeater', en: 'Repeater', zh: '中继器', category: 'protocol', definition: '延长DMX信号传输距离的设备' },
  { id: 'terminator', en: 'Terminator', zh: '终端电阻', category: 'protocol', definition: 'DMX链路末端的120Ω电阻，防止信号反射' },

  // 舞台术语 (Stage Terms)
  { id: 'front-light', en: 'Front Light', zh: '面光', category: 'stage', definition: '位于观众前方投向舞台的基础照明' },
  { id: 'back-light', en: 'Back Light', zh: '逆光', category: 'stage', definition: '位于演员后方的轮廓光' },
  { id: 'side-light', en: 'Side Light', zh: '侧光', category: 'stage', definition: '位于舞台两侧的立体照明' },
  { id: 'top-light', en: 'Top Light', zh: '顶光', category: 'stage', definition: '从舞台顶部垂直照射的光' },
  { id: 'downlight', en: 'Downlight', zh: '下排光', category: 'stage', definition: '从舞台下方向上照射的光' },
  { id: 'footlight', en: 'Footlight', zh: '脚光', category: 'stage', definition: '位于舞台前缘的低位泛光' },
  { id: 'cyc', en: 'Cyc', zh: '天幕', category: 'stage', definition: '舞台后方的背景幕布' },
  { id: 'backdrop', en: 'Backdrop', zh: '背景幕', category: 'stage', definition: '舞台后方用于投影或染色的幕布' },
  { id: 'battens', en: 'Battens', zh: '灯杆', category: 'stage', definition: '悬挂灯具的横向杆件' },
  { id: 'pipes', en: 'Pipes', zh: '灯桥', category: 'stage', definition: '固定安装灯具的结构横梁' },
  { id: 'truss', en: 'Truss', zh: '桁架', category: 'stage', definition: '用于悬挂灯具的金属框架结构' },
  { id: 'fly', en: 'Fly', zh: '吊挂', category: 'stage', definition: '将灯具提升或降低的操作' },
  { id: 'rigging', en: 'Rigging', zh: '吊挂系统', category: 'stage', definition: '用于悬挂设备的全部索具' },
  { id: 'boom', en: 'Boom', zh: '灯架', category: 'stage', definition: '垂直站立的可移动灯架' },
  { id: 'ladder', en: 'Ladder', zh: '梯形灯架', category: 'stage', definition: '用于侧面挂灯的梯形架子' },
  { id: 'tormentor', en: 'Tormentor', zh: '侧幕架', category: 'stage', definition: '舞台两侧用于分割区域的结构' },
  { id: 'portal', en: 'Portal', zh: '入口', category: 'stage', definition: '舞台侧面的入口或通道' },
  { id: 'wing', en: 'Wing', zh: '侧台', category: 'stage', definition: '舞台两侧的隐藏区域' },
  { id: 'apron', en: 'Apron', zh: '伸出舞台', category: 'stage', definition: '舞台面向观众延伸的部分' },
  { id: 'flies', en: 'Flies', zh: '天桥', category: 'stage', definition: '舞台上方的悬挂设备区域' },
  { id: 'grid', en: 'Grid', zh: '栅顶', category: 'stage', definition: '舞台上方用于悬挂的网格结构' },
  { id: 'load-in', en: 'Load-In', zh: '装台', category: 'stage', definition: '将设备运入并安装到舞台的过程' },
  { id: 'load-out', en: 'Load-Out', zh: '拆台', category: '演出后将设备撤离舞台的过程' },
  { id: 'focus', en: 'Focus', zh: '对光', category: 'stage', definition: '调整灯具位置和焦点的过程' },
  { id: 'light-plot', en: 'Light Plot', zh: '灯位图', category: 'stage', definition: '显示所有灯具位置的图纸' },
  { id: 'channel-hookup', en: 'Channel Hookup', zh: '通道表', category: 'stage', definition: '显示每个DMX通道对应灯具的文档' },
  { id: 'instrument-schedule', en: 'Instrument Schedule', zh: '设备清单', category: 'stage', definition: '列出所有灯具和配件的清单' },
];

const categoryTabs = [
  { label: '全部', value: 'all' },
  { label: '基础术语', value: 'basic' },
  { label: '灯具类型', value: 'fixture' },
  { label: '控台操作', value: 'console' },
  { label: '信号协议', value: 'protocol' },
  { label: '舞台术语', value: 'stage' },
];

const categoryColors: Record<string, string> = {
  basic: '#38bdf8',
  fixture: '#a78bfa',
  console: '#4ade80',
  protocol: '#fbbf24',
  stage: '#f472b6',
};

const categoryLabels: Record<string, string> = {
  basic: '基础',
  fixture: '灯具',
  console: '控台',
  protocol: '协议',
  stage: '舞台',
};

export default function GlossaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const currentCategory = categoryTabs[activeTab].value;

  const filteredTerms = useMemo(() => {
    let terms = glossaryTerms;

    // Filter by category
    if (currentCategory !== 'all') {
      terms = terms.filter((term) => term.category === currentCategory);
    }

    // Filter by favorites
    if (showFavoritesOnly) {
      terms = terms.filter((term) => favorites.has(term.id));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      terms = terms.filter(
        (term) =>
          term.en.toLowerCase().includes(query) ||
          term.zh.includes(query) ||
          (term.definition && term.definition.toLowerCase().includes(query))
      );
    }

    return terms;
  }, [currentCategory, searchQuery, favorites, showFavoritesOnly]);

  const toggleFavorite = (termId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(termId)) {
        newSet.delete(termId);
      } else {
        newSet.add(termId);
      }
      return newSet;
    });
  };

  const handleTabChange = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(index);
  };

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = { all: glossaryTerms.length };
    glossaryTerms.forEach((term) => {
      stats[term.category] = (stats[term.category] || 0) + 1;
    });
    return stats;
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <PageHeader
          title="术语翻译"
          subtitle="灯光行业专业术语"
          showTopSafeArea={false}
        />
      </View>

      <View style={styles.searchSection}>
        <GlassInput
          placeholder="搜索术语（中/英文）"
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, showFavoritesOnly && styles.filterChipActive]}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowFavoritesOnly(!showFavoritesOnly);
            }}
          >
            <Ionicons
              name={showFavoritesOnly ? 'star' : 'star-outline'}
              size={16}
              color={showFavoritesOnly ? Colors.warning : Colors.textSecondary}
            />
            <Text style={[styles.filterChipText, showFavoritesOnly && styles.filterChipTextActive]}>
              我的收藏 ({favorites.size})
            </Text>
          </TouchableOpacity>
          {!showFavoritesOnly && (
            <Text style={styles.statsText}>
              共 {categoryStats[currentCategory] || 0} 条术语
            </Text>
          )}
        </View>
      </View>

      <View style={styles.tabContainer}>
        <GlassTabGroup
          tabs={categoryTabs}
          activeIndex={activeTab}
          onChange={handleTabChange}
        />
      </View>

      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>
          {showFavoritesOnly
            ? `收藏 · ${filteredTerms.length} 条`
            : searchQuery
            ? `搜索 "${searchQuery}" · ${filteredTerms.length} 条`
            : `${categoryTabs[activeTab].label} · ${filteredTerms.length} 条`}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredTerms.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Ionicons
              name={showFavoritesOnly ? 'star-outline' : 'search'}
              size={48}
              color={Colors.textMuted}
            />
            <Text style={styles.emptyText}>
              {showFavoritesOnly ? '暂无收藏术语' : '未找到匹配术语'}
            </Text>
            <Text style={styles.emptyHint}>
              {showFavoritesOnly
                ? '点击术语旁的星标添加收藏'
                : '尝试其他关键词或切换分类'}
            </Text>
          </GlassCard>
        ) : (
          filteredTerms.map((term) => (
            <GlassCard key={term.id} style={styles.termCard}>
              <View style={styles.termHeader}>
                <View style={styles.termTitles}>
                  <Text style={styles.termEn}>{term.en}</Text>
                  <Text style={styles.termZh}>{term.zh}</Text>
                </View>
                <TouchableOpacity
                  style={styles.favoriteButton}
                  onPress={() => toggleFavorite(term.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={favorites.has(term.id) ? 'star' : 'star-outline'}
                    size={22}
                    color={favorites.has(term.id) ? Colors.warning : Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              <View style={[styles.categoryBadge, { backgroundColor: categoryColors[term.category] + '20' }]}>
                <Text style={[styles.categoryBadgeText, { color: categoryColors[term.category] }]}>
                  {categoryLabels[term.category]}
                </Text>
              </View>
              {term.definition && (
                <Text style={styles.definition}>{term.definition}</Text>
              )}
            </GlassCard>
          ))
        )}
        <View style={styles.bottomPadding} />
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
  searchSection: {
    paddingHorizontal: 16,
    marginTop: -4,
  },
  searchInput: {
    marginTop: 0,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  filterChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: Colors.warning,
  },
  statsText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  tabContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  resultsBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  resultsText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
    fontWeight: '500',
  },
  emptyHint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  termCard: {
    marginBottom: 12,
    padding: 16,
  },
  termHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  termTitles: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 8,
  },
  termEn: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.3,
  },
  termZh: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '500',
  },
  favoriteButton: {
    padding: 4,
    marginLeft: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  definition: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 10,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 32,
  },
});
