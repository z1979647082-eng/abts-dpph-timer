# 反应时钟 · ABTS / DPPH

适合手机和 iPad 的中文多管实验计时网页，无需登录，无外部字体、脚本或图片依赖。

在线使用：https://z1979647082-eng.github.io/abts-dpph-timer/

## 使用

1. 选择 ABTS 或 DPPH，设置反应时长、管数和加液间隔。DPPH 默认 30 分钟；ABTS 需自行填写。
2. 试听两种提示音，确认设备音量，选择立即开始或指定开始时间。
3. 点击“开始实验”，后续加液与测试提醒自动进行，无需逐管确认。
4. 如需中断加液，点击“暂停后续加液”；继续后，尚未开始的管按暂停时长顺延。已开始的管按原定时间提醒测试。

**使用时保持页面前台、屏幕亮起。** 页面会在支持时申请屏幕常亮。浏览器后台、锁屏或关闭页面后的准时响铃无法保证。刷新后可恢复本机进度，但需再次点按启用声音；离开期间的到期提醒会补发。

实验设置与计时进度保存在本机浏览器 localStorage，不上传到 GitHub。清除浏览器数据、更换浏览器或设备会丢失本机进度。页面显示“已到测试时间”，不会把它视为人工已测试。

## 时间计算

- 第 n 管开始时间 = 实验开始时间 + (n − 1) × 加液间隔。
- 第 n 管测试时间 = 该管开始时间 + 反应时长。
- 使用绝对时间戳计算倒计时；支持跨小时、跨午夜、同时多个事件和暂停恢复。

## 本地验证

安装 Node.js 后运行：

```sh
node tests/timing.cjs
node --check app.js
```

包含跨午夜、暂停、同时到期、后台返回补发和 JSON 恢复等 9 组计时测试。

## 部署

仓库 Settings → Pages → Deploy from a branch → main → /(root)。根目录的 .nojekyll 使静态文件直接发布。

## UI 来源

- 按钮：adamgiebl / Uiverse，https://uiverse.io/adamgiebl/new-bird-34
- 分段选择器：Yaya12085 / Uiverse，https://uiverse.io/Yaya12085/rude-mouse-79

第三方组件的 MIT 许可与署名保留于 [ui-credits.txt](ui-credits.txt)。
