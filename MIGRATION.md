# marktext 老 muya → @muyajs/core 新 muya 迁移追踪表

调研方案在 `/Users/ransixi/.claude/plans/glimmering-hatching-lightning.md`。
本表登记 P0~P3 共 ~80+ 条 commit 的迁移状态。

状态字段：
- `pending` — 待评估
- `verified-not-applicable` — 已验证新架构下 bug 不存在 / 无意义
- `test-only` — bug 复现失败，仅添加防御性回归测试
- `fixed` — 已实施修复 + 测试
- `skipped` — 决定不做（如纯 marktext 应用层）

PR 分组对应方案第三节的 5 个系列 + 后续 PR-6 测试合规：
- **PR-1a** 安全 + 已确认 crash（非 XSS） ✅
- **PR-1b** XSS 四联（独立 PR 便于安全审计） ✅
- **PR-2** Parser 合规性（含 footnote 测试基线）
- **PR-3** 编辑 / 光标 / IME
- **PR-4** Clipboard / 富文本
- **PR-5** P3 体验特性（按需）
- **PR-6** 测试合规：选择性迁 marktext muya 测试 + 接 CommonMark/GFM spec（PR-2~4 落地后做）

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
| 372fe02f | parser | list 解析 #870（task + bullet 混排拆分） | PR-2a | `test-only`（`compatibleTaskList` 已就位；1 个回归测试） |
| 8891287b | parser | paragraph → list 转换 | PR-3 | `pending`（marktext fix 在 `updateCtrl.js` 编辑器键盘逻辑层；PR-2 范围外） |
| 270d33f6 | parser | list item lexer/parser（CM 264/265 不同 marker 拆表） | PR-2a | `test-only`（marked v16 + `compatibleTaskList` 已就位；2 个 CM spec 测试） |
| 04834032 | parser | tab 缩进 list | PR-3 | `pending`（marktext fix 在 `tabCtrl.js` 编辑器 keydown 逻辑；PR-2 范围外） |
| 240d64aa | parser | 合并不同类型 list #706 | PR-4 | `pending`（marktext fix 在 `pasteCtrl.js` 粘贴流程；PR-4 clipboard 系列处理） |
| 02841ffd | parser | list 后续段落归属（exportMarkdown 缩进配置） | PR-2b | `test-only`（stateToMarkdown 已实现 indent/listIndent 拆分；4 个 marktext 缩进 fixture + 4 个扩展 round-trip） |
| 5f191681 | parser | blockquote 内 list（exportMarkdown） | PR-2b | `test-only`（3 个 blockquote round-trip 测试） |
| insertLineBreak 行尾空格 | serializer | 列表项内空行带尾随空格 | PR-2b | `fixed`（`insertLineBreak` 去掉尾随空格，保留 `>` 前缀；1 个回归测试） |
| 70d49c30 | parser | `-foo` 误识 list item | PR-2a | `test-only`（marked v16 已要求 bullet 后接空格；2 个正负回归测试） |
| 7b7a9424 | math | math block 嵌套 | PR-3 | `pending`（marktext fix 在 `paragraphCtrl.js` 编辑器层；PR-3 范围） |
| d937fac0 | inline | inline 语法 (#1071 重复 `**\`x\`**` 只末尾加粗) | PR-2c | `test-only`（`lowerPriority` 的 `ignoreIndex` 已就位；2 个回归测试） |
| 57af8304 | inline | link/image dest 含括号 (#1169) | PR-2c | `test-only`（`correctUrl` 用 `findClosingBracket` 已就位；3 个回归测试） |
| 9c2f6cb3 | inline | inline math 样式 | — | `skipped`（CSS-only，新仓样式体系自有 inline math 样式） |
| 6dfa7938 | inline | inline math selection | — | `skipped`（CSS-only，新仓样式体系自有 selection 样式） |
| d9f64bab | inline | reference link 渲染 | PR-2a | `test-only`（lexer.ts:357 `labels.has(...)` 已就位；2 个回归测试） |
| b8e2cd82 | inline | inline html renderer | PR-3 | `pending`（textRenderer 改动主要在 muya HTML 导出；与 stateToMarkdown 关系待评估） |
| 962fdf35 | inline | heading emoji 偏移 | — | `skipped`（CSS-only，新仓样式体系自有 emoji 处理） |
| 8e32838b | inline | 上/下标 | PR-2a | `test-only`（`super_sub_script` token + 渲染器已就位；3 个正负回归测试） |
| c0853f64 | inline | auto link / extension | PR-2a | `test-only`（auto_link + auto_link_extension + 边界 guard 已就位；4 个回归测试） |
| 1c42555a | block | 粘贴多行进 heading | PR-4a | `fixed`（提取 `mergePasteIntoHeading` 纯函数，6 个测试） |
| dec7502e | block | setext heading | PR-2a | `test-only`（marked v16 lheading + walkTokens `headingStyle` 已就位；3 个回归测试） |
| f00da152 | block | 嵌套块插表 crash | PR-3 | `pending`（marktext fix 在 `tableBlockCtrl.js` 编辑器层；PR-3 范围） |
| 9cb2cbe8 | toc | TOC 更新（如做 TOC 参考） | PR-5 | `pending` |

## P2 — 编辑 / 光标 / 选择 / IME

| Hash | 范畴 | 说明 | PR | 状态 |
|---|---|---|---|---|
| 6f1e733c | cursor | codeblock 光标 #2013 | PR-3a | `verified-not-applicable`（旧 bug 根因是 `partialRender` + `singleRender` 重渲流程，新仓不存在；`codeBlockContent.backspaceHandler` 已有 `text[start.offset-1] === '\n'` 分支显式处理 `\n`） |
| 0a3efbf8 | selection | 文本选区 #622 | PR-3a | `verified-not-applicable`（新仓 selection 通过 `selection/index.ts:_listenSelectActions` 独立监听 mouse 事件，不受 `shownFloat` 影响） |
| 7936e3f4 | selection | 选区无法取消 #636 | PR-3a | `verified-not-applicable`（`content.ts:keydownHandler` 已对 `shownFloat` 内每个浮层细粒度白名单化判定是否 `preventDefault`） |
| 02dbb8af | search | 嵌套 block 搜索 | PR-3d | `verified-not-applicable`（新仓 `Search.search` 用 `scrollPage.depthFirstTraverse` 自然遍历嵌套 block；无 `CAN_NEST_RULES` 白名单限制） |
| 4c517b16 | search | search group | PR-3d | `verified-not-applicable`（`utils/search.ts:buildRegexValue` 已采用新仓正则 `(?<!\\)\$\d` + `$0=full match` 语义；新增 5 个防御测试） |
| 1a4844f8 | history | undo/redo 不触发 change | PR-3d | `verified-not-applicable`（`history._change` → `editor.updateContents` → `jsonState.dispatch` 仍 emit `json-change`；selection 改变由 `editor.updateContents` 末尾 `setCursor` 触发 `selection-change`） |
| 16d61572 | render | partialRender 光标已移除 block | PR-3a | `verified-not-applicable`（新仓 `Editor.updateContents` 走 ot-json1 + `replaceWith` 路径，无 `partialRender`，光标定位通过 `setCursor` 在已存在 block 上重置） |
| 701fb9ae | text | text 删除追加 soft-line | PR-3a | `test-only`（旧多段落删除路径不存在；`autoPair` 内 in-block soft-line 保留分支已就位，2 个防御测试；跨 block 删除依赖浏览器原生行为，需 examples/ 手测） |
| 0dc4b415 | table | cell backspace | PR-3d | `test-only`（`<br/>X` 末尾 backspace 旧路径在 contentState 内被特化；新仓走 `Format.backspaceHandler` token-based + 浏览器原生删除；建议 examples/ 手测 `<br/>` 后字符删除） |
| 5fb130d9 | table | shift+tab 表格导航 | PR-3d | `fixed`（`tableCell.tabHandler` 新增 `event.shiftKey` 分支 + `previousContentInContext()`；3 个回归测试） |
| 9e32c4a0 | table | cursor → next cell index 0 | PR-3d | `verified-not-applicable`（`tableCell.tabHandler` 已 `setCursor(0, 0, true)`，不会选中整 cell 文本） |
| 0028a4bc | table | cell copy 异常 | PR-4 | `pending`（涉及 clipboard / 表格 cell copy，归 PR-4） |
| 3fa8a9ae | autopair | inline code 内禁用 | PR-3b | `verified-not-applicable`（`content.ts:autoPair` 已有 `isInInlineCode` 参数 + `format.ts` 调用前用 `_checkCursorInTokenType` 计算；defensive 测试 2 个） |
| 4278362f | autopair | inline math 内禁用 | PR-3b | `verified-not-applicable`（同上，`isInInlineMath` 参数已就位；defensive 测试 1 个） |
| bbea7eca | autopair | 优化自动补全 | PR-3b | `verified-not-applicable`（`!/[a-z0-9]/i.test(preInputChar)` 已在 markdown-syntax 分支；defensive 测试 3 个） |
| 358fa83d | autopair | 引号自动配对 | PR-3b | `fixed`（`content.ts:autoPair` 加 `postIsNotTouching` 门控，5 个回归测试） |
| 6a50b5cb | tasklist | 切换 task-list 光标跳末尾 | PR-3d | `verified-not-applicable`（`taskListCheckbox` click 已 `event.stopPropagation()`，不会触发 editor click → cursor restore；建议 examples/ 手测确认体感 OK） |
| c3f128e7 | tasklist | copy 保留勾选态 | PR-4b | `verified-not-applicable`：marktext fix 是其 DOM-based copy 的 checkbox 注入边界，新仓走 marked 渲染（task-list `[x]/[ ]` → `<input checked>`），渲染层一致 |
| edbab6ed | ime | 中文输入误删 | PR-3c | `verified-not-applicable`（Ctrl+A 在新仓走浏览器原生，多 block 选区被 `editor.ts` 提前 return，`format.inputHandler` 期初也 `if (isComposed) return`；跨 block + IME 边角仍建议 examples/ 手测） |
| 67e18176 | ime | 中文回车多行 | PR-3c | `verified-not-applicable`（`content.ts:autoPair` 软换行补齐分支已包含 `event.type === 'compositionend'` 条件，新增 1 个 compositionend 防御测试） |
| 8a7e6559 | ime | compose bug | PR-3c | `verified-not-applicable`（`composeHandler` 翻转 `isComposed`；`keyupHandler` / `inputHandler` / Enter+Arrow 都已用 `!this.isComposed` 门控） |
| 63642d39 | typing | 回车 typewriter 抖动 | PR-3d | `verified-not-applicable`（新仓无 typewriter 模式，`scrollIntoView` 抖动场景不存在） |
| 6b3ead95 | keyboard | 非 US 键盘 | PR-3d | `skipped`（marktext 应用层 renderer keybindings 设置页，非 muya 内核） |
| ed1b3354 | keyboard | 图片选中按 delete | PR-3d | `fixed`（`selection/index.ts:_listenSelectActions` 把 `/Backspace\|Enter/` 替换为 `/^(?:Backspace\|Delete\|Enter)$/`，覆盖 Delete 键 + 锁住完整匹配避免子串碰撞；clipboard 路径无 selectedImage 副作用，无需同步修复） |
| b925f7d6 | clipboard | 移动端 cut | PR-4b | `verified-not-applicable`：新仓 `cutHandler` 起手即 `if (selection == null) return;`，等价 marktext 的 `if (!start || !end) return;` 守卫 |
| 393139e5 | clipboard | clipboard 过度 sanitize | PR-4b | `verified-not-applicable`：新仓 `getClipboardData` 单块/多块路径都 `text = substring(...)`/`mdGenerator.generate(...)` 直出，无 `escapeHtml`；含 2 个防御测试 |
| 54a3b585 | clipboard | 粘贴 HTML escape | PR-4a | `verified-not-applicable`：`utils/paste.ts` 已 `sanitize(html, PREVIEW_DOMPURIFY_CONFIG, false)` |
| 485fcfe0 | clipboard | image paste handler 不执行 | PR-4a | `verified-not-applicable`：新仓 pasteHandler 无 image paste 路径；进入 paste handler 后不会因 `!text && !html` 早退 |
| 5b1cd85d | clipboard | 末尾 html block 粘贴错误 | PR-4a | `pending`：需 examples 手测（marktext 在 contentState 走 `getLastBlock` 递归选末块；新仓多段粘贴直接 `insertAfter` 不递归子树，结构上不会因 html-block `editable===false` 选错末块） |
| fb8fca7b | clipboard | copy/paste list | PR-4b | `verified-not-applicable`：turndown `paragraph`/`listItem` 规则已在 `utils/turndownService/index.ts`；checkbox 注入是 marktext DOM-based copy 特有，新仓走 marked 渲染不需要 |
| 067ec485 | clipboard | HTML paste handler | PR-4a | `partial-fixed`：text-only `<table>...</table>` 现在升级到 html 槽走 HtmlToMarkdown；recursion 与 pasteImage 分支新架构不适用（无 pasteImage） |
| ef59a743 | clipboard | 富文本复制 | PR-4b | `verified-not-applicable`：copyHandler 'normal' 已 `setData('text/html', html); setData('text/plain', text)`；`getClipBoardHtml` 经 marked 渲染 |
| c841facd | clipboard | 空内容不写剪贴板 | PR-4b | `fixed`（含 6 个回归测试） |

## P3 — 体验特性（PR-5 按需）

| Hash | 类型 | 说明 | 状态 |
|---|---|---|---|
| 7377de3c | feat | footnote 完整链路 | `pending` |
| ab97336e | feat | highlight 菜单 | `pending` |
| 1ef0d016 | feat | linkTools unlink/jump | `pending` |
| cb25b3d4 | feat | linkTools 支持 `<a>` 与 ref link | `pending` |
| 141d25d8 | feat | 粘贴链接抓页面标题 | PR-4c | `fixed`（`res.json()`→`res.text()`，5 个测试） |
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

## PR-6 — 测试合规迁移（PR-2~4 落地后做）

PR-6a 已落地（2026-05-20）：CommonMark 0.31 + GFM 0.29-gfm spec 合规基础设施。

### PR-6a 交付

- 新增公开同步 API：`renderToStaticHTML(markdown, options?)`，18 个单元测试（happy-path + DOMPurify XSS 处理 + 全部 5 选项覆盖 + mermaid/diagram 占位 + `sanitize: false` 关闭路径）
- `commonmark-spec@^0.31.2` devDep（652 个 example）
- 自解析 GFM spec：`packages/core/test/spec/fixtures/gfm-spec-0.29-gfm.json`（672 个 example，含 5 个 GFM extension section）
- spec runner：`test/spec/runner.ts`（normalizeHtml 折叠 cosmetic 空白 + 防回归 expected-failures 锁）+ 8 个 normalizer 单测
- 两份 spec 测试：`commonmark.spec.ts` + `gfm.spec.ts`，每 example 一条 `it.each`，共 1324 测试，全部锁定通过
- 修复 `getHighlightHtml` 中 `footnote` 选项未连线的 no-op bug
- baseline 报告：`test/spec/conformance.md`（按 section 拆 pass-rate）
- expected-failures.json：CM 80 个 + GFM 92 个待修 example_id
- vitest 配置拆分：默认 `pnpm test` 仅跑 unit；新增 `pnpm test:spec` / `test:spec:commonmark` / `test:spec:gfm`，独立 `vitest.spec.config.ts`
- CI：`.github/workflows/ci-test.yml` 增加 `pnpm test:spec` 步骤

### PR-6a baseline 通过率

| Suite | 通过 | 总数 | 通过率 |
|---|---|---|---|
| CommonMark 0.31 | 572 | 652 | **87.7%** |
| GFM 0.29-gfm | 580 | 672 | **86.3%** |

> 合并后通过率只能涨不能跌：`expected-failures.json` 中的 example 若开始通过，测试会以 "unexpected pass" 报错，要求 reviewer 把它从列表里移除。

Spec runner 用 `renderToStaticHTML(..., { sanitize: false })` 跑——衡量的是 parser 的合规度，不是 DOMPurify sanitizer 行为（sanitizer 该激进就激进，spec 的 Raw HTML allowance example 会被它合法地剥离）。DOMPurify sanitize 行为由 `renderToStaticHTML` 默认 `sanitize: true` 单元测试覆盖。

`normalizeHtml` 规范化：兼属性名排序、self-closing void 标签统一、相邻 tag 间空白折叠（`>(WS)<` → `><`）、void 标签后空白剥离。`<pre>`/`<code>` 内容（如行末 `\n`）保留——因为 collapse 只匹配纯空白 token 间隔，content 字符不动。

### PR-6b 待办（独立 PR，PR-6a 合并后做）

目标：补足"非 bug regression"的测试覆盖。PR-2~5 的每条 fix 都自带回归测试，但 happy-path、合规性、广覆盖的测试目前稀疏。

### 值得迁（高信号）

- marktext `test/unit/specs/parser/marked` 系列的 lexer / tokenizer 单元测试 —— 对应新仓 `state/markdownToState.ts` + `inlineRenderer/lexer/`，纯输入→输出，架构无关
- markdown ↔ state ↔ html 的 round-trip 测试
- footnote / table / list / emoji / math 块和内联的 happy path 测试（区别于 bug regression）

### 值得替代（不搬 marktext 的，直接接上游）

- **CommonMark 0.31 合规**：把 [`spec.json`](https://github.com/commonmark/CommonMark/blob/master/test/spec.json) 接进 vitest 驱动 `markdownToHtml`。约 670 个 example，比 marktext 自带合规测试更广更权威
- **GFM 合规**：用 [GFM spec example list](https://github.github.com/gfm/) 同样做法

可接受 fail rate 阶梯：初期允许 5%（先有 baseline 看见缺口），逐步降到 1%；按 spec section 拆分单独跟踪。

### 不迁

- 针对 `ContentState.prototype.*` / 旧 ctrl 方法的行为测试（API 不存在）
- 光标位置 / DOM 交互 / partialRender 的实现细节测试（OT 架构后机制完全不同）

### 实施

- 拆 PR-6a（marktext 选择性测试搬运）+ PR-6b（CommonMark/GFM spec 集成 + baseline 报告）
- 单独的 vitest project 配置（`test:spec` 命令），与现有 unit test 分开，可独立看通过率
- 在 CI 加 spec compliance 趋势报告（每次 PR 不要求 100%，但不能下降）

---

## 进度统计

| PR | 计划条数 | 已完成 | 占比 |
|---|---|---|---|
| PR-1a | 6 | 4 | 67%（2 fixed + 2 verified-not-applicable，2 转 PR-3） |
| PR-1b | 7 | 6 | 86%（1 fixed + 4 verified-not-applicable + 1 skipped；防御测试 15 个） |
| PR-2 | 26 | 15 | 58%（PR-2a 8 commits = 2 fixed bugs + 9 test-only；PR-2b 3 commits = 1 fixed bug + 2 test-only；PR-2c 1 commit = 2 test-only + 3 skipped；3 条转 PR-3/PR-4；新增 57af8304 入册）|
| PR-3a | 5 | 5 | 100%（4 verified-not-applicable + 1 test-only；防御测试 2 个 soft-line） |
| PR-3b | 4 | 4 | 100%（1 fixed `358fa83d` + 3 verified-not-applicable；回归测试 13 个） |
| PR-3c | 3 | 3 | 100%（3 verified-not-applicable；+1 compositionend 防御测试；跨 block+IME 留 examples/ 手测） |
| PR-3d | 11 | 11 | 100%（2 fixed `5fb130d9`+`ed1b3354` + 6 verified-not-applicable + 2 test-only + 1 转 PR-4；回归测试 8 个） |
| PR-4a (粘贴) | 5 | 4 | 80%（2 fixed + 2 verified-not-applicable；1 留 examples 手测） |
| PR-4b (复制) | 7 | 7 | 100%（1 fixed + 6 verified-not-applicable；防御测试 8 个） |
| PR-4c (P3 抓标题) | 1 | 1 | 100%（fixed，5 个测试） |
| PR-5 | 18+ | 0 | 0% |
| PR-6a | — | done | spec 合规基础设施落地（CM 572/652 = 87.7%, GFM 580/672 = 86.3%，1324 spec 测试 + 8 normalizer 单测 + 18 个 renderToStaticHTML 单测） |
| PR-6b | — | 0 | 0%（PR-6a 合并后启动；footnote 510 行 + markdown-basic round-trip + list-indentation 补齐） |

最后更新：2026-05-20
