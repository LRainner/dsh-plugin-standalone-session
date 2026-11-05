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
  | 'panel.searchPlaceholder'
  | 'panel.searchLabel'
  | 'panel.clearSearch'
  | 'panel.batchManage'
  | 'panel.done'
  | 'panel.selectAllResults'
  | 'panel.selectAllShort'
  | 'panel.selectAllCurrent'
  | 'panel.selectedItems'
  | 'panel.archiveSelected'
  | 'panel.archive'
  | 'panel.archiveTitle'
  | 'panel.archiveBody'
  | 'panel.archiveRunningTitle'
  | 'panel.archiveRunningBody'
  | 'panel.archiveConfirm'
  | 'panel.stopAndArchive'
  | 'panel.batchArchiveTitle'
  | 'panel.batchArchiveBody'
  | 'panel.batchArchiveRunning'
  | 'panel.batchArchiveConfirm'
  | 'panel.batchStopArchive'
  | 'panel.archiveDirs'
  | 'panel.noSearchResults'
  | 'panel.noSearchHint'
  | 'panel.searchResults'
  | 'panel.groupToday'
  | 'panel.groupYesterday'
  | 'panel.groupEarlier'
  | 'panel.groupUnknown'
  | 'panel.moreFor'
  | 'panel.creating'
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
  | 'time.yesterday'
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
  'panel.description': '无需选择工作区，直接开始对话。',
  'panel.new': '新建会话',
  'panel.empty': '还没有独立会话',
  'panel.emptyHint': '点击“新建会话”开始。',
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
  'panel.select': '批量管理',
  'panel.selectToolbar': '批量选择',
  'panel.selectAll': '全选结果',
  'panel.selectAllLabel': '全选独立会话',
  'panel.selectionHint': '点击会话行选择，或使用全选。',
  'panel.selectedCount': '已选 {n} 项',
  'panel.selectRow': '选择“{title}”',
  'panel.batchDelete': '归档所选',
  'panel.batchDeleteTitle': '删除 {n} 个独立会话？',
  'panel.batchDeleteBody': '将归档这 {n} 个会话，可在归档视图中恢复。',
  'panel.batchDeleteRunning': '其中 {n} 个正在运行，归档会停止它们。',
  'panel.batchDeleteDirs':
    '空白且目录为空的会话会清理工作目录；已有消息或目录非空的会话会保留目录。',
  'panel.batchDeleting': '归档中 {done}/{total}…',
  'panel.batchPartial': '{n} 个会话归档失败，已保留选中状态。',
  'panel.deleteKeepDir': '该会话已有消息，目录会被保留。',
  'panel.cancel': '取消',
  'panel.searchPlaceholder': '搜索会话标题',
  'panel.searchLabel': '搜索会话标题',
  'panel.clearSearch': '清除搜索',
  'panel.batchManage': '批量管理',
  'panel.done': '完成',
  'panel.selectAllResults': '全选结果',
  'panel.selectAllShort': '全选',
  'panel.selectAllCurrent': '全选当前搜索结果（{n} 个）',
  'panel.selectedItems': '已选 {n} 项',
  'panel.archiveSelected': '归档所选',
  'panel.archive': '归档',
  'panel.archiveTitle': '归档此会话？',
  'panel.archiveBody': '归档后将从列表移除，可在 DSH 归档视图恢复。',
  'panel.archiveRunningTitle': '停止并归档此会话？',
  'panel.archiveRunningBody': '此会话正在运行。归档会停止当前任务，可在 DSH 归档视图恢复会话。',
  'panel.archiveConfirm': '归档',
  'panel.stopAndArchive': '停止并归档',
  'panel.batchArchiveTitle': '归档 {n} 个会话？',
  'panel.batchArchiveBody': '所选会话将从列表移除，可在 DSH 归档视图恢复。',
  'panel.batchArchiveRunning': '其中 {n} 个正在运行，继续将停止这些任务。会话可在 DSH 归档视图恢复。',
  'panel.batchArchiveConfirm': '归档 {n} 个会话',
  'panel.batchStopArchive': '停止并归档',
  'panel.archiveDirs': '未使用且无用户文件的工作目录可能被清理。',
  'panel.noSearchResults': '没有找到相关会话',
  'panel.noSearchHint': '更换关键词，或清除搜索。',
  'panel.searchResults': '找到 {n} 个会话',
  'panel.groupToday': '今天',
  'panel.groupYesterday': '昨天',
  'panel.groupEarlier': '更早',
  'panel.groupUnknown': '时间未知',
  'panel.moreFor': '“{title}”的更多操作',
  'panel.creating': '正在创建…',
  'panel.renameTitle': '重命名独立会话',
  'panel.renameLabel': '名称',
  'panel.more': '更多操作',
  'panel.save': '保存',
  'panel.titleRequired': '标题不能为空',
  'panel.actionFailed': '操作失败：{message}',
  'panel.retry': '重试',
  'panel.archivedHint': '归档的会话可在 DSH 归档视图中恢复。',
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
  'time.yesterday': '昨天',
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
  'panel.description': 'Start a conversation without selecting a workspace.',
  'panel.new': 'New Session',
  'panel.empty': 'No standalone sessions yet',
  'panel.emptyHint': 'Choose New Session to get started.',
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
  'panel.select': 'Manage Multiple',
  'panel.selectToolbar': 'Bulk selection',
  'panel.selectAll': 'Select all results',
  'panel.selectAllLabel': 'Select all standalone sessions',
  'panel.selectionHint': 'Select rows, or use Select all.',
  'panel.selectedCount': '{n} selected',
  'panel.selectRow': 'Select "{title}"',
  'panel.batchDelete': 'Archive selected',
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
  'panel.searchPlaceholder': 'Search session titles',
  'panel.searchLabel': 'Search session titles',
  'panel.clearSearch': 'Clear search',
  'panel.batchManage': 'Manage Multiple',
  'panel.done': 'Done',
  'panel.selectAllResults': 'Select all results',
  'panel.selectAllShort': 'Select all',
  'panel.selectAllCurrent': 'Select all current search results ({n})',
  'panel.selectedItems': '{n} selected',
  'panel.archiveSelected': 'Archive selected',
  'panel.archive': 'Archive',
  'panel.archiveTitle': 'Archive this session?',
  'panel.archiveBody': 'It will leave the list and can be restored from DSH’s archive view.',
  'panel.archiveRunningTitle': 'Stop and archive this session?',
  'panel.archiveRunningBody': 'This session is running. Archiving stops the current task; the session can be restored from DSH’s archive view.',
  'panel.archiveConfirm': 'Archive',
  'panel.stopAndArchive': 'Stop and Archive',
  'panel.batchArchiveTitle': 'Archive {n} session(s)?',
  'panel.batchArchiveBody': 'The selected sessions will leave the list and can be restored from DSH’s archive view.',
  'panel.batchArchiveRunning': '{n} are running; continuing stops those tasks. Sessions can be restored from DSH’s archive view.',
  'panel.batchArchiveConfirm': 'Archive {n} session(s)',
  'panel.batchStopArchive': 'Stop and Archive',
  'panel.archiveDirs': 'Unused working directories without user files may be cleaned up.',
  'panel.noSearchResults': 'No matching sessions',
  'panel.noSearchHint': 'Try another search, or clear it.',
  'panel.searchResults': '{n} session(s) found',
  'panel.groupToday': 'Today',
  'panel.groupYesterday': 'Yesterday',
  'panel.groupEarlier': 'Earlier',
  'panel.groupUnknown': 'Unknown time',
  'panel.moreFor': 'More actions for “{title}”',
  'panel.creating': 'Creating…',
  'panel.renameTitle': 'Rename standalone session',
  'panel.renameLabel': 'Name',
  'panel.more': 'More actions',
  'panel.save': 'Save',
  'panel.titleRequired': 'Title cannot be empty',
  'panel.actionFailed': 'Operation failed: {message}',
  'panel.retry': 'Retry',
  'panel.archivedHint': 'Archived sessions can be restored from DSH’s archive view.',
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
  'time.yesterday': 'Yesterday',
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
