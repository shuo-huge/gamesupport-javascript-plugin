# GameSupport JavaScript 简易插件开发文档

本文仅使用 JavaScript 示例。事件插件负责提供事件，音效与动画由触发中心规则统一执行。SDK 1.1 新增菜单和工具页面，纯 JavaScript 界面插件不需要独立进程，详见 [菜单与界面开发](PLUGIN-UI.md) 和 [动画编辑器模板](../sdk/examples/animation-editor/README.md)。下文为事件插件与 GS-IPC。

## 创建第一个插件

JavaScript 开发者可直接使用 [最简 JavaScript 模板](../sdk/examples/javascript-event-provider/README.md)：`node sdk/examples/javascript-event-provider/build.mjs` 构建，再在插件中心安装 `build/javascript-example`。模板附带 Node 运行时，通过小型 EXE 启动器适配当前 Host，无 npm 依赖；开发机构建启动器需要 Go。最终用户不需要额外安装 Node/Go。

开发机需要 Windows x64、Node.js 22+ 和 Go（仅用于构建 EXE 启动器）。在项目根目录执行：

```powershell
node sdk/examples/javascript-event-provider/build.mjs
./scripts/ipc-debug.ps1 -PluginDirectory ./build/javascript-example
```

在插件中心安装 `build/javascript-example`，声明能力默认自动启用，无需额外勾选权限。点击启动，等待“运行中”。创建事件为 `example.pulse` 的规则，加入音效和动画并保存。在插件配置页点击“请求测试事件”。模板只在收到测试命令后发送示例事件，不会定时自动触发，也不需要开启本地 HTTP API。

最终用户不需要 Go；发布包必须含独立 EXE 或完整运行时。构建脚本生成 SHA-256 清单。协议调试工具只用于受信任的本地开发包，会直接执行指定 EXE。

## 包格式与校验

```text
javascript-example/
  manifest.json
  plugin.cjs
  NODE-LICENSE.txt
  bin/launcher.exe
  bin/node.exe
```

完整 Schema 在 `sdk/manifest.schema.json`。`files` 是相对路径到小写 SHA-256 的映射，必须包含包内除 manifest 外的全部文件，包括 EXE 和运行时依赖。禁止绝对路径、`..`、NTFS 数据流、符号链接和目录联接。manifest 上限 128 KiB，安装包上限 512 MiB、最多 512 个目录项。ID 使用反向域名且唯一，版本按 SemVer 校验。声明能力在安装时自动启用。启动前重新验证 manifest 和哈希。默认不自动启动。

当前为本地开发安装通道；没有公共发布、恶意软件扫描服务、证书信任库或审核签名链。不能将此版本当作第三方公开 EXE 市场。Native 权限声明与授权记录是运行策略，无法约束 EXE 的 Windows 权限。Job Object 用于退出时清理进程树，不是沙箱。

## GS-IPC / 1.0

stdin 是 Host → Plugin；stdout 是 Plugin → Host；stderr 是日志。UTF-8，每条 JSON 必须以 LF 结束；stdout 禁止普通日志、图像和二进制。每行最多 65,536 字节（包含 LF），每秒最多 100 条消息，事件 data 最大 32 KiB。Host 收件队列 128 条，统一事件队列 256 条。队列满、非法消息或握手错误会中止该插件并记录异常。

握手必须按下列顺序完成，每个阶段超时 5 秒：

```jsonl
{"type":"hello","plugin_id":"com.gamesupport.javascript-example","version":"1.0.0","protocol":"gs-ipc/1.0"}
{"type":"initialize","request_id":"init","protocol":"gs-ipc/1.0","permissions":["events.emit"],"config":{}}
{"type":"ready","request_id":"init"}
{"type":"command","command":"start","request_id":"start"}
{"type":"status","state":"running"}
```

第 1、3、5 行由 Plugin 发出，其余由 Host 发出。hello 的插件 ID、版本和协议必须与已安装清单一致。ready 前发送事件是错误。状态消息只写入日志，不替代 Host 的进程状态机。

```jsonl
{"type":"event","event":"example.pulse","data":{"test":true}}
```

必须在 manifest 声明事件，且已授权 `events.emit`。Host 填写可信 source 与 timestamp，插件不能伪造其他来源。Host 不信任插件的错误码，也不会将其作为命令执行。

Host 每 5 秒发 `{"type":"command","command":"ping","request_id":"heartbeat"}`。Plugin 回复 `{"type":"pong","request_id":"heartbeat"}`，15 秒没有 pong 会被终止。

停止命令：`{"type":"command","command":"stop"}`。Plugin 应释放资源并退出。Host 等待 2 秒，超时强制终止，并通过 Windows Job Object 回收子进程。进程意外退出、协议错误和 JSON 解析错误都只影响该插件。

配置通过 initialize 传递，必须是 32 KiB 内的 JSON 对象；页面保存配置或权限会停止运行中的进程，重启后生效。JavaScript 模板支持测试命令：`{"type":"command","command":"configure","config":{"emit_test":true}}`。

## 生命周期与数据

已安装 → starting → running → stopping → stopped；异常进入 error。可从 stopped/error 再次启动。禁止重复启动。插件配置、自动启用的声明能力与可选自动启动设置保存在 SQLite；包目录与用户资源分离。卸载会在 profiles 备份配置，不删除用户资源或规则；同 ID 重装会恢复配置并自动启用声明能力。更新前必须停止，更新包必须同 ID 且版本更高；校验和暂存完成后替换目录，常规失败回滚。更新保留配置和自动启动选择，自动启用新清单声明的能力。事件仍须在清单中声明，完整性和 IPC 校验保持启用。尚无断电级事务恢复日志。

## 修改 JavaScript 逻辑

主要修改 [plugin.cjs](../sdk/examples/javascript-event-provider/plugin.cjs) 的 `emitPulse()`，将自己的事件来源接入这个函数：

```javascript
function emitPulse() {
  if (running && canEmit) {
    send({ type: 'event', event: 'example.pulse', data: { test: true } });
  }
}
```

`running` 表示收到启动命令，`canEmit` 表示已授权事件发送。初始化配置位于 `message.config`。普通日志使用 `console.error()`；不要阻塞 JavaScript 事件循环，否则无法回复心跳。停止时清理自己创建的定时器和连接。

新增事件时同步修改 `build.mjs` 中的 `events` 清单。修改 ID 或版本时，同步修改脚本 hello 与构建脚本 manifest。每次修改后重新构建以更新哈希。更新已安装包需提高版本、停止旧插件、通过插件中心更新；不要直接编辑用户安装目录中的脚本以绕过完整性检查。
