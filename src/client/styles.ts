/**
 * One namespaced stylesheet. DSH theme variables carry the palette, so the
 * plugin follows light/dark themes without owning color tokens.
 */
export const CSS = `
.ss-panel {
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  overflow: auto;
  padding: 32px clamp(20px, 5vw, 56px) 56px;
  color: var(--dsw-alias-label-primary, #1f2328);
  background: var(--dsw-specific-main-fill, transparent);
}
.ss-shell {
  width: 100%;
  max-width: 880px;
  margin: 0 auto;
}
.ss-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.ss-titleRow {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.ss-title {
  font-size: 24px;
  line-height: 32px;
  font-weight: 600;
  margin: 0;
}
.ss-description {
  color: var(--dsw-alias-label-secondary, #59636e);
  font-size: 13px;
  line-height: 20px;
  margin: 6px 0 0;
  max-width: 560px;
}
.ss-count {
  color: var(--dsw-alias-label-tertiary, #818b98);
  font-size: 12px;
  line-height: 20px;
  margin-top: 6px;
}
.ss-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ss-button {
  font: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  min-height: 32px;
  padding: 5px 12px;
  border-radius: var(--dsw-radius-md, 10px);
  border: 0.5px solid transparent;
  cursor: pointer;
  color: var(--dsw-alias-label-primary, #1f2328);
  background: var(--dsw-alias-button-elevated-fill, #f3f4f6);
  transition: background 120ms ease, border-color 120ms ease;
}
.ss-button:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover, #e9ebee);
}
.ss-button:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid
    var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #3b82f6));
  outline-offset: 1px;
}
.ss-button:disabled {
  cursor: default;
  opacity: 0.55;
}
.ss-buttonPrimary {
  color: #fff;
  background: var(--dsw-alias-state-business-primary, #2563eb);
  border-color: var(--dsw-alias-state-business-primary, #2563eb);
}
.ss-buttonPrimary:hover:not(:disabled) {
  background: var(--dsw-alias-state-business-primary, #2563eb);
  filter: brightness(1.05);
}
.ss-buttonQuiet {
  background: transparent;
  border-color: var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.22));
}
.ss-buttonDanger {
  color: var(--dsw-alias-state-error-primary, #d1242f);
  background: transparent;
  border-color: var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.22));
}
.ss-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: none;
  border-radius: 999px;
  padding: 1px 8px 2px;
  font-size: 11px;
  line-height: 16px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--dsw-alias-label-primary-bluish, #1f4f8f);
  background: var(--dsw-alias-state-business-tertiary, rgba(59, 130, 246, 0.12));
  border: 0.5px solid var(--dsw-alias-interactive-bg-hover, rgba(59, 130, 246, 0.18));
}
.ss-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
}
.ss-row {
  display: flex;
  align-items: center;
  gap: 14px;
  box-sizing: border-box;
  padding: 12px 14px;
  border-radius: var(--dsw-radius-lg, 14px);
  border: 0.5px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.2));
  background: var(--dsw-alias-bg-elevated, rgba(255, 255, 255, 0.02));
}
.ss-row:hover {
  border-color: var(--dsw-alias-border-l4, rgba(128, 128, 128, 0.35));
}
.ss-rowMain {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.ss-rowTitleRow {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.ss-rowTitle {
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ss-rowMeta {
  color: var(--dsw-alias-label-tertiary, #818b98);
  font-size: 12px;
  line-height: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
}
.ss-rowPath {
  font-family: var(--ds-font-family-code, ui-monospace, SFMono-Regular, Menlo, monospace);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 380px;
}
.ss-dotSep {
  opacity: 0.5;
}
.ss-rowActions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
}
.ss-stateRunning {
  color: var(--dsw-alias-state-business-primary, #2563eb);
  font-weight: 600;
}
.ss-empty {
  margin-top: 28px;
  padding: 44px 24px;
  text-align: center;
  border: 0.5px dashed var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.3));
  border-radius: var(--dsw-radius-lg, 14px);
}
.ss-emptyTitle {
  font-size: 15px;
  font-weight: 600;
  line-height: 22px;
  margin: 0 0 6px;
}
.ss-emptyHint {
  color: var(--dsw-alias-label-secondary, #59636e);
  font-size: 13px;
  line-height: 20px;
  margin: 0 auto;
  max-width: 460px;
}
.ss-emptyAction {
  margin-top: 18px;
}
.ss-error {
  margin-top: 16px;
  padding: 8px 10px;
  border-radius: var(--dsw-radius-sm, 8px);
  color: var(--dsw-alias-state-error-primary, #d1242f);
  background: var(--dsw-alias-state-error-tertiary, rgba(209, 36, 47, 0.08));
  font-size: 12px;
  line-height: 18px;
}
.ss-dialogBackdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.28);
  padding: 24px;
}
.ss-dialog {
  width: 100%;
  max-width: 440px;
  box-sizing: border-box;
  border-radius: var(--dsw-radius-lg, 14px);
  border: 0.5px solid var(--dsw-alias-border-l4, rgba(128, 128, 128, 0.35));
  background: var(--dsw-alias-bg-elevated, #fff);
  padding: 20px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
}
.ss-dialogTitle {
  margin: 0 0 6px;
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
}
.ss-dialogBody {
  margin: 0 0 14px;
  color: var(--dsw-alias-label-secondary, #59636e);
  font-size: 13px;
  line-height: 20px;
}
.ss-input {
  box-sizing: border-box;
  width: 100%;
  height: 36px;
  border-radius: var(--dsw-radius-sm, 8px);
  border: 0.5px solid var(--dsw-alias-border-l4, rgba(128, 128, 128, 0.35));
  background: transparent;
  color: inherit;
  font: inherit;
  padding: 0 10px;
}
.ss-dialogFooter {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}
.ss-footerAction {
  box-sizing: border-box;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 4px 8px;
  border: 0;
  border-radius: var(--dsw-radius-md, 10px);
  background: transparent;
  color: var(--dsw-alias-label-secondary, #59636e);
  font: inherit;
  cursor: pointer;
  text-align: left;
}
.ss-footerAction:hover {
  color: var(--dsw-alias-label-primary, #1f2328);
  background: var(--dsw-alias-interactive-bg-hover, #e9ebee);
}
.ss-footerAction:disabled {
  cursor: default;
  opacity: 0.55;
}
.ss-footerLabel {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}
.ss-footerRail {
  width: 36px;
  height: 36px;
  justify-content: center;
  padding: 0;
}
.ss-panelIcon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.ss-panelCount {
  position: absolute;
  top: -5px;
  right: -7px;
  min-width: 13px;
  height: 13px;
  padding: 0 3px;
  box-sizing: border-box;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  line-height: 1;
  font-weight: 700;
  color: var(--dsw-alias-label-primary, #1f2328);
  background: var(--dsw-alias-state-business-tertiary, rgba(59, 130, 246, 0.18));
}
.ss-heroBadge {
  margin-right: 4px;
}
.ss-rowMark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 4px;
  font-size: 9px;
  line-height: 1;
  font-weight: 700;
  color: var(--dsw-alias-label-primary-bluish, #1f4f8f);
  background: var(--dsw-alias-state-business-tertiary, rgba(59, 130, 246, 0.14));
  flex: none;
}
.ss-rowHover {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #cfd3d6;
  font-size: 12px;
  line-height: 16px;
}
.ss-toast {
  position: fixed;
  left: 50%;
  bottom: 28px;
  transform: translateX(-50%);
  z-index: 90;
  max-width: min(520px, calc(100vw - 40px));
  box-sizing: border-box;
  padding: 9px 14px;
  border-radius: var(--dsw-radius-md, 10px);
  border: 0.5px solid var(--dsw-alias-border-l4, rgba(128, 128, 128, 0.35));
  background: var(--dsw-alias-bg-elevated, #fff);
  color: var(--dsw-alias-label-primary, #1f2328);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  font-size: 13px;
  line-height: 19px;
  pointer-events: auto;
}
.ss-toastError {
  color: var(--dsw-alias-state-error-primary, #d1242f);
}
.ss-visuallyHidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
@media (max-width: 640px) {
  .ss-panel { padding: 20px 14px 40px; }
  .ss-row { flex-wrap: wrap; }
  .ss-rowActions { width: 100%; justify-content: flex-end; }
  .ss-rowPath { max-width: 100%; }
}
`

/**
 * Insert (or replace) the plugin's one style element.
 * @returns a disposer that removes the element.
 */
export function insertStyles(): () => void {
  if (typeof document === 'undefined') return () => undefined
  const existing = document.querySelector('style[data-plugin="dsh-plugin-standalone-session"]')
  if (existing !== null) {
    existing.textContent = CSS
    return () => undefined
  }
  const tag = document.createElement('style')
  tag.setAttribute('data-plugin', 'dsh-plugin-standalone-session')
  tag.textContent = CSS
  document.head.appendChild(tag)
  return () => tag.remove()
}
