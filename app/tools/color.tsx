import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Share, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassTabGroup } from '@/components/ui/glass-tab-group';
import { Colors } from '@/constants/colors';

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

interface PresetColor {
  name: string;
  rgb: RGBColor;
  category: string;
  scene: string;
}

interface ColorScheme {
  name: string;
  colors: PresetColor[];
}

const PRESET_COLOR_SCHEMES: ColorScheme[] = [
  {
    name: '舞台常用',
    colors: [
      { name: '舞台红', rgb: { r: 220, g: 20, b: 60 }, category: '主色', scene: '演唱会、体育场、节日庆典' },
      { name: '舞台蓝', rgb: { r: 30, g: 60, b: 180 }, category: '主色', scene: '演唱会、剧场、DJ派对' },
      { name: '舞台绿', rgb: { r: 0, g: 180, b: 80 }, category: '主色', scene: '演唱会、户外音乐节' },
      { name: '舞台黄', rgb: { r: 255, g: 220, b: 0 }, category: '主色', scene: '节日庆典、户外活动' },
      { name: '舞台紫', rgb: { r: 138, g: 43, b: 226 }, category: '主色', scene: '演唱会、剧场、酒吧' },
      { name: '舞台橙', rgb: { r: 255, g: 140, b: 0 }, category: '主色', scene: '体育赛事、节日庆典' },
    ],
  },
  {
    name: '演出配色',
    colors: [
      { name: '日落', rgb: { r: 255, g: 140, b: 80 }, category: '渐变', scene: '抒情演出、户外音乐节' },
      { name: '海洋', rgb: { r: 64, g: 154, b: 210 }, category: '渐变', scene: '派对、水上活动、泳池派对' },
      { name: '森林', rgb: { r: 80, g: 160, b: 100 }, category: '渐变', scene: '自然主题演出、户外音乐节' },
      { name: '火焰', rgb: { r: 255, g: 80, b: 40 }, category: '渐变', scene: '摇滚演出、DJ派对、节日庆典' },
      { name: '极光', rgb: { r: 100, g: 200, b: 180 }, category: '渐变', scene: '科技主题演出、电音节' },
      { name: '星空', rgb: { r: 80, g: 100, b: 200 }, category: '渐变', scene: '科幻主题演出、剧场' },
    ],
  },
  {
    name: '色温配色',
    colors: [
      { name: '极暖白光', rgb: { r: 255, g: 180, b: 100 }, category: '暖色', scene: '温馨场景、人像摄影' },
      { name: '暖白光', rgb: { r: 255, g: 200, b: 140 }, category: '暖色', scene: '酒店、餐厅、咖啡厅' },
      { name: '自然白', rgb: { r: 255, g: 230, b: 200 }, category: '中性', scene: '办公室、商场、展厅' },
      { name: '中性白', rgb: { r: 255, g: 240, b: 230 }, category: '中性', scene: '会议室、教室' },
      { name: '冷白光', rgb: { r: 240, g: 245, b: 255 }, category: '冷色', scene: '医院、实验室、车间' },
      { name: '日光', rgb: { r: 220, g: 235, b: 255 }, category: '冷色', scene: '工厂、体育馆、仓库' },
    ],
  },
];

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
  if (r === 0 && g === 0 && b === 0) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const k = 1 - Math.max(rNorm, gNorm, bNorm);
  const c = (1 - rNorm - k) / (1 - k) || 0;
  const m = (1 - gNorm - k) / (1 - k) || 0;
  const y = (1 - bNorm - k) / (1 - k) || 0;

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

function kelvinToRgb(kelvin: number): RGBColor {
  const temp = kelvin / 100;
  let r: number, g: number, b: number;

  if (temp <= 66) {
    r = 255;
    g = temp;
    g = 99.4708025861 * Math.log(g) - 161.1195681661;
    if (temp <= 19) {
      b = 0;
    } else {
      b = temp - 10;
      b = 138.5177312231 * Math.log(b) - 305.0447927307;
    }
  } else {
    r = temp - 60;
    r = 329.698727446 * Math.pow(r, -0.1332047592);
    g = temp - 60;
    g = 288.1221695283 * Math.pow(g, -0.0755148492);
    b = 255;
  }

  return {
    r: Math.round(Math.max(0, Math.min(255, r))),
    g: Math.round(Math.max(0, Math.min(255, g))),
    b: Math.round(Math.max(0, Math.min(255, b))),
  };
}

function kelvinToMired(kelvin: number): number {
  return Math.round(1000000 / kelvin);
}

function getColorName(r: number, g: number, b: number): string {
  const colorNames: { name: string; r: number; g: number; b: number }[] = [
    { name: '红', r: 255, g: 0, b: 0 },
    { name: '橙', r: 255, g: 165, b: 0 },
    { name: '黄', r: 255, g: 255, b: 0 },
    { name: '绿', r: 0, g: 255, b: 0 },
    { name: '青', r: 0, g: 255, b: 255 },
    { name: '蓝', r: 0, g: 0, b: 255 },
    { name: '紫', r: 128, g: 0, b: 128 },
    { name: '粉', r: 255, g: 192, b: 203 },
    { name: '白', r: 255, g: 255, b: 255 },
    { name: '黑', r: 0, g: 0, b: 0 },
    { name: '灰', r: 128, g: 128, b: 128 },
  ];

  let closestName = '未知';
  let minDistance = Infinity;

  for (const color of colorNames) {
    const distance = Math.sqrt(
      Math.pow(r - color.r, 2) + Math.pow(g - color.g, 2) + Math.pow(b - color.b, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestName = color.name;
    }
  }

  return closestName;
}

function getColorCategory(r: number, g: number, b: number): string {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2 / 255;

  if (max - min < 20) {
    if (l < 0.2) return '深色';
    if (l > 0.8) return '浅色';
    return '中性色';
  }

  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  if (rNorm >= gNorm && rNorm >= bNorm) {
    return '红色系';
  } else if (gNorm >= rNorm && gNorm >= bNorm) {
    return '绿色系';
  } else if (bNorm >= rNorm && bNorm >= gNorm) {
    return '蓝色系';
  }

  return '混合色';
}

function getApplicableScene(r: number, g: number, b: number): string {
  const hex = rgbToHex(r, g, b).toLowerCase();
  const cmyk = rgbToCmyk(r, g, b);

  if (cmyk.k > 80) {
    return '舞台背景、阴影效果';
  } else if (cmyk.k < 20 && cmyk.c < 20 && cmyk.m < 20 && cmyk.y > 60) {
    return '温馨场景、人像补光';
  } else if (cmyk.c > 40 && cmyk.m < 30 && cmyk.y < 30) {
    return '冷调演出、科幻主题';
  } else if (cmyk.m > 40 && cmyk.y < 30) {
    return '紫色系演出、DJ派对';
  } else if (cmyk.y > 60 && cmyk.m < 30) {
    return '暖色演出、节日庆典';
  }

  return '通用场景';
}

function Slider({ label, value, onValueChange, color }: {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  color: string;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.labelRow}>
        <Text style={sliderStyles.label}>{label}</Text>
        <Text style={sliderStyles.value}>{value}</Text>
      </View>
      <View style={sliderStyles.track}>
        <View style={[sliderStyles.fill, { width: `${(value / 255) * 100}%`, backgroundColor: color }]} />
        <TouchableOpacity
          style={[sliderStyles.thumb, { left: `${(value / 255) * 100}%`, backgroundColor: color }]}
          activeOpacity={1}
        />
      </View>
      <View style={sliderStyles.controls}>
        <TouchableOpacity
          style={sliderStyles.button}
          onPress={() => onValueChange(Math.max(0, value - 1))}
        >
          <Ionicons name="remove" size={16} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={sliderStyles.button}
          onPress={() => onValueChange(Math.min(255, value + 1))}
        >
          <Ionicons name="add" size={16} color={Colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    minWidth: 36,
    textAlign: 'right',
  },
  track: {
    height: 8,
    backgroundColor: Colors.glass,
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    top: -6,
    marginLeft: -10,
    borderWidth: 2,
    borderColor: Colors.bg,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function ColorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const [r, setR] = useState(56);
  const [g, setG] = useState  (189);
  const [b, setB] = useState(248);
  const [kelvin, setKelvin] = useState(4000);

  const tabs = [
    { label: 'RGB 调色', value: 'rgb' },
    { label: '色温换算', value: 'kelvin' },
    { label: '配色方案', value: 'scheme' },
  ];

  const hex = useMemo(() => rgbToHex(r, g, b), [r, g, b]);
  const cmyk = useMemo(() => rgbToCmyk(r, g, b), [r, g, b]);
  const colorName = useMemo(() => getColorName(r, g, b), [r, g, b]);
  const colorCategory = useMemo(() => getColorCategory(r, g, b), [r, g, b]);
  const scene = useMemo(() => getApplicableScene(r, g, b), [r, g, b]);

  const kelvinRgb = useMemo(() => kelvinToRgb(kelvin), [kelvin]);
  const mired = useMemo(() => kelvinToMired(kelvin), [kelvin]);
  const kelvinHex = useMemo(() => rgbToHex(kelvinRgb.r, kelvinRgb.g, kelvinRgb.b), [kelvinRgb]);

  const handleKelvinInput = (text: string) => {
    const value = parseInt(text) || 0;
    const clamped = Math.max(1000, Math.min(20000, value));
    setKelvin(clamped);
  };

  const applyKelvinToRgb = () => {
    setR(kelvinRgb.r);
    setG(kelvinRgb.g);
    setB(kelvinRgb.b);
  };

  const applyPresetColor = (color: PresetColor) => {
    setR(color.rgb.r);
    setG(color.rgb.g);
    setB(color.rgb.b);
  };

  const shareColor = async () => {
    const content = `颜色信息\n\n颜色名称: ${colorName}色\nHEX: ${hex}\nRGB: RGB(${r}, ${g}, ${b})\nCMYK: CMYK(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)\n色温: ${kelvin}K\n分类: ${colorCategory}\n适用场景: ${scene}`;

    try {
      await Share.share({
        message: content,
        title: `${colorName}色 - 灯光工具`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>调色配色</Text>
        <TouchableOpacity onPress={shareColor} style={styles.shareButton}>
          <Ionicons name="share-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <GlassTabGroup
          tabs={tabs.map(t => t.label)}
          activeIndex={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 0 && (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <GlassCard style={styles.card}>
              <View style={[styles.colorPreview, { backgroundColor: hex }]}>
                <Text style={[styles.previewHex, { color: r + g + b > 384 ? '#000' : '#fff' }]}>
                  {hex}
                </Text>
              </View>
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>RGB 调整</Text>
              <Slider label="红 (R)" value={r} onValueChange={setR} color="#f87171" />
              <Slider label="绿 (G)" value={g} onValueChange={setG} color="#4ade80" />
              <Slider label="蓝 (B)" value={b} onValueChange={setB} color="#60a5fa" />
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>颜色数值</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>HEX</Text>
                  <Text style={styles.infoValue}>{hex}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>RGB</Text>
                  <Text style={styles.infoValue}>{r}, {g}, {b}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>C</Text>
                  <Text style={styles.infoValue}>{cmyk.c}%</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>M</Text>
                  <Text style={styles.infoValue}>{cmyk.m}%</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Y</Text>
                  <Text style={styles.infoValue}>{cmyk.y}%</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>K</Text>
                  <Text style={styles.infoValue}>{cmyk.k}%</Text>
                </View>
              </View>
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>色彩信息</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>颜色名称</Text>
                <Text style={styles.detailValue}>{colorName}色</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>颜色分类</Text>
                <Text style={styles.detailValue}>{colorCategory}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>适用场景</Text>
                <Text style={styles.detailValue}>{scene}</Text>
              </View>
            </GlassCard>
          </ScrollView>
        )}

        {activeTab === 1 && (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <GlassCard style={styles.card}>
              <View style={[styles.colorPreview, { backgroundColor: kelvinHex }]}>
                <Text style={[
                  styles.previewHex,
                  styles.previewKelvinTemp,
                  { color: kelvinRgb.r + kelvinRgb.g + kelvinRgb.b > 384 ? '#000' : '#fff' }
                ]}>
                  {kelvin}K
                </Text>
              </View>
              <View style={styles.kelvinSliderContainer}>
                <View style={styles.kelvinLabels}>
                  <Text style={styles.kelvinLabel}>2700K</Text>
                  <Text style={styles.kelvinLabel}>6500K</Text>
                </View>
                <View style={styles.kelvinTrack}>
                  <View style={[styles.kelvinFill, { width: `${((kelvin - 2700) / (6500 - 2700)) * 100}%` }]} />
                  <View style={[styles.kelvinGradient]} />
                </View>
                <View style={styles.kelvinPresets}>
                  {[2700, 3200, 4000, 5000, 5600, 6500].map((k) => (
                    <TouchableOpacity
                      key={k}
                      style={[styles.kelvinPreset, kelvin === k && styles.kelvinPresetActive]}
                      onPress={() => setKelvin(k)}
                    >
                      <Text style={[styles.kelvinPresetText, kelvin === k && styles.kelvinPresetTextActive]}>
                        {k}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>色温输入</Text>
              <View style={styles.kelvinInputRow}>
                <GlassInput
                  value={kelvin.toString()}
                  onChangeText={handleKelvinInput}
                  keyboardType="numeric"
                  style={styles.kelvinInput}
                />
                <Text style={styles.kelvinUnit}>K</Text>
              </View>
              <View style={styles.miredRow}>
                <Text style={styles.miredLabel}>Mired 值</Text>
                <Text style={styles.miredValue}>{mired}</Text>
              </View>
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>对应 RGB 值</Text>
              <View style={styles.rgbDisplay}>
                <View style={[styles.rgbBox, { backgroundColor: `rgb(${kelvinRgb.r}, 0, 0)` }]}>
                  <Text style={styles.rgbLabel}>R</Text>
                  <Text style={styles.rgbValue}>{kelvinRgb.r}</Text>
                </View>
                <View style={[styles.rgbBox, { backgroundColor: `rgb(0, ${kelvinRgb.g}, 0)` }]}>
                  <Text style={styles.rgbLabel}>G</Text>
                  <Text style={styles.rgbValue}>{kelvinRgb.g}</Text>
                </View>
                <View style={[styles.rgbBox, { backgroundColor: `rgb(0, 0, ${kelvinRgb.b})` }]}>
                  <Text style={styles.rgbLabel}>B</Text>
                  <Text style={styles.rgbValue}>{kelvinRgb.b}</Text>
                </View>
              </View>
              <View style={styles.hexDisplay}>
                <Text style={styles.hexLabel}>HEX</Text>
                <Text style={styles.hexValue}>{kelvinHex}</Text>
              </View>
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>色温说明</Text>
              <View style={styles.kelvinInfo}>
                <View style={styles.kelvinInfoItem}>
                  <View style={[styles.kelvinDot, { backgroundColor: '#ffb464' }]} />
                  <View style={styles.kelvinInfoText}>
                    <Text style={styles.kelvinInfoTitle}>暖白光 (2700K-3000K)</Text>
                    <Text style={styles.kelvinInfoDesc}>温馨舒适，适合家居、酒店</Text>
                  </View>
                </View>
                <View style={styles.kelvinInfoItem}>
                  <View style={[styles.kelvinDot, { backgroundColor: '#ffe4c4' }]} />
                  <View style={styles.kelvinInfoText}>
                    <Text style={styles.kelvinInfoTitle}>自然白 (4000K-4500K)</Text>
                    <Text style={styles.kelvinInfoDesc}>自然明亮，适合办公、商场</Text>
                  </View>
                </View>
                <View style={styles.kelvinInfoItem}>
                  <View style={[styles.kelvinDot, { backgroundColor: '#dce8ff' }]} />
                  <View style={styles.kelvinInfoText}>
                    <Text style={styles.kelvinInfoTitle}>冷白光 (5000K-6500K)</Text>
                    <Text style={styles.kelvinInfoDesc}>明亮清晰，适合车间、体育馆</Text>
                  </View>
                </View>
              </View>
            </GlassCard>

            <GlassButton title="应用到 RGB 调色" onPress={applyKelvinToRgb} />
          </ScrollView>
        )}

        {activeTab === 2 && (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {PRESET_COLOR_SCHEMES.map((scheme) => (
              <GlassCard key={scheme.name} style={styles.card}>
                <Text style={styles.sectionTitle}>{scheme.name}</Text>
                <View style={styles.colorGrid}>
                  {scheme.colors.map((color) => (
                    <TouchableOpacity
                      key={color.name}
                      style={styles.colorItem}
                      onPress={() => applyPresetColor(color)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.colorSwatch,
                          { backgroundColor: rgbToHex(color.rgb.r, color.rgb.g, color.rgb.b) },
                        ]}
                      />
                      <Text style={styles.colorName}>{color.name}</Text>
                      <Text style={styles.colorHex}>
                        {rgbToHex(color.rgb.r, color.rgb.g, color.rgb.b)}
                      </Text>
                      <Text style={styles.colorCategory}>{color.category}</Text>
                      <Text style={styles.colorScene} numberOfLines={2}>
                        {color.scene}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </GlassCard>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
    </View>
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
  shareButton: {
    padding: 8,
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
    marginBottom: 16,
  },
  colorPreview: {
    height: 120,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  previewHex: {
    fontSize: 28,
    fontWeight: '700',
  },
  previewKelvinTemp: {
    fontSize: 32,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoItem: {
    width: '30%',
    backgroundColor: Colors.glass,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  kelvinSliderContainer: {
    marginTop: 16,
  },
  kelvinLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kelvinLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  kelvinTrack: {
    height: 8,
    backgroundColor: Colors.glass,
    borderRadius: 4,
    overflow: 'hidden',
  },
  kelvinGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  kelvinFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    opacity: 0.5,
  },
  kelvinPresets: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  kelvinPreset: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: Colors.glass,
  },
  kelvinPresetActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  kelvinPresetText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  kelvinPresetTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  kelvinInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kelvinInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
  },
  kelvinUnit: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.primary,
  },
  miredRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  miredLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  miredValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  rgbDisplay: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  rgbBox: {
    flex: 1,
    height: 80,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rgbLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  rgbValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  hexDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.glass,
    borderRadius: 10,
    padding: 12,
  },
  hexLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  hexValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  kelvinInfo: {
    gap: 16,
  },
  kelvinInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  kelvinDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  kelvinInfoText: {
    flex: 1,
  },
  kelvinInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  kelvinInfoDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorItem: {
    width: '47%',
    backgroundColor: Colors.glass,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  colorSwatch: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: Colors.glassBorder,
  },
  colorName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  colorHex: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
  },
  colorCategory: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  colorScene: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
