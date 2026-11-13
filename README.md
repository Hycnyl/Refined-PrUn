# Refined PrUn OOG 汉化版

基于 [OOG 版 Refined PrUn](https://github.com/jackinabox86/refined-prun) 的自用简体中文扩展，保留 OOG 功能和 RT 编排增强，优先沿用 [SupCH/refined-prun-cn](https://github.com/SupCH/refined-prun-cn) 的已有译文。

当前功能基线：OOG 1.1.11，提交 `33a4ebe56f61e3dc195c7cad2073b04cad4344c3`。本仓库负责扩展自身的界面汉化；游戏服务器提供的原始内容、玩家自定义名称、命令和导入导出字段保留原值。

## 安装

1. 从 [Releases](https://github.com/Hycnyl/Refined-PrUn/releases/latest) 下载 `refined-prun-cn-*.zip`，解压到固定目录。
2. 在 Chrome 打开 `chrome://extensions`，或在 Edge 打开 `edge://extensions`，开启开发者模式。
3. 点击“加载已解压的扩展程序”，选择直接包含 `manifest.json` 的目录。
4. 禁用其他 Refined PrUn、旧汉化版及 PMMG Extended，重新加载 [APEX](https://apex.prosperousuniverse.com)。
5. 使用 `XIT SET` 打开设置，`XIT HELP` 查看帮助，`XIT CMDS` 查看命令列表。

更新时，先在旧版本的 `XIT SET` 导出用户数据，再用新包替换同一目录中的文件，在扩展管理页点击重新加载，最后刷新游戏。同一路径加载通常保留扩展本地数据；如果扩展标识变化，可在新版本中导入备份。未登录或未访问过的游戏数据仍需按 OOG 原有方式加载。

本项目只提供一份可解压加载的扩展包，不发布扩展商店版本。程序中的 RT 指令语法、内部动作类型、库存标识和 JSON 字段保留英文，以兼容既有数据；相应界面标签显示为中文。

## 构建与发布

使用 Node.js 22.16.0 或更高版本，以及 package.json 指定的 pnpm 10.32.1。首次检出需要 Git LFS 以获取图标和字体。

```sh
git lfs pull
corepack pnpm install --frozen-lockfile
corepack pnpm build
```

产物位于 `dist/`。也可运行 `bash scripts/build-dist.sh` 生成根目录的 `dist.zip`，压缩包不进入版本控制。

GitHub Actions 在推送和 PR 时执行类型检查、Lint、现有测试和构建，并保存 `refined-prun-cn-unpacked` 构建产物。主分支提交消息以 `release:` 开头，或手动运行工作流并勾选发布时，全部检查通过后由 Actions 创建 GitHub Release 和扩展 ZIP。版本由 `VERSION`、`public/manifest.json` 和 `package.json` 共同维护；Chrome 数字版本使用四段，例如 `1.1.11.1`，显示版本使用 `1.1.11-cn.1`。

## 致谢与许可

功能来自 [refined-prun/refined-prun](https://github.com/refined-prun/refined-prun)、[agm-114/refined-prun](https://github.com/agm-114/refined-prun) 和 [jackinabox86/refined-prun](https://github.com/jackinabox86/refined-prun)，中文文案参考 [SupCH/refined-prun-cn](https://github.com/SupCH/refined-prun-cn)。沿用原项目的 [MIT 许可证](LICENSE)。
