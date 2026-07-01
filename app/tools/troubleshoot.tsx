import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassTabGroup } from '@/components/ui/glass-tab-group';
import { Colors } from '@/constants/colors';

type Symptom = 'not_lit' | 'flicker' | 'color_issue' | 'moving_issue' | 'no_control';
type Severity = 'common' | 'uncommon' | 'rare';

interface DiagnosisResult {
  cause: string;
  solution: string;
  severity: Severity;
}

interface CommonProblem {
  id: string;
  title: string;
  category: string;
  symptoms: string[];
  causes: string[];
  solutions: string[];
}

interface DMXIssue {
  id: string;
  title: string;
  type: 'address_conflict' | 'wiring' | 'signal_attenuation';
  description: string;
  symptoms: string[];
  diagnosis: string[];
  solutions: string[];
}

// Fixture diagnosis data
const diagnosisData: Record<Symptom, DiagnosisResult[]> = {
  not_lit: [
    { cause: '电源未接通或电源线损坏', solution: '检查电源线连接，确认开关已打开，使用万用表检测电源', severity: 'common' },
    { cause: '灯泡/光源损坏', solution: '更换相同规格的灯泡或LED光源模块', severity: 'common' },
    { cause: '保险丝熔断', solution: '检查并更换同规格保险丝，检查是否有短路', severity: 'common' },
    { cause: '镇流器/电源模块故障', solution: '使用万用表检测输出电压，更换故障模块', severity: 'uncommon' },
    { cause: '过热保护触发', solution: '等待灯具冷却，检查散热风扇是否工作，确保通风良好', severity: 'uncommon' },
    { cause: '控制信号中断', solution: '检查DMX信号线连接，确认控制器输出正常', severity: 'rare' },
  ],
  flicker: [
    { cause: '电源电压不稳定', solution: '使用稳压器，确保电源符合灯具要求', severity: 'common' },
    { cause: 'DMX信号线接触不良', solution: '检查并重新插紧DMX线缆，更换损坏的接头', severity: 'common' },
    { cause: '信号线过长导致衰减', solution: '减少信号线长度，增加信号放大器', severity: 'common' },
    { cause: '灯具频率与电源频率不匹配', solution: '选择与当地电网频率匹配的灯具', severity: 'uncommon' },
    { cause: '灯泡老化或接触不良', solution: '更换灯泡，清洁灯泡底座触点', severity: 'uncommon' },
    { cause: '附近有强电磁干扰', solution: '远离干扰源，使用屏蔽线缆', severity: 'rare' },
  ],
  color_issue: [
    { cause: '色片老化或损坏', solution: '更换色片，选择原厂配件', severity: 'common' },
    { cause: '混色系统故障', solution: '检查混色电机和驱动板', severity: 'common' },
    { cause: 'DMX颜色通道设置错误', solution: '检查控制台通道映射和颜色值', severity: 'common' },
    { cause: '颜料褪色或污染', solution: '清洁或更换颜料盘', severity: 'uncommon' },
    { cause: '光源色温变化', solution: '校准或更换光源模块', severity: 'rare' },
  ],
  moving_issue: [
    { cause: '电机卡住或机械受阻', solution: '手动轻推检查受阻点，清洁轨道和齿轮', severity: 'common' },
    { cause: '步进电机驱动故障', solution: '检查驱动板输出，更换故障驱动', severity: 'common' },
    { cause: '限位开关故障', solution: '检查并清洁限位开关，必要时更换', severity: 'common' },
    { cause: '皮带松动或断裂', solution: '调整皮带张力或更换新皮带', severity: 'uncommon' },
    { cause: '控制通道设置错误', solution: '检查DMX通道配置，确认运动范围设置', severity: 'uncommon' },
    { cause: '内部线缆磨损断裂', solution: '检查内部排线，修复或更换', severity: 'rare' },
  ],
  no_control: [
    { cause: 'DMX地址设置错误', solution: '重新设置正确的DMX起始地址', severity: 'common' },
    { cause: '信号线接反(正负极)', solution: '检查DMX+和DMX-接线，确保正确连接', severity: 'common' },
    { cause: '控制器输出故障', solution: '使用信号测试仪检测控制器输出', severity: 'common' },
    { cause: '信号放大器未供电', solution: '检查放大器电源连接', severity: 'uncommon' },
    { cause: '灯具DMX接收卡损坏', solution: '更换DMX接收卡或主板', severity: 'uncommon' },
    { cause: '过多灯具串联导致信号衰减', solution: '在信号链中增加放大器或信号分离器', severity: 'rare' },
  ],
};

const symptomLabels: Record<Symptom, string> = {
  not_lit: '灯具不亮',
  flicker: '灯光闪烁',
  color_issue: '颜色异常',
  moving_issue: '摇头异常',
  no_control: '无控制信号',
};

const symptomIcons: Record<Symptom, string> = {
  not_lit: 'bulb-outline',
  flicker: 'flash-outline',
  color_issue: 'color-palette-outline',
  moving_issue: 'git-compare-outline',
  no_control: 'radio-outline',
};

// Common problems database
const commonProblems: CommonProblem[] = [
  {
    id: '1',
    title: 'LED帕灯整体不亮',
    category: 'LED灯',
    symptoms: ['全部光源不亮', '部分光源暗'],
    causes: ['电源适配器故障', 'LED驱动板损坏', '光源模组老化'],
    solutions: ['检测12V/24V电源输出', '更换LED驱动板', '更换光源模组'],
  },
  {
    id: '2',
    title: '光束灯摇头不响应',
    category: '光束灯',
    symptoms: ['水平或垂直运动停止', '异响'],
    causes: ['电机损坏', '皮带断裂', '控制板故障'],
    solutions: ['更换步进电机', '更换传动皮带', '检查主板信号输出'],
  },
  {
    id: '3',
    title: 'DMX信号时断时续',
    category: '信号问题',
    symptoms: ['灯光随机闪烁', '部分灯不受控'],
    causes: ['信号线过长', '接头松动', '信号干扰'],
    solutions: ['增加信号放大器', '重新焊接所有接头', '使用屏蔽线缆'],
  },
  {
    id: '4',
    title: '换色器不转',
    category: '换色器',
    symptoms: ['颜色不变', '卡顿'],
    causes: ['电机故障', '色盘卡住', '驱动IC损坏'],
    solutions: ['手动旋转测试', '清洁色盘轨道', '更换驱动板'],
  },
  {
    id: '5',
    title: '调光不线性',
    category: '调光',
    symptoms: ['亮度跳跃', '调光范围窄'],
    causes: ['DMX曲线设置错误', '调光模块故障', '灯具温度过高'],
    solutions: ['调整控制器曲线设置', '更换调光模块', '降低环境温度'],
  },
  {
    id: '6',
    title: '频闪不同步',
    category: '频闪',
    symptoms: ['频闪与音乐不同步', '频闪速度异常'],
    causes: ['频闪模式设置错误', '信号延迟', '控制台设置问题'],
    solutions: ['检查频闪模式设置', '调整DMX通道', '同步控制器时钟'],
  },
  {
    id: '7',
    title: '图案抖动',
    category: '图案灯',
    symptoms: ['图案模糊', '持续抖动'],
    causes: ['图案轮电机故障', '图案片损坏', '聚焦系统问题'],
    solutions: ['更换图案轮电机', '更换损坏图案片', '调整聚焦镜头'],
  },
  {
    id: '8',
    title: '三合一灯颜色混合异常',
    category: '三合一灯',
    symptoms: ['颜色不纯', '混色不均匀'],
    causes: ['RGB二极管损坏', '混色程序错误', '光学系统污染'],
    solutions: ['更换损坏的二极管', '重置灯具程序', '清洁光学透镜'],
  },
];

// DMX troubleshooting database
const dmxIssues: DMXIssue[] = [
  {
    id: '1',
    title: 'DMX地址冲突',
    type: 'address_conflict',
    description: '两个或多个灯具被设置为相同的DMX起始地址，导致控制信号冲突',
    symptoms: ['两个灯具做相同动作', '一个灯具正常另一个异常', '无法单独控制'],
    diagnosis: [
      '检查所有灯具的DIP开关或电子地址设置',
      '列出所有灯具的地址分配表',
      '确认没有地址范围重叠',
    ],
    solutions: [
      '为每个灯具分配唯一的起始地址',
      '确保相邻地址的灯具不超出512通道限制',
      '使用地址冲突检测工具扫描线路',
    ],
  },
  {
    id: '2',
    title: '信号线连接问题',
    type: 'wiring',
    description: 'DMX信号线接头松动、焊点脱落或内部断路',
    symptoms: ['信号时断时续', '特定位置后所有灯失控', '仅第一盏灯正常'],
    diagnosis: [
      '检查所有XLR接头的焊点',
      '使用万用表的连续性测试检查每根导线',
      '逐一排查每个接头',
    ],
    solutions: [
      '重新焊接松动的接头',
      '更换损坏的DMX线缆',
      '使用优质的屏蔽双绞线',
      '确保信号线远离电源线',
    ],
  },
  {
    id: '3',
    title: '信号衰减',
    type: 'signal_attenuation',
    description: '信号线过长或过多灯具串联导致信号强度下降',
    symptoms: ['远处灯具响应迟缓', '颜色渐变不准确', '动作不够精确'],
    diagnosis: [
      '测量信号线总长度',
      '统计串联的灯具数量',
      '在信号链中间位置测试信号强度',
    ],
    solutions: [
      '将信号线总长度控制在300米以内',
      '每200米安装一个信号放大器',
      '使用分支器分离信号线路',
      '减少单根线串联的灯具数量',
    ],
  },
  {
    id: '4',
    title: '接地回路问题',
    type: 'wiring',
    description: '多个设备接地电位不同导致噪声干扰',
    symptoms: ['灯光无规律闪烁', '图像有条纹干扰', '控制不稳定'],
    diagnosis: [
      '检查所有设备的接地连接',
      '测量接地电位差',
      '断开可疑设备测试',
    ],
    solutions: [
      '确保所有设备共地',
      '使用隔离变压器',
      '采用光纤传输DMX信号',
      '移除信号线的屏蔽层接地',
    ],
  },
  {
    id: '5',
    title: '终端电阻缺失',
    type: 'wiring',
    description: 'DMX线路末端缺少120欧姆终端电阻导致信号反射',
    symptoms: ['最后几盏灯不稳定', '长距离传输后信号变差'],
    diagnosis: [
      '检查线路末端是否有终端电阻',
      '确认终端电阻阻值为120Ω',
    ],
    solutions: [
      '在最后一个灯具的DMX OUT接口安装120Ω终端电阻',
      '或使用带终端功能的信号分配器',
    ],
  },
];

const dmxIssueTypeLabels: Record<DMXIssue['type'], string> = {
  address_conflict: '地址冲突',
  wiring: '线路问题',
  signal_attenuation: '信号衰减',
};

const dmxIssueTypeIcons: Record<DMXIssue['type'], string> = {
  address_conflict: 'git-network-outline',
  wiring: 'cable-outline',
  signal_attenuation: 'pulse-outline',
};

const allProblems: Array<{ id: string; title: string; content: string; category: string }> = [
  ...commonProblems.map(p => ({
    id: p.id,
    title: p.title,
    content: `症状: ${p.symptoms.join(', ')}\n原因: ${p.causes.join(', ')}\n解决: ${p.solutions.join(', ')}`,
    category: p.category,
  })),
  ...dmxIssues.map(i => ({
    id: i.id,
    title: i.title,
    content: `症状: ${i.symptoms.join(', ')}\n诊断: ${i.diagnosis.join(', ')}\n解决: ${i.solutions.join(', ')}`,
    category: dmxIssueTypeLabels[i.type],
  })),
];

export default function TroubleshootScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSymptom, setSelectedSymptom] = useState<Symptom | null>(null);
  const [expandedProblem, setExpandedProblem] = useState<string | null>(null);
  const [expandedDMXIssue, setExpandedDMXIssue] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { label: '灯具诊断', value: 'diagnosis' },
    { label: '常见问题', value: 'common' },
    { label: 'DMX故障', value: 'dmx' },
    { label: '快速搜索', value: 'search' },
  ];

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allProblems.filter(
      p =>
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case 'common':
        return Colors.warning;
      case 'uncommon':
        return Colors.primary;
      case 'rare':
        return Colors.success;
    }
  };

  const getSeverityLabel = (severity: Severity) => {
    switch (severity) {
      case 'common':
        return '常见';
      case 'uncommon':
        return '偶发';
      case 'rare':
        return '罕见';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>故障分析</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <GlassTabGroup
          tabs={tabs}
          activeIndex={activeTab}
          onChange={setActiveTab}
        />

        {/* 灯具诊断 Tab */}
        {activeTab === 0 && (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>选择症状</Text>
              <Text style={styles.sectionSubtitle}>根据灯具表现选择对应症状，获取可能原因和解决方案</Text>
              <View style={styles.symptomGrid}>
                {(Object.keys(symptomLabels) as Symptom[]).map(symptom => (
                  <TouchableOpacity
                    key={symptom}
                    style={[
                      styles.symptomItem,
                      selectedSymptom === symptom && styles.symptomItemActive,
                    ]}
                    onPress={() => setSelectedSymptom(symptom)}
                  >
                    <Ionicons
                      name={symptomIcons[symptom] as any}
                      size={28}
                      color={selectedSymptom === symptom ? Colors.primary : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.symptomText,
                        selectedSymptom === symptom && styles.symptomTextActive,
                      ]}
                    >
                      {symptomLabels[symptom]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassCard>

            {selectedSymptom && (
              <GlassCard style={styles.card}>
                <Text style={styles.sectionTitle}>可能原因及解决方案</Text>
                <Text style={styles.selectedSymptomLabel}>
                  症状: {symptomLabels[selectedSymptom]}
                </Text>
                {diagnosisData[selectedSymptom].map((result, index) => (
                  <View key={index} style={styles.diagnosisItem}>
                    <View style={styles.diagnosisHeader}>
                      <View style={styles.diagnosisNumber}>
                        <Text style={styles.diagnosisNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.diagnosisContent}>
                        <View style={styles.severityBadge}>
                          <Text style={[styles.severityText, { color: getSeverityColor(result.severity) }]}>
                            {getSeverityLabel(result.severity)}
                          </Text>
                        </View>
                        <Text style={styles.causeText}>{result.cause}</Text>
                      </View>
                    </View>
                    <View style={styles.solutionContainer}>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                      <Text style={styles.solutionText}>{result.solution}</Text>
                    </View>
                    {index < diagnosisData[selectedSymptom].length - 1 && (
                      <View style={styles.separator} />
                    )}
                  </View>
                ))}
              </GlassCard>
            )}

            {!selectedSymptom && (
              <GlassCard style={styles.card}>
                <View style={styles.emptyState}>
                  <Ionicons name="search" size={48} color={Colors.textMuted} />
                  <Text style={styles.emptyText}>请选择上方症状开始诊断</Text>
                </View>
              </GlassCard>
            )}

            <View style={styles.bottomPadding} />
          </ScrollView>
        )}

        {/* 常见问题 Tab */}
        {activeTab === 1 && (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>常见故障及解决方案</Text>
              <Text style={styles.sectionSubtitle}>点击展开查看详细诊断步骤和解决方法</Text>
            </GlassCard>

            {commonProblems.map(problem => (
              <GlassCard key={problem.id} style={styles.card}>
                <TouchableOpacity
                  style={styles.problemHeader}
                  onPress={() => setExpandedProblem(expandedProblem === problem.id ? null : problem.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.problemInfo}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{problem.category}</Text>
                    </View>
                    <Text style={styles.problemTitle}>{problem.title}</Text>
                  </View>
                  <Ionicons
                    name={expandedProblem === problem.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>

                {expandedProblem === problem.id && (
                  <View style={styles.problemDetails}>
                    <View style={styles.detailSection}>
                      <View style={styles.detailHeader}>
                        <Ionicons name="alert-circle-outline" size={18} color={Colors.warning} />
                        <Text style={styles.detailTitle}>症状表现</Text>
                      </View>
                      {problem.symptoms.map((s, i) => (
                        <Text key={i} style={styles.detailItem}>• {s}</Text>
                      ))}
                    </View>

                    <View style={styles.detailSection}>
                      <View style={styles.detailHeader}>
                        <Ionicons name="construct-outline" size={18} color={Colors.danger} />
                        <Text style={styles.detailTitle}>可能原因</Text>
                      </View>
                      {problem.causes.map((c, i) => (
                        <Text key={i} style={styles.detailItem}>• {c}</Text>
                      ))}
                    </View>

                    <View style={styles.detailSection}>
                      <View style={styles.detailHeader}>
                        <Ionicons name="checkmark-circle-outline" size={18} color={Colors.success} />
                        <Text style={styles.detailTitle}>解决方案</Text>
                      </View>
                      {problem.solutions.map((s, i) => (
                        <Text key={i} style={styles.detailItem}>• {s}</Text>
                      ))}
                    </View>
                  </View>
                )}
              </GlassCard>
            ))}

            <View style={styles.bottomPadding} />
          </ScrollView>
        )}

        {/* DMX故障 Tab */}
        {activeTab === 2 && (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>DMX信号故障排查</Text>
              <Text style={styles.sectionSubtitle}>系统化排查DMX信号传输中的各类问题</Text>
            </GlassCard>

            {dmxIssues.map(issue => (
              <GlassCard key={issue.id} style={styles.card}>
                <TouchableOpacity
                  style={styles.problemHeader}
                  onPress={() => setExpandedDMXIssue(expandedDMXIssue === issue.id ? null : issue.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.problemInfo}>
                    <View style={styles.dmxTypeBadge}>
                      <Ionicons
                        name={dmxIssueTypeIcons[issue.type] as any}
                        size={14}
                        color={Colors.primary}
                      />
                      <Text style={styles.dmxTypeText}>{dmxIssueTypeLabels[issue.type]}</Text>
                    </View>
                    <Text style={styles.problemTitle}>{issue.title}</Text>
                  </View>
                  <Ionicons
                    name={expandedDMXIssue === issue.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>

                {expandedDMXIssue === issue.id && (
                  <View style={styles.problemDetails}>
                    <Text style={styles.issueDescription}>{issue.description}</Text>

                    <View style={styles.detailSection}>
                      <View style={styles.detailHeader}>
                        <Ionicons name="eye-outline" size={18} color={Colors.warning} />
                        <Text style={styles.detailTitle}>典型症状</Text>
                      </View>
                      {issue.symptoms.map((s, i) => (
                        <Text key={i} style={styles.detailItem}>• {s}</Text>
                      ))}
                    </View>

                    <View style={styles.detailSection}>
                      <View style={styles.detailHeader}>
                        <Ionicons name="search-outline" size={18} color={Colors.primary} />
                        <Text style={styles.detailTitle}>诊断步骤</Text>
                      </View>
                      {issue.diagnosis.map((d, i) => (
                        <Text key={i} style={styles.detailItem}>
                          <Text style={styles.stepNumber}>{i + 1}. </Text>
                          {d}
                        </Text>
                      ))}
                    </View>

                    <View style={styles.detailSection}>
                      <View style={styles.detailHeader}>
                        <Ionicons name="checkmark-circle-outline" size={18} color={Colors.success} />
                        <Text style={styles.detailTitle}>解决方案</Text>
                      </View>
                      {issue.solutions.map((s, i) => (
                        <Text key={i} style={styles.detailItem}>• {s}</Text>
                      ))}
                    </View>
                  </View>
                )}
              </GlassCard>
            ))}

            <GlassCard style={styles.card}>
              <View style={styles.tipCard}>
                <View style={styles.tipHeader}>
                  <Ionicons name="bulb" size={20} color={Colors.warning} />
                  <Text style={styles.tipTitle}>排查提示</Text>
                </View>
                <Text style={styles.tipText}>
                  建议按照以下顺序排查DMX问题: 地址设置 → 信号线连接 → 信号衰减 → 接地回路 → 终端电阻
                </Text>
              </View>
            </GlassCard>

            <View style={styles.bottomPadding} />
          </ScrollView>
        )}

        {/* 快速搜索 Tab */}
        {activeTab === 3 && (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>快速搜索</Text>
              <GlassInput
                placeholder="输入关键词搜索故障和解决方案..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                icon="search"
              />
            </GlassCard>

            {searchQuery.trim() && (
              <>
                <Text style={styles.searchResultCount}>
                  找到 {searchResults.length} 条相关结果
                </Text>

                {searchResults.map(result => (
                  <GlassCard key={result.id} style={styles.card}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{result.category}</Text>
                    </View>
                    <Text style={styles.problemTitle}>{result.title}</Text>
                    <Text style={styles.searchContent}>{result.content}</Text>
                  </GlassCard>
                ))}

                {searchResults.length === 0 && (
                  <GlassCard style={styles.card}>
                    <View style={styles.emptyState}>
                      <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
                      <Text style={styles.emptyText}>未找到匹配的结果</Text>
                      <Text style={styles.emptySubtext}>请尝试其他关键词</Text>
                    </View>
                  </GlassCard>
                )}
              </>
            )}

            {!searchQuery.trim() && (
              <GlassCard style={styles.card}>
                <Text style={styles.sectionTitle}>搜索提示</Text>
                <View style={styles.searchTips}>
                  <View style={styles.searchTipItem}>
                    <Ionicons name="bulb-outline" size={18} color={Colors.primary} />
                    <Text style={styles.searchTipText}>可搜索: 灯具名称、故障现象、解决方案关键词</Text>
                  </View>
                  <View style={styles.searchTipItem}>
                    <Ionicons name="bulb-outline" size={18} color={Colors.primary} />
                    <Text style={styles.searchTipText}>例如: "不亮"、"闪烁"、"DMX"、"地址"等</Text>
                  </View>
                </View>
              </GlassCard>
            )}

            <View style={styles.bottomPadding} />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
    marginTop: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  symptomItem: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: Colors.glass,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  symptomItemActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.borderActive,
  },
  symptomText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  symptomTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  selectedSymptomLabel: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 16,
  },
  diagnosisItem: {
    marginBottom: 12,
  },
  diagnosisHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  diagnosisNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  diagnosisNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  diagnosisContent: {
    flex: 1,
  },
  severityBadge: {
    marginBottom: 4,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  causeText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  solutionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginLeft: 36,
    backgroundColor: 'rgba(74, 222, 128, 0.08)',
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  solutionText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: 12,
    marginLeft: 36,
  },
  problemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  problemInfo: {
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  problemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  problemDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  detailItem: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 8,
    marginBottom: 6,
    lineHeight: 20,
  },
  stepNumber: {
    color: Colors.primary,
    fontWeight: '600',
  },
  dmxTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  dmxTypeText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  issueDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    backgroundColor: Colors.glass,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    lineHeight: 20,
  },
  tipCard: {
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warning,
  },
  tipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  searchResultCount: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  searchContent: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 12,
    lineHeight: 22,
  },
  searchTips: {
    gap: 12,
  },
  searchTipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  searchTipText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textMuted,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  bottomPadding: {
    height: 32,
  },
});
