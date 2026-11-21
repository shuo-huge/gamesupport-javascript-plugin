# 最简 JavaScript 插件模板

只需修改 `plugin.cjs`，没有 npm 依赖。示例收到主程序“请求测试事件”命令时发送 `example.pulse`，不是游戏识别器。

## 构建

开发机需要 Windows x64、Node.js 22+ 和 Go（仅用来构建小型 EXE 启动器）。在 GameSupport 项目根目录执行：

```powershell
node sdk/examples/javascript-event-provider/build.mjs
./scripts/ipc-debug.ps1 -PluginDirectory ./build/javascript-example
```

输出在 `build/javascript-example`。包含 `manifest.json`、`plugin.cjs`、`bin/launcher.exe`、`bin/node.exe`。Node 运行时随包分发，最终用户无需安装 Node 或 Go；包体会包含完整 node.exe，并非小体积单文件程序。当前版本主程序只支持 EXE 入口，不能把 JS 文件直接当作入口安装。

## 安装使用

1. 插件中心 → 安装本地插件 → 选择 `build/javascript-example`。
2. 打开“配置与权限”，勾选 `events.emit`，保存后启动。
3. 触发中心创建规则，事件标识填 `example.pulse`，加入你自己的音效或动画并保存。
4. 插件配置页点击“请求测试事件”，查看事件记录和实际播放。

不需要开启本地 HTTP API。本模板通过 stdin/stdout 直接连接主程序。`stdout` 只能输出一行一条 JSON，普通日志使用 `console.error()`。

## 修改逻辑

将自己的事件检测逻辑放在 `plugin.cjs` 的 `emitPulse()` 附近。只有启动且已授权时才发送事件。初始化配置在 `message.config`；停止时清理自建的定时器、连接等。不要阻塞 JS 事件循环，否则无法回复心跳。

新增事件时同时修改构建脚本的 `events` 清单；更换插件 ID/版本时同步修改脚本 hello 和构建脚本 manifest。每次修改后重新构建，以更新 SHA-256。已安装包修改后应提高版本，停止旧插件，通过“更新”安装新包，再重新授权；不要直接改用户插件目录以绕过完整性校验。

这是 Native 插件，不是 JavaScript 沙箱。权限勾选不会限制 Node 本身的 Windows 能力；仅安装可信来源的代码。分发 Node 运行时时还应遵守对应发行版的许可和第三方声明。

完整规范：[Plugin SDK 1.0](../../../docs/PLUGIN-SDK.md)。
