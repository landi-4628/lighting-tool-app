# Lighting Tool App

Expo 项目，用于灯光相关工具与计算。

## 本地开发

1. 安装依赖

   ```bash
   npm install
   ```

2. 启动项目

   ```bash
   npx expo start
   ```

3. 运行到设备或模拟器

   - 用 Expo Go 扫码
   - 或用 Android/iOS 模拟器
   - 或在真机上做开发构建

## 打包成安卓 APK

推荐使用 EAS Build：

1. 登录 Expo

   ```bash
   npx expo login
   ```

2. 初始化 EAS 配置

   ```bash
   npx eas build:configure
   ```

3. 构建 APK

   ```bash
   npx eas-cli build --platform android --profile preview
   ```

构建完成后，Expo 会提供下载链接。首次构建需要较长时间。

## 打包成 iOS 安装包

推荐使用 EAS Build：

1. 登录 Expo 并初始化 EAS 配置

   ```bash
   npx expo login
   npx eas build:configure
   ```

2. 构建 iOS 安装包

   ```bash
   npx eas-cli build --platform ios --profile preview
   ```

3. 安装方式

   - 通过 TestFlight 分发
   - 或使用 Apple Configurator / 企业证书安装

注意：iOS 打包需要有效的 Apple Developer Program 账号，并且需要在 EAS 中配置相应的证书和描述文件。
