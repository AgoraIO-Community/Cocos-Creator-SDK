'use strict';
const path = require('fire-path');
const fs = require('fire-fs');
const utils = Editor.require('packages://cocos-services/panel/utils/utils.js');
const {ios} = Editor.require('app://editor/core/native-packer');
const ProjHelper = Editor.require(
    'packages://cocos-services/panel/utils/projHelper.js');
const creatorHomePath = Editor.isMainProcess ?
    Editor.App.home :
    Editor.remote.App.home;

var projHelper;

function addUsesPermission(permission) {
  let manifestPath = this.androidPath + '/app/AndroidManifest.xml';
  if (!fs.existsSync(manifestPath)) return;
  let contents = fs.readFileSync(manifestPath, 'utf8');
  if (contents.indexOf(permission) >= 0) return;
  var perStr = `    <uses-permission android:name="android.permission.${permission}"/>`;
  projHelper.insertCodeLine(manifestPath, 'uses-permission', perStr);
}

let checkContentByFile = function(filePath, reg) {
  if (!fs.existsSync(filePath)) return false;
  let contents = fs.readFileSync(filePath, 'utf8');
  return contents.match(reg) != null;
};

module.exports = {
  /**
   * 开启服务时会调用此函数，在此函数中要完成的工作：
   *  若服务存在 js 版本的 sdk，则在此处就应该将 sdk 引入到用户的项目中
   * @param {String} projectPath 项目根路径
   * @param {Object} params 服务的参数 ( 若未填写则为 null )
   */
  onServiceEnable(projectPath, params) {
    // 在此处完成 js sdk 的引用
    // Todo...
    try {
      let metaName = 'agora';
      let assetDir = `${projectPath}/assets/${metaName}`;
      if (fs.existsSync(assetDir)) utils.removeDir(assetDir);
      utils.copyDir(`${__dirname}/resources/js/${metaName}`, assetDir);
      Editor.assetdb.refresh(`db://assets/${metaName}`);
      utils.copyFile(`${__dirname}/resources/js/${metaName}.d.ts`,
          `${projectPath}/${metaName}.d.ts`);

      utils.copyDir(
          path.join(__dirname, '/resources/ccservices-agora-preview-script'),
          projectPath + '/packages/ccservices-agora-preview-script',
      );

      if (params.sdkType === 'video') {
        utils.copyDir(
            path.join(__dirname, '/resources/components/AgoraVideoRender'),
            creatorHomePath + '/cloud-component/AgoraVideoRender',
        );
      }
    } catch (e) {
    }
    utils.printToCreatorConsole('log',
        'Agora service js sdk installation is complete!');
  },

  /**
   * 关闭服务时会调用此函数，在此函数中要完成的工作：
   *  将开启服务时安装的 sdk 从用户项目中移除引用并删除
   * @param {String} projectPath 项目根路径
   * @param {Object} params 服务的参数(若未填写则为 null)
   */
  onServiceDisable(projectPath, params) {
    // 在此处完成 js sdk 的移除
    // Todo...
    try {
      let metaName = 'agora';
      if (Editor.assetdb.exists(
          `db://assets/${metaName}`)) Editor.assetdb.delete(
          [`db://assets/${metaName}`]);
      if (fs.existsSync(`${projectPath}/${metaName}.d.ts`)) fs.unlinkSync(
          `${projectPath}/${metaName}.d.ts`);
      utils.removeDir(
          projectPath + '/packages/ccservices-agora-preview-script');

      utils.removeDir(creatorHomePath + '/cloud-component/AgoraVideoRender');
    } catch (e) {
    }
    utils.printToCreatorConsole('log',
        'Agora service js sdk uninstallation is complete!');
  },

  /**
   * 当 Creator 构建项目时，且当前服务处于开启状态会调用此函数，在此函数中要完成的工作：
   *   将对应服务的 sdk 集成到项目中
   * @param {Object} options 编译选项
   * @param {Object} params 服务的参数(若未填写则为 null)
   */
  onBuildedProjectEnable(options, params) {
    projHelper = new ProjHelper(options);
    projHelper.Android.addUsesPermission = addUsesPermission;
    projHelper.Android.androidPath = path.join(options.dest,
        `frameworks/runtime-src/proj.android-studio`);

    // Editor.Builder.on("build-finished", this.handleEventForCocoaPods);
    // 在此处完成构建项目服务 sdk 的集成
    // Todo...
    if (options.platform === 'android') {
      var apiRegRes = options.apiLevel.match(/\d+/);
      if (apiRegRes) {
        if (parseInt(apiRegRes[0]) < 23) {
          utils.printToCreatorConsole('warn',
              'The Agora service plugin requires an Android platform API level of at least 23, please choose a higher platform to rebuild.');
          return;
        }
      }
    }
    if (['ios', 'android', 'huawei-agc'].includes(options.platform)) {
      this.parseNative(options, params);
    }

    this.praseHTML();

    utils.printToCreatorConsole('log',
        'Agora service installation is complete!');
  },

  /**
   * 当 Creator 构建项目时，且当前服务处于关闭状态会调用此函数，在此函数中要完成的工作：
   *   将对应服务的 sdk 集成到项目中
   * @param {Object} options 编译选项
   * @param {Object} params 服务的参数(若未填写则为 null)
   */
  onBuildedProjectDisable(options, params) {
    projHelper = new ProjHelper(options);

    // 在此处完成构建项目服务 sdk 的卸载
    // Todo...
    let filePath = path.join(options.dest,
        'frameworks/runtime-src/Classes/AppDelegate.cpp');
    fs.exists(filePath) &&
    projHelper.noteCodeLine(filePath, '#define SERVICE_AGORA 1', '//');
    if (options.platform === 'android') {
      this.uninstallAndroid(options, params);
      utils.printToCreatorConsole('log',
          'Agora service uninstallation is complete!');
    }
  },

  parseNative(options, params) {
    let projectFilePath = path.join(options.dest, 'project.json');
    if (fs.existsSync(projectFilePath))
      utils.parseProjectJson(projectFilePath,
          'org.cocos2dx.javascript.service.ServiceAgora', true);
    this.copyFiles(options, params);
    this.modifyAppDelegate(options);
    if (options.platform === 'android') this.android(options, params);
    else if (options.platform === 'ios') this.ios(options, params);
  },

  modifyAppDelegate(options) {
    var runtimePath = path.join(options.dest, 'frameworks/runtime-src');
    let AppDelegatePath = path.join(runtimePath, 'Classes/AppDelegate.cpp');

    if (!fs.existsSync(AppDelegatePath)) return;
    let contents = fs.readFileSync(AppDelegatePath, 'utf8');
    if (contents.indexOf('SERVICE_AGORA') >= 0) {
      projHelper.replaceCodeSegment(AppDelegatePath,
          '//#define SERVICE_AGORA 1', '#define SERVICE_AGORA 1');
    } else {
      let includeAgora = `
#define SERVICE_AGORA 1
#if (CC_TARGET_PLATFORM == CC_PLATFORM_ANDROID || CC_TARGET_PLATFORM == CC_PLATFORM_IOS) && SERVICE_AGORA
#include "base/CCScheduler.h"
#include "agora/AgoraManager.h"
#endif
`;
      let registerAgora = `
#if (CC_TARGET_PLATFORM == CC_PLATFORM_ANDROID || CC_TARGET_PLATFORM == CC_PLATFORM_IOS) && SERVICE_AGORA
    getScheduler()->removeAllFunctionsToBePerformedInCocosThread();
    AgoraManager::getInstance()->registerJSBCallback();
#endif
      `;
      projHelper.insertCodeLine(AppDelegatePath, 'USING_NS_CC', includeAgora,
          true);
      projHelper.insertCodeLine(AppDelegatePath, 'se->start()', registerAgora,
          true);
    }
  },

  praseHTML() {
    const agoraHtml = `
<script src="https://cdn.agora.io/sdk/release/AgoraRTCSDK-3.1.2.js" charset="utf-8"></script>
`;
    projHelper.insertScriptToIndexHTML(agoraHtml);
  },

  copyFiles(options, params) {
    var isCreator23x = fs.existsSync(
        `${options.dest}/frameworks/runtime-src/proj.android-studio/jni/CocosAndroid.mk`);
    utils.printToCreatorConsole('info', isCreator23x);
    var runtimePath = path.join(options.dest, 'frameworks/runtime-src');
    var list = [];
    list.push({
      src: __dirname + '/resources/js-binding/agora',
      dst: path.join(runtimePath, 'Classes/agora'),
    });
    if (options.platform === 'android') {
      list.push({
        src: __dirname +
            `/resources/src/android/${params.sdkType}/ServiceAgora.java`,
        dst: path.join(runtimePath,
            'proj.android-studio/app/src/org/cocos2dx/javascript/service/ServiceAgora.java'),
      });
      list.push({
        src: __dirname +
            `/resources/sdk/android/lib/${params.sdkType}/agora-rtc-sdk.jar`,
        dst: path.join(runtimePath,
            'proj.android-studio/app/libs/agora-rtc-sdk.jar'),
      });
      list.push({
        src: __dirname + `/resources/sdk/android/agora/${params.sdkType}`,
        dst: path.join(runtimePath, isCreator23x ?
            'proj.android-studio/jni/agora' :
            'proj.android-studio/app/jni/agora'),
      });
    } else if (options.platform === 'ios') {
      // list.push({
      // 	src: __dirname + `/resources/sdk/ios/agora/${params.sdkType}`,
      // 	dst: path.join(runtimePath, "proj.ios_mac/ios/agora")
      // });
    }
    utils.copyServicePackages(list);
  },

  isInstall(options) {
    var isCreator23x = fs.existsSync(
        `${options.dest}/frameworks/runtime-src/proj.android-studio/jni/CocosAndroid.mk`);
    let filePath = path.join(options.dest,
        'frameworks/runtime-src/proj.android-studio',
        isCreator23x ? 'jni/CocosAndroid.mk' : 'app/jni/Android.mk');
    if (!fs.existsSync(filePath)) return;
    let contents = fs.readFileSync(filePath, 'utf8');
    return contents.indexOf('USE_AGORA') >= 0;
  },

  android(options, params) {
    var isCreator23x = fs.existsSync(
        `${options.dest}/frameworks/runtime-src/proj.android-studio/jni/CocosAndroid.mk`);
    let importAgora = `
#======================================= 
#=========Agora import segment==========
ifeq ($(USE_AGORA), 1)
include $(CLEAR_VARS)
LOCAL_MODULE := agora-rtc-sdk
LOCAL_SRC_FILES := $(LOCAL_PATH)/agora/$(TARGET_ARCH_ABI)/libagora-rtc-sdk.so
include $(PREBUILT_SHARED_LIBRARY)
include $(CLEAR_VARS)
LOCAL_MODULE := agora-soundtouch
LOCAL_SRC_FILES := $(LOCAL_PATH)/agora/$(TARGET_ARCH_ABI)/libagora-soundtouch.so
include $(PREBUILT_SHARED_LIBRARY)
include $(CLEAR_VARS)
LOCAL_MODULE := agora-mpg123
LOCAL_SRC_FILES := $(LOCAL_PATH)/agora/$(TARGET_ARCH_ABI)/libagora-mpg123.so
include $(PREBUILT_SHARED_LIBRARY)
include $(CLEAR_VARS)
LOCAL_MODULE := agora-fdkaac
LOCAL_SRC_FILES := $(LOCAL_PATH)/agora/$(TARGET_ARCH_ABI)/libagora-fdkaac.so
include $(PREBUILT_SHARED_LIBRARY)
include $(CLEAR_VARS)
LOCAL_MODULE := agora_ai_denoise_extension
LOCAL_SRC_FILES := $(LOCAL_PATH)/agora/$(TARGET_ARCH_ABI)/libagora_ai_denoise_extension.so
include $(PREBUILT_SHARED_LIBRARY)
include $(CLEAR_VARS)
LOCAL_MODULE := agora-core
LOCAL_SRC_FILES := $(LOCAL_PATH)/agora/$(TARGET_ARCH_ABI)/libagora-core.so
include $(PREBUILT_SHARED_LIBRARY)
${params.sdkType === 'video'  ? `
include $(CLEAR_VARS)
LOCAL_MODULE := agora-ffmpeg
LOCAL_SRC_FILES := $(LOCAL_PATH)/agora/$(TARGET_ARCH_ABI)/libagora-ffmpeg.so
include $(PREBUILT_SHARED_LIBRARY)
include $(CLEAR_VARS)
LOCAL_MODULE := agora_dav1d_extension
LOCAL_SRC_FILES := $(LOCAL_PATH)/agora/$(TARGET_ARCH_ABI)/libagora_dav1d_extension.so
include $(PREBUILT_SHARED_LIBRARY)
include $(CLEAR_VARS)
LOCAL_MODULE := agora_jnd_extension
LOCAL_SRC_FILES := $(LOCAL_PATH)/agora/$(TARGET_ARCH_ABI)/libagora_jnd_extension.so
include $(PREBUILT_SHARED_LIBRARY)
` : ''}
endif
#=======================================
        `;
    let usingAgora = isCreator23x ? `
#======================================
#==========Agora use segment===========
ifeq ($(USE_AGORA),1)
#traverse all the directory and subdirectory
define walk
  $(wildcard $(1)) $(foreach e, $(wildcard $(1)/*), $(call walk, $(e)))
endef

#find all the file recursively under jni/

ALLFILES = $(call walk, $(LOCAL_PATH)/../../Classes/agora)
FILE_LIST := $(filter %.cpp, $(ALLFILES))

LOCAL_SRC_FILES += $(FILE_LIST:$(LOCAL_PATH)/%=%)
LOCAL_C_INCLUDES += ../../Classes/agora \\
        ../../Classes/agora/callback \\
        ../../Classes/agora/common \\
        ../../Classes/agora/include \\
        ../../Classes/agora/observer \\
        ../../Classes/agora/rtcChannel \\
        ../../Classes/agora/rtcEngine \\
        ../../Classes/agora/test
LOCAL_SHARED_LIBRARIES := agora-rtc-sdk agora-soundtouch agora-mpg123 agora-fdkaac agora_ai_denoise_extension agora-core${params.sdkType === 'video' 
 ? ' agora-ffmpeg agora_dav1d_extension agora_jnd_extension' : ''}
endif
#======================================
        ` : `
#======================================
#==========Agora use segment===========
ifeq ($(USE_AGORA),1)
#traverse all the directory and subdirectory
define walk
  $(wildcard $(1)) $(foreach e, $(wildcard $(1)/*), $(call walk, $(e)))
endef

#find all the file recursively under jni/

ALLFILES = $(call walk, $(LOCAL_PATH)/../../../Classes/agora)
FILE_LIST := $(filter %.cpp, $(ALLFILES))

LOCAL_SRC_FILES += $(FILE_LIST:$(LOCAL_PATH)/%=%)
LOCAL_C_INCLUDES += ../../../Classes/agora \\
        ../../../Classes/agora/callback \\
        ../../../Classes/agora/common \\
        ../../../Classes/agora/include \\
        ../../../Classes/agora/observer \\
        ../../../Classes/agora/rtcChannel \\
        ../../../Classes/agora/rtcEngine \\
        ../../../Classes/agora/test
LOCAL_SHARED_LIBRARIES := agora-rtc-sdk agora-soundtouch agora-mpg123 agora-fdkaac agora_ai_denoise_extension agora-core${params.sdkType === 'video' 
 ? ' agora-ffmpeg agora_dav1d_extension agora_jnd_extension' : ''}
endif
#======================================
        `;
    let useAgora = `
USE_AGORA := 1
ifeq ($(USE_AGORA),1)
APP_CPPFLAGS += -DSERVICE_AGORA
endif\n\n
        `;
    let asPath = path.join(options.dest,
        'frameworks/runtime-src/proj.android-studio');
    this.modifyABIFilters(asPath);
    let androidMKPath = path.join(asPath,
        isCreator23x ? 'jni/CocosAndroid.mk' : 'app/jni/Android.mk');
    let applicationMKPath = path.join(asPath,
        isCreator23x ? 'jni/CocosApplication.mk' : 'app/jni/Application.mk');
    let buildGradePath = path.join(asPath, 'app/build.gradle');
    if (this.isInstall(options)) {
      projHelper.replaceCodeSegment(applicationMKPath, '#USE_AGORA := 1',
          'USE_AGORA := 1');
      projHelper.replaceCodeSegment(buildGradePath,
          '//implementation \'com.android.support:appcompat-v7:23.4.0\'',
          'implementation \'com.android.support:appcompat-v7:23.4.0');
      return;
    }
    projHelper.Android.addUsesPermission('READ_PHONE_STATE');
    projHelper.Android.addUsesPermission('INTERNET');
    projHelper.Android.addUsesPermission('RECORD_AUDIO');
    if (params.sdkType === 'video') {
      projHelper.Android.addUsesPermission('CAMERA');
    }
    projHelper.Android.addUsesPermission('MODIFY_AUDIO_SETTINGS');
    projHelper.Android.addUsesPermission('ACCESS_NETWORK_STATE');
    projHelper.Android.addUsesPermission('READ_EXTERNAL_STORAGE');
    projHelper.Android.addUsesPermission('READ_PRIVILEGED_PHONE_STATE');
    projHelper.insertCodeLine(androidMKPath, /CLEAR_VARS/, importAgora);
    projHelper.insertCodeLine(androidMKPath, /cocos2dx_static/, usingAgora,
        true);
    projHelper.insertCodeLine(applicationMKPath, /NDK_DEBUG/, useAgora, true);
    let dependenciesCode = `
dependencies {
    implementation 'com.android.support:appcompat-v7:23.4.0'`;
    projHelper.replaceCodeSegment(buildGradePath, 'dependencies {',
        dependenciesCode);

    var proguradRules = `
# Proguard Agora for release
-keep class io.agora.** { *; }
-dontwarn io.agora.**
`;
    var proguradPath = options.dest +
        '/frameworks/runtime-src/proj.android-studio/app/proguard-rules.pro';
    if (!fs.existsSync(proguradPath)) return;
    let contents = fs.readFileSync(proguradPath, 'utf8');
    if (contents.indexOf('Agora') >= 0) return;
    projHelper.appendCodeLine(proguradPath, proguradRules);
  },

  modifyABIFilters(asPath) {
    let appBuildGradePath = path.join(asPath, 'app/build.gradle');
    if (fs.existsSync(appBuildGradePath) &&
        !checkContentByFile(appBuildGradePath,
            /ndk[\s]*\{[\s\S]*abiFilters[\s]*PROP_APP_ABI\.split\(/))
      projHelper.replaceCodeSegment(appBuildGradePath,
          /\}[\s]*\}[\s]*sourceSets\.main/g,
          `    ndk { abiFilters PROP_APP_ABI.split(':') }\n        }\n    }\n\n    sourceSets.main`);
  },

  async ios(options, params) {
    let targetName = `${options.projectName}-mobile`;
    projHelper.iOS.addToHeaderSearchPaths('"$(SRCROOT)/ios/agora/include"');
    projHelper.iOS.addToHeaderSearchPaths('"$(SRCROOT)/../Classes/agora"');
    projHelper.iOS.addToHeaderSearchPaths(
        '"$(SRCROOT)/../Classes/agora/callback"');
    projHelper.iOS.addToHeaderSearchPaths(
        '"$(SRCROOT)/../Classes/agora/common"');
    projHelper.iOS.addToHeaderSearchPaths(
        '"$(SRCROOT)/../Classes/agora/include"');
    projHelper.iOS.addToHeaderSearchPaths(
        '"$(SRCROOT)/../Classes/agora/observer"');
    projHelper.iOS.addToHeaderSearchPaths(
        '"$(SRCROOT)/../Classes/agora/rtcChannel"');
    projHelper.iOS.addToHeaderSearchPaths(
        '"$(SRCROOT)/../Classes/agora/rtcEngine"');
    projHelper.iOS.addToHeaderSearchPaths('"$(SRCROOT)/../Classes/agora/test"');
    // projHelper.iOS.addFrameworkToTarget("ios/agora/AgoraRtcCryptoLoader.framework", targetName);
    // projHelper.iOS.addFrameworkToTarget("ios/agora/AgoraRtcKit.framework", targetName);
    projHelper.iOS.addSourceFileToProject(
        'agora/callback/rtcChannnelCallback/RtcChannelEventHandler.cpp',
        'Classes', targetName);
    projHelper.iOS.addSourceFileToProject(
        'agora/callback/rtcEngineCallback/RtcEngineEventHandler.cpp', 'Classes',
        targetName);
    projHelper.iOS.addSourceFileToProject(
        'agora/deviceManager/audioDeviceManager/AudioPlaybackDeviceManager.cpp',
        'Classes', targetName);
    projHelper.iOS.addSourceFileToProject(
        'agora/deviceManager/audioDeviceManager/AudioRecordingDeviceManager.cpp',
        'Classes', targetName);
    projHelper.iOS.addSourceFileToProject(
        'agora/deviceManager/videoDeviceManager/VideoDeviceManager.cpp',
        'Classes', targetName);
    projHelper.iOS.addSourceFileToProject(
        'agora/observer/metadata/metadata_observer.cpp', 'Classes', targetName);
    projHelper.iOS.addSourceFileToProject(
        'agora/rtcChannel/RtcChannelBridge.cpp', 'Classes', targetName);
    projHelper.iOS.addSourceFileToProject('agora/rtcEngine/RtcEngineBridge.cpp',
        'Classes', targetName);
    projHelper.iOS.addSourceFileToProject('agora/test/ApiTester.cpp', 'Classes',
        targetName);
    projHelper.iOS.addSourceFileToProject('agora/test/EventTester.cpp',
        'Classes', targetName);
    projHelper.iOS.addSourceFileToProject('agora/test/LogJson.cpp', 'Classes',
        targetName);
    projHelper.iOS.addSourceFileToProject('agora/AgoraManager.cpp', 'Classes',
        targetName);
    projHelper.iOS.addSourceFileToProject('agora/Extensions.cpp', 'Classes',
        targetName);
    projHelper.iOS.addSourceFileToProject('agora/jsb_agoraCreator.cpp',
        'Classes', targetName);
    projHelper.iOS.addSourceFileToProject('agora/VideoFrameObserver.cpp',
        'Classes', targetName);
    params.requireTips = 'Request Microphone Permission';
    let infoStr = `<dict>
	<key>NSMicrophoneUsageDescription</key>
    <string>${params.requireTips}</string>`;
    let infoPlistPath = options.dest +
        '/frameworks/runtime-src/proj.ios_mac/ios/Info.plist';
    projHelper.replaceCodeSegment(infoPlistPath, '<dict>', infoStr);
    if (params.sdkType === 'video') {
      params.requireTips = 'Request Camera Permission';
      let infoStr = `<dict>
      <key>NSCameraUsageDescription</key>
      <string>${params.requireTips}</string>`;
      let infoPlistPath = options.dest +
          '/frameworks/runtime-src/proj.ios_mac/ios/Info.plist';
      projHelper.replaceCodeSegment(infoPlistPath, '<dict>', infoStr);
    }
    await this.handleiOSCocoaPods(options, params);
  },

  async handleiOSCocoaPods(options, params) {
    // 第一步，判断是否安装 pod 命令
    let iosPacker = new ios(options);
    if (!iosPacker.checkPodEnvironment()) return Promise.reject();
    // 第二步，创建Podfile已经，如果以来已存在，那么不进行修改和更新
    let dependence = (params.sdkType === 'video' ?
        'AgoraRtcEngine_iOS' :
        'AgoraAudio_iOS');
    let version = (params.sdkType === 'video' ? '\'3.4.6\'' : '\'3.4.6\'');
    let target = `${options.projectName}-mobile`;
    if (!iosPacker.isDependenceExist(dependence,
        target)) iosPacker.addPodDependenceForTarget(dependence, target,
        version);
    utils.printToCreatorConsole('info',
        'Start to execute CocoaPods, please wait patiently for the execution to complete before executing the subsequent operation!');
    await iosPacker.executePodFile();
    utils.printToCreatorConsole('info',
        'CocoaPods was successfully executed, and now you can perform subsequent operations!');

    //第三步，往 UserConfigIOS.debug.xcconfig 添加 pod include
    this._addIncludeToUserConfig(path.join(options.dest,
        `frameworks/runtime-src/proj.ios_mac/ios/UserConfigIOS.debug.xcconfig`),
        options.projectName, 'debug');
    this._addIncludeToUserConfig(path.join(options.dest,
        `frameworks/runtime-src/proj.ios_mac/ios/UserConfigIOS.release.xcconfig`),
        options.projectName, 'release');
  },

  _addIncludeToUserConfig(path, projectName, mode) {
    if (!fs.existsSync(path)) return Editor.warn('file not found ', path);
    let str = `#include "Pods/Target Support Files/Pods-${projectName}-mobile/Pods-${projectName}-mobile.${mode}.xcconfig"`;
    let content = fs.readFileSync(path, 'utf8');
    if (content.indexOf(str) !== -1) return;
    content += str + '\n';
    fs.writeFileSync(path, content);
  },

  uninstallAndroid(options, params) {
    var isCreator23x = fs.existsSync(
        `${options.dest}/frameworks/runtime-src/proj.android-studio/jni/CocosAndroid.mk`);
    var runtimePath = path.join(options.dest, 'frameworks/runtime-src');
    var list = [];
    list.push({
      src: __dirname +
          `/resources/src/android/${params.sdkType}/ServiceAgora.java`,
      dst: path.join(runtimePath,
          'proj.android-studio/app/src/org/cocos2dx/javascript/service/ServiceAgora.java'),
    });
    list.push({
      src: __dirname +
          `/resources/sdk/android/lib/${params.sdkType}/agora-rtc-sdk.jar`,
      dst: path.join(runtimePath,
          'proj.android-studio/app/libs/agora-rtc-sdk.jar'),
    });
    list.push({
      src: __dirname + `/resources/sdk/android/agora/${params.sdkType}`,
      dst: path.join(runtimePath, isCreator23x ?
          'proj.android-studio/jni/agora' :
          'proj.android-studio/app/jni/agora'),
    });
    utils.deleteServicePackages(list);
    let filePath = path.join(options.dest,
        'frameworks/runtime-src/proj.android-studio',
        isCreator23x ? 'jni/CocosApplication.mk' : 'app/jni/Application.mk');
    fs.existsSync(filePath) &&
    projHelper.noteCodeLine(filePath, 'USE_AGORA := 1', '#');

    let buildGradePath = path.join(options.dest,
        'frameworks/runtime-src/proj.android-studio/app/build.gradle');
    fs.existsSync(buildGradePath) && projHelper.noteCodeLine(buildGradePath,
        'implementation \'com.android.support:appcompat-v7:23.4.0\'', '//');
  },
};
