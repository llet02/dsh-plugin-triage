// dsh-plugin-triage — browser half.
//
// Contributes one tab to the Plugins settings page (slot `plugins.tab`,
// rendered after the page's own Installed/Discover tabs):
//
//   「冲突体检 / Conflict clinic」
//
// The tab is fully self-contained: the Host half owns every fact and every
// mutation (`/api/dsh-plugin-triage/state`, `/api/dsh-plugin-triage/action`),
// so this file renders what the Host reports and calls actions verbatim. The
// Plugins page hands the entry its owner props; this face ignores them on
// purpose, so a page layout change cannot break the tab's data path.
//
// Bundle artifact contract: the shell materializes this file as a closure
// factory (`window.__ModuleLoader__.load({ id, factory })`), so `require` is a
// parameter supplied by the shell's module table and `react` is a baseline
// module every dynamic bundle may request. `exports.apply(ctx)` is called by
// the shell with the client plugin context; services are awaited with the
// dynamic `ctx.inject([...], (owner) => ...)` form so a profile that lacks a
// service never leaves the fiber pending.

window.__ModuleLoader__.load({ id: "dsh-plugin-triage", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;

const STATE_URL = '/api/dsh-plugin-triage/state'
const ACTION_URL = '/api/dsh-plugin-triage/action'

// Bulk actions must never disable the tool that hosts this tab: doing so would
// remove the only place the user can re-enable the rest.
const SELF_BUNDLE = 'dsh-plugin-triage'

// Capability tag labels, mirroring the Host's CAPABILITY_RULES order. The Host
// sends per-bundle tags with labels; this map is only for the summary row, which
// receives counts keyed by tag.
const CAP_LABELS = {
  tool: '工具', model: '模型', ui: 'UI视图', route: 'Web接口', command: '命令',
  skill: '技能', agent: '子代理', mcp: 'MCP', schedule: '后台任务',
  session: '会话投影', storage: '本地存储', shell: '执行命令', catalog: '插件目录',
}

const STYLE_ID = 'dsh-plugin-triage-style'

// Theme tokens copied from the harness's own plugin card styles so this tab
// reads as a shipped one rather than a guest; every token keeps a literal
// fallback for a page that has no theme loaded.
const CSS = [
  '.ptg-root{font-family:inherit;color:var(--dsw-alias-label-primary,inherit);display:flex;flex-direction:column;gap:14px;padding:4px 0 24px}',
  '.ptg-head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}',
  '.ptg-title{font-size:16px;font-weight:700;line-height:1.4}',
  '.ptg-sub{font-size:12px;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.85))}',
  '.ptg-stats{display:flex;flex-wrap:wrap;gap:8px}',
  '.ptg-stat{display:flex;align-items:center;gap:7px;border:.5px solid var(--dsw-alias-border-l2,rgba(127,127,127,.3));',
  'background:var(--dsw-alias-bg-layer-3,transparent);border-radius:12px;padding:8px 12px;font-size:12.5px;line-height:1.4}',
  '.ptg-stat b{font-size:14px}',
  '.ptg-stat.bad{border-color:rgba(210,74,67,.55);background:rgba(210,74,67,.12);color:#d24a43}',
  '.ptg-stat.warn{border-color:rgba(210,120,40,.5);background:rgba(210,120,40,.1);color:#b46214}',
  '.ptg-stat.ok{border-color:rgba(7,150,90,.45);background:rgba(7,150,90,.08);color:#07974b}',
  '.ptg-stat.info{border-color:rgba(79,157,217,.4);background:rgba(79,157,217,.08);color:#4f9dd9}',
  '.ptg-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}',
  '.ptg-batch{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:8px 10px;border-radius:10px;',
  'border:.5px dashed var(--dsw-alias-border-l2,rgba(127,127,127,.34));background:rgba(127,127,127,.035)}',
  '.ptg-search{flex:1;min-width:220px;border:.5px solid var(--dsw-alias-border-l2,rgba(127,127,127,.34));',
  'background:var(--dsw-alias-bg-layer-3,transparent);color:inherit;border-radius:10px;padding:8px 12px;font:inherit;font-size:13px}',
  '.ptg-search:focus{outline:2px solid var(--dsw-alias-brand-primary,#4f9dd9);outline-offset:-1px}',
  '.ptg-chip{border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.34));background:none;color:inherit;',
  'border-radius:999px;padding:5px 12px;font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}',
  '.ptg-chip:hover:not(:disabled){background:rgba(127,127,127,.12)}',
  '.ptg-chip[data-on="1"]{border-color:var(--dsw-alias-brand-primary,#4f9dd9);color:var(--dsw-alias-brand-primary,#4f9dd9);font-weight:600}',
  '.ptg-chip .n{opacity:.75;font-weight:400}',
  '.ptg-chip.bad[data-on="1"]{border-color:#d24a43;color:#d24a43}',
  '.ptg-chip.third[data-on="1"]{border-color:#8b5cf6;color:#8b5cf6}',
  '.ptg-sec{display:flex;flex-direction:column;gap:10px}',
  '.ptg-sec-h{font-size:13px;font-weight:700;display:flex;align-items:center;gap:8px}',
  '.ptg-count{font-size:11px;line-height:1.5;padding:1px 8px;border-radius:999px;background:rgba(210,74,67,.16);color:#d24a43;white-space:nowrap}',
  '.ptg-count.ok{background:rgba(7,150,90,.14);color:#07974b}',
  '.ptg-count.info{background:rgba(79,157,217,.15);color:#4f9dd9}',
  '.ptg-card{border:.5px solid var(--dsw-alias-border-l2,rgba(127,127,127,.3));border-radius:14px;',
  'background:var(--dsw-alias-bg-layer-3,transparent);padding:12px 14px;display:flex;flex-direction:column;gap:8px}',
  '.ptg-card.bad{border-color:rgba(210,74,67,.6);background:rgba(210,74,67,.07)}',
  '.ptg-card.warn{border-color:rgba(210,120,40,.55);background:rgba(210,120,40,.06)}',
  '.ptg-cardhead{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
  '.ptg-badge{font-size:11px;line-height:1.5;padding:1px 8px;border-radius:999px;white-space:nowrap;',
  'background:rgba(127,127,127,.16);color:var(--dsw-alias-label-secondary,rgba(127,127,127,.95))}',
  '.ptg-badge.high{background:rgba(210,74,67,.16);color:#d24a43}',
  '.ptg-badge.medium{background:rgba(210,120,40,.15);color:#b46214}',
  '.ptg-badge.ok{background:rgba(7,150,90,.14);color:#07974b}',
  '.ptg-badge.warn{background:rgba(210,120,40,.15);color:#b46214}',
  '.ptg-badge.info{background:rgba(79,157,217,.15);color:#4f9dd9}',
  '.ptg-badge.third{background:rgba(139,92,246,.16);color:#8b5cf6}',
  '.ptg-ttl{font-size:13.5px;font-weight:600;flex:1;min-width:0}',
  '.ptg-advice{font-size:12px;line-height:1.55;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.9))}',
  '.ptg-advice b{color:var(--dsw-alias-label-secondary,rgba(127,127,127,.95))}',
  '.ptg-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:7px 8px;border-radius:10px;',
  'border:.5px solid transparent;background:rgba(127,127,127,.045)}',
  '.ptg-row + .ptg-row{margin-top:2px}',
  '.ptg-row.off{opacity:.55}',
  '.ptg-note{font-size:11.5px;line-height:1.55;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.8))}',
  '.ptg-card.info{border-color:rgba(79,157,217,.45);background:rgba(79,157,217,.05)}',
  '.ptg-node{flex:1;min-width:180px;display:flex;flex-direction:column;gap:2px}',
  '.ptg-node .nm{font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.ptg-node .dm{font-size:11.5px;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.8));overflow:hidden;',
  'text-overflow:ellipsis;white-space:nowrap}',
  '.ptg-actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap}',
  '.ptg-btn{border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.34));background:none;color:inherit;',
  'border-radius:8px;padding:4px 11px;font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}',
  '.ptg-btn:hover:not(:disabled){background:rgba(127,127,127,.12)}',
  '.ptg-btn:disabled{opacity:.45;cursor:default}',
  '.ptg-btn.danger{color:#d24a43;border-color:rgba(210,74,67,.5)}',
  '.ptg-btn.danger:hover:not(:disabled){background:rgba(210,74,67,.1)}',
  '.ptg-btn.primary{color:var(--dsw-alias-brand-primary,#4f9dd9);border-color:var(--dsw-alias-brand-primary,#4f9dd9)}',
  '.ptg-btn.primary:hover:not(:disabled){background:rgba(79,157,217,.12)}',
  '.ptg-btn.warn{color:#b46214;border-color:rgba(210,120,40,.5)}',
  '.ptg-btn.warn:hover:not(:disabled){background:rgba(210,120,40,.1)}',
  '.ptg-hint{font-size:11px;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.75));white-space:normal}',
  '.ptg-meta{font-size:11.5px;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.8))}',
  '.ptg-table{display:flex;flex-direction:column;gap:4px}',
  '.ptg-th{display:flex;gap:8px;padding:0 8px 4px;font-size:11.5px;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.8))}',
  '.ptg-th .c-name{flex:1.6;min-width:160px}.ptg-th .c-ver{width:92px}.ptg-th .c-range{width:150px}.ptg-th .c-state{width:110px}.ptg-th .c-act{flex:1.4;min-width:200px}',
  '.ptg-trow{display:flex;gap:8px;align-items:center;padding:6px 8px;border-radius:10px;background:rgba(127,127,127,.045)}',
  '.ptg-trow .c-name{flex:1.6;min-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px}',
  '.ptg-trow .c-ver{width:92px;font-size:12px;color:var(--dsw-alias-label-secondary,rgba(127,127,127,.9));overflow:hidden;text-overflow:ellipsis}',
  '.ptg-trow .c-range{width:150px;font-size:11.5px;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.8));overflow:hidden;text-overflow:ellipsis}',
  '.ptg-trow .c-state{width:110px}.ptg-trow .c-act{flex:1.4;min-width:200px;display:flex;gap:6px;flex-wrap:wrap}',
  '.ptg-empty{font-size:12.5px;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.8));padding:16px 4px;text-align:center}',
  '.ptg-err{border:.5px solid rgba(210,74,67,.55);background:rgba(210,74,67,.08);color:#d24a43;border-radius:10px;',
  'padding:9px 12px;font-size:12.5px;line-height:1.5}',
  '.ptg-toast{position:sticky;bottom:8px;align-self:flex-start;max-width:100%;border-radius:10px;padding:8px 13px;',
  'font-size:12.5px;line-height:1.5;box-shadow:0 4px 18px rgba(0,0,0,.35);z-index:5}',
  '.ptg-toast.ok{background:rgba(7,150,90,.92);color:#fff}',
  '.ptg-toast.err{background:rgba(210,74,67,.95);color:#fff}',
  '.ptg-detail{font-size:12.5px;line-height:1.55;color:var(--dsw-alias-label-secondary,rgba(127,127,127,.9))}',
  '.ptg-diagpanel{margin-top:6px;border-left:2px solid var(--dsw-alias-border-l2,rgba(127,127,127,.3));',
  'padding-left:10px;display:flex;flex-direction:column;gap:8px}',
  '.ptg-decl{display:flex;align-items:center;gap:8px;font-size:12px;line-height:1.5}',
  '.ptg-decl code{background:rgba(127,127,127,.12);padding:1px 6px;border-radius:6px;color:inherit;font-size:11.5px}',
  '.ptg-declln{color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.7));font-size:11px}',
  '.ptg-diag{border:.5px solid var(--dsw-alias-border-l2,rgba(127,127,127,.3));border-radius:10px;padding:10px 12px;',
  'background:rgba(127,127,127,.05);display:flex;flex-direction:column;gap:6px}',
  '.ptg-diagh{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
  '.ptg-diagerr{margin:0;font-size:11.5px;line-height:1.6;color:#d24a43;white-space:pre-wrap;word-break:break-all;',
  'background:rgba(210,74,67,.06);border-radius:8px;padding:8px 10px;max-height:180px;overflow:auto}',
  '.ptg-diagstack{margin:0;font-size:10.5px;line-height:1.55;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.8));',
  'white-space:pre-wrap;word-break:break-all;background:rgba(127,127,127,.05);border-radius:8px;padding:8px 10px;max-height:220px;overflow:auto}',
  '.ptg-vers{margin-top:4px;display:flex;flex-direction:column;gap:4px}',
  '.ptg-ver{display:flex;gap:8px;align-items:center;font-size:12px}',
  '.ptg-ver .v{font-weight:600}.ptg-ver .t{color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.8))}',
  '.ptg-caps{display:inline-flex;gap:4px;flex-wrap:wrap;align-items:center}',
  '.ptg-cap{font-size:10.5px;line-height:1.5;padding:0 6px;border-radius:6px;white-space:nowrap;',
  'background:rgba(79,157,217,.14);color:#4f9dd9;border:.5px solid rgba(79,157,217,.3)}',
  '.ptg-cap.api{background:rgba(139,92,246,.14);color:#8b5cf6;border-color:rgba(139,92,246,.3)}',
  '.ptg-caps.tiny .ptg-cap{font-size:10px;padding:0 5px}',
  '.ptg-tr{font-size:9.5px;line-height:1.6;padding:0 5px;border-radius:4px;margin-left:5px;',
  'background:rgba(7,150,90,.16);color:#07974b;vertical-align:middle}',
].join('')

function ensureStyle() {
  if (document.getElementById(STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS
  document.head.appendChild(style)
}

/** Read one awaited service from the injected owner context. */
function serviceAt(owner, name) {
  try {
    if (owner !== null && owner !== undefined && typeof owner.get === 'function') {
      const value = owner.get(name)
      if (value !== undefined && value !== null) return value
    }
  } catch (error) {
    // global-store miss; the property may still answer
  }
  try {
    return owner === null || owner === undefined ? undefined : owner[name]
  } catch (error) {
    return undefined
  }
}

function tabName() {
  try {
    if (typeof navigator !== 'undefined' && /^zh/i.test(navigator.language || '')) return '冲突体检'
  } catch (error) { /* keep default */ }
  return 'Conflict clinic'
}

// ---------------------------------------------------------------------------
// Human-readable summaries
// ---------------------------------------------------------------------------

function fmtApplication(application) {
  switch (application) {
    case 'applied': return '已生效'
    case 'restart-required': return '已保存，重启后生效'
    case 'overridden': return '被更高优先级覆盖，未生效'
    case 'failed': return '执行失败'
    case 'cancelled': return '已取消'
    default: return String(application ?? '未知')
  }
}

/** One-line result summary for the toast. */
function summarize(result, verb) {
  if (!result || typeof result !== 'object') return verb + '：无返回结果'
  const app = fmtApplication(result.application)
  let line = `${verb}：${app}`
  for (const warning of Array.isArray(result.warnings) ? result.warnings : []) {
    line += '｜' + warning
  }
  if (result.error) {
    const message = result.error.diagnostic || result.error.code
    if (message) line += '｜' + message
  }
  return line
}

/**
 * The consequence hint shown next to each verb when the user keeps the hint
 * switch on. These are the exact trade-offs the Host enforces.
 */
const CONSEQUENCES = {
  'enable-plugin': '立即恢复运行；若其依赖与当前版本不兼容，可能再次加载失败。',
  'disable-plugin': '该入口立即停止运行，配置行写入 disabled，重启后保持。',
  'enable-bundle': '整个包的所有行恢复加载，即时生效（涉及宿主模块时需重启）。',
  'disable-bundle': '包内所有功能立刻消失，但依赖已安装文件保留，可随时重新启用。',
  'disable-bundles': '所选第三方包整体停止加载；文件保留，可在兼容表或搜索中逐个重新启用。',
  'remove-bundle': '从 profile 卸载该包并移除依赖，功能永久消失，需要时需重新安装。',
  'install': '立即下载并纳入本 profile；与版本不兼容的包会被管理器拒绝。',
  'update': '先经注册表校验目标版本与当前 DSH 的兼容性；失败会自动回滚到原版本。',
  'exemption': 'DSH 官方明确警告：放行不兼容版本可能导致崩溃或数据丢失，风险自担。',
}

// ---------------------------------------------------------------------------
// The tab
// ---------------------------------------------------------------------------

/** Component shared by every card render; receives { runtime, ... } via inject. */
function PluginTriageTab(props) {
  const React = props.runtime
  const { useState, useEffect, useCallback, useMemo } = React

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [busy, setBusy] = useState(null)
  const [toast, setToast] = useState(null)
  const [versions, setVersions] = useState({})   // bundle name -> PluginVersionList
  const [openVersions, setOpenVersions] = useState({}) // bundle name -> bool
  const [diagnostics, setDiagnostics] = useState({}) // bundle name -> { result, open }
  const [diagnosing, setDiagnosing] = useState(null) // bundle name being diagnosed
  const [showShared, setShowShared] = useState(false) // expand the informational shared-dependency list
  const [showOriginal, setShowOriginal] = useState(false) // show the untranslated description

  const load = useCallback(async (silent) => {
    if (!silent) setLoading(true)
    try {
      const response = await fetch(STATE_URL, { cache: 'no-store' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const payload = await response.json()
      if (payload && payload.ok === false) throw new Error(payload.error || '报告生成失败')
      setReport(payload)
      setError(null)
    } catch (cause) {
      setError(String(cause && cause.message ? cause.message : cause))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    ensureStyle()
    load(false).catch(() => {})
    const interval = window.setInterval(() => { load(true).catch(() => {}) }, 30000)
    const onRefresh = () => { load(true).catch(() => {}) }
    window.addEventListener('plugin-triage:refresh', onRefresh)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('plugin-triage:refresh', onRefresh)
    }
  }, [load])

  const showToast = useCallback((text, kind) => {
    setToast({ text, kind })
    window.setTimeout(() => setToast(null), 5000)
  }, [])

  /** POST one action; toast the outcome, refresh, clear stale version lists. */
  const act = useCallback(async (action, body, confirmText) => {
    if (confirmText && typeof window.confirm === 'function') {
      try {
        if (!window.confirm(confirmText)) return
      } catch (error) {
        return
      }
    }
    setBusy(action)
    try {
      const response = await fetch(ACTION_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(Object.assign({ action }, body || {})),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload || payload.ok !== true) {
        const message = (payload && payload.error) || `HTTP ${response.status}`
        showToast(message, 'err')
        return
      }
      const batch = Array.isArray(payload.results) ? payload.results : null
      const names = batch ? batch.map((entry) => entry.name) : payload.result && payload.result.bundle ? [payload.result.bundle]
        : body && body.name ? [body.name] : []
      if (names.length > 0) {
        setVersions((current) => {
          const next = Object.assign({}, current)
          for (const name of names) delete next[name]
          return next
        })
      }
      if (batch) {
        const failed = batch.filter((entry) => !entry.ok)
        const succeeded = batch.length - failed.length
        let text = `批量禁用：${succeeded} 个成功`
        if (failed.length > 0) {
          text += `，${failed.length} 个失败（${failed[0].name}: ${failed[0].error}）`
        }
        showToast(text, failed.length > 0 ? 'err' : 'ok')
      } else {
        showToast(summarize(payload.result, verbLabel(action)), 'ok')
      }
    } catch (cause) {
      showToast(String(cause && cause.message ? cause.message : cause), 'err')
    } finally {
      setBusy(null)
      load(true).catch(() => {})
    }
  }, [load, showToast])

  /**
   * Disable a set of bundles in one request. Used by the group-level and
   * page-level one-click actions; the Host applies each bundle through the
   * official pluginManager channel and reports per-bundle results.
   */
  const disableBundles = useCallback(async (names, label) => {
    const list = [...new Set((Array.isArray(names) ? names : []).filter((name) => typeof name === 'string' && name !== ''))]
    if (list.length === 0) return
    const preview = list.slice(0, 12).join('\n')
    const more = list.length > 12 ? `\n…另有 ${list.length - 12} 个` : ''
    const confirmed = typeof window.confirm === 'function'
      ? window.confirm(`确定${label || '禁用这些插件包'}吗？（共 ${list.length} 个）\n\n${preview}${more}\n\n后果：包内功能立刻停止加载，已安装文件保留，可随时重新启用。`)
      : true
    if (!confirmed) return
    await act('disable-bundles', { names: list })
  }, [act])

  const verbLabel = useCallback((action) => {
    switch (action) {
      case 'enable-plugin': return '启用插件'
      case 'disable-plugin': return '禁用插件'
      case 'enable-bundle': return '启用插件包'
      case 'disable-bundle': return '禁用插件包'
      case 'disable-bundles': return '批量禁用插件包'
      case 'remove-bundle': return '删除插件包'
      case 'install': return '安装'
      case 'versions': return '检查更新'
      case 'update': return '更新'
      case 'exemption-set': return '设置豁免'
      case 'exemption-remove': return '移除豁免'
      case 'update-all': return '一键更新'
      case 'disable-conflicts': return '一键禁用冲突插件'
      case 'disable-erroring': return '一键禁用报错插件'
      case 'translate': return '一键翻译插件描述'
      case 'translate-probe': return '探测翻译模型'
      case 'capabilities': return '读取插件能力'
      default: return action
    }
  }, [])

  const ask = useCallback((text) => {
    if (typeof window.confirm !== 'function') return true
    try { return window.confirm(text) } catch (error) { return false }
  }, [])

  /**
   * Run one one-click governance action and report its own summary. These
   * actions answer with a `result` verdict (updated / disabled / failed) or a
   * per-group plan, so each one owns its toast wording instead of reusing the
   * disable-only batch phrasing.
   */
  const bulk = useCallback(async (action, body) => {
    setBusy(action)
    try {
      const response = await fetch(ACTION_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(Object.assign({ action }, body || {})),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload || payload.ok !== true) {
        showToast((payload && payload.error) || ('HTTP ' + response.status), 'err')
        return null
      }
      const result = payload.result || {}
      let text
      if (action === 'update-all') {
        text = '更新：' + (result.updated || 0) + ' 个已更新｜' + (result.upToDate || 0) + ' 个已最新'
        if (result.failed) text += '｜' + result.failed + ' 个失败'
        if (result.truncated) text += '（单次最多检查 20 个包）'
      } else if (action === 'disable-erroring') {
        text = '已禁用 ' + (result.disabled || 0) + ' 个报错插件'
        if (result.failed) text += '，' + result.failed + ' 个失败'
      } else if (action === 'disable-conflicts') {
        const groups = payload.groups || []
        const fixed = groups.filter((group) => group.keeper && group.disable && group.disable.length > 0).length
        const skipped = groups.filter((group) => group.skipped && !group.keeper).length
        text = '冲突：' + fixed + ' 组已按策略修复，禁用 ' + (result.disabled || 0) + ' 个成员'
        if (skipped) text += '，' + skipped + ' 组需人工决定'
        if (result.failed) text += '，' + result.failed + ' 个失败'
      } else if (action === 'translate') {
        const done = Object.keys(payload.translations || {}).length
        const route = payload.route ? payload.route.provider + '/' + payload.route.model : '未识别模型'
        text = '翻译：' + done + ' 个描述已译（' + route + '）'
        const skipped = (payload.skipped || []).length
        if (skipped) text += '，' + skipped + ' 个跳过'
        if (payload.persisted === false) text += '（缓存写入失败，仅本次生效）'
      } else {
        text = verbLabel(action) + '完成'
      }
      showToast(text, result.failed ? 'err' : 'ok')
      return payload
    } catch (cause) {
      showToast(String(cause && cause.message ? cause.message : cause), 'err')
      return null
    } finally {
      setBusy(null)
      load(true).catch(() => {})
    }
  }, [load, showToast, verbLabel])

  /** Description in the reader's language when a translation exists. */
  const descOf = useCallback((bundle) => {
    if (!bundle) return '—'
    const zh = bundle.descriptionZh && bundle.descriptionZh.text ? bundle.descriptionZh.text : null
    if (showOriginal || !zh) return bundle.description || '—'
    return zh
  }, [showOriginal])

  const renderCaps = useCallback((bundle, tiny) => {
    const caps = bundle && bundle.capabilities
    if (!caps || !Array.isArray(caps.tags) || caps.tags.length === 0) return null
    return React.createElement('span', { className: 'ptg-caps' + (tiny ? ' tiny' : '') },
      caps.tags.map((tag) => React.createElement('span', {
        key: tag.key,
        className: 'ptg-cap',
        title: (tag.evidence || []).map((item) => item.file + (item.line ? ':' + item.line : '')).join('\n') || tag.label,
      }, tag.label)))
  }, [React])

  const checkVersions = useCallback(async (name) => {
    setBusy('versions')
    try {
      const response = await fetch(ACTION_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'versions', name }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload || payload.ok !== true) {
        showToast((payload && payload.error) || `HTTP ${response.status}`, 'err')
        return
      }
      setVersions((current) => Object.assign({}, current, { [name]: payload.result }))
      setOpenVersions((current) => Object.assign({}, current, { [name]: true }))
      if (payload.result && payload.result.status === 'refused') {
        showToast(payload.result.reason || '未找到可更新的版本', 'err')
      }
    } catch (cause) {
      showToast(String(cause && cause.message ? cause.message : cause), 'err')
    } finally {
      setBusy(null)
    }
  }, [showToast])

  /**
   * Run the Host's `diagnose` action for one bundle: import its entry in a
   * child process and show the actual error (file + line + stack). This is
   * the concrete evidence for whether a plugin is loadable at all.
   */
  const runDiagnose = useCallback(async (name) => {
    setDiagnosing(name)
    try {
      const response = await fetch(ACTION_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'diagnose', names: [name] }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload || payload.ok !== true) {
        showToast((payload && payload.error) || `HTTP ${response.status}`, 'err')
        return
      }
      const result = (payload.diagnosis || []).find((d) => d.name === name)?.result
      if (!result) {
        showToast('未返回诊断结果', 'err')
        return
      }
      setDiagnostics((current) => Object.assign({}, current, { [name]: { result } }))
      setOpenVersions((current) => Object.assign({}, current, { [name]: true }))
    } catch (cause) {
      showToast(String(cause && cause.message ? cause.message : cause), 'err')
    } finally {
      setDiagnosing(null)
    }
  }, [showToast])

  const reactOn = useCallback((name) => {
    setOpenVersions((current) => Object.assign({}, current, { [name]: !current[name] }))
  }, [])

  /**
   * The diagnostic panel for one bundle: its patch declarations, plus the
   * result of importing its entry in a child process.
   */
  const renderDiagnosisPanel = (bundle, member) => {
    const React = props.runtime
    const name = bundle ? bundle.name : member.sourceBundle
    const patch = member.patch
    const diag = diagnostics[name]
    const open = openVersions[name] === true
    if (open === false && !diag) return null
    return React.createElement('div', { className: 'ptg-diagpanel', key: name },
      // patch declarations
      patch
        ? React.createElement(React.Fragment, null,
          React.createElement('div', { className: 'ptg-meta' },
            `${bundle.name} 声明于：${patch.patchPath.replace(/[\\/]+/g, '/')}`),
          (patch.declarations || []).map((decl) =>
            React.createElement('div', { key: decl.id, className: 'ptg-decl' },
              React.createElement('code', null, decl.id),
              React.createElement('span', { className: 'ptg-declln' }, `L${decl.line}`))))
        : null,
      // diagnostics result
      diag
        ? React.createElement('div', { className: 'ptg-diag' },
          React.createElement('div', { className: 'ptg-diagh' },
            React.createElement('span', { className: 'ptg-badge ' + (diag.result.error ? 'high' : 'ok') },
              diag.result.error ? '✗ 入口导入失败' : '✓ 入口可加载'),
            diag.result.exitCode !== undefined && diag.result.exitCode !== null
              ? React.createElement('span', { className: 'ptg-meta' }, `exit ${diag.result.exitCode}`)
              : null),
          diag.result.error
            ? React.createElement('pre', { className: 'ptg-diagerr' },
              React.createElement('code', null, String(diag.result.error).slice(0, 1500)))
            : null,
          diag.result.stack
            ? React.createElement('pre', { className: 'ptg-diagstack' },
              React.createElement('code', null, String(diag.result.stack).slice(0, 2500)))
            : null)
        : null,
      // action row
      React.createElement('div', { className: 'ptg-actions' },
        React.createElement('button', {
          className: 'ptg-btn',
          disabled: diagnosing === name || busy !== null,
          onClick: () => reactOn(name),
        }, open ? '收起诊断' : '显示具体诊断'),
        React.createElement('button', {
          className: 'ptg-btn primary',
          disabled: diagnosing === name || busy !== null,
          onClick: () => runDiagnose(name),
        }, diagnosing === name ? '诊断中…' : '深度诊断（真实导入）')))
  }

  // -------------------------------------------------------------------------
  // Derived views
  // -------------------------------------------------------------------------

  const config = (report && report.config) || { enabled: true, autoRefreshSeconds: 30, showConsequenceHints: true }
  const showHints = config.showConsequenceHints !== false
  const stats = (report && report.stats) || null

  const hint = useCallback((verb) => (showHints ? CONSEQUENCES[verb] || null : null), [showHints])

  const matcher = useMemo(() => {
    const query = String(search || '').trim().toLowerCase()
    if (query === '') return () => true
    return (text) => {
      if (typeof text !== 'string') return false
      return text.toLowerCase().indexOf(query) >= 0
    }
  }, [search])

  const bundleMatches = useCallback((b) => {
    if (!b) return false
    if (matcher(b.name) || matcher(b.description) || matcher(b.version)) return true
    const metaTitle = b.meta && (typeof b.meta.title === 'string' ? b.meta.title : b.meta.title && b.meta.title.zh)
    if (matcher(metaTitle)) return true
    if (b.patch && (matcher(b.patch.patchPath) || (b.patch.declarations || []).some((decl) => matcher(decl.id)))) return true
    if (b.compat && matcher(b.compat.reason)) return true
    return (b.rows || []).some((row) => matcher(row.rowId) || matcher(row.moduleName) || matcher(row.entryId))
  }, [matcher])

  const visibleConflicts = useMemo(() => {
    if (!report) return []
    let list = report.conflicts || []
    if (filter === 'conflicts') list = list
    else if (filter === 'all') { /* all */ }
    else return []
    if (matcher('')) return list
    return list.filter((conflict) => {
      if (matcher(conflict.title) || matcher(conflict.detail) || matcher(conflict.type)) return true
      return (conflict.members || []).some((m) => {
        const bundle = m.bundle || (m.sourceBundle ? report.bundles.find((b) => b.name === m.sourceBundle) : null)
        return bundleMatches(bundle) || matcher(m.rowId) || matcher(m.moduleName) || matcher(m.entryId)
      })
    })
  }, [report, filter, matcher, bundleMatches])

  const visibleIssues = useMemo(() => {
    if (!report) return []
    let list = report.issues || []
    if (filter === 'issues') list = list
    else if (filter === 'all') { /* all */ }
    else return []
    if (matcher('')) return list
    return list.filter((issue) => {
      if (matcher(issue.title) || matcher(issue.detail) || matcher(issue.type)) return true
      const subject = issue.subject || {}
      return matcher(subject.name) || matcher(subject.entryId) || matcher(subject.moduleName)
    })
  }, [report, filter, matcher])

  const visibleCompat = useMemo(() => {
    if (!report) return []
    if (filter !== 'all' && filter !== 'compat') return []
    let list = (report.bundles || []).filter((b) => b.installed)
    if (filter === 'compat') {
      list = list.filter((b) => b.compat && b.compat.status !== 'ok' && b.compat.status !== 'n/a')
    }
    if (matcher('')) return list
    return list.filter(bundleMatches)
  }, [report, filter, matcher, bundleMatches])

  const visibleCatalog = useMemo(() => {
    if (!report) return []
    if (filter !== 'all' && filter !== 'catalog') return []
    let list = report.official || []
    if (filter === 'catalog') list = list
    if (matcher('')) return list
    return list.filter((entry) => matcher(entry.name) || matcher(entry.description) || matcher(entry.version))
  }, [report, filter, matcher])

  const hasSearch = matcher('') === false

  // Third-party inventory, newest-first by enabled state. `report.bundles`
  // already carries the `thirdParty` flag from the Host; the fallback keeps old
  // Host versions compatible.
  const thirdPartyBundles = useMemo(() => {
    const list = ((report && report.bundles) || []).filter((b) => b.installed && (b.thirdParty === true || b.official !== true))
    return [...list].sort((a, b) => {
      if (!!a.enabled !== !!b.enabled) return a.enabled ? -1 : 1
      return String(a.name).localeCompare(String(b.name))
    })
  }, [report])

  const enabledThirdParty = useMemo(
    () => thirdPartyBundles.filter((b) => b.enabled && b.name !== SELF_BUNDLE && !b.readOnlyReason),
    [thirdPartyBundles],
  )

  const allThirdPartyNames = useMemo(() => enabledThirdParty.map((b) => b.name), [enabledThirdParty])

  // The same population the Host's `update-all` inspects: installed, enabled,
  // non-official packages. The count is a candidate count, not a known update
  // count — only the Host's per-bundle version check knows that.
  const updateCandidates = useMemo(
    () => ((report && report.bundles) || []).filter((b) => b.installed && !b.official && b.enabled !== false),
    [report],
  )

  const errorTargetNames = useMemo(() => {
    const names = []
    for (const issue of (report && report.issues) || []) {
      const subject = issue.subject || {}
      const name = subject.entryId || subject.name
      if (!name || name === SELF_BUNDLE) continue
      if (subject.disabled === true) continue
      if (!names.includes(name)) names.push(name)
    }
    return names
  }, [report])

  const untranslatedCount = (report && report.stats && report.stats.untranslated) || 0


  const visibleThirdParty = filter === 'thirdparty' ? thirdPartyBundles : []

  const searchInstalled = useMemo(() => {
    if (!hasSearch) return []
    return ((report && report.bundles) || []).filter((b) => b.installed && bundleMatches(b))
  }, [report, hasSearch, bundleMatches])

  const searchCatalog = useMemo(() => {
    if (!hasSearch) return []
    return ((report && report.official) || []).filter(
      (entry) => matcher(entry.name) || matcher(entry.description) || matcher(entry.version),
    )
  }, [report, hasSearch, matcher])

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const renderBundleActions = (bundle) => {
    const React = props.runtime
    const buttons = []
    const dis = busy !== null
    const compat = bundle.compat || {}
    const key = `${bundle.name}@${bundle.version}`
    const exempted = compat.status === 'exempted'
    const incompatible = compat.status === 'incompatible'

    if (bundle.enabled) {
      buttons.push(React.createElement('button', {
        key: 'disable-bundle', className: 'ptg-btn', disabled: dis || bundle.readOnlyReason,
        onClick: () => act('disable-bundle', { name: bundle.name }, `确定禁用插件包 ${bundle.name} 吗？\n后果：包内所有功能立刻消失，但已安装文件保留，可随时重新启用。`),
      }, '禁用包'))
    } else {
      buttons.push(React.createElement('button', {
        key: 'enable-bundle', className: 'ptg-btn primary', disabled: dis || bundle.readOnlyReason,
        onClick: () => act('enable-bundle', { name: bundle.name }, `确定重新启用插件包 ${bundle.name} 吗？`),
      }, '启用包'))
    }
    if (bundle.removable) {
      buttons.push(React.createElement('button', {
        key: 'remove', className: 'ptg-btn danger', disabled: dis,
        onClick: () => act('remove-bundle', { name: bundle.name }, `确定删除插件包 ${bundle.name} 吗？\n后果：从 profile 卸载并移除依赖，功能永久消失，需要时需重新安装。`),
      }, '删除包'))
    }
    // Deep diagnostic: import this bundle's entry in a child process and show
    // the real error (file + line + stack). Lets the user decide which plugin
    // to keep or replace based on the actual failure.
    buttons.push(React.createElement('button', {
      key: 'diagnose', className: 'ptg-btn', disabled: diagnosing === bundle.name || busy !== null,
      onClick: () => runDiagnose(bundle.name),
    }, diagnosing === bundle.name ? '诊断中…' : '深度诊断'))
    if (bundle.updatable || !bundle.removable) {
      buttons.push(React.createElement('button', {
        key: 'versions', className: 'ptg-btn', disabled: dis,
        onClick: () => checkVersions(bundle.name),
      }, '检查更新'))
    }
    if (incompatible && compat.failure) {
      const pkgVersion = compat.failure.key || key
      const runtimeVersion = (report && report.engineVersion) || compat.failure.engineVersion || ''
      buttons.push(React.createElement('button', {
        key: 'exempt', className: 'ptg-btn warn', disabled: dis,
        onClick: () => act('exemption-set', { packageVersion: pkgVersion, runtimeVersion, acceptRisk: true },
          `确定对 ${pkgVersion} 设置版本豁免吗？\n后果（DSH 官方警告）：放行不兼容版本可能导致崩溃或数据丢失，风险自担。`),
      }, '设置豁免'))
    } else if (exempted) {
      const pkgVersion = (compat.failure && compat.failure.key) || key
      const runtimeVersion = (report && report.engineVersion) || ''
      buttons.push(React.createElement('button', {
        key: 'unexempt', className: 'ptg-btn', disabled: dis,
        onClick: () => act('exemption-remove', { packageVersion: pkgVersion, runtimeVersion }),
      }, '移除豁免'))
    }
    return buttons
  }

  const renderVersionPicker = (bundle) => {
    const React = props.runtime
    const list = versions[bundle.name]
    const open = openVersions[bundle.name] === true
    if (!list) return null
    const children = []
    if (list.status === 'listed') {
      children.push(React.createElement('div', { key: 'h', className: 'ptg-meta' },
        `已装 ${list.installed}｜远端可更新 ${(list.versions || []).length} 个`))
      for (const version of (list.versions || []).slice(0, 8)) {
        const line = []
        line.push(React.createElement('span', { key: 'v', className: 'v' }, version.version))
        if (version.incompatible) {
          const req = version.incompatible.requirements || {}
          const range = req.dsh || req.node || ''
          line.push(React.createElement('span', { key: 'bad', className: 'ptg-badge high' },
            '与当前 DSH 不兼容' + (range ? `（要求 ${range}）` : '')))
        } else {
          line.push(React.createElement('span', { key: 'ok', className: 'ptg-badge ok' }, '兼容'))
        }
        if (version.deprecated) line.push(React.createElement('span', { key: 'dep', className: 'ptg-badge warn' }, '已弃用'))
        line.push(React.createElement('button', {
          key: 'up', className: 'ptg-btn primary', disabled: busy !== null,
          onClick: () => act('update', { name: bundle.name, version: version.version },
            `确定将 ${bundle.name} 更新到 ${version.version} 吗？\n后果：先校验兼容性，失败自动回滚原版本；部分更新需要重启后生效。`),
        }, '更新到此版本'))
        children.push(React.createElement('div', { key: version.version, className: 'ptg-ver' }, line))
      }
      if ((list.versions || []).length > 8) {
        children.push(React.createElement('div', { key: 'more', className: 'ptg-meta' }, `…还有 ${list.versions.length - 8} 个版本未列出`))
      }
      if ((list.versions || []).length === 0) {
        children.push(React.createElement('div', { key: 'no', className: 'ptg-meta' }, '已是最新版本。'))
      }
    } else {
      children.push(React.createElement('div', { key: 'refused', className: 'ptg-meta' }, list.reason || '无法获取版本列表'))
    }
    return React.createElement('div', { className: 'ptg-vers' },
      React.createElement('button', {
        className: 'ptg-btn', disabled: busy !== null,
        onClick: () => reactOn(bundle.name),
      }, open ? '收起版本列表' : '展开版本列表'),
      open ? children : [])
  }

  const renderRowActions = (row, bundle) => {
    // row-level entry actions; entryId lives in the runtime plugin inventory
    const React = props.runtime
    const plugin = (report && report.plugins || []).find((p) => p.entryId === row.entryId)
    const dis = busy !== null
    if (!plugin || plugin.readOnlyReason) return null
    const buttons = []
    if (plugin.enabled) {
      buttons.push(React.createElement('button', {
        key: 'dp', className: 'ptg-btn', disabled: dis,
        onClick: () => act('disable-plugin', { entryId: plugin.entryId },
          `确定禁用入口 ${plugin.entryId} 吗？\n后果：该入口立即停止运行，配置行写入 disabled。`),
      }, '禁用入口'))
    } else {
      buttons.push(React.createElement('button', {
        key: 'ep', className: 'ptg-btn primary', disabled: dis,
        onClick: () => act('enable-plugin', { entryId: plugin.entryId }, `确定重新启用入口 ${plugin.entryId} 吗？`),
      }, '启用入口'))
    }
    return buttons
  }

  const renderRichHint = (verbs) => {
    if (!showHints) return null
    const React = props.runtime
    const lines = []
    for (const verb of verbs) {
      const text = CONSEQUENCES[verb]
      if (text) lines.push(React.createElement('div', { key: verb }, `后果（${verbLabel(verb)}）：${text}`))
    }
    return lines.length === 0 ? null : React.createElement('div', { className: 'ptg-hint' }, lines)
  }

  if (loading && !report) {
    return React.createElement('div', { className: 'ptg-root' }, '正在生成冲突体检报告…')
  }
  if (error && !report) {
    return React.createElement('div', { className: 'ptg-root' },
      React.createElement('div', { className: 'ptg-err' },
        '无法读取体检状态：' + error,
        React.createElement('br'),
        React.createElement('button', { className: 'ptg-btn', onClick: () => load(false), style: { marginTop: 8 } }, '重试')))
  }
  if (!report) return React.createElement('div', { className: 'ptg-root' }, '暂无数据。')

  const conflicts = visibleConflicts
  const issues = visibleIssues
  const compatList = visibleCompat
  const catalog = visibleCatalog

  return React.createElement('div', { className: 'ptg-root' },
    // header
    React.createElement('div', { className: 'ptg-head' },
      React.createElement('span', { className: 'ptg-title' }, '插件冲突体检'),
      React.createElement('span', { className: 'ptg-sub' },
        `DSH 应用 ${stats && stats.runtimeVersion ? stats.runtimeVersion : '版本未知'}｜引擎 ${report.engineVersion || '版本未知'}｜`
        + `检查于 ${new Date(report.generatedAt).toLocaleTimeString()}`),
      React.createElement('button', { className: 'ptg-btn', disabled: busy !== null, onClick: () => load(false) }, '重新检查')),

    // stats
    React.createElement('div', { className: 'ptg-stats' },
      React.createElement('span', { className: 'ptg-stat' },
        React.createElement('b', null, stats ? stats.plugins : '-'), '运行中插件入口'),
      React.createElement('span', { className: 'ptg-stat' },
        React.createElement('b', null, stats ? stats.installedBundles : '-'), '已安装插件包'),
      React.createElement('span', { className: 'ptg-stat ' + (stats && stats.conflictGroups > 0 ? 'bad' : 'ok') },
        React.createElement('b', null, stats ? stats.conflictGroups : '-'),
        `真冲突组（${stats ? stats.conflictMembers : 0} 个启用成员）`),
      React.createElement('span', { className: 'ptg-stat bad' },
        React.createElement('b', null, stats ? stats.issues : '-'), '问题（失败/不兼容等）'),
      React.createElement('span', { className: 'ptg-stat info' },
        React.createElement('b', null, stats ? `${stats.thirdPartyEnabled}/${stats.thirdPartyBundles}` : '-'),
        '第三方包（启用/总数）'),
      React.createElement('span', { className: 'ptg-stat info' },
        React.createElement('b', null, stats ? stats.sharedClientDependencies : '-'),
        '共享客户端依赖（正常）'),
      stats && stats.exempted > 0
        ? React.createElement('span', { className: 'ptg-stat warn' },
          React.createElement('b', null, stats.exempted), '被豁免版本')
        : null,
      React.createElement('span', { className: 'ptg-stat' },
        React.createElement('b', null, stats ? (stats.engineVersion || '-') : '-'),
        '引擎基准')),

    // capability distribution: what this profile's plugins can actually do
    stats && stats.capabilityCounts && Object.keys(stats.capabilityCounts).length > 0
      ? React.createElement('div', { className: 'ptg-caps' },
        React.createElement('span', { className: 'ptg-meta' }, '插件能力分布（按已安装包计）：'),
        Object.keys(stats.capabilityCounts)
          .sort((a, b) => stats.capabilityCounts[b] - stats.capabilityCounts[a])
          .map((key) => React.createElement('span', {
            key,
            className: 'ptg-cap api',
            title: '从 package.json / cordis.patch.yml / 入口代码的静态证据推断',
          }, (CAP_LABELS[key] || key) + ' ' + stats.capabilityCounts[key])))
      : null,

    // toolbar
    React.createElement('div', { className: 'ptg-toolbar' },
      React.createElement('input', {
        className: 'ptg-search', placeholder: '查找插件：包名 / 入口 / 模块 / 声明 / 描述 / 官方目录…',
        value: search, onChange: (event) => setSearch(event.target.value),
      }),
      hasSearch
        ? React.createElement('button', { className: 'ptg-chip', onClick: () => setSearch('') }, '清空搜索')
        : null,
      React.createElement('button', { className: 'ptg-chip', 'data-on': filter === 'all' ? '1' : '0', onClick: () => setFilter('all') }, '全部'),
      React.createElement('button', { className: 'ptg-chip bad', 'data-on': filter === 'conflicts' ? '1' : '0', onClick: () => setFilter('conflicts') },
        React.createElement('span', null, '冲突 '),
        React.createElement('span', { className: 'n' }, report.conflicts.length)),
      React.createElement('button', { className: 'ptg-chip bad', 'data-on': filter === 'issues' ? '1' : '0', onClick: () => setFilter('issues') },
        React.createElement('span', null, '问题 '),
        React.createElement('span', { className: 'n' }, report.issues.length)),
      React.createElement('button', { className: 'ptg-chip', 'data-on': filter === 'compat' ? '1' : '0', onClick: () => setFilter('compat') },
        React.createElement('span', null, '兼容性 '),
        React.createElement('span', { className: 'n' }, compatList.length)),
      React.createElement('button', { className: 'ptg-chip', 'data-on': filter === 'catalog' ? '1' : '0', onClick: () => setFilter('catalog') },
        React.createElement('span', null, '官方目录可安装 '),
        React.createElement('span', { className: 'n' }, (report.official || []).length)),
      React.createElement('button', { className: 'ptg-chip third', 'data-on': filter === 'thirdparty' ? '1' : '0', onClick: () => setFilter(filter === 'thirdparty' ? 'all' : 'thirdparty') },
        React.createElement('span', null, '第三方 '),
        React.createElement('span', { className: 'n' }, thirdPartyBundles.length)),
      React.createElement('button', {
        className: 'ptg-chip', 'data-on': showOriginal ? '0' : '1',
        title: '插件描述显示：模型译文 / 原文',
        onClick: () => setShowOriginal(!showOriginal),
      }, showOriginal ? '描述：原文' : '描述：译文')),

    // batch actions
    React.createElement('div', { className: 'ptg-batch' },
      React.createElement('span', { className: 'ptg-meta' },
        `批量治理（已启用第三方 ${enabledThirdParty.length} 个，不含本插件）：`),
      React.createElement('button', {
        className: 'ptg-btn warn', disabled: busy !== null || (report.conflicts || []).length === 0,
        onClick: () => {
          if (!ask('按「官方包 > 已启用 > 版本更高」为每组保留一个成员，其余成员一键禁用。\n\n无法判定保留者的组会跳过并保持标红，等你手动决定。\n\n继续吗？')) return
          bulk('disable-conflicts', {})
        },
      }, '一键禁用冲突插件（' + (report.conflicts || []).length + ' 组）'),
      React.createElement('button', {
        className: 'ptg-btn primary', disabled: busy !== null || updateCandidates.length === 0,
        onClick: () => {
          if (!ask('一键更新会逐个检查远端版本，只处理非官方且已启用的插件包（单次最多 20 个）。\n\n后果：每次更新先校验兼容性，失败自动回滚原版本；部分更新需要重启后生效。\n\n继续吗？')) return
          bulk('update-all', {})
        },
      }, '一键更新（检查 ' + updateCandidates.length + ' 个包）'),
      React.createElement('button', {
        className: 'ptg-btn danger', disabled: busy !== null || errorTargetNames.length === 0,
        onClick: () => {
          if (!ask('将禁用报告里所有加载失败 / 插件包管理错误 / 版本不兼容的插件与包（共 ' + errorTargetNames.length + ' 个）。\n\n后果：它们立即停止加载，已安装文件保留。\n注意：版本不兼容的包被禁用后，需先「设置豁免」才能重新启用。\n\n继续吗？')) return
          bulk('disable-erroring', {})
        },
      }, '一键禁用报错插件（' + errorTargetNames.length + '）'),
      React.createElement('button', {
        className: 'ptg-btn', disabled: busy !== null || untranslatedCount === 0,
        onClick: () => {
          if (!ask('用当前 profile 已配置的模型翻译 ' + untranslatedCount + ' 个非中文插件描述（单次最多 12 个）。\n\n后果：描述文本会发送给你配置的模型提供方；译文缓存在本机，可离线复用。\n\n继续吗？')) return
          bulk('translate', {})
        },
      }, '一键翻译描述（' + untranslatedCount + '）'),
      React.createElement('button', {
        className: 'ptg-btn danger', disabled: busy !== null || allThirdPartyNames.length === 0,
        onClick: () => disableBundles(allThirdPartyNames, '禁用全部启用的第三方包'),
      }, `一键禁用全部第三方包（${allThirdPartyNames.length}）`),
      React.createElement('span', { className: 'ptg-note' },
        '以上动作都走官方 pluginManager 通道；批量禁用永不包含本插件自身。'
        + '版本不兼容的包被禁用后需「设置豁免」才能再启用，这是 DSH 的版本门控。')),

    // plugin search results (installed + official catalog)
    hasSearch
      ? React.createElement('div', { className: 'ptg-sec' },
        React.createElement('div', { className: 'ptg-sec-h' },
          '查找插件 · 搜索结果',
          React.createElement('span', { className: 'ptg-count info' },
            String(searchInstalled.length + searchCatalog.length)),
          React.createElement('button', { className: 'ptg-btn', onClick: () => setSearch('') }, '清空')),
        searchInstalled.length + searchCatalog.length === 0
          ? React.createElement('div', { className: 'ptg-empty' }, '没有匹配的插件包或官方目录条目。')
          : null,
        searchInstalled.map((bundle) =>
          React.createElement('div', { key: 'found:' + bundle.name, className: 'ptg-row' + (bundle.enabled ? '' : ' off') },
            React.createElement('div', { className: 'ptg-node' },
              React.createElement('span', { className: 'ptg-cardhead' },
                React.createElement('span', { className: 'nm' }, bundle.name + (bundle.version ? ` v${bundle.version}` : '')),
                React.createElement('span', { className: 'ptg-badge ' + (bundle.enabled ? 'ok' : 'medium') }, bundle.enabled ? '已启用' : '已禁用'),
                React.createElement('span', { className: 'ptg-badge ' + (bundle.official ? 'info' : 'third') }, bundle.official ? '官方' : '第三方'),
              renderCaps(bundle, true)),
            React.createElement('span', { className: 'dm' },
              descOf(bundle),
              bundle.descriptionZh && !showOriginal
                ? React.createElement('span', { className: 'ptg-tr', title: '模型译文：' + (bundle.descriptionZh.model || '未知模型') }, '译')
                : null)),
            React.createElement('div', { className: 'ptg-actions' }, renderBundleActions(bundle)),
            renderDiagnosisPanel(bundle, { patch: bundle.patch }),
            renderVersionPicker(bundle))),
        searchCatalog.map((entry) => {
          const spec = (entry.installTarget && entry.installTarget.spec) || entry.name
          return React.createElement('div', { key: 'catalog:' + entry.name, className: 'ptg-row' },
            React.createElement('div', { className: 'ptg-node' },
              React.createElement('span', { className: 'ptg-cardhead' },
                React.createElement('span', { className: 'nm' }, entry.name),
                React.createElement('span', { className: 'ptg-badge info' }, '官方目录')),
              React.createElement('span', { className: 'dm' },
                descOf(entry) + (entry.version ? '｜v' + entry.version : ''),
                entry.descriptionZh
                  ? React.createElement('span', { className: 'ptg-tr', title: '模型译文：' + (entry.descriptionZh.model || '未知模型') }, '译')
                  : null)),
            React.createElement('div', { className: 'ptg-actions' },
              React.createElement('button', {
                className: 'ptg-btn primary', disabled: busy !== null,
                onClick: () => act('install', { spec },
                  `确定安装 ${entry.name} 吗？\n后果：立即下载并纳入本 profile；与当前版本不兼容的包会被管理器拒绝。`),
              }, '安装')))
        }))
      : null,

    // third-party inventory view
    filter === 'thirdparty'
      ? React.createElement('div', { className: 'ptg-sec' },
        React.createElement('div', { className: 'ptg-sec-h' },
          '第三方插件包',
          React.createElement('span', { className: 'ptg-count info' }, String(thirdPartyBundles.length)),
          React.createElement('button', {
            className: 'ptg-btn danger', disabled: busy !== null || allThirdPartyNames.length === 0,
            onClick: () => disableBundles(allThirdPartyNames, '禁用全部启用的第三方包'),
          }, `一键禁用全部启用的第三方包（${allThirdPartyNames.length}）`)),
        React.createElement('div', { className: 'ptg-note' },
          '按启用状态排序。禁用只会停止加载，文件仍保留；可随时在这里重新启用。'),
        visibleThirdParty.length === 0
          ? React.createElement('div', { className: 'ptg-empty' }, '没有已安装的第三方插件包。')
          : visibleThirdParty.map((bundle) =>
            React.createElement('div', { key: 'tp:' + bundle.name, className: 'ptg-row' + (bundle.enabled ? '' : ' off') },
              React.createElement('div', { className: 'ptg-node' },
                React.createElement('span', { className: 'ptg-cardhead' },
                  React.createElement('span', { className: 'nm' }, bundle.name + (bundle.version ? ` v${bundle.version}` : '')),
                  React.createElement('span', { className: 'ptg-badge ' + (bundle.enabled ? 'ok' : 'medium') }, bundle.enabled ? '已启用' : '已禁用'),
                  renderCaps(bundle, true)),
                React.createElement('span', { className: 'dm' },
                  descOf(bundle),
                  bundle.descriptionZh && !showOriginal
                    ? React.createElement('span', { className: 'ptg-tr', title: '模型译文：' + (bundle.descriptionZh.model || '未知模型') }, '译')
                    : null)),
              React.createElement('div', { className: 'ptg-actions' }, renderBundleActions(bundle)),
              renderDiagnosisPanel(bundle, { patch: bundle.patch }),
              renderVersionPicker(bundle))))
      : null,

    // conflicts
    (filter === 'all' || filter === 'conflicts')
      ? React.createElement('div', { className: 'ptg-sec' },
      React.createElement('div', { className: 'ptg-sec-h' },
        '同类 / 重复冲突',
        React.createElement('span', { className: 'ptg-count' }, conflicts.length === 0 ? '无' : String(conflicts.length))),
      React.createElement('div', { className: 'ptg-note' },
        '只统计已启用的插件包和入口；已禁用的同类包不参与冲突判定，可在搜索或第三方列表中查看并重新启用。'),
      conflicts.length === 0
        ? React.createElement('div', { className: 'ptg-empty' },
          hasSearch ? '没有匹配的冲突组。' : '没有真正的重复挂载/重复装载冲突（已禁用包不计入）。')
        : conflicts.map((conflict) => {
          const groupThirdParty = [...new Set(
            (conflict.members || [])
              .map((member) => member.bundle)
              .filter((bundle) => bundle && bundle.enabled && !bundle.official && bundle.name !== SELF_BUNDLE && !bundle.readOnlyReason)
              .map((bundle) => bundle.name),
          )]
          return React.createElement('div', { key: conflict.id, className: 'ptg-card bad' },
            React.createElement('div', { className: 'ptg-cardhead' },
              React.createElement('span', { className: 'ptg-badge high' },
                conflict.type === 'duplicate-entry' ? '重复入口' : '重复模块'),
              React.createElement('span', { className: 'ptg-ttl' }, conflict.title),
              React.createElement('span', { className: 'ptg-count' },
                `${conflict.enabledMembers || conflict.members.length} 个启用包`),
              React.createElement('button', {
                className: 'ptg-btn primary', disabled: busy !== null,
                onClick: () => {
                  if (!ask('按「官方包 > 已启用 > 版本更高」保留本组一个成员，其余成员一键禁用。\n\n无法判定保留者时不会改动。\n\n继续吗？')) return
                  bulk('disable-conflicts', { id: conflict.id })
                },
              }, '按策略修复本组'),
              groupThirdParty.length > 0
                ? React.createElement('button', {
                  className: 'ptg-btn warn', disabled: busy !== null,
                  onClick: () => disableBundles(groupThirdParty, '禁用本组冲突的第三方包'),
                }, `禁用本组第三方包（${groupThirdParty.length}）`)
                : null),
            React.createElement('div', { className: 'ptg-detail' }, conflict.detail),
            React.createElement('div', { className: 'ptg-advice' },
              React.createElement('b', null, '建议：'), conflict.advice),
            (conflict.members || []).map((member, index) => {
              const bundle = member.bundle
              const rowActions = member.entryId ? renderRowActions(member, bundle) : null
              const bundleActions = bundle ? renderBundleActions(bundle) : null
              const wrapped = []
              if (rowActions) for (const node of rowActions) wrapped.push(node)
              if (bundleActions) for (const node of bundleActions) wrapped.push(node)
              const extra = []
              if (member.rowId) extra.push(`入口 ${member.rowId}`)
              if (member.entryId) extra.push(member.entryId)
              if (member.moduleName) extra.push(member.moduleName)
              const name = bundle ? bundle.name
                : member.sourceBundle ? String(member.sourceBundle) : (member.entryId || '?')
              const version = bundle && bundle.version ? ` v${bundle.version}` : ''
              return React.createElement('div', { key: member.rowId || member.sourceBundle || index, className: 'ptg-row' },
                React.createElement('div', { className: 'ptg-node' },
                  React.createElement('span', { className: 'ptg-cardhead' },
                    React.createElement('span', { className: 'nm' }, name + version),
                    React.createElement('span', { className: 'ptg-badge ' + (bundle && !bundle.official ? 'third' : 'info') },
                      bundle && !bundle.official ? '第三方' : '官方')),
                  React.createElement('span', { className: 'dm' }, extra.join(' ｜ ') || '—')),
                React.createElement('div', { className: 'ptg-actions' }, wrapped),
                renderDiagnosisPanel(bundle, member))
            }),
            renderRichHint(['disable-bundle', 'disable-bundles', 'remove-bundle']))
        })
      )
      : null,

    // shared client module dependencies (informational, not a conflict)
    filter === 'all' && (report.sharedClientDependencies || []).length > 0
      ? React.createElement('div', { className: 'ptg-sec' },
        React.createElement('div', { className: 'ptg-sec-h' },
          '共享客户端依赖（正常，非冲突）',
          React.createElement('span', { className: 'ptg-count info' }, String(report.sharedClientDependencies.length)),
          React.createElement('button', {
            className: 'ptg-btn', onClick: () => setShowShared(!showShared),
          }, showShared ? '收起明细' : '展开明细')),
        React.createElement('div', { className: 'ptg-note' },
          'dsh.client.inject 声明的是客户端模块依赖，不是 UI 挂载点；多个插件复用同一模块时 DSH 只保留一个实例。'
          + (stats && stats.platformOverlapGroups > 0 ? ` 另有 ${stats.platformOverlapGroups} 组框架官方重叠（分层机制，非冲突）。` : '')),
        showShared
          ? report.sharedClientDependencies.map((shared) =>
            React.createElement('div', { key: shared.id, className: 'ptg-card info' },
              React.createElement('div', { className: 'ptg-cardhead' },
                React.createElement('span', { className: 'ptg-badge info' }, '依赖共享'),
                React.createElement('span', { className: 'ptg-ttl' }, shared.slot),
                React.createElement('span', { className: 'ptg-count info' }, `${shared.enabledMembers} 个启用插件`)),
              React.createElement('div', { className: 'ptg-detail' }, shared.detail),
              (shared.members || []).map((member) =>
                React.createElement('div', {
                  key: member.sourceBundle,
                  className: 'ptg-row' + (member.enabled ? '' : ' off'),
                },
                React.createElement('div', { className: 'ptg-node' },
                  React.createElement('span', { className: 'ptg-cardhead' },
                    React.createElement('span', { className: 'nm' },
                      member.sourceBundle + (member.bundle && member.bundle.version ? ` v${member.bundle.version}` : '')),
                    React.createElement('span', { className: 'ptg-badge ' + (member.enabled ? 'ok' : 'medium') },
                      member.enabled ? '已启用' : '已禁用'),
                    React.createElement('span', { className: 'ptg-badge ' + (member.thirdParty ? 'third' : 'info') },
                      member.thirdParty ? '第三方' : '官方')),
                  React.createElement('span', { className: 'dm' }, '共享该客户端模块依赖')),
                member.bundle ? React.createElement('div', { className: 'ptg-actions' }, renderBundleActions(member.bundle)) : null))
            ))
          : null)
      : null,

    // issues
    (filter === 'all' || filter === 'issues')
      ? React.createElement('div', { className: 'ptg-sec' },
      React.createElement('div', { className: 'ptg-sec-h' },
        '加载问题 / 版本不兼容',
        React.createElement('span', { className: 'ptg-count' }, issues.length === 0 ? '无' : String(issues.length)),
      React.createElement('button', {
        className: 'ptg-btn danger', disabled: busy !== null || errorTargetNames.length === 0,
        onClick: () => {
          if (!ask('将禁用报告里全部报错插件与插件包（' + errorTargetNames.length + ' 个）。\n\n后果：立即停止加载，已安装文件保留。\n注意：版本不兼容的包被禁用后，需先在「兼容性」表格里为它「设置豁免」才能重新启用（这是 DSH 的版本门控，不是本插件加的）。\n\n继续吗？')) return
          bulk('disable-erroring', {})
        },
      }, '一键禁用报错插件（' + errorTargetNames.length + '）')),
      issues.length === 0
        ? React.createElement('div', { className: 'ptg-empty' },
          hasSearch ? '没有匹配的问题。' : '没有加载失败、pending 或版本不兼容的问题。')
        : issues.map((issue) => {
          const subject = issue.subject || {}
          const bundle = subject.name ? (report.bundles || []).find((b) => b.name === subject.name) : null
          const verbs = []
          if (subject.entryId) verbs.push('disable-plugin')
          if (bundle) verbs.push('disable-bundle')
          const actions = []
          if (subject.entryId) {
            const plugin = (report.plugins || []).find((p) => p.entryId === subject.entryId)
            if (plugin && !plugin.readOnlyReason) {
              actions.push(React.createElement('button', {
                key: 'dp', className: 'ptg-btn', disabled: busy !== null,
                onClick: () => act('disable-plugin', { entryId: plugin.entryId },
                  `确定禁用入口 ${plugin.entryId} 吗？\n后果：该入口立即停止运行。`),
              }, '禁用该插件'))
            }
          }
          if (bundle) {
            for (const node of renderBundleActions(bundle)) actions.push(node)
          }
          return React.createElement('div', { key: issue.id, className: 'ptg-card' + (issue.type === 'incompatible' ? ' warn' : ' bad') },
            React.createElement('div', { className: 'ptg-cardhead' },
              React.createElement('span', { className: 'ptg-badge ' + (issue.type === 'incompatible' ? 'medium' : 'high') },
                issue.type === 'failed' ? '加载失败' : issue.type === 'pending' ? '加载等待' : issue.type === 'incompatible' ? '版本不兼容' : '管理错误'),
              React.createElement('span', { className: 'ptg-ttl' }, issue.title)),
            React.createElement('div', { className: 'ptg-detail' }, issue.detail),
            React.createElement('div', { className: 'ptg-advice' },
              React.createElement('b', null, '建议：'), issue.advice),
            actions.length > 0 ? React.createElement('div', { className: 'ptg-actions' }, actions) : null,
            bundle ? renderDiagnosisPanel(bundle, { patch: issue.patch || bundle.patch }) : null,
            renderRichHint(['disable-bundle', 'remove-bundle']))
        }))
      : null,

    // version compatibility table
    (filter === 'all' || filter === 'compat')
      ? React.createElement('div', { className: 'ptg-sec' },
      React.createElement('div', { className: 'ptg-sec-h' },
        '已安装插件包 × 当前 DSH 版本兼容性',
        React.createElement('span', { className: 'ptg-count' }, compatList.length === 0 ? '无' : String(compatList.length))),
      React.createElement('div', { className: 'ptg-table' },
        React.createElement('div', { className: 'ptg-th' },
          React.createElement('span', { className: 'c-name' }, '插件包'),
          React.createElement('span', { className: 'c-ver' }, '版本'),
          React.createElement('span', { className: 'c-range' }, 'engines.dsh'),
          React.createElement('span', { className: 'c-state' }, '判定'),
          React.createElement('span', { className: 'c-act' }, '治理')),
        compatList.length === 0
          ? React.createElement('div', { className: 'ptg-empty' }, '没有可展示的已安装插件包。')
          : compatList.map((bundle) => {
            const compat = bundle.compat || {}
            const badge = compat.status === 'ok'
              ? React.createElement('span', { className: 'ptg-badge ok' }, '✓ 兼容')
              : compat.status === 'incompatible'
                ? React.createElement('span', { className: 'ptg-badge high' }, '✗ 不兼容')
                : compat.status === 'exempted'
                  ? React.createElement('span', { className: 'ptg-badge warn' }, '⚠ 已豁免')
                  : React.createElement('span', { className: 'ptg-badge' }, compat.status === 'unknown' ? '? 未声明' : '—')
            return React.createElement('div', { key: bundle.name },
              React.createElement('div', { className: 'ptg-trow' },
                React.createElement('span', { className: 'c-name', title: bundle.name }, bundle.name),
                React.createElement('span', { className: 'c-ver' }, bundle.version || '-'),
                React.createElement('span', { className: 'c-range', title: compat.reason || '' }, compat.engineRange || '未声明'),
                React.createElement('span', { className: 'c-state' }, badge),
                React.createElement('span', { className: 'c-act' }, renderBundleActions(bundle))),
              renderDiagnosisPanel(bundle, { patch: bundle.patch }))
          })),
      (report.exemptions && report.exemptions.warnings && report.exemptions.warnings.length > 0)
        ? React.createElement('div', { className: 'ptg-meta' }, '豁免记录告警：' + report.exemptions.warnings.join('；'))
        : null)
      : null,

    // catalog search
    (filter === 'all' || filter === 'catalog')
      ? React.createElement('div', { className: 'ptg-sec' },
      React.createElement('div', { className: 'ptg-sec-h' },
        '官方目录（可搜索、可安装，用于替换同类插件）',
        React.createElement('span', { className: 'ptg-count' }, catalog.length === 0 ? '无' : String(catalog.length))),
      catalog.length === 0
        ? React.createElement('div', { className: 'ptg-empty' },
          hasSearch ? '官方目录没有匹配的插件。' : '官方目录为空（未随安装包提供官方目录时显示为空）。')
        : catalog.slice(0, 60).map((entry) => {
          const spec = (entry.installTarget && entry.installTarget.spec) || entry.name
          return React.createElement('div', { key: entry.name, className: 'ptg-row' },
            React.createElement('div', { className: 'ptg-node' },
              React.createElement('span', { className: 'nm' }, entry.name),
              React.createElement('span', { className: 'dm' }, descOf(entry) + (entry.version ? `｜v${entry.version}` : ''))),
            React.createElement('div', { className: 'ptg-actions' },
              React.createElement('button', {
                className: 'ptg-btn primary', disabled: busy !== null,
                onClick: () => act('install', { spec },
                  `确定安装 ${entry.name} 吗？\n后果：立即下载并纳入本 profile；与当前版本不兼容的包会被管理器拒绝。`),
              }, '安装'),
              React.createElement('span', { className: 'ptg-hint' }, '安装同类包前建议先禁用/删除旧包，避免重复注册。')))
        }))
      : null,

    toast
      ? React.createElement('div', { className: 'ptg-toast ' + (toast.kind === 'err' ? 'err' : 'ok') }, toast.text)
      : null)
}

/** The registered entry: a single full-tab component (the tab slot asks one shape). */
function TabEntry(props) {
  return PluginTriageTab(props)
}

/**
 * Contribute the tab, then keep it fresh.
 * @param ctx - client root context (services: slots, locale).
 */
exports.apply = function apply(ctx) {
  try {
    let React = null
    try {
      React = require('react')
    } catch (error) {
      React = null
    }
    if (React === null || typeof React.createElement !== 'function') return
    if (ctx === undefined || ctx === null || typeof ctx.inject !== 'function') return

    // Refresh the tab whenever the profile's plugin set changes (install,
    // enable/disable, removal) — the Host emits this event for every manager
    // operation, and the client runtime mirrors it.
    try {
      if (typeof ctx.on === 'function') {
        ctx.on('plugin-manager/changed', () => {
          try {
            window.dispatchEvent(new window.CustomEvent('plugin-triage:refresh'))
          } catch (error) { /* no window yet */ }
        })
      }
    } catch (error) {
      console.warn('plugin-triage: change listener unavailable', error)
    }

    ctx.inject(['slots', 'locale'], (owner) => {
      try {
        const slots = serviceAt(owner, 'slots')
        if (slots === undefined || slots === null || typeof slots.inject !== 'function') return

        // Idempotent registration: `slots.register` throws when a list slot
        // already holds the same id, and that throw lands inside the slot
        // ledger's store notification, killing the rendered entry's updates.
        // So dispose a previous registration before registering again.
        let registration = null
        const contribute = function () {
          if (registration !== null) return
          try {
            registration = slots.inject('plugins.tab', () => slots.register(
              {
                name: 'plugins.tab',
                id: 'plugin-triage.tab',
                order: 40,
                label: () => tabName(),
                inject: () => ({ runtime: React }),
              },
              TabEntry,
            ))
          } catch (error) {
            registration = null
            console.warn('plugin-triage: tab not registered', error)
          }
        }
        const withdraw = function () {
          if (registration === null) return
          const dispose = registration
          registration = null
          try {
            if (typeof dispose === 'function') dispose()
          } catch (error) {
            console.warn('plugin-triage: tab not withdrawn', error)
          }
        }
        const serve = function () {
          contribute()
          return withdraw
        }
        if (typeof owner.effect === 'function') owner.effect(serve, 'plugin-triage: plugins tab')
        else serve()
      } catch (error) {
        console.warn('plugin-triage: tab wiring failed', error)
      }
    })
  } catch (error) {
    console.warn('plugin-triage: apply failed', error)
  }
}

return module.exports; } });