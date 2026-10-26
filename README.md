# dsh-plugin-standalone-session

为 **DeepSeek Harness (DSH)** 增加“独立会话”：不隶属于任何工作区、不占用项目工作区、但完整复用 DSH 原生输入区（模型选择、附件、斜杠指令、发送）的会话。

- 插件 ID：`standalone-session`
- 显示名：`Standalone Session`
- 中文名：`独立会话`
- 兼容 DSH：`>=0.2.1-rc.2 <0.3.0-0`
- 许可证：MIT

## 它解决什么

DSH 原生输入区在“会话没有工作区”时会把输入区置为不可用：空白会话页需要先选择一个工作区才能开始输入。本插件让“独立会话”成为一个可用的、持久的状态：

- 会话本身**不属于任何工作区**；DSH 的工作区注册表里不会出现任何由本插件创建的“假工作区”。
- 原生输入区被解锁，模型、附件、`/` 指令、发送全部照常。
- 独立会话显示在侧边栏顶层的 **未分组** 区域，并带有 `独` / `独立` badge；同时提供一个独立的“独立会话”管理面板。
- 重启 DSH 后，独立会话仍可恢复，且不会自动变成某个工作区的会话。
- 不替换原生“新建会话”按钮、工作区浏览器、工作区选择器、会话菜单或聊天界面。

## 安装

### 从本地 tarball 安装（本仓库验证方式）

```bash
cd dsh-plugin-standalone-session
npm install
npm run build
npm pack
# 产物：/absolute/path/to/dsh-plugin-standalone-session-0.1.0.tgz
```

**Web 配置：**

```bash
dsh plugin --profile web add /absolute/path/to/dsh-plugin-standalone-session-0.1.0.tgz
```

重启 `dsh web`，然后硬刷新页面（macOS `Cmd+Shift+R`）以获取新的客户端 bundle。

**Desktop 配置：**

DSH 0.2.1-rc.2 的 `dsh` CLI 会拒绝直接管理 desktop 配置：

```text
error: profile "desktop" is managed exclusively by the Electron application
```

这是设计行为，不是本插件的安装失败。Desktop 插件应通过应用内的 **插件 / Plugins** 页面安装：

1. 打开 DeepSeek Harness 桌面应用。
2. 侧边栏 → **插件** → 安装/添加插件。
3. 输入本仓库 tarball 的**绝对路径**，或它解包后的**绝对目录**（Plugin Manager 接受 npm 包名、git URL、tarball 路径和绝对本地目录）。
4. 安装完成后，完全退出并重新启动 DeepSeek Harness；宿主端插件只在进程启动时加载。
5. 如果右侧/左侧 UI 没有立即变化，执行一次窗口重载（`Cmd+R`）。

> 如果桌面应用正在运行，请优先使用应用内 Plugin Manager；不要在应用运行时直接改写 `~/.dsh/profiles/desktop` 下的依赖，以免与应用的 profile 管理冲突。

本仓库**没有**执行 `npm publish`，也没有创建 GitHub Release。`dsh-plugin-standalone-session` 这个 npm 名称当前可用（`npm view` 返回 404）；如果将来发布，Web 配置仍可使用：

```bash
dsh plugin --profile web add dsh-plugin-standalone-session
```

Desktop 配置仍应通过应用内 Plugin Manager 安装，CLI 不会代理该配置。

### 卸载

- **Web**：`dsh plugin --profile web remove dsh-plugin-standalone-session`，然后重启 `dsh web`。
- **Desktop**：在桌面应用的 **插件 / Plugins** 页面卸载，然后完全重启应用。

**卸载不会删除任何会话**，也不会自动删除独立会话的工作目录。卸载后：

- 已经产生过消息的独立会话仍可作为普通“未分组”会话继续使用（输入区在活动会话中本来就是可用的）。
- **空白**独立会话缺少本插件的输入区解锁逻辑，输入区会回到 DSH 原生的“选择工作区”状态；可以给它挂一个真实工作区，或重新安装本插件。
- 如果确认不再需要这些独立会话，可手动清理其工作目录（见“清理”）。

## 使用

### 新建独立会话

主要入口是侧边栏顶部的 **`新建独立会话`（+）** 行：

- 点击这一行会**立即创建并进入**一个新的独立会话，不再先显示管理面板。
- 如果上一次由这个入口创建的会话仍然是空白且仍然存在，会直接复用它，避免误点/连点产生大量空白会话。
- 创建失败会停留在轻量的 launcher 页，提供“重试”和“管理已有会话”。

其他入口：

1. **管理面板为空时**：空状态里的 `新建独立会话` 总是创建全新的空白会话。
2. **命令菜单**：在任意会话的输入框输入 `/`，选择 `独立会话：新建`（英文 `Standalone Session: New`）。

创建后会直接在**主视图**打开原生会话页。输入框、模型选择、附件按钮立即可用。

### 管理

点击侧边栏底部的 **`管理独立会话`**，或使用命令菜单里的 `独立会话：管理` / `Standalone Session: Manage`，打开管理面板：

- 列出所有未归档的独立会话（含空白的会话；原生侧边栏默认只显示当前空白会话）。
- 点击会话行：切回原生会话页；行尾 `⋯` 菜单提供重命名和删除。
- `重命名`：调用原生 Session Controller 的重命名能力，标题投影同步更新。
- `删除`：调用原生归档（DSH 没有物理删除会话的公开 API）。

### 删除语义

DSH 把“删除”实现为**归档**：会话从普通列表消失，但仍可在原生归档视图中恢复。本插件遵守这一点：

- 从未产生过用户消息、且目录为空的独立会话：归档后，宿主端会删除它的专用工作目录。
- 从未产生过用户消息、但目录非空（例如 agent 已经写入文件）：保留目录，避免把“没有记录到消息”误判为“可以删除内容”。
- 已经产生过消息的独立会话：归档后**保留**工作目录，以便日后从归档恢复时仍能继续在原目录工作；即使目录为空也不删除。
- 清理失败：宿主端记录 `[standalone-session]` 前缀的日志，并在 `registry.json` 中保留 `cleanupFailed` / `cleanupError`，下次扫描重试；这不会阻塞归档主流程。

## 与普通工作区会话的区别

| | 普通工作区会话 | 独立会话 |
| --- | --- | --- |
| 工作区归属 | 属于某个工作区 | 不属于任何工作区 |
| 工作区注册表 | 有对应工作区记录 | **没有**任何工作区记录 |
| 侧边栏位置 | 工作区分组下 | 顶层“未分组” + 独立面板 |
| badge | 无 | `独` / `独立会话 · 无工作区` |
| 工作目录 | 工作区目录 | `~/.dsh/dsh-standalone-sessions/<sessionId>` |
| 原生输入区 | 原生启用 | 由本插件解锁（仍是同一个原生 InputBar） |
| 重启恢复 | 是 | 是（靠会话自身 cwd 标记 + 宿主 registry） |

## 实现方案（没有使用临时工作区）

调研结论：原生输入区的 `inert` 条件来自 Conversation 的 `hero && chipTitle === undefined`，而 `chipTitle` 通常来自“当前会话是否属于某个工作区”。常见做法是**临时创建一个工作区**并挂载会话，让输入区解锁，首条消息后再删除该工作区。

本插件**没有采用**这个方案，原因：

1. 临时工作区必须进入宿主 `workspaceRegistry` 才会被原生会话页识别，因此它会出现在用户的侧边栏工作区列表中；要隐藏它就必须替换/过滤原生 WorkspaceBrowser，风险更大。
2. 若在首条消息前崩溃或用户切走，还可能留下“孤儿工作区”，与“临时工作区不得出现在用户工作区列表”的要求冲突。

本插件改为一个**范围极小的视图适配器**：

- `conversation.composer.bar` 是 DSH 原生输入条的 slot。插件包装该 slot 的**现有**组件；仅当当前会话的 durable `cwd` 带有独立标记且原生 `disabled === true` 时，传入 `disabled: false`，并清空工作区选择器的占位参数。
- 原生 InputBar 仍然负责编辑器、模型选择、附件、斜杠指令、提交、停止和错误展示；插件没有重写聊天 UI，也没有修改会话数据模型。
- 适配器在插件卸载时恢复原组件；如果 DSH 未来改变该 slot 的形状，适配器会安全地不生效（输入区回到原生状态），管理面板仍然可用。

其他部分：

- **持久化标记**：会话的 `cwd` 是 `~/.dsh/dsh-standalone-sessions/<sessionId>`；`<sessionId>` 与目录名一致。这个标记写入 DSH 的会话 header，重启后仍然存在。宿主端另有 `~/.dsh/dsh-standalone-sessions/registry.json` 记录 `standalone: true`、`hadMessage`、清理状态等生命周期信息；浏览器端只依赖 cwd 标记，因此 registry 损坏不会导致会话“消失”。
- **点击即新建**：`sidebar.panellist` 的行点击被 DSH 固定为 `selectPanel(id)`，插件无法替换整行动作。因此顶栏行指向一个专用的 launcher main panel：它挂载时创建（或复用空白）会话并 `openSession`，用户感知为“点一下就进入新对话”。launcher 还会记录一次真实行点击作为“arm”信号，布局/历史恢复该 panel 时只显示 CTA，不会静默创建会话。
- **宿主端**：监听 `api-session/added` / `api-session/activity`，维护 registry；每 2s 读取 `workspaceRegistry.archivedSessionIds`，对已归档的独立会话执行清理；启动时回收失败的空白目录。
- **并发创建**：每次创建由客户端铸造 `session-<uuid>`，目录唯一；registry 写入串行化并使用临时文件 + `rename` 原子替换。
- **失败回滚**：创建失败时不会调用 `openSession`；宿主扫描会回收 60s 以上、没有 live session、且为空目录的残留。删除清理失败会记录并重试，不影响归档。
- **不破坏原生行为**：没有 patch `uiWorkspace.startSession`，没有替换 `sidebar.workspaces`，没有改工作区选择器或会话菜单。

## 数据与清理

默认工作目录：

```text
~/.dsh/dsh-standalone-sessions/
├── registry.json
└── session-<uuid>/
```

- 插件不会把独立会话写进 `workspace.json` 的工作区列表。
- 删除空白独立会话后，对应 `session-<uuid>/` 会被删除；已使用过的会话目录保留。
- 清理 registry 中已不存在的记录不会删除 DSH 的会话日志（`~/.dsh/sessions`）；会话日志由 DSH 自己管理。

### 完整清理（谨慎）

仅在确认不再需要这些独立会话时：

```bash
# 先卸载插件并重启 DSH
rm -rf ~/.dsh/dsh-standalone-sessions
```

这会删除独立会话的工作目录（可能包含 agent 写入的文件）。若要连同会话历史一起删除，请使用 DSH 自身的归档/存储管理方式；本插件不提供物理删除会话日志的能力。

## 兼容性

- 目标宿主：`0.2.1-rc.2`，声明范围 `>=0.2.1-rc.2 <0.3.0-0`。
- 本插件**不依赖** npm 上的 `@deepseek-ai/dsh-tools`、`@deepseek-ai/dsh-client-ui-*` 等子包。当前 npm 上这些子包仍是过旧的 `0.0.1-rc.1`（`dsh-tools` 为 `0.0.1-rc.1`），与 `0.2.1-rc.2` 宿主不兼容；插件在运行时使用宿主提供的模块图（React、slot、Session/Workspace controllers），构建期只依赖 TypeScript、esbuild 和 Vitest。
- 自定义 `DSH_HOME`：本插件的工作目录固定为 `~/.dsh/dsh-standalone-sessions`，因为浏览器端只能拿到 `$host.home`。如果使用自定义 `DSH_HOME`，DSH 的 profile/session 数据会在自定义位置，但独立会话目录仍在 `~/.dsh` 下；会话功能不受影响，只是目录不跟随 `DSH_HOME`。
- 如果未来 DSH 修改 `conversation.composer.bar` slot 或原生 InputBar props，输入区解锁可能失效；插件会安全降级，不损坏会话或工作区数据。

## 已知限制

- **原生“未分组”区域仍会显示独立会话**：它们不隶属于任何工作区（`workspaceIds` 为空），但 DSH 的原生 WorkspaceBrowser 会把无工作区会话放进顶层“未分组”分组。插件在该分组中为独立会话加 `独` / `独立` badge，并提供独立管理面板；没有替换原生浏览器来彻底隐藏这个分组。
- **删除 = 归档**：DSH 没有公开的物理删除会话 API；已删除会话可从原生归档视图恢复。空白会话的目录会被清理；已使用会话的目录会保留。
- **空白会话依赖本插件解锁输入区**：卸载后空白独立会话的输入区会回到原生 inert 状态。
- **没有全局快捷键**：只注册了命令菜单项和侧边栏入口，避免与原生快捷键冲突。
- **顶栏行本质是导航键**：DSH 的 `sidebar.panellist` 点击固定执行 `selectPanel`，插件通过 launcher main panel 实现“点击即创建”；如果未来 DSH 改变 panel/行语义，需要重新适配。
- **没有自动模型回复测试**：本地验证使用了隔离的 DSH profile 和真实浏览器；首次消息成功写入并保持独立状态，但测试环境的 API Key 无效，模型返回 `API 密钥无效`。这不影响会话、输入区和独立标记的验证。

## 开发

```bash
npm install
npm run typecheck   # tsc --noEmit
npm run build       # 宿主 ESM + 客户端 Module Loader bundle + .d.ts
npm test            # Vitest：51 个单元测试
npm run check       # typecheck + build + test
```

本项目结构：

```text
src/index.ts                宿主端入口（registry、归档清理、孤儿目录回收）
src/host/registry.ts        原子写入的 registry、目录清理策略
src/shared/standalone.ts    纯函数：路径标记、id、registry 归一化、清理策略
src/client/index.ts         客户端入口（slot 注册、命令、主题样式）
src/client/adapters.ts      原生输入条适配器（仅解锁独立会话）
src/client/components.tsx   独立会话面板、launcher、侧边栏入口、行 badge、toast
src/client/launcher.ts      launcher 的创建去重、空白复用、点击 arm 策略
src/client/panels.ts        main panel id（launcher / 管理）
src/client/format.ts        相对时间本地化
src/client/create.ts        创建策略（可注入测试）
src/client/hooks.ts         Session/Workspace 可观察源的 React 绑定
test/standalone.test.ts     创建策略、标记、回滚、composer 策略
test/registry.test.ts       registry 持久化、并发、清理、失败重试、孤儿回收
test/launcher.test.ts       launcher 创建去重、空白复用、arm 窗口
test/actions.test.ts         管理入口与显式创建/打开
test/format.test.ts         相对时间本地化
```

构建产物：

- `lib/index.js`：宿主 ESM 插件。
- `lib/client.js`：`window.__ModuleLoader__.load({ id, factory })` 形式的客户端 bundle。
- `lib/types/**`：TypeScript 声明。

## English summary

Adds first-class standalone sessions to DeepSeek Harness. A standalone session has no workspace: its durable cwd is `~/.dsh/dsh-standalone-sessions/<sessionId>`, it is listed under the native top-level **Ungrouped** group with a standalone badge, and it also has a dedicated sidebar panel with create/open/rename/delete. A narrowly scoped adapter unlocks DSH's own composer for these sessions, so model selection, attachments, slash commands and sending work without creating a synthetic workspace. The native New Session button, workspace browser, picker, session menus and chat UI are not replaced. Deleting a standalone session uses DSH's native archive; an unused session's directory is removed, while a used session's directory is retained for recovery. Compatible with DSH `>=0.2.1-rc.2 <0.3.0-0`. MIT.

## License

MIT. See [LICENSE](./LICENSE).
