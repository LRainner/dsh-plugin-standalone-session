# dsh-plugin-standalone-session

[![npm](https://img.shields.io/npm/v/dsh-plugin-standalone-session)](https://www.npmjs.com/package/dsh-plugin-standalone-session)
[![release](https://img.shields.io/github/v/release/LRainner/dsh-plugin-standalone-session)](https://github.com/LRainner/dsh-plugin-standalone-session/releases)

DeepSeek Harness 的独立会话：**不隶属于任何工作区**，但完整复用原生输入区。

- 插件 ID：`standalone-session`
- 中文名：`独立会话` / `Standalone Session`
- 兼容 DSH：`>=0.2.1-rc.2 <0.3.0-0`
- License：MIT

## 功能

- 侧边栏顶部点击 **新建独立会话**，直接创建并打开会话。
- 上一次由该入口创建的空白会话会复用，避免连点产生大量空会话；管理面板空状态可强制新建。
- 侧边栏底部 **管理独立会话**：点击行打开，`⋯` 菜单重命名/删除，支持多选批量删除。
- 原生输入区可用：模型选择、附件、`/` 指令、发送。
- 重启 DSH 后仍保持独立状态。
- 不替换原生新建会话、工作区浏览器、会话菜单或聊天 UI。

## 安装

### npm（推荐）

**Web**

```bash
dsh plugin --profile web add dsh-plugin-standalone-session
```

重启 `dsh web`，硬刷新页面。

**Desktop**

打开 **插件 / Plugins** → 安装 → 输入 `dsh-plugin-standalone-session`，然后完全退出并重启 DSH。

桌面端的 profile 由 Electron 管理，不能用 `dsh plugin --profile desktop` 安装。

### 本地 tarball

```bash
npm ci
npm run build
npm pack
dsh plugin --profile web add /absolute/path/to/dsh-plugin-standalone-session-0.1.0.tgz
```

> 不要直接安装 GitHub 源码 tarball。仓库不包含构建后的 `lib/`，pnpm 会因构建脚本策略报 `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED`；请用 npm 包或本地 tarball。

## 使用

- **新建**：点击侧边栏顶部 `新建独立会话`。如果上次创建的会话仍为空白，会直接复用它。
- **管理**：点击底部 `管理独立会话（n）`，或命令菜单里的 `独立会话：管理`。
- **命令**：输入 `/`，选择 `独立会话：新建` / `独立会话：管理`。
- **删除**：使用 DSH 原生归档，不是物理删除；已删除会话可在归档视图中恢复。

管理面板点击整行打开会话；行尾 `⋯` 提供重命名和删除。点击右上角 `选择` 进入批量模式，可全选/半选后一次删除；部分失败会保留失败项。删除最后一条后会停留在空状态，不会跳回新会话页。

## 与普通会话的区别

| | 普通工作区会话 | 独立会话 |
| --- | --- | --- |
| 工作区归属 | 属于某个工作区 | 不属于任何工作区 |
| 工作区注册表 | 有记录 | 没有记录 |
| 侧边栏 | 工作区分组 | 顶层“未分组” + 独立面板 |
| 工作目录 | 工作区目录 | `~/.dsh/dsh-standalone-sessions/<sessionId>` |
| 输入区 | 原生启用 | 插件解锁同一个原生 InputBar |

## 实现

没有创建临时工作区，也没有 patch 原生 workspace 逻辑：

- 会话自身 `cwd` 带有独立标记；宿主 `registry.json` 记录生命周期。
- 客户端只包装 `conversation.composer.bar`：当 cwd 是独立标记且原生输入区为 disabled 时解锁。
- 不替换原生聊天、工作区选择器、会话菜单或新建按钮。

数据目录：

```text
~/.dsh/dsh-standalone-sessions/
├── registry.json
└── session-<uuid>/
```

删除语义：

- 空白且目录为空：归档后删除工作目录。
- 目录非空或产生过消息：保留目录，便于恢复。
- 清理失败会记录日志并重试，不阻塞归档。

## 兼容与限制

- 只在 DSH `>=0.2.1-rc.2 <0.3.0-0` 验证。
- 独立会话仍会出现在原生“未分组”区域；插件没有替换 WorkspaceBrowser。
- 原生 hero 的 `选择工作区` chip 仍在；插件只在右侧显示 `独立会话 · 无工作区`。
- 卸载后，空白独立会话的输入区会回到原生 inert 状态；有消息的会话不受影响。
- DSH 没有物理删除会话 API，删除等于归档。
- 自定义 `DSH_HOME` 时，独立会话目录仍固定在 `~/.dsh/dsh-standalone-sessions`。

## 开发

```bash
npm ci
npm run check       # typecheck + build + 59 个单元测试
npm test
```

产物：

- `lib/index.js`：宿主插件
- `lib/client.js`：客户端 Module Loader bundle
- `lib/types/**`：类型声明

## 发布

发布使用 [Release Please](https://github.com/googleapis/release-please-action)：合并 `feat:` / `fix:` 后自动创建 release PR；合并 release PR 后自动创建 tag、GitHub Release，并通过 npm Trusted Publishing 发布和附加 tarball。

首次使用需要在 npm 包设置中配置 Trusted Publisher：

- Repository：`LRainner/dsh-plugin-standalone-session`
- Workflow：`release.yml`

同时确保仓库 Actions 设置允许创建 pull request。

## 卸载

```bash
dsh plugin --profile web remove dsh-plugin-standalone-session
```

Desktop 在 **插件 / Plugins** 页面卸载，然后完全重启。

卸载不会删除会话。确需清理独立会话目录时：

```bash
rm -rf ~/.dsh/dsh-standalone-sessions
```

这会删除工作目录，可能包含 agent 写入的文件；会话历史仍由 DSH 管理。

## License

MIT
