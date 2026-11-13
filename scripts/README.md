# 构建脚本

`build-dist.sh` 执行类型检查、Lint 和构建，并将 `dist/` 打包为根目录的 `dist.zip`。在没有 Git LFS 的环境中，它会从 `patches/fonts/` 恢复字体二进制文件；图标仍需要 Git LFS。

推荐通过 GitHub Actions 进行完整验证和发布。工作流只产生一份解压缩扩展包，不使用商店签名或上架流程。
