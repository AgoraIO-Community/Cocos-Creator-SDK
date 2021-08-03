# Agora Cocos Creator SDK

*其他语言版本：[中文](README.zh.md)*

## Prerequisites

* >= Cocos Creator 2.4
* iOS SDK 8.0+
* Android 5.0+
* A valid Agora account [Sign up](https://dashboard.agora.io/en/) for free.

Open the specified ports in [Firewall Requirements](https://docs.agora.io/en/Agora%20Platform/firewall?platform=All%20Platforms) if your network has a firewall.

### Generate an App ID

In the next step, you need to use the App ID of your project. Follow these steps to [Create an Agora project](https://docs.agora.io/en/Agora%20Platform/manage_projects?platform=All%20Platformshttps://docs.agora.io/en/Agora%20Platform/manage_projects?platform=All%20Platforms#create-a-new-project) in Console and get an [App ID](https://docs.agora.io/en/Agora%20Platform/terms?platform=All%20Platforms#a-nameappidaapp-id).

1. Go to [Console](https://dashboard.agora.io/) and click the [Project Management](https://dashboard.agora.io/projects) icon on the left navigation panel. 
2. Click **Create** and follow the on-screen instructions to set the project name, choose an authentication mechanism (for this project select App ID without a certificate), and Click **Submit**. 
3. On the **Project Management** page, find the **App ID** of your project. 

Check the end of document if you want to use App ID with the certificate.

### Steps to use this SDK

* Download and extract the zip file (or clone this repository).
* Find `~/.CocosCreator/services/agora` and replace all files.
* Download Agora SDK which matched the version，the version code part of `package.json/version` value in the middle.
  Sample as `1.2.1_3.1.2_3.2.1`，you need to download the `3.1.2` version of SDK.
  - SDK link sample:
    - Audio:
      - https://download.agora.io/sdk/release/Agora_Native_SDK_for_Android_v3_1_2_VOICE.zip
      - https://download.agora.io/sdk/release/Agora_Native_SDK_for_iOS_v3_1_2_VOICE.zip
    - Video:
      - https://download.agora.io/sdk/release/Agora_Native_SDK_for_Android_v3_1_2_FULL.zip
      - https://download.agora.io/sdk/release/Agora_Native_SDK_for_iOS_v3_1_2_FULL.zip
* Extract SDK to the `resources/sdk` folder（Audio and Video in different folder）.
  - `android/agora/audio` and `android/agora/video` folders save the `.so` file，`android/lib/audio` and `android/lib/video` save the `.jar` file.
  - `ios/agora/audio` and `ios/agora/video` folders save the `.framework` file. (Not need, use Cocoapods instead of now)
* Finally, Use Cocos Creator build to make SDK work.

## Sources

* Agora [API doc](https://docs.agora.io/en/)

## License

MIT
