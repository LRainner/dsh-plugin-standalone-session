/**
 * Browser dictionaries. `zh` is the key-set source of truth; the checked type
 * keeps `en` complete, and both shipped languages are registered together.
 */
export const NS = 'standaloneSession'

export type StandaloneKey =
  | 'panel.label'
  | 'panel.title'
  | 'panel.description'
  | 'panel.new'
  | 'panel.empty'
  | 'panel.emptyHint'
  | 'panel.badge'
  | 'panel.open'
  | 'panel.rename'
  | 'panel.delete'
  | 'panel.untitled'
  | 'panel.blank'
  | 'panel.running'
  | 'panel.cwd'
  | 'panel.count'
  | 'panel.deleteTitle'
  | 'panel.deleteBody'
  | 'panel.deleteConfirm'
  | 'panel.select'
  | 'panel.selectToolbar'
  | 'panel.selectAll'
  | 'panel.selectAllLabel'
  | 'panel.selectionHint'
  | 'panel.selectedCount'
  | 'panel.selectRow'
  | 'panel.batchDelete'
  | 'panel.batchDeleteTitle'
  | 'panel.batchDeleteBody'
  | 'panel.batchDeleteRunning'
  | 'panel.batchDeleteDirs'
  | 'panel.batchDeleting'
  | 'panel.batchPartial'
  | 'panel.deleteKeepDir'
  | 'panel.cancel'
  | 'panel.renameTitle'
  | 'panel.renameLabel'
  | 'panel.more'
  | 'panel.save'
  | 'panel.titleRequired'
  | 'panel.actionFailed'
  | 'panel.retry'
  | 'panel.archivedHint'
  | 'panel.loading'
  | 'entry.label'
  | 'launcher.creating'
  | 'launcher.failedTitle'
  | 'launcher.retry'
  | 'launcher.manage'
  | 'launcher.hint'
  | 'command.label'
  | 'command.description'
  | 'command.manageLabel'
  | 'command.manageDescription'
  | 'footer.manage'
  | 'footer.manageCount'
  | 'footer.manageTooltip'
  | 'time.now'
  | 'time.minutes'
  | 'time.hours'
  | 'time.days'
  | 'toast.manageFailed'
  | 'hero.badge'
  | 'hero.hint'
  | 'row.mark'
  | 'row.hover'
  | 'composer.placeholder'
  | 'toast.created'
  | 'toast.createFailed'
  | 'toast.deleteFailed'
  | 'toast.deleted'
  | 'toast.renamed'
  | 'toast.renameFailed'
  | 'error.noHome'
  | 'error.noSession'

export type StandaloneDict = Readonly<Record<StandaloneKey, string>>

export const zh: StandaloneDict = {
  'panel.label': '独立会话',
  'panel.title': '独立会话',
  'panel.description': '不隶属于任何工作区，使用 DSH 原生输入区。',
  'panel.new': '新建独立会话',
  'panel.empty': '还没有独立会话',
  'panel.emptyHint': '点击下方按钮，创建一个空白会话开始。',
  'panel.badge': '独立',
  'panel.open': '打开',
  'panel.rename': '重命名',
  'panel.delete': '删除',
  'panel.untitled': '未命名会话',
  'panel.blank': '空白',
  'panel.running': '运行中',
  'panel.cwd': '工作目录',
  'panel.count': '{n} 个会话',
  'panel.deleteTitle': '删除独立会话？',
  'panel.deleteBody':
    '会话将从列表和原生会话视图中移除（DSH 以归档实现删除），但仍可在归档视图中恢复。空白会话的临时目录会被清理；已经产生过消息的会话会保留其目录。',
  'panel.deleteConfirm': '删除',
  'panel.select': '选择',
  'panel.selectToolbar': '批量选择',
  'panel.selectAll': '全选',
  'panel.selectAllLabel': '全选独立会话',
  'panel.selectionHint': '点击会话行选择，或使用全选。',
  'panel.selectedCount': '已选 {n} / {total}',
  'panel.selectRow': '选择“{title}”',
  'panel.batchDelete': '删除',
  'panel.batchDeleteTitle': '删除 {n} 个独立会话？',
  'panel.batchDeleteBody': '将归档这 {n} 个会话，可在归档视图中恢复。',
  'panel.batchDeleteRunning': '其中 {n} 个正在运行，归档会停止它们。',
  'panel.batchDeleteDirs':
    '空白且目录为空的会话会清理工作目录；已有消息或目录非空的会话会保留目录。',
  'panel.batchDeleting': '归档中 {done}/{total}…',
  'panel.batchPartial': '{n} 个会话归档失败，已保留选中状态。',
  'panel.deleteKeepDir': '该会话已有消息，目录会被保留。',
  'panel.cancel': '取消',
  'panel.renameTitle': '重命名独立会话',
  'panel.renameLabel': '名称',
  'panel.more': '更多操作',
  'panel.save': '保存',
  'panel.titleRequired': '标题不能为空',
  'panel.actionFailed': '操作失败：{message}',
  'panel.retry': '重试',
  'panel.archivedHint': '已删除的会话在 DSH 的归档视图中仍可恢复。',
  'panel.loading': '正在加载会话…',
  'entry.label': '新建独立会话',
  'launcher.creating': '正在创建独立会话…',
  'launcher.failedTitle': '无法创建独立会话',
  'launcher.retry': '重试',
  'launcher.manage': '管理已有会话',
  'launcher.hint': '点击左侧“新建独立会话”即可直接开始。',
  'command.label': '独立会话：新建',
  'command.description': '创建一个不属于任何工作区的独立会话。',
  'command.manageLabel': '独立会话：管理',
  'command.manageDescription': '打开独立会话列表，支持打开、重命名和删除。',
  'footer.manage': '管理独立会话',
  'footer.manageCount': '管理独立会话（{n}）',
  'footer.manageTooltip': '打开独立会话列表，支持打开、重命名和删除。',
  'time.now': '刚刚',
  'time.minutes': '{n} 分钟前',
  'time.hours': '{n} 小时前',
  'time.days': '{n} 天前',
  'toast.manageFailed': '无法打开管理面板：{message}',
  'hero.badge': '独立会话 · 无工作区',
  'hero.hint': '不隶属于任何工作区',
  'row.mark': '独',
  'row.hover': '独立会话 · 不属于任何工作区',
  'composer.placeholder': '描述你想构建的内容…',
  'toast.created': '已创建独立会话',
  'toast.createFailed': '无法创建独立会话：{message}',
  'toast.deleteFailed': '无法删除独立会话：{message}',
  'toast.deleted': '已删除独立会话',
  'toast.renamed': '已重命名独立会话',
  'toast.renameFailed': '无法重命名独立会话：{message}',
  'error.noHome': '无法确定宿主主目录',
  'error.noSession': '没有可用的会话',
}

export const en: StandaloneDict = {
  'panel.label': 'Standalone',
  'panel.title': 'Standalone Sessions',
  'panel.description': 'Workspace-free sessions using the native DSH composer.',
  'panel.new': 'New Standalone Session',
  'panel.empty': 'No standalone sessions yet',
  'panel.emptyHint': 'Use the button below to create a blank session.',
  'panel.badge': 'Standalone',
  'panel.open': 'Open',
  'panel.rename': 'Rename',
  'panel.delete': 'Delete',
  'panel.untitled': 'Untitled session',
  'panel.blank': 'Blank',
  'panel.running': 'Running',
  'panel.cwd': 'Working directory',
  'panel.count': '{n} session(s)',
  'panel.deleteTitle': 'Delete standalone session?',
  'panel.deleteBody':
    'The session leaves the list and the native session view (DSH implements deletion as archive), and remains recoverable from the archived view. The directory of an unused session is removed; a session that already carried messages keeps its directory.',
  'panel.deleteConfirm': 'Delete',
  'panel.select': 'Select',
  'panel.selectToolbar': 'Bulk selection',
  'panel.selectAll': 'Select all',
  'panel.selectAllLabel': 'Select all standalone sessions',
  'panel.selectionHint': 'Select rows, or use Select all.',
  'panel.selectedCount': '{n} / {total} selected',
  'panel.selectRow': 'Select "{title}"',
  'panel.batchDelete': 'Delete',
  'panel.batchDeleteTitle': 'Delete {n} standalone session(s)?',
  'panel.batchDeleteBody':
    'The {n} selected session(s) will be archived and can be restored from the archived view.',
  'panel.batchDeleteRunning': '{n} session(s) are running; archiving will stop them.',
  'panel.batchDeleteDirs':
    'Blank sessions with empty directories lose their working directory; sessions with messages or non-empty directories keep theirs.',
  'panel.batchDeleting': 'Archiving {done}/{total}…',
  'panel.batchPartial': 'Failed to archive {n} session(s); selection was kept.',
  'panel.deleteKeepDir': 'This session already carried messages; its directory is retained.',
  'panel.cancel': 'Cancel',
  'panel.renameTitle': 'Rename standalone session',
  'panel.renameLabel': 'Name',
  'panel.more': 'More actions',
  'panel.save': 'Save',
  'panel.titleRequired': 'Title cannot be empty',
  'panel.actionFailed': 'Operation failed: {message}',
  'panel.retry': 'Retry',
  'panel.archivedHint': 'Deleted sessions remain recoverable from the native archived view.',
  'panel.loading': 'Loading sessions…',
  'entry.label': 'New Standalone Session',
  'launcher.creating': 'Creating a standalone session…',
  'launcher.failedTitle': 'Could not create a standalone session',
  'launcher.retry': 'Retry',
  'launcher.manage': 'Manage sessions',
  'launcher.hint': 'Choose New Standalone Session in the sidebar to start.',
  'command.label': 'Standalone Session: New',
  'command.description': 'Create a standalone session that belongs to no workspace.',
  'command.manageLabel': 'Standalone Session: Manage',
  'command.manageDescription': 'Open the standalone session list to open, rename or delete sessions.',
  'footer.manage': 'Manage standalone sessions',
  'footer.manageCount': 'Manage standalone sessions ({n})',
  'footer.manageTooltip': 'Open the standalone session list to open, rename or delete sessions.',
  'time.now': 'Just now',
  'time.minutes': '{n} min ago',
  'time.hours': '{n} hr ago',
  'time.days': '{n} days ago',
  'toast.manageFailed': 'Could not open the manager: {message}',
  'hero.badge': 'Standalone · No workspace',
  'hero.hint': 'Not attached to any workspace',
  'row.mark': 'S',
  'row.hover': 'Standalone session · not attached to any workspace',
  'composer.placeholder': 'Describe what you want to build…',
  'toast.created': 'Standalone session created',
  'toast.createFailed': 'Could not create the standalone session: {message}',
  'toast.deleteFailed': 'Could not delete the standalone session: {message}',
  'toast.deleted': 'Standalone session deleted',
  'toast.renamed': 'Standalone session renamed',
  'toast.renameFailed': 'Could not rename the standalone session: {message}',
  'error.noHome': 'Cannot determine the host home directory',
  'error.noSession': 'No session is available',
}
