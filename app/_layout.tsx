import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#06070b' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="tools/bpm" options={{ title: 'BPM 检测' }} />
        <Stack.Screen name="tools/ltc" options={{ title: 'LTC 时码' }} />
        <Stack.Screen name="tools/audio" options={{ title: '音频工具' }} />
        <Stack.Screen name="tools/dmx" options={{ title: 'DMX 地址码' }} />
        <Stack.Screen name="tools/fixture" options={{ title: '灯库制作' }} />
        <Stack.Screen name="tools/knowledge" options={{ title: '灯光理论知识库' }} />
      </Stack>
    </ThemeProvider>
  );
}
