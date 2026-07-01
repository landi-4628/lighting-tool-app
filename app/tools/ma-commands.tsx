import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, LayoutAnimation, Platform, UIManager, Share, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassTabGroup } from '@/components/ui/glass-tab-group';
import { Colors } from '@/constants/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Command category types
interface CommandExample {
  command: string;
  description: string;
  category: string;
}

interface CommandCategory {
  id: string;
  name: string;
  icon: string;
  commands: CommandExample[];
}

// MA2 Command categories
const ma2Categories: CommandCategory[] = [
  {
    id: 'basic',
    name: '基础操作',
    icon: 'cube-outline',
    commands: [
      {
        command: 'Channel 1 Thru 10 At 50',
        description: '将通道 1-10 的亮度设置为 50%',
        category: 'Channel',
      },
      {
        command: 'Fixture 1 Thru 20',
        description: '选中通道 1-20 的灯具',
        category: 'Fixture',
      },
      {
        command: 'Group 1 + Group 2',
        description: '将组 1 和组 2 的灯具合并选中',
        category: 'Group',
      },
      {
        command: 'Select Fixture 1',
        description: '选中通道 1 对应的灯具',
        category: 'Select',
      },
      {
        command: 'Select All',
        description: '选中所有灯具',
        category: 'Select',
      },
      {
        command: 'Deselect',
        description: '取消当前选中',
        category: 'Select',
      },
      {
        command: 'Channel 1 At Full',
        description: '将通道 1 调至最大 (100%)',
        category: 'Channel',
      },
      {
        command: 'Channel 1 At 0',
        description: '将通道 1 关闭 (0%)',
        category: 'Channel',
      },
    ],
  },
  {
    id: 'console',
    name: '控台命令',
    icon: 'terminal-outline',
    commands: [
      {
        command: 'Please',
        description: '确认执行当前编辑',
        category: 'Execute',
      },
      {
        command: 'Blind',
        description: '切换到盲编模式',
        category: 'Mode',
      },
      {
        command: 'Blind 1',
        description: '设置盲编显示器 1',
        category: 'Mode',
      },
      {
        command: 'Off Fixture 1',
        description: '关闭通道 1 的输出',
        category: 'Output',
      },
      {
        command: 'Off',
        description: '关闭选中的灯具',
        category: 'Output',
      },
      {
        command: 'Clear',
        description: '清除当前编程区',
        category: 'Programming',
      },
      {
        command: 'Update',
        description: '更新当前 Cue',
        category: 'Programming',
      },
      {
        command: 'Learn',
        description: '学习当前值到 Cue',
        category: 'Programming',
      },
    ],
  },
  {
    id: 'cue',
    name: 'Cue 操作',
    icon: 'play-outline',
    commands: [
      {
        command: 'Store Cue 1',
        description: '存储当前编程为 Cue 1',
        category: 'Store',
      },
      {
        command: 'Store Cue 1.1',
        description: '存储到 Cue 1 的子页面',
        category: 'Store',
      },
      {
        command: 'Go+ Cue 1',
        description: '执行 Cue 1 并前进',
        category: 'Go',
      },
      {
        command: 'Go- Cue 1',
        description: '执行 Cue 1 并后退',
        category: 'Go',
      },
      {
        command: 'Go Cue 1',
        description: '跳转到 Cue 1',
        category: 'Go',
      },
      {
        command: 'Goto Cue 1',
        description: '跳转到 Cue 1 (完整写法)',
        category: 'Go',
      },
      {
        command: 'Pause Cue 1',
        description: '暂停 Cue 1 执行',
        category: 'Pause',
      },
      {
        command: 'Delete Cue 1',
        description: '删除 Cue 1',
        category: 'Delete',
      },
    ],
  },
  {
    id: 'sequence',
    name: '序列操作',
    icon: 'list-outline',
    commands: [
      {
        command: 'Store Sequence 1',
        description: '存储为序列 1',
        category: 'Store',
      },
      {
        command: 'Sequence 1 Go',
        description: '执行序列 1',
        category: 'Go',
      },
      {
        command: 'Sequence 1 Time 5',
        description: '设置序列 1 的默认时间为 5 秒',
        category: 'Time',
      },
      {
        command: 'Sequence 1 Off',
        description: '关闭序列 1 中所有 Cue 的输出',
        category: 'Off',
      },
      {
        command: 'Remove Sequence 1',
        description: '移除序列 1',
        category: 'Remove',
      },
    ],
  },
  {
    id: 'executor',
    name: 'Executor',
    icon: 'grid-outline',
    commands: [
      {
        command: 'Store Executor 1',
        description: '存储到 Executor 1',
        category: 'Store',
      },
      {
        command: 'Assign Executor 1 = Sequence 1',
        description: '将序列 1 分配到 Executor 1',
        category: 'Assign',
      },
      {
        command: 'Go Executor 1',
        description: '执行 Executor 1',
        category: 'Go',
      },
      {
        command: 'Off Executor 1',
        description: '关闭 Executor 1',
        category: 'Off',
      },
      {
        command: 'Off Executor 1 Thru 6',
        description: '关闭 Executor 1-6',
        category: 'Off',
      },
    ],
  },
  {
    id: 'macro',
    name: '宏语法',
    icon: 'code-slash-outline',
    commands: [
      {
        command: 'If Condition Then',
        description: '条件语句 - 如果条件成立则执行',
        category: 'Logic',
      },
      {
        command: 'Else',
        description: '条件语句 - 否则执行',
        category: 'Logic',
      },
      {
        command: 'End',
        description: '结束条件/循环语句',
        category: 'Logic',
      },
      {
        command: 'Loop "Label"',
        description: '循环标签定义',
        category: 'Loop',
      },
      {
        command: 'Macro',
        description: '开始宏定义',
        category: 'Macro',
      },
      {
        command: 'Macro "MyMacro"',
        description: '执行名为 MyMacro 的宏',
        category: 'Macro',
      },
    ],
  },
  {
    id: 'preset',
    name: 'Preset',
    icon: 'albums-outline',
    commands: [
      {
        command: 'Store Preset 1',
        description: '存储为 Preset 1',
        category: 'Store',
      },
      {
        command: 'Preset 1',
        description: '调用 Preset 1',
        category: 'Call',
      },
      {
        command: 'Preset 1.1 Thru 1.5',
        description: '调用 Preset 1 的通道 1-5',
        category: 'Call',
      },
      {
        command: 'Delete Preset 1',
        description: '删除 Preset 1',
        category: 'Delete',
      },
    ],
  },
  {
    id: 'network',
    name: '网络/同步',
    icon: 'sync-outline',
    commands: [
      {
        command: 'Sync',
        description: '同步控台数据',
        category: 'Sync',
      },
      {
        command: 'Backup On',
        description: '启用备份模式',
        category: 'Backup',
      },
      {
        command: 'Backup Off',
        description: '关闭备份模式',
        category: 'Backup',
      },
      {
        command: 'Merge',
        description: '合并外部数据',
        category: 'Merge',
      },
    ],
  },
];

// MA3 Compatibility notes
const ma3Notes = [
  {
    title: '语法保持兼容',
    content: 'MA3 的命令行语法与 MA2 高度兼容，大部分 MA2 命令可直接在 MA3 上使用。',
    icon: 'checkmark-circle-outline',
  },
  {
    title: '新增关键字',
    content: 'MA3 新增了一些关键字，如 "Edit", "Copy", "Move" 等提供更直观的操作方式。',
    icon: 'add-circle-outline',
  },
  {
    title: 'World 功能增强',
    content: 'MA3 的 World 功能更加强大，可创建更复杂的分组结构。',
    icon: 'globe-outline',
  },
  {
    title: 'UI 界面变化',
    content: 'MA3 采用了全新的 UI 设计，但命令行功能保持一致。',
    icon: 'laptop-outline',
  },
  {
    title: '性能提升',
    content: 'MA3 处理器性能大幅提升，支持更多灯具和更复杂的编程。',
    icon: 'speedometer-outline',
  },
  {
    title: '网络协议增强',
    content: 'MA3 支持 sACN、Art-Net 4 和更多网络协议。',
    icon: 'wifi-outline',
  },
];

// Quick reference data
const quickReference = [
  {
    category: '通道操作',
    items: [
      { keyword: 'Channel', desc: '选择通道' },
      { keyword: 'Fixture', desc: '选择灯具' },
      { keyword: 'Group', desc: '选择组' },
      { keyword: 'At', desc: '设置值' },
      { keyword: 'Thru', desc: '范围' },
      { keyword: '+', desc: '加' },
      { keyword: '-', desc: '减' },
    ],
  },
  {
    category: '数值快捷',
    items: [
      { keyword: 'Full', desc: '100%' },
      { keyword: 'Flash', desc: '闪光' },
      { keyword: 'Min', desc: '最小值' },
      { keyword: 'Max', desc: '最大值' },
      { keyword: '+', desc: '增加' },
      { keyword: '-', desc: '减少' },
    ],
  },
  {
    category: '存储操作',
    items: [
      { keyword: 'Store', desc: '存储' },
      { keyword: 'Delete', desc: '删除' },
      { keyword: 'Copy', desc: '复制' },
      { keyword: 'Move', desc: '移动' },
      { keyword: 'Rename', desc: '重命名' },
    ],
  },
  {
    category: '执行控制',
    items: [
      { keyword: 'Go', desc: '执行' },
      { keyword: 'Go+', desc: '前进执行' },
      { keyword: 'Go-', desc: '后退执行' },
      { keyword: 'Pause', desc: '暂停' },
      { keyword: 'Off', desc: '关闭' },
      { keyword: 'On', desc: '打开' },
    ],
  },
  {
    category: '编程辅助',
    items: [
      { keyword: 'Please', desc: '确认' },
      { keyword: 'Blind', desc: '盲编模式' },
      { keyword: 'Clear', desc: '清除' },
      { keyword: 'Update', desc: '更新' },
      { keyword: 'Learn', desc: '学习' },
    ],
  },
];

export default function MaCommandsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);
  const [expandedCommand, setExpandedCommand] = useState<string | null>(null);

  const tabs = [
    { label: '命令速查', value: 'quick' },
    { label: 'MA2 语法', value: 'ma2' },
    { label: 'MA3 兼容', value: 'ma3' },
    { label: '分类目录', value: 'category' },
  ];

  const currentMa2Category = ma2Categories[activeCategory];

  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) {
      return currentMa2Category.commands;
    }
    const query = searchQuery.toLowerCase();
    return currentMa2Category.commands.filter(
      (cmd) =>
        cmd.command.toLowerCase().includes(query) ||
        cmd.description.toLowerCase().includes(query) ||
        cmd.category.toLowerCase().includes(query)
    );
  }, [searchQuery, currentMa2Category.commands]);

  const handleCommandPress = (command: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCommand(expandedCommand === command ? null : command);
  };

  const handleCopyCommand = async (command: string) => {
    try {
      await Share.share({
        message: command,
        title: 'MA Command',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleExportAll = async () => {
    let content = 'MA2/MA3 灯光控制命令速查\n';
    content += '================================\n\n';

    for (const category of ma2Categories) {
      content += `[${category.name}]\n`;
      for (const cmd of category.commands) {
        content += `${cmd.command}\n`;
        content += `  说明: ${cmd.description}\n`;
      }
      content += '\n';
    }

    try {
      await Share.share({
        message: content,
        title: 'MA Commands Export',
      });
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>MA 宏命令</Text>
          <Text style={styles.subtitle}>grandMA2/MA3 命令速查</Text>
        </View>
        <TouchableOpacity onPress={handleExportAll} style={styles.exportButton}>
          <Ionicons name="share-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <GlassTabGroup
          tabs={tabs}
          activeIndex={activeTab}
          onChange={setActiveTab}
          style={styles.tabGroup}
        />

        {activeTab === 0 && (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>快捷命令</Text>
              <Text style={styles.sectionDescription}>
                最常用的 MA 命令，点击复制
              </Text>

              <View style={styles.quickCommandsGrid}>
                {[
                  { cmd: 'Channel 1 Thru 10 At 50', desc: '通道 1-10 设置 50%' },
                  { cmd: 'Fixture 1 Thru 20 Color 1', desc: '灯具 1-20 颜色 1' },
                  { cmd: 'Group 1 + Group 2', desc: '组 1 + 组 2' },
                  { cmd: 'Select Fixture 1', desc: '选中灯具 1' },
                  { cmd: 'Store Cue 1', desc: '存储 Cue 1' },
                  { cmd: 'Go+ Cue 1', desc: '执行 Cue 1 前进' },
                  { cmd: 'Please', desc: '确认执行' },
                  { cmd: 'Blind', desc: '盲编模式' },
                  { cmd: 'Off Fixture 1', desc: '关闭通道 1' },
                ].map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickCommandItem}
                    onPress={() => handleCopyCommand(item.cmd)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.quickCommandContent}>
                      <Text style={styles.quickCommandText} numberOfLines={1}>
                        {item.cmd}
                      </Text>
                      <Text style={styles.quickCommandDesc}>{item.desc}</Text>
                    </View>
                    <Ionicons name="copy-outline" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>常用操作符</Text>

              <View style={styles.operatorGrid}>
                {[
                  { op: 'Thru', desc: '范围: 1 Thru 10' },
                  { op: 'Plus / +', desc: '加: Group 1 + Group 2' },
                  { op: 'Minus / -', desc: '减: Channel 5 - 1' },
                  { op: 'And / &', desc: '与: Channel 1 And 5' },
                  { op: 'At / @', desc: '赋值: Channel 1 At 50' },
                  { op: 'If / Then', desc: '条件: If condition Then' },
                ].map((item, index) => (
                  <View key={index} style={styles.operatorItem}>
                    <Text style={styles.operatorSymbol}>{item.op}</Text>
                    <Text style={styles.operatorDesc}>{item.desc}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>示例场景</Text>

              {[
                {
                  title: '基础调光',
                  commands: ['Channel 1 Thru 10 At 50', 'Channel 1 At Full'],
                },
                {
                  title: '灯具控制',
                  commands: ['Select Fixture 1', 'Fixture 1 Thru 10 Color 1'],
                },
                {
                  title: 'Cue 操作',
                  commands: ['Store Cue 1', 'Go+ Cue 1', 'Go- Cue 1'],
                },
                {
                  title: '组合操作',
                  commands: ['Group 1 + Group 2', 'At 75'],
                },
              ].map((scene, index) => (
                <View key={index} style={styles.sceneItem}>
                  <Text style={styles.sceneTitle}>{scene.title}</Text>
                  <View style={styles.sceneCommands}>
                    {scene.commands.map((cmd, cmdIndex) => (
                      <TouchableOpacity
                        key={cmdIndex}
                        style={styles.sceneCommandChip}
                        onPress={() => handleCopyCommand(cmd)}
                      >
                        <Text style={styles.sceneCommandText}>{cmd}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </GlassCard>
          </ScrollView>
        )}

        {activeTab === 1 && (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.searchContainer}>
              <GlassInput
                placeholder="搜索命令..."
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
              {ma2Categories.map((cat, index) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryTab,
                    activeCategory === index && styles.categoryTabActive,
                  ]}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setActiveCategory(index);
                    setSearchQuery('');
                    setExpandedCommand(null);
                  }}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={16}
                    color={activeCategory === index ? Colors.primary : Colors.textSecondary}
                    style={styles.categoryIcon}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      activeCategory === index && styles.categoryTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.commandListHeader}>
              <Text style={styles.commandListTitle}>
                {currentMa2Category.name} · {filteredCommands.length} 条
              </Text>
            </View>

            {filteredCommands.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <Ionicons name="search" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyText}>未找到匹配命令</Text>
              </GlassCard>
            ) : (
              filteredCommands.map((cmd, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.85}
                  onPress={() => handleCommandPress(cmd.command)}
                >
                  <GlassCard
                    style={[
                      styles.commandCard,
                      expandedCommand === cmd.command && styles.commandCardExpanded,
                    ]}
                  >
                    <View style={styles.commandHeader}>
                      <View style={styles.commandBadge}>
                        <Text style={styles.commandBadgeText}>{cmd.category}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.copyButton}
                        onPress={() => handleCopyCommand(cmd.command)}
                      >
                        <Ionicons name="copy-outline" size={18} color={Colors.primary} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.commandText}>{cmd.command}</Text>
                    <Text style={styles.commandDescription}>{cmd.description}</Text>

                    {expandedCommand === cmd.command && (
                      <View style={styles.expandedContent}>
                        <View style={styles.divider} />
                        <View style={styles.expandedActions}>
                          <GlassButton
                            onPress={() => handleCopyCommand(cmd.command)}
                            style={styles.actionButton}
                          >
                            复制命令
                          </GlassButton>
                        </View>
                      </View>
                    )}
                  </GlassCard>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}

        {activeTab === 2 && (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>MA3 新特性</Text>
              <Text style={styles.sectionDescription}>
                MA3 相比 MA2 的主要改进和新增功能
              </Text>

              {ma3Notes.map((note, index) => (
                <View key={index} style={styles.noteItem}>
                  <View style={styles.noteIconContainer}>
                    <Ionicons
                      name={note.icon as any}
                      size={20}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={styles.noteContent}>
                    <Text style={styles.noteTitle}>{note.title}</Text>
                    <Text style={styles.noteText}>{note.content}</Text>
                  </View>
                </View>
              ))}
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>语法差异</Text>

              <View style={styles.diffTable}>
                <View style={styles.diffHeader}>
                  <Text style={[styles.diffHeaderCell, styles.diffCol1]}>MA2</Text>
                  <Text style={[styles.diffHeaderCell, styles.diffCol2]}>MA3</Text>
                </View>
                {[
                  { ma2: 'Please', ma3: 'Please / Enter' },
                  { ma2: 'Delete', ma3: 'Delete / Remove' },
                  { ma2: 'Goto', ma3: 'Goto / Go' },
                  { ma2: 'Assign', ma3: 'Assign / Link' },
                ].map((diff, index) => (
                  <View key={index} style={styles.diffRow}>
                    <Text style={[styles.diffCell, styles.diffCol1]}>{diff.ma2}</Text>
                    <Text style={styles.diffArrow}>→</Text>
                    <Text style={[styles.diffCell, styles.diffCol2]}>{diff.ma3}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>注意事项</Text>

              <View style={styles.tipList}>
                {[
                  'MA3 的 World 功能更强大，支持嵌套结构',
                  '建议在实际控台上测试命令兼容性',
                  'MA3 支持更多快捷键和触控操作',
                  '网络协议升级到 Art-Net 4',
                ].map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          </ScrollView>
        )}

        {activeTab === 3 && (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>命令分类目录</Text>
              <Text style={styles.sectionDescription}>
                按功能分类的完整命令列表
              </Text>

              {quickReference.map((category, catIndex) => (
                <View key={catIndex} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryTitle}>{category.category}</Text>
                    <Text style={styles.categoryCount}>{category.items.length} 项</Text>
                  </View>

                  <View style={styles.keywordGrid}>
                    {category.items.map((item, itemIndex) => (
                      <TouchableOpacity
                        key={itemIndex}
                        style={styles.keywordItem}
                        onPress={() => handleCopyCommand(item.keyword)}
                      >
                        <Text style={styles.keywordText}>{item.keyword}</Text>
                        <Text style={styles.keywordDesc}>{item.desc}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {catIndex < quickReference.length - 1 && (
                    <View style={styles.categoryDivider} />
                  )}
                </View>
              ))}
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>运算符速查</Text>

              <View style={styles.operatorTable}>
                <View style={styles.operatorTableHeader}>
                  <Text style={[styles.operatorTableCell, styles.opCol1]}>运算符</Text>
                  <Text style={[styles.operatorTableCell, styles.opCol2]}>说明</Text>
                  <Text style={[styles.operatorTableCell, styles.opCol3]}>示例</Text>
                </View>
                {[
                  { op: 'Thru / -', desc: '范围', example: '1 Thru 10' },
                  { op: 'Plus / +', desc: '并集', example: 'Group 1 + 2' },
                  { op: 'Minus / -', desc: '差集', example: 'Channel 1 - 5' },
                  { op: 'And / &', desc: '交集', example: 'Ch 1 And 3' },
                  { op: 'At / @', desc: '赋值', example: 'At 50' },
                  { op: 'Thru', desc: '连续', example: '1 Thru 20' },
                ].map((row, index) => (
                  <View key={index} style={styles.operatorTableRow}>
                    <Text style={[styles.operatorTableText, styles.opCol1]}>{row.op}</Text>
                    <Text style={[styles.operatorTableText, styles.opCol2]}>{row.desc}</Text>
                    <Text style={[styles.operatorTableText, styles.opCol3]}>{row.example}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>数值快捷键</Text>

              <View style={styles.shortcutGrid}>
                {[
                  { key: 'Full', value: '100%' },
                  { key: 'Half', value: '50%' },
                  { key: 'Min', value: '0%' },
                  { key: 'Flash', value: '闪光' },
                  { key: 'Flash On', value: '闪光保持' },
                  { key: 'Locate', value: '定位' },
                ].map((shortcut, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.shortcutItem}
                    onPress={() => handleCopyCommand(shortcut.key)}
                  >
                    <Text style={styles.shortcutKey}>{shortcut.key}</Text>
                    <Text style={styles.shortcutValue}>{shortcut.value}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassCard>
          </ScrollView>
        )}
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
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
    marginRight: -4,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  exportButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tabGroup: {
    marginBottom: 12,
  },
  scrollView: {
    flex: 1,
    marginTop: 8,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  quickCommandsGrid: {
    gap: 8,
  },
  quickCommandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickCommandContent: {
    flex: 1,
  },
  quickCommandText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: Colors.primary,
    fontWeight: '500',
  },
  quickCommandDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  operatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  operatorItem: {
    width: '48%',
    backgroundColor: Colors.glass,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  operatorSymbol: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  operatorDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sceneItem: {
    marginBottom: 16,
  },
  sceneTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  sceneCommands: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sceneCommandChip: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  sceneCommandText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: Colors.primary,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    marginTop: 0,
  },
  categoryScroll: {
    maxHeight: 48,
    marginBottom: 8,
  },
  categoryContent: {
    paddingRight: 16,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  categoryTabActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(125, 211, 252, 0.3)',
  },
  categoryIcon: {
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
  commandListHeader: {
    marginBottom: 12,
  },
  commandListTitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  commandCard: {
    marginBottom: 10,
  },
  commandCardExpanded: {
    backgroundColor: Colors.glassRaised,
  },
  commandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commandBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  commandBadgeText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
  copyButton: {
    padding: 4,
  },
  commandText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 6,
  },
  commandDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  expandedContent: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  expandedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
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
  noteItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  noteIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  diffTable: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  diffHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.glass,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  diffHeaderCell: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  diffCell: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: Colors.text,
  },
  diffArrow: {
    fontSize: 14,
    color: Colors.primary,
    marginHorizontal: 12,
  },
  diffCol1: {
    flex: 1,
  },
  diffCol2: {
    flex: 1,
  },
  tipList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  categoryCount: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  keywordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  keywordItem: {
    width: '48%',
    backgroundColor: Colors.glass,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  keywordText: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  keywordDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  categoryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: 16,
  },
  operatorTable: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  operatorTableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.glass,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  operatorTableCell: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  operatorTableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  operatorTableText: {
    fontSize: 12,
    color: Colors.text,
  },
  opCol1: {
    flex: 1,
    fontFamily: 'monospace',
  },
  opCol2: {
    flex: 1,
  },
  opCol3: {
    flex: 1.5,
    fontFamily: 'monospace',
    color: Colors.primary,
  },
  shortcutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shortcutItem: {
    width: '31%',
    backgroundColor: Colors.glass,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shortcutKey: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  shortcutValue: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
