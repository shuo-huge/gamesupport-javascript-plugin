# JavaScript 菜单与工具页面插件

GameSupport 0.11.0 / Plugin SDK 1.1 新增工具页面，兼容现有事件插件。菜单来自已安装插件清单，在侧栏“插件工具”中显示；卸载移除菜单和页面。纯界面插件无需独立 EXE、Node 运行时或启动进程。现有 Native 事件插件也能声明相同的 ui.pages，事件进程生命周期保持独立。

## 运行动画编辑器示例

```powershell
node sdk/examples/animation-editor/build.mjs
```

在插件中心安装 `build/animation-editor-plugin`，点击“打开工具”或侧栏“动画编辑器”。调整光环、粒子、颜色和速度，预览/拖动帧，保存工程；导出后前往动画库，在触发中心添加规则关联导出的动画。模板是简单效果编辑器，不包含视频剪辑或完整关键帧系统。

## 清单

```json
{
  "manifest_version": 1,
  "id": "com.example.animation-editor",
  "name": "我的动画编辑器",
  "version": "1.0.0",
  "author": "Your name",
  "description": "编辑并导出动画",
  "type": "ui",
  "runtime": { "type": "web" },
  "permissions": [],
  "events": [],
  "ui": {
    "pages": [
      { "id": "editor", "title": "动画编辑器", "html": "page.html", "script": "page.js", "style": "page.css" }
    ]
  },
  "files": { "page.html": "填写实际 SHA-256", "page.js": "填写实际 SHA-256", "page.css": "填写实际 SHA-256" }
}
```

示例 build.mjs 自动生成真实哈希。一个插件支持 1–8 页，页面 ID 唯一，格式为小写字母开头、字母/数字/下划线/短横线，最长 40 字符；标题最长 40 字符。html、script 必需，style 可选，各文件上限 512 KiB，均须在完整性清单中。HTML 写 body 内的内容，JavaScript 写独立 script 文件，事件用 addEventListener 或元素属性绑定；不要在 HTML 写 script 或 onclick。CSS 写独立 style 文件，可用 Canvas、内嵌 data 图片和浏览器 File API。

事件插件保持 `type: event_provider` 与现有 native runtime，仅新增 ui 字段即可。现有插件包不需要修改。纯界面插件 events 为空，不发送 GS-IPC 事件，也不运行进程；自动启动设置忽略。

## 页面 API 1.0

主程序提供 `window.GameSupport`，`GameSupport.apiVersion` 为 `1.0`。脚本运行时即可调用，返回 Promise；失败 reject Error，页面应显示可读错误。

```javascript
const info = await GameSupport.call('plugin.info');
const project = await GameSupport.call('storage.get');
await GameSupport.call('storage.set', { value: { title: '我的工程', layers: [] } });
const assets = await GameSupport.call('assets.list');
```

| 方法 | 参数 | 结果 |
| --- | --- | --- |
| plugin.info | 无 | 本插件 id、name、version、api_version |
| storage.get | 无 | 本插件保存的 JSON，没有工程时为 null |
| storage.set | {value: JSON} | {saved: true}，整体覆盖本插件工程 |
| assets.list | 无 | 素材 id、name、asset_type、width、height、duration，不含磁盘路径 |
| effects.save | 下述动画参数 | 导入动画的公开素材信息 |

工程总计最多 1 MiB，保存到本插件独立 SQLite 记录，同一插件的多个页面共享；与运行配置分开，升级保留。卸载暂时保留工程，同 ID 重装可以读取。页面切换会销毁页面，未保存的内存编辑不会自动保留。不要依赖 localStorage（页面为独立不透明来源）。

### 导出 GIF

```javascript
const bytes = canvas.getContext('2d').getImageData(0, 0, width, height).data;
let raw = '';
for (let i = 0; i < bytes.length; i += 8192)
  raw += String.fromCharCode(...bytes.subarray(i, i + 8192));
const asset = await GameSupport.call('effects.save', {
  name: '我的动画', width, height, fps: 24,
  frames: [btoa(raw)] // 每帧为按行排列的 RGBA8 原始数据的 base64
});
```

名称 1–80 字；尺寸每边 1–256；FPS 1–60；帧数 1–60；所有 base64 帧字符串合计最多 8 MiB，每帧解码长度严格为 width × height × 4。Host 编码循环 GIF，使用普通素材导入校验，返回素材 ID。GIF 使用有限调色板与二值透明度，不能完整保留 RGBA 的半透明渐变；与库内已有文件哈希相同会提示已经导入。插件不能指定输出磁盘路径。导出不会自动创建/触发规则或覆盖已有素材。

## 页面边界与更新

页面放在独立 sandbox iframe，只允许脚本，不允许同源访问、弹窗、下载或顶层导航；通过每次打开生成的通道标识与父窗口通信。Host 检查消息来源和固定接口白名单，插件 ID/页面 ID/版本由 Host 绑定，不能通过参数切换到其他插件。页面禁止外网连接、CDN、任意本地文件读取、任意主程序命令和原生进程启动。不支持在此接口里调用 Native 插件自定义命令。

页面代码通过本地 data 文档加载，配有独立 CSP；主窗口不执行插件 HTML/JavaScript。加载前重新检查包与哈希；版本变化/卸载后旧页面请求被拒绝。最多 4 个同时在途请求，请求超时 60 秒；请避免高频轮询和无限循环。浏览器隔离不代表 CPU/内存配额；不要安装不受信任插件。Native 插件仍使用操作系统进程权限，不受 iframe 限制。

更新时提高版本、重新构建哈希并在插件中心更新；重新打开页面加载新代码。将来扩展 API 应保持旧接口兼容，不要直接调用 Tauri 内部接口。
