import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-reanimated';

import { Colors } from '@/constants/colors';

export const unstable_settings = {
  anchor: '(tabs)',
};

const AppDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.bg,
    card: Colors.bg,
    text: Colors.text,
    border: Colors.border,
    primary: Colors.primary,
  },
};

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ThemeProvider value={AppDarkTheme}>
        <StatusBar style="light" backgroundColor={Colors.bg} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.bg },
            sceneStyle: { backgroundColor: Colors.bg },
            animation: 'simple_push',
            animationDuration: 180,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="menu" />
          <Stack.Screen name="tools/bpm" options={{ title: 'BPM 检测' }} />
          <Stack.Screen name="tools/ltc" options={{ title: 'LTC 时码' }} />
          <Stack.Screen name="tools/audio" options={{ title: '音频工具' }} />
          <Stack.Screen name="tools/dmx" options={{ title: 'DMX 地址码' }} />
          <Stack.Screen name="tools/fixture" options={{ title: '灯库制作' }} />
          <Stack.Screen name="tools/knowledge" options={{ title: '灯光理论知识库' }} />
          <Stack.Screen name="tools/power" options={{ title: '功率计算' }} />
          <Stack.Screen name="tools/troubleshoot" options={{ title: '故障分析' }} />
          <Stack.Screen name="tools/beam" options={{ title: '光束角度' }} />
          <Stack.Screen name="tools/glossary" options={{ title: '术语翻译' }} />
          <Stack.Screen name="tools/ma-commands" options={{ title: 'MA 宏命令' }} />
          <Stack.Screen name="tools/illuminance" options={{ title: '照度色温' }} />
          <Stack.Screen name="tools/color" options={{ title: '调色配色' }} />
        </Stack>
      </ThemeProvider>
    </View>
  );
}
