# GameSupport JavaScript 插件模板

本仓库只包含 JavaScript 简易插件及其开发文档。

- [插件开发文档](docs/PLUGIN-SDK.md)
- [模板使用说明](sdk/examples/javascript-event-provider/README.md)

在 Windows x64 开发机安装 Node.js 22+ 和 Go，然后执行：

```powershell
node sdk/examples/javascript-event-provider/build.mjs
./scripts/ipc-debug.ps1 -PluginDirectory ./build/javascript-example
```

构建后，在 GameSupport 插件中心安装 build/javascript-example，授权 events.emit 并启动；创建 example.pulse 事件规则，再点击请求测试事件。
