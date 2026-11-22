#!/usr/bin/env node
// Regenerate market/index.json for the git distribution channel.
//
// Source of truth: package.json (name, version, engines, description) plus the
// repository's HEAD commit. Run it after every release commit, so the index
// always pins an installable, immutable git commit:
//
//   node scripts/build-index.mjs https://github.com/<user>/<repo>
//
// The repository URL falls back to `git remote get-url origin` when omitted.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
}

function repoUrl() {
  const fromArg = process.argv[2]
  if (fromArg) return fromArg
  try {
    return git(['remote', 'get-url', 'origin'])
  } catch {
    console.error('usage: node scripts/build-index.mjs https://github.com/<user>/<repo>')
    console.error('(no git remote named origin found)')
    process.exit(2)
  }
}

const url = repoUrl().replace(/\.git$/u, '')
const commit = git(['rev-parse', 'HEAD'])
if (!/^[0-9a-f]{40}$/u.test(commit)) {
  console.error('HEAD is not a 40-hex commit: ' + commit)
  process.exit(2)
}
if (git(['status', '--porcelain']) !== '') {
  console.error('warning: working tree is dirty; the pinned commit does not contain uncommitted work')
}

const index = {
  format: 1,
  title: { en: pkg.name, zh: pkg.name + ' · 插件冲突体检' },
  description: {
    en: 'Conflict triage and one-click governance for the DSH plugin page: what is installed, what collides, what is broken, and what each plugin can actually do.',
    zh: 'DSH 插件页上的冲突体检与一键治理：装了哪些、谁在打架、谁坏了、每个插件到底能干什么。',
  },
  plugins: [
    {
      name: pkg.name,
      title: { en: 'Plugin conflict triage', zh: '插件冲突体检与一键治理' },
      description: {
        en: 'Adds a conflict-clinic tab to Settings → Plugins. Groups duplicate mounts and duplicate modules, flags engine incompatibility and load failures, and offers one-click update / disable conflicting / disable broken / translate descriptions, plus a static capability scan (tools, UI, web routes, subagents, MCP, and more) with file:line evidence.',
        zh: '在「设置 → 插件」页新增冲突体检标签页：把重复挂载与重复装载分组标红，标出引擎不兼容与加载失败，并提供一键更新 / 一键禁用冲突 / 一键禁用报错 / 一键翻译描述，以及带 file:line 证据的能力扫描（工具、UI、Web 接口、子代理、MCP 等）。',
      },
      icon: 'icon.svg',
      homepage: url,
      repository: { url },
      metadata: { keywords: pkg.keywords || [] },
      versions: [
        {
          version: pkg.version,
          publishTimestamp: Math.floor(Date.now() / 1000),
          source: { type: 'git', url, commit },
          engines: pkg.dsh && pkg.dsh.engines ? pkg.dsh.engines : {},
        },
      ],
    },
  ],
}

const target = join(root, 'market', 'index.json')
writeFileSync(target, JSON.stringify(index, null, 2) + '\n', 'utf8')
console.log('wrote market/index.json: ' + pkg.name + '@' + pkg.version + ' -> ' + commit.slice(0, 12) + ' (' + url + ')')
