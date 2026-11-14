# 汉化维护规则

- 本仓库以 `jackinabox86/refined-prun`（OOG 版）为功能基线，只做汉化及必要的构建发布维护，不增删游戏功能
- 源码、GitHub Actions 和发布产物均使用 `Hycnyl/Refined-PrUn`
- 优先沿用 `SupCH/refined-prun-cn` 已有译文；缺失时使用同样简洁、清晰、准确的中文
- 设置项长句功能描述末尾不加句号；段落形式长文末尾加句号；旧译仅在上述标点或设置长句功能表述错误时做最小修正
- 保留命令、代码标识符、接口字段、存储键、导入导出格式及用于匹配游戏界面的原文，避免汉化改变功能
- 仅维护可加载的解压缩扩展包，不为扩展商店增加版本或发布流程
- 测试、类型检查、构建和发布优先交给 GitHub Actions；本地只做必要的检查
- 长期规则只记录在本文件，不创建额外的记忆、计划或工作记录文件
- 不提交依赖、构建压缩包、缓存、个人 AI 工具配置和机器专属部署配置

## 临时任务进度（全部完成后删除）

- 基线：OOG 1.1.11，`33a4ebe56f61e3dc195c7cad2073b04cad4344c3`
- 已推送清理提交 `b2b30683` 和汉化候选提交 `1c502d3f`；尚无 Release
- 中断时的 23 个文件补译和文案修正已保留并纳入后续提交
- 首轮 Actions：`43450831650`，build job `131972261434`；类型检查及 Lint 通过，测试 98 个文件中 28 个失败、70 个通过，尚未构建
- 已恢复自动生成动作包及材料组的内部英文名称，中文通过显示适配呈现；已补译确认按钮等遗漏，修正标点和两处依赖显示文案的识别逻辑；已将现有测试的显示文案断言对齐中文，保留功能及原生按钮匹配断言
- 第二轮候选提交：`1c72fac8659fc83f955e3870b7ee91ec0d9303e2`；Actions `43544715744` 已完成，类型检查及 Lint 通过，764/773 项测试通过
- 第二轮剩余 9 项失败均为提示文案或空格断言；工作区已修正相关提示断言、冒号空格和错误行号前缀空白处理，下一步推送并触发第三轮 Actions
- 全部验证通过后，通过 Actions 的 release=true 发布单一 ZIP，删除本临时章节；不要直接调用 Release API
- 环境：`/workspace/Refined-PrUn` 是工作仓库，`/workspace/reference-cn` 是旧汉化参考，`/workspace/reference-upstream` 是原版参考；使用 `corepack pnpm` 调用项目指定版本
- GitHub 插件支持源码读写；手动触发 Actions 使用环境中已连接的 `gh workflow run build-extension.yml --repo Hycnyl/Refined-PrUn --ref main -f release=false`；发布时改为 `release=true`，不要直接发布 Release
- 字符串提取和迁移工具及中间数据位于 `/tmp/rprun-*`，不要提交；旧原文记录为 `/tmp/rprun-strings-original.json`，已采用译文映射为 `/tmp/rprun-resolved.json`
