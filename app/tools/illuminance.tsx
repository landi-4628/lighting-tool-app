import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from '@/components/ui/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassTabGroup } from '@/components/ui/glass-tab-group';
import { Colors } from '@/constants/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 环境光照度数据
const illuminanceData = [
  { scene: '会议室', min: 300, max: 500, icon: 'people-outline', desc: '会议、洽谈、办公' },
  { scene: '舞台表演', min: 500, max: 1500, icon: 'musical-notes-outline', desc: '演唱会、话剧、舞蹈' },
  { scene: '演播室', min: 1000, max: 2000, icon: 'videocam-outline', desc: '电视、直播、摄影棚' },
  { scene: '户外演出', min: 1000, max: 3000, icon: 'sunny-outline', desc: '音乐节、露天剧场' },
  { scene: '展览馆', min: 200, max: 500, icon: 'albums-outline', desc: '博物馆、美术馆、展厅' },
  { scene: '酒店大堂', min: 200, max: 400, icon: 'business-outline', desc: '接待、等候、休息区' },
];

// 光源色温数据
const colorTempData = [
  { name: '烛光', kelvin: 1800, icon: 'flame-outline', desc: '温馨、浪漫、私密', category: '极暖' },
  { name: '白炽灯', kelvin: 2700, icon: 'bulb-outline', desc: '温暖、舒适、传统', category: '暖色' },
  { name: '暖白', kelvin: 3000, icon: 'sunny-outline', desc: '温暖、自然、家居', category: '暖色' },
  { name: '中性光', kelvin: 4000, icon: 'contrast-outline', desc: '中性、自然、平衡', category: '中性' },
  { name: '冷白', kelvin: 5000, icon: 'flash-outline', desc: '清爽、专业、高效', category: '冷色' },
  { name: '日光', kelvin: 5600, icon: 'partly-sunny-outline', desc: '自然、标准、日光', category: '冷色' },
  { name: '闪光灯', kelvin: 6000, icon: 'flash', desc: '明亮、锐利、专业', category: '极冷' },
  { name: '阴天', kelvin: 6500, icon: 'cloudy-outline', desc: '冷调、均匀、标准', category: '极冷' },
];

// CRI 参考数据
const criData = [
  { level: '极佳', min: 95, max: 100, color: Colors.success, desc: '博物馆、医疗、精密色彩', examples: '专业显示器、手术灯' },
  { level: '优秀', min: 90, max: 95, color: '#4ade80', desc: '高端影视、广告摄影', examples: 'ARRI 镝灯、专业影视 LED' },
  { level: '良好', min: 80, max: 90, color: '#fbbf24', desc: '一般舞台、商业照明', examples: '大部分 LED 帕灯、电脑灯' },
  { level: '一般', min: 70, max: 80, color: Colors.warning, desc: '效果照明、装饰用途', examples: '低价 LED、装饰灯带' },
  { level: '较差', min: 0, max: 70, color: Colors.danger, desc: '仅用于特殊效果', examples: '单色 LED、激光' },
];

// 场景推荐数据
const sceneRecommendations = [
  {
    id: 'concert',
    name: '演唱会',
    icon: 'musical-notes-outline',
    illuminance: '800-1500',
    colorTemp: '5000K-6000K',
    cri: '85+',
    desc: '高亮度保证远距离观众可见，较高 CRI 确保舞台人物肤色自然',
    lights: ['面光 500W+ 电脑灯', '逆光染色 LED', '追光 1200W+'],
  },
  {
    id: 'drama',
    name: '戏剧话剧',
    icon: 'theater-outline',
    illuminance: '400-800',
    colorTemp: '3200K-4000K',
    cri: '90+',
    desc: '适中照度营造舞台氛围，暖色调符合传统戏剧审美',
    lights: ['螺纹透镜灯 1kW', 'LED 平板柔光', '侧光低位染色'],
  },
  {
    id: 'tv',
    name: '电视节目',
    icon: 'tv-outline',
    illuminance: '1000-2000',
    colorTemp: '5600K-6500K',
    cri: '95+',
    desc: '高 CRI 保证摄像机色彩还原，一致性色温确保画面协调',
    lights: ['菲涅尔 LED', '天空灯阵列', '三基色柔光箱'],
  },
  {
    id: 'live',
    name: '网络直播',
    icon: 'radio-outline',
    illuminance: '500-1000',
    colorTemp: '4000K-5600K',
    cri: '90+',
    desc: '根据主播风格灵活调整，美妆类偏冷白，才艺类可偏暖',
    lights: ['环形补光灯', '双 Key Light', 'RGB 染色背景'],
  },
  {
    id: 'wedding',
    name: '婚礼宴会',
    icon: 'heart-outline',
    illuminance: '300-600',
    colorTemp: '2700K-3200K',
    cri: '90+',
    desc: '温馨浪漫氛围为主，避免过亮破坏仪式感',
    lights: ['染色灯铺光', '追光跟随新人', '烛光效果模拟'],
  },
  {
    id: 'exhibition',
    name: '展览展示',
    icon: 'albums-outline',
    illuminance: '300-500',
    colorTemp: '4000K-5000K',
    cri: '95+',
    desc: '重点展品需要高显色，均匀度要求高，避免眩光',
    lights: ['轨道射灯', '洗墙灯', '展柜内嵌灯'],
  },
];

const tabs = [
  { label: '环境照度', value: 'illuminance' },
  { label: '光源色温', value: 'colortemp' },
  { label: 'CRI参考', value: 'cri' },
  { label: '场景推荐', value: 'scene' },
];

// 根据色温获取颜色描述
const getColorTempColor = (kelvin: number): string => {
  if (kelvin <= 2000) return '#ff6b35';
  if (kelvin <= 2700) return '#ffa94d';
  if (kelvin <= 3000) return '#ffd43b';
  if (kelvin <= 4000) return '#fff9db';
  if (kelvin <= 5000) return '#f8f9fa';
  if (kelvin <= 6000) return '#e3fafc';
  return '#e7f5ff';
};

// 根据色温获取文字颜色
const getColorTempTextColor = (kelvin: number): string => {
  if (kelvin <= 3000) return '#1a1a1a';
  if (kelvin <= 5000) return '#2d3436';
  return '#0a0a0a';
};

export default function IlluminanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const [customLux, setCustomLux] = useState('');
  const [customKelvin, setCustomKelvin] = useState('');

  const handleTabChange = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(index);
  };

  const getIlluminanceRecommendation = (lux: number): string => {
    if (lux < 200) return '昏暗 · 仅适合休息或特殊氛围';
    if (lux < 300) return '偏暗 · 适合放松或电影';
    if (lux < 500) return '适中 · 适合会议、办公';
    if (lux < 800) return '明亮 · 适合一般舞台';
    if (lux < 1000) return '较亮 · 适合演播室';
    if (lux < 2000) return '明亮 · 适合专业摄影';
    return '极亮 · 适合户外或特殊需求';
  };

  const getColorTempDescription = (kelvin: number): string => {
    if (kelvin < 2000) return '极暖光，类似烛光';
    if (kelvin < 2700) return '暖白光，类似白炽灯';
    if (kelvin < 3200) return '暖色，类似卤素灯';
    if (kelvin < 4000) return '中性光，舒适自然';
    if (kelvin < 5000) return '冷白光，清爽专业';
    if (kelvin < 6000) return '日光色，标准参考';
    return '冷日光，高亮度参考';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      
      <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <PageHeader 
          title="照度色温计算" 
          subtitle="专业灯光参数参考" 
          showTopSafeArea={false} 
        />
      </View>

      <View style={styles.tabContainer}>
        <GlassTabGroup
          tabs={tabs}
          activeIndex={activeTab}
          onChange={handleTabChange}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 环境照度 Tab */}
        {activeTab === 0 && (
          <View style={styles.tabContent}>
            <GlassCard style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons name="bulb-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoTitle}>什么是照度？</Text>
              </View>
              <Text style={styles.infoText}>
                照度（Lux）是单位面积上接收到的光通量。1 Lux = 1 lm/m²。舞台照度直接影响表演的可见度和观众体验。
              </Text>
            </GlassCard>

            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>场景推荐照度</Text>
              <Text style={styles.sectionTitleSub}>单位：Lux（勒克斯）</Text>
            </View>

            {illuminanceData.map((item, index) => (
              <GlassCard key={index} style={styles.dataCard}>
                <View style={styles.dataCardHeader}>
                  <View style={styles.dataIconContainer}>
                    <Ionicons name={item.icon as any} size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.dataInfo}>
                    <Text style={styles.dataTitle}>{item.scene}</Text>
                    <Text style={styles.dataDesc}>{item.desc}</Text>
                  </View>
                </View>
                <View style={styles.dataValueContainer}>
                  <View style={styles.dataValue}>
                    <Text style={styles.dataValueNumber}>{item.min}</Text>
                    <Text style={styles.dataValueUnit}>Lux</Text>
                  </View>
                  <View style={styles.dataArrow}>
                    <Ionicons name="arrow-forward" size={16} color={Colors.textMuted} />
                  </View>
                  <View style={styles.dataValue}>
                    <Text style={styles.dataValueNumber}>{item.max}</Text>
                    <Text style={styles.dataValueUnit}>Lux</Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${(item.max / 3000) * 100}%` }]} />
                </View>
              </GlassCard>
            ))}

            <GlassCard style={styles.calculatorCard}>
              <Text style={styles.calculatorTitle}>自定义计算</Text>
              <GlassInput
                placeholder="输入照度值 (Lux)"
                value={customLux}
                onChangeText={setCustomLux}
                keyboardType="numeric"
              />
              {customLux && !isNaN(Number(customLux)) && (
                <View style={styles.calculatorResult}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.calculatorResultText}>
                    {getIlluminanceRecommendation(Number(customLux))}
                  </Text>
                </View>
              )}
            </GlassCard>
          </View>
        )}

        {/* 光源色温 Tab */}
        {activeTab === 1 && (
          <View style={styles.tabContent}>
            <GlassCard style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons name="thermometer-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoTitle}>色温的意义</Text>
              </View>
              <Text style={styles.infoText}>
                色温（Kelvin）是表示光源颜色的物理量。数值越低越偏暖（橙黄），数值越高越偏冷（蓝白）。不同色温营造不同氛围。
              </Text>
            </GlassCard>

            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>常见光源色温</Text>
              <Text style={styles.sectionTitleSub}>单位：K（开尔文）</Text>
            </View>

            {colorTempData.map((item, index) => (
              <GlassCard key={index} style={styles.colorTempCard}>
                <View style={styles.colorTempLeft}>
                  <View 
                    style={[
                      styles.colorTempBadge, 
                      { backgroundColor: getColorTempColor(item.kelvin) }
                    ]}
                  >
                    <Text style={[
                      styles.colorTempBadgeText,
                      { color: getColorTempTextColor(item.kelvin) }
                    ]}>
                      {item.kelvin}K
                    </Text>
                  </View>
                  <View style={styles.colorTempInfo}>
                    <View style={styles.colorTempNameRow}>
                      <Ionicons name={item.icon as any} size={18} color={Colors.text} />
                      <Text style={styles.colorTempName}>{item.name}</Text>
                    </View>
                    <Text style={styles.colorTempDesc}>{item.desc}</Text>
                    <View style={styles.colorTempCategory}>
                      <Text style={styles.colorTempCategoryText}>{item.category}</Text>
                    </View>
                  </View>
                </View>
              </GlassCard>
            ))}

            <GlassCard style={styles.calculatorCard}>
              <Text style={styles.calculatorTitle}>自定义色温</Text>
              <GlassInput
                placeholder="输入色温值 (K)"
                value={customKelvin}
                onChangeText={setCustomKelvin}
                keyboardType="numeric"
              />
              {customKelvin && !isNaN(Number(customKelvin)) && (
                <View style={styles.customKelvinResult}>
                  <View 
                    style={[
                      styles.customKelvinBadge,
                      { backgroundColor: getColorTempColor(Number(customKelvin)) }
                    ]}
                  >
                    <Text style={[
                      styles.customKelvinBadgeText,
                      { color: getColorTempTextColor(Number(customKelvin)) }
                    ]}>
                      {customKelvin}K
                    </Text>
                  </View>
                  <Text style={styles.customKelvinDesc}>
                    {getColorTempDescription(Number(customKelvin))}
                  </Text>
                </View>
              )}
            </GlassCard>
          </View>
        )}

        {/* CRI 参考 Tab */}
        {activeTab === 2 && (
          <View style={styles.tabContent}>
            <GlassCard style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons name="color-palette-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoTitle}>显色指数 CRI</Text>
              </View>
              <Text style={styles.infoText}>
                CRI（Color Rendering Index）是衡量光源还原物体真实颜色能力的指标，满分100。CRI 越高，色彩还原越准确。
              </Text>
            </GlassCard>

            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>CRI 等级参考</Text>
              <Text style={styles.sectionTitleSub}>Ra 值范围</Text>
            </View>

            {criData.map((item, index) => (
              <GlassCard key={index} style={styles.criCard}>
                <View style={styles.criHeader}>
                  <View style={[styles.criBadge, { backgroundColor: item.color + '22' }]}>
                    <Text style={[styles.criBadgeText, { color: item.color }]}>{item.level}</Text>
                  </View>
                  <View style={styles.criRange}>
                    <Text style={styles.criRangeText}>Ra {item.min} - {item.max}</Text>
                  </View>
                </View>
                <Text style={styles.criDesc}>{item.desc}</Text>
                <View style={styles.criExamples}>
                  <Ionicons name="bulb-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.criExamplesText}>{item.examples}</Text>
                </View>
                <View style={styles.criProgressBar}>
                  <View 
                    style={[
                      styles.criProgressFill, 
                      { 
                        width: `${(item.max / 100) * 100}%`,
                        backgroundColor: item.color 
                      }
                    ]} 
                  />
                </View>
              </GlassCard>
            ))}

            <GlassCard style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <Ionicons name="information-circle" size={20} color={Colors.primary} />
                <Text style={styles.tipTitle}>专业建议</Text>
              </View>
              <Text style={styles.tipText}>
                舞台表演建议 CRI ≥ 85，影视制作建议 CRI ≥ 90。LED 灯具注意 R9（红色还原指数），肤色还原需要 R15 > 80。
              </Text>
            </GlassCard>
          </View>
        )}

        {/* 场景推荐 Tab */}
        {activeTab === 3 && (
          <View style={styles.tabContent}>
            <GlassCard style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons name="sparkles-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoTitle}>场景灯光推荐</Text>
              </View>
              <Text style={styles.infoText}>
                根据不同演出场景和用途，推荐合适的照度、色温和 CRI 参数，帮助快速配置专业灯光方案。
              </Text>
            </GlassCard>

            {sceneRecommendations.map((scene, index) => (
              <GlassCard key={index} style={styles.sceneCard}>
                <View style={styles.sceneHeader}>
                  <View style={styles.sceneIconContainer}>
                    <Ionicons name={scene.icon as any} size={28} color={Colors.primary} />
                  </View>
                  <Text style={styles.sceneName}>{scene.name}</Text>
                </View>
                
                <Text style={styles.sceneDesc}>{scene.desc}</Text>
                
                <View style={styles.sceneParams}>
                  <View style={styles.sceneParam}>
                    <Ionicons name="sunny-outline" size={16} color={Colors.textMuted} />
                    <Text style={styles.sceneParamLabel}>照度</Text>
                    <Text style={styles.sceneParamValue}>{scene.illuminance} Lux</Text>
                  </View>
                  <View style={styles.sceneParam}>
                    <Ionicons name="thermometer-outline" size={16} color={Colors.textMuted} />
                    <Text style={styles.sceneParamLabel}>色温</Text>
                    <Text style={styles.sceneParamValue}>{scene.colorTemp}</Text>
                  </View>
                  <View style={styles.sceneParam}>
                    <Ionicons name="color-palette-outline" size={16} color={Colors.textMuted} />
                    <Text style={styles.sceneParamLabel}>CRI</Text>
                    <Text style={styles.sceneParamValue}>{scene.cri}</Text>
                  </View>
                </View>

                <View style={styles.sceneLights}>
                  <Text style={styles.sceneLightsTitle}>推荐灯具</Text>
                  {scene.lights.map((light, lightIndex) => (
                    <View key={lightIndex} style={styles.sceneLightItem}>
                      <View style={styles.sceneLightDot} />
                      <Text style={styles.sceneLightText}>{light}</Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            ))}
          </View>
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
  tabContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  tabContent: {
    paddingTop: 8,
  },
  infoCard: {
    padding: 16,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionTitleSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 8,
  },
  dataCard: {
    padding: 16,
    marginBottom: 10,
  },
  dataCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dataIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dataInfo: {
    flex: 1,
  },
  dataTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  dataDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dataValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dataValue: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dataValueNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  dataValueUnit: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dataArrow: {
    paddingHorizontal: 8,
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
  colorTempCard: {
    padding: 14,
    marginBottom: 10,
  },
  colorTempLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorTempBadge: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 14,
    minWidth: 80,
    alignItems: 'center',
  },
  colorTempBadgeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  colorTempInfo: {
    flex: 1,
  },
  colorTempNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorTempName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  colorTempDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  colorTempCategory: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: Colors.glass,
    borderRadius: 8,
  },
  colorTempCategoryText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  calculatorCard: {
    padding: 16,
    marginTop: 8,
  },
  calculatorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  calculatorResult: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.glass,
    borderRadius: 12,
  },
  calculatorResultText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  customKelvinResult: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.glass,
    borderRadius: 12,
    alignItems: 'center',
  },
  customKelvinBadge: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  customKelvinBadgeText: {
    fontSize: 20,
    fontWeight: '700',
  },
  customKelvinDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  criCard: {
    padding: 16,
    marginBottom: 10,
  },
  criHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  criBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  criBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  criRange: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.glass,
    borderRadius: 10,
  },
  criRangeText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  criDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  criExamples: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  criExamplesText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 6,
  },
  criProgressBar: {
    height: 6,
    backgroundColor: Colors.glass,
    borderRadius: 3,
    overflow: 'hidden',
  },
  criProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  tipCard: {
    padding: 16,
    marginTop: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  tipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  sceneCard: {
    padding: 16,
    marginBottom: 12,
  },
  sceneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sceneIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sceneName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  sceneDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },
  sceneParams: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.glass,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  sceneParam: {
    alignItems: 'center',
    flex: 1,
  },
  sceneParamLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: 2,
  },
  sceneParamValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  sceneLights: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sceneLightsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 8,
  },
  sceneLightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sceneLightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 10,
  },
  sceneLightText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
