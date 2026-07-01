import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * 在 web 端静态预渲染期间，真实的主题值尚未确定。
 * 之前在 hydration 前直接返回 'light' 会让 React Navigation 的
 * ThemeProvider 使用 DefaultTheme (白色背景) 进行第一次渲染，
 * 从而在切页/首屏时出现白屏闪烁。
 *
 * 这里在 hydration 前返回 null，让调用方（_layout）走自己的
 * 强制深色逻辑，避免任何与系统色相关的中间渲染态。
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (!hasHydrated) {
    return null;
  }

  return useRNColorScheme();
}
