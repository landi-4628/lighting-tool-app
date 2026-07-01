import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from '@/components/ui/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { Colors } from '@/constants/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface KnowledgeCard {
  id: string;
  title: string;
  summary: string;
  detail: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  cards: KnowledgeCard[];
}

const categories: Category[] = [
  {
    id: 'fixtures',
    name: '灯具分类',
    icon: 'bulb-outline',
    cards: [
      {
        id: 'spotlight',
        title: '电脑灯 (Spotlight)',
        summary: '具有可调光束、可更换图案和颜色的专业舞台灯具。',
        detail: '电脑灯是现代舞台灯光的核心设备，分为 Spot（图案灯）和 Beam（光束灯）。\n\n关键参数：\n- 功率：200W-1500W\n- 光束角度：5-50° 可调\n- 通道数：8-32 通道\n- 典型品牌：Martin、Robe、Clay Paky、ETC\n\nSpot 特点：\n- 宽角度投射（15-50°）\n- 可变图案盘（Gobo）\n- 可旋转颜色盘（Color Wheel）\n- 棱镜、柔光等效果\n\nBeam 特点：\n- 窄角度投射（1-5°）\n- 远距离投射\n- 锐利光束边缘\n- 注重光束效果而非图案',
      },
      {
        id: 'wash',
        title: '染色灯 (Wash)',
        summary: '用于大面积染色铺光的泛光照明灯具。',
        detail: '染色灯主要功能是大面积铺光和颜色渲染，是舞台氛围营造的主力。\n\n常见类型：\n- LED Par：RGB/RGBW/六色，功耗低、寿命长\n- 菲涅尔染色灯：均匀柔和光斑\n- 电池灯：无线移动染色，灵活性高\n- 大功率泛光灯：摇头 LED 和气体放电光源\n\n典型配置：\n- 每 4-8 台为一组\n- 串联 DMX 控制\n- 同组灯具设置相同地址\n- 色温一致性校准',
      },
      {
        id: 'strobe',
        title: '频闪灯 (Strobe)',
        summary: '产生快速闪光效果的舞台特效灯具。',
        detail: '频闪灯通过快速闪烁创造强烈的视觉冲击效果。\n\n关键参数：\n- 闪光频率：1-30Hz\n- 占空比可调\n- 高功率频闪单次可达 150000 流明\n- LED 频闪无机械部件\n\n类型选择：\n- 机械频闪：传统气体放电灯\n- LED 频闪：可控性更强\n- 矩阵灯：像素控制频闪\n\n注意事项：\n- 可能诱发光敏性癫痫，演出前需警告\n- 高功率频闪配电需使用 D 型空开\n- DMX 通常占用 1-3 通道',
      },
      {
        id: 'laser',
        title: '激光灯 (Laser)',
        summary: '高能量光束，用于创造科幻和动感效果。',
        detail: '激光灯提供高亮度、方向性极强的光束效果。\n\n激光等级：\n- Class 3R：低功率，可日常使用\n- Class 3B：中功率，需安全措施\n- Class 4：高功率，严格管控\n\n应用场景：\n- 激光扫描图案\n- 光束墙（Laser Curtain）\n- 跟踪追光效果\n\n安全要求：\n- 激光表演需取得使用许可\n- 观众区域激光等级必须合规\n- 配备激光故障安全系统',
      },
      {
        id: 'followspot',
        title: '追光灯 (Followspot)',
        summary: '手动或自动跟踪演员的聚光灯具。',
        detail: '追光灯是舞台表演中最重要的情感传递工具，需要专人操作。\n\n类型：\n- 手动追光：操作员手动跟踪\n- 自动追光：使用摄像头或追踪系统\n- LED 追光：功耗低、色温稳定\n\n关键参数：\n- 光源：HPL 575/750、LED 400W+\n- 功率：575W-1500W\n- 光斑：可调 5-25°\n- 色温：3200K 或 5600K\n\n操作要点：\n- 与演员保持眼神接触\n- 提前预判移动轨迹\n- 熟悉 Cue 点位置\n- 与灯光师保持通讯',
      },
      {
        id: 'ledpar',
        title: 'LED Par 灯',
        summary: '固态光源的多色泛光灯具。',
        detail: 'LED Par 灯是现代演出中最普及的染色灯具。\n\n光源配置：\n- RGB：红绿蓝三色\n- RGBW：增加白色通道\n- 六色：RGB + 琥珀 + 青绿 + 靛蓝\n- 可调白：3200K-6500K 可变\n\n优势：\n- 功耗低（典型 150W）\n- 寿命长（50000 小时）\n- 发热量小\n- 即时开关，无预热\n\n应用：\n- 舞台染色铺光\n- 环境照明\n- 建筑照明\n- 巡演便携方案',
      },
    ],
  },
  {
    id: 'positions',
    name: '灯位布局',
    icon: 'grid-outline',
    cards: [
      {
        id: 'front',
        title: '面光 (Front Light)',
        summary: '位于观众席正前方的主照明灯位。',
        detail: '面光是舞台灯光的基础，为演员提供正面主照明。\n\n位置规范：\n- 位置：观众厅前沿上方\n- 与中线夹角：45-60°\n- 高度角：35-45°\n\n设计要点：\n- 左右各一组保证立体感\n- 加柔光纸（Diffusion）柔化光影\n- 覆盖全部表演区\n- 色温统一（通常 3200K）\n\n灯具选择：\n- 螺纹透镜灯（PC/FC）\n- LED 平板灯\n- 电脑灯（需要高亮度时）',
      },
      {
        id: 'back',
        title: '逆光 (Back Light)',
        summary: '位于演员身后上方的轮廓光。',
        detail: '逆光勾勒人物轮廓，增强视觉层次和立体感。\n\n位置规范：\n- 位置：演员后方上方\n- 高度角：55-70°\n- 与中线夹角：30-45°\n\n典型配置：\n- 每 2-3 米一盏\n- 沿舞台深度分布 2-3 排\n- DMX 分组控制区域变化\n\n效果作用：\n- 分离演员与背景\n- 创造发光轮廓效果\n- 增加舞台空间深度\n- 冷暖色对比增强层次',
      },
      {
        id: 'side',
        title: '侧光 (Side Light)',
        summary: '位于舞台两侧的立体照明。',
        detail: '侧光塑造人物立体感和空间感，是三维照明的重要组成。\n\n高度分类：\n- 低位侧光：1.5-3m，营造地面阴影\n- 中位侧光：3-6m，主侧光\n- 高位侧光：6m+，强调轮廓\n\n配置要点：\n- 左/右侧各一组\n- 高度分上下两层\n- 按排 × 色彩分组 DMX\n- 与面光配合使用\n\n色温策略：\n- 可与面光同色温\n- 或使用互补色增加变化\n- 侧光可使用更饱和颜色',
      },
      {
        id: 'top',
        title: '天幕光 (Backdrop Light)',
        summary: '用于照亮背景幕布的灯光配置。',
        detail: '天幕光为舞台背景提供均匀照明或染色效果。\n\n类型：\n- 天空灯（Sky Cyc）：大面积泛光\n- 地排灯（Floor Cyc）：从下往上\n- Par 灯组：经济方案\n\n设计要点：\n- 均匀覆盖，无明显接缝\n- 与演员光区分开控制\n- 颜色可快速变换\n- 避免在天幕上产生人影\n\n特殊效果：\n- 天幕追光效果\n- 渐变染色\n- 图案投射',
      },
      {
        id: 'followpos',
        title: '追光位置',
        summary: '追光灯的安装位置和覆盖范围。',
        detail: '追光位置的选择直接影响追光效果和操作难度。\n\n典型位置：\n- 追光室：最佳观察位置，专业场所\n- 观众区前排：成本低，但影响观众\n- 舞台侧面：覆盖范围有限\n- 升降追光架：灵活性高\n\n覆盖计算：\n- 射程：20-50m\n- 光斑大小随距离变化\n- 需要备有不同角度透镜\n\n设备要求：\n- 独立配电回路\n- 直通控台推子\n- 操作员通话系统',
      },
    ],
  },
  {
    id: 'color',
    name: '色彩理论',
    icon: 'color-palette-outline',
    cards: [
      {
        id: 'temp',
        title: '色温 (Color Temperature)',
        summary: '衡量光源颜色偏暖或偏冷的物理量。',
        detail: '色温基于黑体辐射理论，单位为开尔文(K)。\n\n舞台常用色温：\n- 2700K：极暖白色\n- 3200K：暖白色（传统钨丝灯）\n- 4000K：中性白色\n- 5600K：日光（典型 Daylight）\n- 6500K：冷白色/产品灯\n\n应用场景：\n- 3200K：室内演出面光\n- 5600K：外场/高清视频录制\n- 可调色温：适应多种环境\n\n色温混合：\n高低色温混合可产生丰富的空间层次，暖光营造亲密感，冷光创造未来感。',
      },
      {
        id: 'cri',
        title: '显色指数 CRI',
        summary: '衡量灯光还原物体真实色彩能力的指标。',
        detail: 'CRI（Color Rendering Index）以 0-100 评分，是专业灯光的重要参数。\n\n标准分级：\n- Ra > 95：极佳（博物馆/医疗）\n- Ra 90-95：优秀（高端影视）\n- Ra 80-90：良好（一般舞台）\n- Ra < 80：较差（仅用于效果）\n\n检测指标：\n- Ra：前 8 个标准色\n- R9：红色还原（重要）\n- R12：蓝色还原\n- R15：肤色还原\n\nLED 注意事项：\n- 选择高 CRI 灯具\n- 注意 R9 > 80\n- 避免窄光谱 LED\n- 不同品牌混合使用可能偏色',
      },
      {
        id: 'additive',
        title: '加色混合 vs 减色混合',
        summary: 'LED 使用加色混合，颜色纸使用减色混合。',
        detail: '理解色彩混合原理是灯光设计的基础。\n\n加色混合（Additive）：\nRGB 三原色光叠加\n- R + G = 黄\n- R + B = 品红\n- G + B = 青\n- R + G + B = 白\n\n减色混合（Subtractive）：\n颜色纸吸收部分光谱\n- 黄纸吸收蓝光\n- 品红纸吸收绿光\n- 青纸吸收红光\n\n实际应用：\n- LED 混色：直接加法混合\n- 颜色纸：减法滤色\n- 两者不能直接互换\n- 色温会影响 LED 混色结果',
      },
      {
        id: 'psychology',
        title: '色彩心理学',
        summary: '颜色对观众情绪和感知的影响。',
        detail: '色彩心理学帮助灯光师通过颜色传达情感和氛围。\n\n暖色系（2800-3500K）：\n- 红/橙：激情、能量、温暖\n- 金色：奢华、高贵\n- 适用：亲密场景、爱情戏\n\n冷色系（5000K+）：\n- 蓝/青：冷静、科技、未来\n- 绿色：自然、平静（需谨慎）\n- 适用：科幻、紧张场景\n\n中性色：\n- 白色：纯净、清洁\n- 紫色：神秘、魔幻\n\n设计原则：\n- 颜色服务于剧情\n- 避免长时间单色刺激\n- 肤色永远是第一优先\n- 颜色变化要有逻辑',
      },
    ],
  },
  {
    id: 'dmx',
    name: 'DMX 协议',
    icon: 'git-network-outline',
    cards: [
      {
        id: 'basics',
        title: 'DMX512 协议基础',
        summary: '舞台灯光数字控制协议。',
        detail: 'DMX512 是舞台灯光行业标准控制协议。\n\n物理层规范：\n- 总线类型：RS-485 差分信号\n- 连接器：3 芯或 5 芯 XLR\n- 线缆：120 欧姆特性阻抗\n- 每 Universe：最多 512 通道\n\n连接规则：\n- 控台 → 放大器 → 灯具\n- 每链路最多 32 台设备\n- 建议使用 DMX 放大器延长距离\n- 末端需加终端电阻\n\n协议结构：\n- Break：88μs（复位信号）\n- MAB：8μs（标记）\n- Slot：44μs（每通道）\n- 刷新率：44Hz（理想）',
      },
      {
        id: 'address',
        title: 'DMX 地址码设置',
        summary: '为每台灯具分配唯一的起始通道。',
        detail: '正确的地址设置是灯具正常工作的前提。\n\n地址设置步骤：\n1. 确定灯具通道数\n2. 计算起始地址\n3. 通过灯具菜单或 DIP 拨码设置\n4. 验证通道分配\n\n计算规则：\n地址 = 前一台起始地址 + 前一台通道数\n\n示例：\n- 灯具 A：12 通道，起始 001\n- 灯具 B：24 通道，起始 013\n- 灯具 C：16 通道，起始 037\n\n注意事项：\n- 地址范围：1-512\n- 同一链路地址不能重叠\n- 预留扩展通道\n- 记录地址分配表',
      },
      {
        id: 'artnet',
        title: 'Art-Net 与 sACN',
        summary: '通过以太网传输 DMX 数据。',
        detail: '网络协议突破传统 DMX 的距离和设备数量限制。\n\nArt-Net：\n- 基于 UDP/IP 协议\n- 使用 10.x.x.x 私有网段\n- 每物理网口最多 32768 个 Universe\n- 品牌：Martin、Chamsys\n\nsACN (E1.31)：\n-ESTA 行业标准\n- 支持多播（Multicast）\n- 跨平台兼容性最好\n- ETC、MA 等主流支持\n\n网络架构：\n- 核心交换机\n- 节点（Node）转换\n- 备份网络\n- 独立 VLAN',
      },
      {
        id: 'rdm',
        title: 'RDM 远程管理',
        summary: 'DMX512 的双向通讯扩展协议。',
        detail: 'RDM（Remote Device Management）实现灯具的远程配置和监控。\n\n功能支持：\n- 地址远程设置\n- 模式远程切换\n- 灯具状态回读\n- 故障诊断\n\n实施要求：\n- 控台支持 RDM\n- 灯具支持 RDM\n- 使用 RDM 专用线缆/协议\n\n应用场景：\n- 高空灯具地址调整\n- 批量参数设置\n- 实时监控系统\n- 预测性维护',
      },
    ],
  },
  {
    id: 'console',
    name: '控台操作',
    icon: 'options-outline',
    cards: [
      {
        id: 'ma2',
        title: 'grandMA2 操作哲学',
        summary: '以 Cue/Sequence/Executor 三层结构组织灯光。',
        detail: 'grandMA2 是专业演出最常用的灯光控台之一。\n\n核心概念：\n- Cue：单个灯光状态快照\n- Sequence：多个 Cue 的有序序列\n- Executor：物理或虚拟回放键\n- Group：灯具分组预设\n- Preset：参数预设\n\n关键原则：\n- 一切皆可存储\n- 大量使用 Preset 减少重复工作\n- Cue 是最基础的记忆单元\n- Sequence 组织演出流程\n- Executor 是现场执行界面\n\nMA3 升级注意：\n- 操作逻辑相似\n- 界面布局改变\n- 性能大幅提升',
      },
      {
        id: 'timing',
        title: 'Cue 时间与过渡曲线',
        summary: '控制灯光状态切换的速度和方式。',
        detail: '时间和曲线控制决定灯光变化的艺术表现力。\n\n核心时间参数：\n- In-Time：淡入时间\n- Out-Time：淡出时间\n- Delay：延迟时间\n- Duration：总持续时间\n\n曲线类型：\n- Linear：线性过渡\n- S-Curve：平滑过渡（推荐）\n- In：先慢后快\n- Out：先快后慢\n- In-Out：中间慢两端快\n\n应用技巧：\n- 面光：使用 S 曲线避免突兀\n- 效果灯：可使用线性或快曲线\n- 追光：手动控制时间\n- 渐变：长 In-Time',
      },
      {
        id: 'timecode',
        title: '时间码演出',
        summary: '将灯光 Cue 与音视频时间码同步。',
        detail: '时间码实现灯光与音视频的精确同步。\n\n时间码类型：\n- LTC：线性时间码（音频信号）\n- MIDI Timecode：MIDI 协议时间码\n- 内置时间码：控台自带\n- SMPTE：电影标准（24/25/30fps）\n\n工作流程：\n1. 与音视频团队确认时间码格式\n2. 生成时间码音频文件\n3. 配置控台时间码输入\n4. 录制/编辑时间码 Cue\n5. 回放时自动触发\n\n注意事项：\n- 时间码必须完全同步\n- 测试备份播放方案\n- 准备手动触发备份',
      },
      {
        id: 'effects',
        title: '效果引擎基础',
        summary: '使用控台内置效果创造动态灯光。',
        detail: '效果引擎是创造动态灯光效果的核心工具。\n\n效果类型：\n- 光束效果：Pan/Tilt 摆动\n- 颜色效果：彩虹、闪烁\n- 亮度效果：波浪、脉冲\n- Gobo 效果：旋转、抖动\n\n参数控制：\n- Speed：效果速度\n- Size：效果范围\n- Spread：灯具间差异\n- Phase：相位偏移\n\n使用技巧：\n- 从简单效果开始\n- 控制灯具数量\n- 与音乐节拍配合\n- 避免效果过于复杂',
      },
    ],
  },
  {
    id: 'power',
    name: '配电知识',
    icon: 'flash-outline',
    cards: [
      {
        id: 'basics',
        title: '配电基础',
        summary: '舞台灯光配电的基本原理和安全规范。',
        detail: '配电是舞台安全的基础，必须严格遵守规范。\n\n基本概念：\n- 单相：220V 家用\n- 三相：380V 工业动力\n- 相电压：L-N（220V）\n- 线电压：L-L（380V）\n\n功率计算：\n- P = U × I（功率 = 电压 × 电流）\n- 单相：16A = 3.5kW\n- 三相：16A = 10.5kW\n\n安全规范：\n- 同一回路不超过 16A\n- 使用带漏电保护的配电箱\n- 定期检查线缆绝缘\n- 避免过载运行',
      },
      {
        id: 'distribution',
        title: '三相配电',
        summary: '大型演出使用的三相平衡配电方案。',
        detail: '三相配电是专业演出的标准方案。\n\n三相原理：\n- L1/L2/L3 三根相线\n- 每相 220V，相间 380V\n- 负载均匀分布在三相\n\n平衡原则：\n- 计算总功率\n- 平均分配到三相\n- 避免单相过载\n- 预留余量\n\n配置示例：\n- 总功率 30kW\n- 每相负载 10kW\n- 使用 32A 三相配电箱\n- 32A × 3 路 16A 分电',
      },
      {
        id: 'ups',
        title: 'UPS 不间断电源',
        summary: '为关键设备提供紧急备用电力的系统。',
        detail: 'UPS 是保障演出安全的重要设备。\n\nUPS 类型：\n- 在线式：始终逆变供电，最稳定\n- 后备式：市电异常时切换，较便宜\n- 双变换：结合两者优点\n\n容量选择：\n- 控台 + 显示器：1-2kVA\n- 完整备份系统：5-10kVA\n- 计算备用时间需求\n\n应用场景：\n- 主控台应急供电\n- 追光灯备用\n- 网络交换机\n- 通讯系统',
      },
    ],
  },
  {
    id: 'lightpath',
    name: '光路设计',
    icon: 'analytics-outline',
    cards: [
      {
        id: 'principles',
        title: '光路设计原则',
        summary: '创建专业灯光设计的基本步骤。',
        detail: '光路设计是灯光师创造视觉作品的核心技能。\n\n设计流程：\n1. 分析场地和舞美设计\n2. 确定主视觉方向\n3. 设计基础照明\n4. 添加层次和氛围\n5. 编排效果序列\n\n层次理论：\n- 基础层：确保演员可见\n- 造型层：创造立体感\n- 氛围层：染色和情绪\n- 效果层：动态视觉元素\n\n设计平衡：\n- 明暗对比\n- 色彩对比\n- 动静结合\n- 主次分明',
      },
      {
        id: 'layers',
        title: '灯光层次设计',
        summary: '通过多层灯光叠加创造丰富视觉效果。',
        detail: '灯光层次是专业设计的核心概念。\n\n标准层次：\n1. 基础照明（General）\n   - 保证基本可见度\n   - 均匀覆盖表演区\n2. 主光（Key Light）\n   - 主要造型光\n   - 定义主体形态\n3. 辅助光（Fill）\n   - 填充阴影\n   - 控制明暗比\n4. 轮廓光（Back Light）\n   - 分离主体与背景\n   - 增加空间感\n5. 效果光（Effect）\n   - 特殊视觉效果\n   - 氛围营造\n\n明暗比：\n- 1:2：轻度立体（演唱会）\n- 1:4：中度立体（戏剧）\n- 1:8：强烈对比（戏剧强调）',
      },
    ],
  },
  {
    id: 'workflow',
    name: '演出流程',
    icon: 'git-branch-outline',
    cards: [
      {
        id: 'loadin',
        title: '装台流程 (Load-In)',
        summary: '从设备进场到灯光就绪的规范化操作。',
        detail: '装台是演出准备的关键阶段，需要系统化管理。\n\n标准流程：\n1. 设备进场卸货\n   - 核对设备清单\n   - 检查运输损坏\n2. 桁架吊挂安装\n   - 确认承重安全\n   - 安装保险绳\n3. 灯具安装接线\n   - 按灯位图安装\n   - 接入 DMX 和电源\n4. 控台编程\n   - 下载预编程\n   - 现场调整\n5. 技术彩排\n   - 与演出团队配合\n   - 完善 Cue\n\n安全要点：\n- 高空作业必须使用安全带\n- 灯具必须挂安全绳\n- 配电箱上锁管理\n- 保持通道畅通',
      },
      {
        id: 'tech',
        title: '技术彩排 (Tech Rehearsal)',
        summary: '灯光、音响、视频全系统联调。',
        detail: '技术彩排是确保演出质量的关键环节。\n\n彩排阶段：\n1. Dry Tech\n   - 无演员参与\n   - 检查所有 Cue\n   - 确认时间码同步\n2. Cue-to-Cue\n   - 演员就位\n   - 逐 Cue 运行\n   - 记录调整需求\n3. Full Run\n   - 完整演出时长\n   - 全系统联调\n4. Dress Rehearsal\n   - 带妆彩排\n   - 完整流程模拟\n\n灯光师准备：\n- CueList 打印稿\n- 手电筒（白色柔光）\n- 备用通话耳麦\n- 笔记本记录问题',
      },
      {
        id: 'emergency',
        title: '应急预案',
        summary: '设备故障或突发情况的应急处理。',
        detail: '应急预案是保障演出安全的重要准备。\n\n常见故障应对：\n1. 灯具灭灯\n   - 检查 DMX 信号\n   - 切换备份 Cue\n   - 准备备用灯具\n2. 控台死机\n   - 切换备份控台\n   - 保持当前 Cue\n3. 某区断电\n   - 检查配电箱\n   - 调整功率分配\n   - 通知技术总监\n\n建议准备：\n- UPS 不间断电源\n- 备份 Cue 随时可用\n- 对讲机保持通讯\n- 备用灯泡和保险丝\n\n沟通原则：\n- 快速判断问题\n- 优先保障安全\n- 及时汇报情况',
      },
      {
        id: 'maintenance',
        title: '设备维护',
        summary: '灯光设备的日常维护和保养。',
        detail: '定期维护延长设备寿命，保证演出质量。\n\n日常检查：\n- 使用前检查所有设备\n- 清洁灯具透镜\n- 检查线缆完整性\n- 测试 DMX 信号\n\n定期保养：\n- 电脑灯：清洁 Gobo、色轮\n- 换色器：检查电机和卡槽\n- 电源：检查接头和电压\n- 风扇：清洁或更换\n\n记录管理：\n- 使用日志\n- 维修记录\n- 耗材更换\n- 租赁设备归还\n\n存放要求：\n- 干燥通风\n- 避免阳光直射\n- 定期通电测试\n- 原始包装存储',
      },
    ],
  },
];

const categoryIcons: { [key: string]: string } = {
  fixtures: 'bulb-outline',
  positions: 'grid-outline',
  color: 'color-palette-outline',
  dmx: 'git-network-outline',
  console: 'options-outline',
  power: 'flash-outline',
  lightpath: 'analytics-outline',
  workflow: 'git-branch-outline',
};

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
          card.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.detail.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentCategory.cards;

  const handleCardPress = (cardId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      
      <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 16}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <PageHeader 
          title="灯光理论知识库" 
          subtitle="专业舞台灯光知识" 
          showTopSafeArea={false} 
        />
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
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setActiveCategory(index);
              setSearchQuery('');
              setExpandedCard(null);
            }}
          >
            <Ionicons 
              name={categoryIcons[category.id] as any} 
              size={18} 
              color={activeCategory === index ? Colors.primary : Colors.textSecondary} 
              style={styles.categoryIcon}
            />
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

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {currentCategory.name} · 共 {currentCategory.cards.length} 条
        </Text>
        {searchQuery.trim() !== '' && (
          <Text style={styles.statsText}>
            搜索结果：{filteredCards.length} 条
          </Text>
        )}
      </View>

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
              activeOpacity={0.85}
              onPress={() => handleCardPress(card.id)}
            >
              <GlassCard style={[styles.card, expandedCard === card.id && styles.cardExpanded]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Ionicons
                      name={expandedCard === card.id ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={Colors.textMuted}
                    />
                  </View>
                  <Text style={styles.cardSummary}>{card.summary}</Text>
                </View>
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
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  statsText: {
    fontSize: 12,
    color: Colors.textMuted,
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
  cardExpanded: {
    backgroundColor: Colors.glassRaised,
  },
  cardHeader: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
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
