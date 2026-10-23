/**
 * Browser half of `dsh-plugin-standalone-session`: a dedicated sidebar/panel
 * area, a direct creation action, a command contribution, native-row badges
 * and the composer adapter that makes a workspace-free session usable.
 *
 * Composition is additive: every registration lands in an existing DSH list
 * seat or keyed panel. The native New Session action, workspace browser,
 * picker, session menus and chat surface are not replaced.
 */
import type { ClientContext } from './dsh.js'
import { patchComposer } from './adapters.js'
import {
  StandaloneToast,
  createFooterAction,
  createHeroBadge,
  createPanelIcon,
  createRowHover,
  createRowLeading,
  createStandalonePanel,
  StandaloneIcon,
} from './components.js'
import { startStandalone, messageOf } from './actions.js'
import { NS, en, zh } from './locales.js'
import { showNotice } from './notice.js'
import { insertStyles } from './styles.js'

/** The keyed main-panel id and the matching sidebar row id. */
export const PANEL_ID = 'standalone-sessions'

/** Services this client plugin requires. */
export const inject = [
  'slots',
  'locale',
  'sessions',
  'workspaces',
  'uiWorkspace',
  'commandUi',
  'remote',
]

/**
 * Register the browser half.
 * @param ctx - Cordis client root context.
 */
export function apply(ctx: ClientContext): void {
  const boundT = ctx.locale.bind(NS)

  ctx.effect(
    () => ctx.locale.register(NS, { zh, en }),
    'standalone-session: dictionaries',
  )

  ctx.effect(() => insertStyles(), 'standalone-session: styles')

  // A standalone session has no Workspace, so the native composer starts
  // inert. This adapter clears only that gate for sessions whose durable cwd
  // carries the standalone marker.
  ctx.slots.inject('conversation.composer.bar', () => patchComposer(ctx, boundT))

  // Dedicated area: a sidebar row plus the matching keyed main panel.
  ctx.slots.inject('main', () =>
    ctx.slots.register(
      { name: 'main', key: PANEL_ID, locale: NS },
      createStandalonePanel(ctx),
    ),
  )
  ctx.slots.inject('sidebar.panellist', () =>
    ctx.slots.register(
      {
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: 20,
        locale: NS,
        label: () => boundT('panel.label'),
      },
      createPanelIcon(ctx),
    ),
  )

  // Direct creation entry in the sidebar foot.
  ctx.slots.inject('sidebar.footer.action', () =>
    ctx.slots.register(
      {
        name: 'sidebar.footer.action',
        id: 'standalone-session-new',
        order: 20,
        locale: NS,
      },
      createFooterAction(ctx),
    ),
  )

  // Badges on the native Ungrouped row and its hover card. These are additive
  // decorations; the native row remains fully native.
  ctx.slots.inject('conversation.hero.options', () =>
    ctx.slots.register(
      {
        name: 'conversation.hero.options',
        id: 'standalone-session-badge',
        order: 100,
        locale: NS,
      },
      createHeroBadge(ctx),
    ),
  )
  ctx.slots.inject('sidebar.session.row.leading', () =>
    ctx.slots.register(
      {
        name: 'sidebar.session.row.leading',
        id: 'standalone-session-mark',
        order: 100,
        locale: NS,
      },
      createRowLeading(ctx),
    ),
  )
  ctx.slots.inject('sidebar.session.row.hover', () =>
    ctx.slots.register(
      {
        name: 'sidebar.session.row.hover',
        id: 'standalone-session-hover',
        order: 100,
        locale: NS,
      },
      createRowHover(ctx),
    ),
  )

  // Creation errors can happen on the New Session page, where no session can
  // host a native notice.
  ctx.slots.inject('shell.overlay', () =>
    ctx.slots.register(
      {
        name: 'shell.overlay',
        id: 'standalone-session-toast',
        order: 1000,
      },
      StandaloneToast,
    ),
  )

  // Command-menu contribution (the `/` menu and the composer's command list).
  ctx.effect(
    () =>
      ctx.commandUi.register({
        name: 'standalone-new',
        label: () => boundT('command.label'),
        description: () => boundT('command.description'),
        icon: StandaloneIcon,
        available: () => true,
        ui: {
          kind: 'action',
          run: () => {
            void startStandalone(ctx, boundT).catch((error: unknown) => {
              showNotice(
                'error',
                boundT('toast.createFailed', { message: messageOf(error) }),
              )
            })
          },
        },
      }),
    'standalone-session: command',
  )
}
