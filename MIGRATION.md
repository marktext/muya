# marktext 老 muya → @muyajs/core 新 muya 迁移追踪表

调研方案在 `/Users/ransixi/.claude/plans/glimmering-hatching-lightning.md`。
本表登记 P0~P3 共 ~80+ 条 commit 的迁移状态。

状态字段：
- `pending` — 待评估
- `verified-not-applicable` — 已验证新架构下 bug 不存在 / 无意义
- `test-only` — bug 复现失败，仅添加防御性回归测试
- `fixed` — 已实施修复 + 测试
- `skipped` — 决定不做（如纯 marktext 应用层）

PR 分组对应方案第三节的 5 个系列：
- **PR-1a** 安全 + 已确认 crash（非 XSS）
- **PR-1b** XSS 四联（独立 PR 便于安全审计）
- **PR-2** Parser 合规性（含 footnote 测试基线）
- **PR-3** 编辑 / 光标 / IME
- **PR-4** Clipboard / 富文本
- **PR-5** P3 体验特性（按需）

---

## P0 — 安全 / 数据损坏 / crash

| Hash | 范畴 | 说明 | PR | 状态 |
|---|---|---|---|---|
| 9884342f | table | normalizeTable 行单元数 > 表头 crash | PR-1a | `fixed`（含 3 个回归测试） |
| 9ffc5b1b | heading | 空 heading slug crash | PR-1a | `verified-not-applicable`（新仓无 slugger） |
| bca2ed62 | image | loadImageAsync 失败永久缓存 | PR-1a | `fixed`（含 3 个回归测试） |
| 36e825c2 | image | getImageInfo 空 firstChild | PR-1a | `verified-not-applicable`（新仓 getImageInfo 不读 firstChild） |
| fed1dac4 | xss | HTML 表格粘贴 XSS | PR-1b | `verified-not-applicable`（`utils/paste.ts` 已 `sanitize` 经 DOMPurify；anchor title 改用 `textContent` 比老版更安全） |
| 0dd09cc6 | xss | code lang + 超链接 XSS | PR-1b | `partial-fixed`：超链接路径 `sanitizeHyperlink` + `htmlTag` `isValidAttribute` 已就位；**langInputContent 残留 XSS 此 PR 实修** + 3 测试 |
| c959d185 | xss | Mermaid XSS | PR-1b | `verified-not-applicable`（`markdownToHtml.ts` + `diagramPreview.ts` 都已 `securityLevel:'strict'`，mermaid innerHTML 走 `sanitize`） |
| dc54c7b6 | xss | 代码块未 escape HTML | PR-1b | `verified-not-applicable`（`escapeHTML` 已用含 `&` 的 5 字符版本，codeBlockContent 已 escape）+ 4 个防御测试 |
| c47795e4 | xss | XSS + Electron（部分电子相关跳过） | PR-1b | `skipped`（Electron-only） |
| 0baf2e9e / 7de33f11 | xss | #1390 XSS | PR-1b | `pending`（issue 已关闭，影响面待评估；暂不实修） |
| sanitizeHyperlink 防御 | xss | 锁住 `javascript:/vbscript:/data:` 阻断 | PR-1b | `test-only`（8 个防御测试） |
| 6293d408 | table-ctrl | 老 tableBlockCtrl 修复，新仓无同名结构 | 待评估 | `pending`（建议 PR-3 验证） |
| f99addd2 | table-ctrl | selectedTableCells 清理，新仓无对应 | 待评估 | `pending`（建议 PR-3 验证） |
| 0a3fda63 + 2754e393 + 4b362e52 | architecture | post-refactor 修复合集（拆条） | 待拆 | `pending` |

## P1 — Parser / 渲染正确性

| Hash | 范畴 | 说明 | PR | 状态 |
|---|---|---|---|---|
| 1ecc3601 | parser | footnote 解析 + 510 行测试基线 | PR-2a | `fixed`（marked v16 block 扩展 + 12 个回归测试；3 个 negative 用例 marked 自带 `def` 规则替代 paragraph fallback） |
| 23435ce6 | parser | 任务列表缩进 | PR-2a | `test-only`（marked v16 内置 list tokenizer 不共用旧 fork 的缩进 bug；2 个防御测试锁定嵌套） |
| 57cd04c5 | parser | CommonMark example 475 + 353/387/520/521 等 | PR-2a | `fixed`（canOpenEmphasis 阻断 mid-run `_`；link/reference_link 加 lowerPriority；5 个 CM spec 用例） |
| ad5ddbf9 | parser | GFM example 558（link/image title 支持） | PR-2a | `test-only`（`parseSrcAndTitle` 已就位；4 个回归测试锁定 link/image title） |
| 372fe02f | parser | list 解析 #870 | PR-2 | `pending` |
| 8891287b | parser | paragraph → list 转换 | PR-2 | `pending` |
| 270d33f6 | parser | list item lexer/parser | PR-2 | `pending` |
| 04834032 | parser | tab 缩进 list | PR-2 | `pending` |
| 240d64aa | parser | 合并不同类型 list #706 | PR-2 | `pending` |
| 02841ffd | parser | list 后续段落归属 | PR-2 | `pending` |
| 5f191681 | parser | blockquote 内 list | PR-2 | `pending` |
| 70d49c30 | parser | `-foo` 误识 list item | PR-2 | `pending` |
| 7b7a9424 | math | math block 嵌套 | PR-2 | `pending` |
| d937fac0 | inline | inline 语法 | PR-2 | `pending` |
| 9c2f6cb3 | inline | inline math 样式 | PR-2 | `pending` |
| 6dfa7938 | inline | inline math selection | PR-2 | `pending` |
| d9f64bab | inline | reference link 渲染 | PR-2 | `pending` |
| b8e2cd82 | inline | inline html renderer | PR-2 | `pending` |
| 962fdf35 | inline | heading emoji 偏移 | PR-2 | `pending` |
| 8e32838b | inline | 上/下标 | PR-2 | `pending` |
| c0853f64 | inline | auto link / extension | PR-2 | `pending` |
| 1c42555a | block | 粘贴多行进 heading | PR-4 | `pending` |
| dec7502e | block | setext heading | PR-2 | `pending` |
| f00da152 | block | 嵌套块插表 crash | PR-2 | `pending` |
| 9cb2cbe8 | toc | TOC 更新（如做 TOC 参考） | PR-5 | `pending` |

## P2 — 编辑 / 光标 / 选择 / IME

| Hash | 范畴 | 说明 | PR | 状态 |
|---|---|---|---|---|
| 6f1e733c | cursor | codeblock 光标 #2013 | PR-3 | `pending` |
| 0a3efbf8 | selection | 文本选区 #622 | PR-3 | `pending` |
| 7936e3f4 | selection | 选区无法取消 #636 | PR-3 | `pending` |
| 02dbb8af | search | 嵌套 block 搜索 | PR-3 | `pending` |
| 4c517b16 | search | search group | PR-3 | `pending` |
| 1a4844f8 | history | undo/redo 不触发 change | PR-3 | `pending` |
| 16d61572 | render | partialRender 光标已移除 block | PR-3 | `pending` |
| 701fb9ae | text | text 删除追加 soft-line | PR-3 | `pending` |
| 0dc4b415 | table | cell backspace | PR-3 | `pending` |
| 5fb130d9 | table | shift+tab 表格导航 | PR-3 | `pending` |
| 9e32c4a0 | table | cursor → next cell index 0 | PR-3 | `pending` |
| 0028a4bc | table | cell copy 异常 | PR-3 | `pending` |
| 3fa8a9ae | autopair | inline code 内禁用 | PR-3 | `pending` |
| 4278362f | autopair | inline math 内禁用 | PR-3 | `pending` |
| bbea7eca | autopair | 优化自动补全 | PR-3 | `pending` |
| 358fa83d | autopair | 引号自动配对 | PR-3 | `pending` |
| 6a50b5cb | tasklist | 切换 task-list 光标跳末尾 | PR-3 | `pending` |
| c3f128e7 | tasklist | copy 保留勾选态 | PR-4 | `pending` |
| edbab6ed | ime | 中文输入误删 | PR-3 | `pending` |
| 67e18176 | ime | 中文回车多行 | PR-3 | `pending` |
| 8a7e6559 | ime | compose bug | PR-3 | `pending` |
| 63642d39 | typing | 回车 typewriter 抖动 | PR-3 | `pending` |
| 6b3ead95 | keyboard | 非 US 键盘 | PR-3 | `pending` |
| ed1b3354 | keyboard | 图片选中按 delete | PR-3 | `pending` |
| b925f7d6 | clipboard | 移动端 cut | PR-4 | `pending` |
| 393139e5 | clipboard | clipboard 过度 sanitize | PR-4 | `pending` |
| 54a3b585 | clipboard | 粘贴 HTML escape | PR-4 | `pending` |
| 485fcfe0 | clipboard | image paste handler 不执行 | PR-4 | `pending` |
| 5b1cd85d | clipboard | 末尾 html block 粘贴错误 | PR-4 | `pending` |
| fb8fca7b | clipboard | copy/paste list | PR-4 | `pending` |
| 067ec485 | clipboard | HTML paste handler | PR-4 | `pending` |
| ef59a743 | clipboard | 富文本复制 | PR-4 | `pending` |
| c841facd | clipboard | 空内容不写剪贴板 | PR-4 | `pending` |

## P3 — 体验特性（PR-5 按需）

| Hash | 类型 | 说明 | 状态 |
|---|---|---|---|
| 7377de3c | feat | footnote 完整链路 | `pending` |
| ab97336e | feat | highlight 菜单 | `pending` |
| 1ef0d016 | feat | linkTools unlink/jump | `pending` |
| cb25b3d4 | feat | linkTools 支持 `<a>` 与 ref link | `pending` |
| 141d25d8 | feat | 粘贴链接抓页面标题 | `pending` |
| d26f5092 | feat | image resize + inline/block 切换 | `pending` |
| cb7be189 | feat | inline image / small image | `pending` |
| 9eff8248 | feat | focus / blur 事件 | `pending` |
| 8474a997 | feat | prism 语言别名 | `pending` |
| 8af9605e | feat | code block Solidity 等语言 | `pending` |
| 47cb2bbe | feat | indent code block | `pending` |
| 7aa0d1bf | feat | code block 复制按钮 | `pending` |
| a028a7c2 | feat | code block 行号 | `pending` |
| ef9fe756 | feat | underline 格式 | `pending` |
| 81af43be | feat | quick insert hint 隐藏 | `pending` |
| c0c8ea4b | feat | 打开外链 / 本地 md | `pending` |
| f3b53427 | feat | 跳光标到末尾再格式化 | `pending` |
| efd38644 | feat | 长 footnote 编号 | `pending` |
| 318bfc6a / fc89d04a / 37b96c88 | feat | footnote 系列 | `pending` |

## P4 — 明确不迁

- marktext 应用层（Electron / preferences / IPC / 文件系统 / theme / print / 键位设置 UI）
- 老 muya CSS 主题
- 已被新架构结构性解决的 partialRender / contentState ctrl 系列
- 纯 lint / 格式化 / 依赖升级
- marktext i18n 文案

---

## 进度统计

| PR | 计划条数 | 已完成 | 占比 |
|---|---|---|---|
| PR-1a | 6 | 4 | 67%（2 fixed + 2 verified-not-applicable，2 转 PR-3） |
| PR-1b | 7 | 6 | 86%（1 fixed + 4 verified-not-applicable + 1 skipped；防御测试 15 个） |
| PR-2 | 25 | 4 | 16%（2 fixed + 2 test-only）|
| PR-3 | 19 | 0 | 0% |
| PR-4 | 13 | 0 | 0% |
| PR-5 | 19+ | 0 | 0% |

最后更新：2026-05-20
