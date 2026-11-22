# 发布到 DSH 插件源（插件市场索引）

「DSH 插件源」不是一个上传接口，而是**一份你自己托管的 JSON 索引**：
DSH 在 `设置 → 插件 → 自定义插件索引`（Discover）里按 URL 读取它，再通过 `pluginManager.installBundle` 安装条目。

本仓库选定的通道是 **git 源 + GitHub Pages 托管索引**：不需要 npm 账号，推送仓库即发布，索引钉死 40 位 commit（可复现、不可变）。

## 0. 前置

- Node（本机自带于 DSH 运行时）：`C:\Users\<你>\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe`
- 一个 GitHub 仓库（公开即可；不需要 token 也能发布，只要你能 push）

## 1. 自检

```bash
node --check entry.js
node --check lib/client.js
```

## 2. 提交（发布 = 推送）

```bash
cd D:/dsh-plugin-src/dsh-plugin-triage
git add -A
git commit -m "feat: 一键治理 + 能力扫描 v0.3.0"
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin HEAD
```

## 3. 生成索引（钉住 HEAD commit）

```bash
node scripts/build-index.mjs https://github.com/<user>/<repo>
```

它读 `package.json`（name / version / engines / keywords）与 `git rev-parse HEAD`，写出 `market/index.json`：
`versions[0].source = { type: "git", url, commit }` —— commit 就是刚才那次提交，所以**先提交代码，再生成索引，再提交索引**。
工作树不干净时脚本会警告：那次 commit 不含未提交的改动。

校验（用 DSH 自带的官方校验器，避免格式 1 规则漂移）：

```js
import { parseMarketIndex } from '@deepseek-ai/dsh-plugin-market-index'
const url = 'https://<user>.github.io/<repo>/market/index.json'
const index = parseMarketIndex(JSON.parse(readFileSync('market/index.json', 'utf8')), url)
// index.plugins[0].icon 会被解析成绝对 URL
```

## 4. 托管索引（GitHub Pages，branch 根目录）

1. 仓库 Settings → Pages → Source: **Deploy from a branch**，Branch: `main`，目录 **/(root)**；
2. 等 Pages 构建完成，索引地址即：
   `https://<user>.github.io/<repo>/market/index.json`
3. `icon` 用相对路径 `icon.svg`，按索引 URL 解析为 `.../market/icon.svg` —— 所以 `market/icon.svg` 必须一起推送（本仓库已就位）。

不想开 Pages 时，同一份文件也能用 raw 链接：
`https://raw.githubusercontent.com/<user>/<repo>/main/market/index.json`（内容类型是 text/plain，但读取端只取 body）。

## 5. 在 DSH 里登记

1. 设置 → 插件 → **自定义插件索引** → 启用；
2. 添加索引 URL；
3. 插件页出现 **发现** 标签 → 条目 → 安装（spec 形如 `git+https://github.com/<user>/<repo>.git#<40位commit>`）。

## 6. 发新版本

```bash
node scripts/build-index.mjs https://github.com/<user>/<repo>   # 先提交，再跑
git add -A && git commit -m "release: v0.3.1" && git push
```

索引里 `versions` 是数组，多版本并存由读取端按 SemVer 取最高兼容版本；旧版本条目可保留用于回滚。

## 7. 回滚

- 坏版本：把索引里对应 `versions[]` 条目删掉并推送（Discover 有 `cacheTtlMs`，默认 10 分钟自动刷新）；
- 索引本身：`git revert` 上一次索引提交即可。

## 8. 收集反馈

- 索引条目的 `homepage` / `repository.url` 是用户点「问题报告」的落点，务必填真实地址；
- 建议开两个 Issue 模板：**冲突误报**（附 `curl http://127.0.0.1:<port>/api/dsh-plugin-triage/state` 的 JSON）与**功能建议**；
- 误报排查优先看 `conflicts[].members[].patch`（补丁声明行）与 `capabilities[].tags[].evidence`（file:line）。

## 附：改用 npm 通道

若之后要发 npm：`pnpm publish --access public`，然后把 `scripts/build-index.mjs` 里的
`source` 换成 `{ type: 'npm' }` 并去掉 `commit`；索引里同一版本只能挂一个 source。
