# 发布到 DSH 插件源（插件市场索引）

「DSH 插件源」不是一个上传接口，而是**一份你自己托管的 JSON 索引**：
DSH 在 `设置 → 插件 → 自定义插件索引`（Discover）里按 URL 读取它，再通过 `pluginManager.installBundle` 安装条目。
所以发布 = ① 把包发到 npm ② 把索引 JSON 托管成可访问的 URL ③ 把 URL 填进 DSH。

本仓库已经带好第 ② 步的产物：`market/index.json` + `market/icon.svg`（格式 1，已用官方 `@deepseek-ai/dsh-plugin-market-index` 校验器验证）。

## 0. 前置

- Node / pnpm：本机自带于 DSH 运行时目录
  - `C:\Users\<你>\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe`
  - `C:\Users\<你>\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\pnpm\bin\pnpm.mjs`
- npm 账号（`npm login`，或准备一个只用于本仓库的 automation token）

## 1. 自检

```bash
node --check entry.js
node --check lib/client.js
```

## 2. 发到 npm

```bash
cd D:/dsh-plugin-src/dsh-plugin-triage
node C:/Users/<你>/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/pnpm/bin/pnpm.mjs publish --access public
```

只想内部试用时，用私有 registry 并在索引的 `versions[].source.registry` 里写同一个地址。
发布后验证：

```bash
npm view dsh-plugin-triage version
```

## 3. 更新索引条目

`market/index.json` 里改三处：

1. `plugins[0].versions[0].version` → 与刚发布的版本一致（对应 `package.json.version`）；
2. 可选：给该版本加 `publishTimestamp`（毫秒时间戳）；
3. `homepage` / `repository.url` → 换成真实仓库地址（现在是占位符 `your-name`）。

校验（用 DSH 自带的校验器，避免格式 1 规则漂移）：

```js
import { parseMarketIndex } from '@deepseek-ai/dsh-plugin-market-index'
const url = 'https://example.com/market/index.json'
const index = parseMarketIndex(JSON.parse(fs.readFileSync('market/index.json', 'utf8')), url)
```

## 4. 托管索引

任选一种，关键是拿到**可公开 GET 的绝对 URL**：

| 方式 | URL 形状 | 备注 |
| --- | --- | --- |
| GitHub Pages | `https://<user>.github.io/<repo>/market/index.json` | 推荐：内容类型正确、带 CDN |
| raw.githubusercontent | `https://raw.githubusercontent.com/<user>/<repo>/main/market/index.json` | 最快，但内容类型是 text/plain |
| Gitee raw | `https://gitee.com/<user>/<repo>/raw/main/market/index.json` | 国内访问更稳 |

`icon` 是相对路径，会按索引 URL 解析 —— 所以 `market/icon.svg` 必须和 `index.json` 一起托管（本仓库已就位）。

## 5. 在 DSH 里登记

1. 设置 → 插件 → **自定义插件索引** → 启用；
2. 添加索引 URL（第 4 步的地址）；
3. 插件页出现 **发现** 标签，条目即本插件，点安装 → `dsh-plugin-triage@<版本>`。

## 6. 收集反馈

- 索引条目的 `homepage` / `repository.url` 是用户点「问题报告」时的落点，务必填真实地址；
- 建议在仓库开两个 Issue 模板：**冲突误报**（附体检报告 JSON：`curl http://127.0.0.1:<port>/api/dsh-plugin-triage/state`）与**功能建议**；
- 误报排查优先看报告里的 `capabilities[].evidence` 与 `conflicts[].members[].patch` —— 它们直接给出 file:line 与补丁声明行。

## 7. 回滚

- 发行包：`npm deprecate dsh-plugin-triage@<坏版本> "<原因>"`，索引里把 `versions` 改回上一个可用版本（索引保留多版本即可，读取端取最高兼容版本）；
- 索引本身：改回上一版 JSON 重新部署，DSH 有 `cacheTtlMs`（默认 10 分钟）自动刷新。
