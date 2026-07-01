/**
 * 灯光大师 App 主题配色
 * 基于原始网页的 CSS 变量
 */

export const Colors = {
  // 背景色
  bg: '#06070b',

  // 玻璃态效果
  glass: 'rgba(255, 255, 255, 0.04)',
  glassHover: 'rgba(255, 255, 255, 0.07)',
  glassCard: 'rgba(255, 255, 255, 0.04)',
  glassRaised: 'rgba(255, 255, 255, 0.055)',
  glassBorder: 'rgba(255, 255, 255, 0.07)',

  // 边框色
  border: 'rgba(255, 255, 255, 0.07)',
  borderIce: 'rgba(180, 210, 240, 0.14)',
  borderActive: 'rgba(125, 211, 252, 0.3)',
  inputBg: 'rgba(255, 255, 255, 0.04)',

  // 主色调
  primary: '#38bdf8',
  primaryDark: '#7dd3fc',
  primaryGlow: 'rgba(56, 189, 248, 0.15)',

  // 状态色
  success: '#4ade80',
  danger: '#f87171',
  warning: '#fbbf24',

  // 文字色
  text: '#e2e8f0',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',

  // 颜色渐变
  gradient: {
    bgStart: 'rgba(56, 189, 248, 0.04)',
    bgEnd: 'transparent',
  },
};

// 玻璃态卡片样式
export const glassCardStyle = {
  backgroundColor: Colors.glassCard,
  borderWidth: 1,
  borderColor: Colors.borderIce,
  borderRadius: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 4,
};

// 玻璃态按钮样式
export const glassButtonStyle = {
  backgroundColor: 'rgba(56, 189, 248, 0.15)',
  borderWidth: 1,
  borderColor: 'rgba(125, 211, 252, 0.25)',
  borderRadius: 14,
  paddingVertical: 12,
  paddingHorizontal: 24,
};

// 玻璃态输入框样式
export const glassInputStyle = {
  backgroundColor: Colors.inputBg,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 14,
  paddingVertical: 12,
  paddingHorizontal: 16,
  color: Colors.text,
  fontSize: 15,
};

// 玻璃态 Tab 样式
export const glassTabStyle = {
  backgroundColor: Colors.glass,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 16,
  padding: 4,
};

// 阴影效果
export const shadows = {
  glow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
};
