# GameSupport JavaScript 插件

适用于 **GameSupport 0.11.0+ / Plugin SDK 1.1**。本仓库提供 JavaScript 界面插件、动画编辑器示例和事件插件模板。

- [在线开发文档](https://shuo-huge.github.io/gamesupport-javascript-plugin/)
- [菜单与工具页面开发](docs/PLUGIN-UI.md)
- [事件插件与 GS-IPC](docs/PLUGIN-SDK.md)
- [manifest Schema](sdk/manifest.schema.json)

## 直接安装动画编辑器

下载本仓库 ZIP 并解压，在 GameSupport 插件中心安装 `plugins/animation-editor` 文件夹（包含 manifest.json）。点击“打开工具”或侧栏“动画编辑器”。最终用户无需安装 Node.js、Go 或运行独立 EXE。

可编辑光环、粒子与星光效果，调整颜色、数量和速度，预览、保存/读取工程，并导出 GIF 到动画库。导出的动画请到“触发中心”添加规则后关联使用。示例是简单效果编辑器，不包含完整关键帧/视频编辑。

## 开发自己的界面插件

只需 Node.js，无 npm 依赖。在仓库根目录执行：

```powershell
node sdk/examples/animation-editor/build.mjs
```

安装生成的 `build/animation-editor-plugin`。修改 [page.html](sdk/examples/animation-editor/page.html)、[page.css](sdk/examples/animation-editor/page.css) 和 [page.js](sdk/examples/animation-editor/page.js)，使用 `GameSupport.call()` 访问本插件工程、素材信息和 GIF 导出。发布新版本时修改 build.mjs 中 ID/版本并重建哈希。

## 开发事件插件

事件模板使用 Node 运行时与小型 EXE 启动器，开发机需 Windows x64、Node.js 22+ 和 Go：

```powershell
node sdk/examples/javascript-event-provider/build.mjs
./scripts/ipc-debug.ps1 -PluginDirectory ./build/javascript-example
```

安装 `build/javascript-example` 后启动。声明能力自动启用，无需勾选权限；将 `example.pulse` 添加到触发中心，选择音效/动画并保存，再在插件配置页请求测试事件。规则统一在触发中心管理。详见 [事件模板说明](sdk/examples/javascript-event-provider/README.md)。

界面插件无需进程；事件插件保留 GS-IPC，亦可附带 ui.pages 页面。两者运行边界不同，详见文档。
