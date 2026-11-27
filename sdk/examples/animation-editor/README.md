# JavaScript 动画编辑器插件

需要 GameSupport 0.11.0+。开发机构建只需 Node.js，无第三方 npm 依赖，最终用户无需 Node、Go 或 EXE。

执行 `node sdk/examples/animation-editor/build.mjs`，在插件中心安装 `build/animation-editor-plugin`，侧栏“插件工具”出现“动画编辑器”。打开即可使用，不需要点击启动。

调整光环/粒子、颜色、数量和速度，拖动帧滑块或播放预览；保存工程会保存到本插件独立存储；重新打开自动读取。导出生成透明 GIF 并进入主程序动画库。随后到触发中心添加规则关联动画。本例是界面扩展模板，不是完整关键帧/视频编辑器。

`page.html` 是页面主体，`page.css` 是样式，`page.js` 是逻辑。脚本通过 `GameSupport.call(method, params)` 调用接口。修改后重建以更新哈希；更新已安装插件时提高 build.mjs 中版本号。

接口与边界见项目 `docs/PLUGIN-UI.md`。所有资源必须随包提供，不支持 CDN、外网请求、内联事件处理器或在 HTML 中放 script；脚本写在 manifest 指定的独立文件里。
