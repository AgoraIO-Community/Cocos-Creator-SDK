# Agora Cocos Creator SDK

*Other language: [English](README.md)*

## 准备工作

* Cocos Creator 2.4 及以上
* iOS SDK 8.0 及以上
* Android 5.0 及以上
* 有效的 Agora 账户 [免费注册](https://dashboard.agora.io/cn/)

如果你的网络环境部署了防火墙，请参考 [应用企业防火墙限制](https://docs.agora.io/cn/Agora%20Platform/firewall?platform=All%20Platforms) 打开相应端口。

### 创建项目并获取 App ID

要运行示例应用程序，你需要首先获取 Agora App ID。参考以下步骤在控制台 [创建一个 Agora 项目](https://docs.agora.io/cn/Agora%20Platform/manage_projects?platform=All%20Platforms#%E5%88%9B%E5%BB%BA%E6%96%B0%E9%A1%B9%E7%9B%AE) ，并获取一个 [App ID](https://docs.agora.io/cn/Agora%20Platform/terms?platform=All%20Platforms#a-nameappidaapp-id) 。

1. 前往 [控制台](https://console.agora.io/) ，并点击左侧导航栏的 [项目管理](https://console.agora.io/projects) 按钮。
2. 点击 **创建** ，按照屏幕提示设置项目名，选择一种鉴权机制，然后点击 **提交** 。
3. 在你的 **项目管理** 页面，你可以获取项目的 **App ID** 。

### 使用SDK

* 下载并解压程序 zip 包。
* 找到 `~/.CocosCreator/services/agora` 并替换所有文件。
* 下载对应版本的Agora SDK，版本号为`package.json`的`version`中间部分的版本，如`1.2.1_3.1.2_3.2.1`，则下载`3.1.2`版本的SDK。
  - 下载链接示例：
    - 音频：
      - https://download.agora.io/sdk/release/Agora_Native_SDK_for_Android_v3_1_2_VOICE.zip
      - https://download.agora.io/sdk/release/Agora_Native_SDK_for_iOS_v3_1_2_VOICE.zip
    - 视频：
      - https://download.agora.io/sdk/release/Agora_Native_SDK_for_Android_v3_1_2_FULL.zip
      - https://download.agora.io/sdk/release/Agora_Native_SDK_for_iOS_v3_1_2_FULL.zip
* 将下载的SDK解压到`resources/sdk`目录下（注意音频和视频放在不同目录下）。
  - `android/agora/audio`和`android/agora/video`目录存放so文件，`android/lib/audio`和`android/lib/video`存放jar文件
  - `ios/agora/audio`和`ios/agora/video`目录存放framework文件（暂不需要，已通过Cocoapods方式导入）
* 最后可通过Cocos Creator的build来使SDK生效

## 附录

* Agora [API doc](https://docs.agora.io/cn/)

## License

MIT
