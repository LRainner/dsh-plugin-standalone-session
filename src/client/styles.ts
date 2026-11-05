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
  flex-wrap: nowrap;
  min-height: 58px;
  margin-bottom: 8px;
}
.ss-headerMain {
  min-width: 0;
  flex: 1;
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
.ss-statusLine {
  margin: 6px 0 0;
  color: var(--dsw-alias-label-secondary, #59636e);
  font-size: 13px;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ss-statusLineError {
  color: var(--dsw-alias-state-error-primary, #d1242f);
}
.ss-count {
  color: var(--dsw-alias-label-tertiary, #818b98);
  font-size: 12px;
  line-height: 20px;
  margin-top: 6px;
}
.ss-countInline {
  margin-top: 0;
  align-self: center;
}
.ss-headerActions {
  display: flex;
  flex: 0 0 176px;
  width: 176px;
  height: 32px;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: nowrap;
  gap: 8px;
}
.ss-deleteSlot {
  width: 56px;
  height: 32px;
  flex: none;
  display: flex;
  justify-content: flex-end;
}
.ss-deleteSlot .ss-button {
  min-width: 52px;
  flex: none;
}
.ss-selectButton {
  min-height: 32px;
  padding: 3px 8px;
  border: 0;
  border-radius: var(--dsw-radius-md, 10px);
  background: transparent;
  color: var(--dsw-alias-label-secondary, #59636e);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  cursor: pointer;
}
.ss-selectButton:hover:not(:disabled) {
  color: var(--dsw-alias-label-primary, #1f2328);
  background: var(--dsw-alias-interactive-bg-hover, #e9ebee);
}
.ss-selectButton:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid
    var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #3b82f6));
  outline-offset: 1px;
}
.ss-selectButton:disabled {
  cursor: default;
  opacity: 0.55;
}
.ss-button {
  font: inherit;
  display: inline-flex;
  flex: none;
  white-space: nowrap;
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
  background: var(--dsw-alias-button-tool-bar-fill, var(--dsw-alias-bg-layer-2));
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
  color: var(--dsw-alias-label-primary-foreground, #fff);
  background: var(--dsw-alias-button-primary-fill, var(--dsw-alias-state-business-primary));
  border-color: var(--dsw-alias-button-primary-fill, var(--dsw-alias-state-business-primary));
}
.ss-buttonPrimary:hover:not(:disabled) {
  background: var(--dsw-alias-button-primary-hover, var(--dsw-alias-state-business-primary));
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
  color: var(--dsw-alias-state-business-primary, #1f4f8f);
  background: var(--dsw-alias-button-ghost-active-fill, transparent);
  border: 0.5px solid var(--dsw-alias-button-ghost-active-border, transparent);
}
.ss-selectAll {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--dsw-alias-label-secondary, #59636e);
  font-size: 13px;
  line-height: 20px;
  cursor: pointer;
  user-select: none;
}
.ss-checkbox {
  width: 18px;
  height: 18px;
  margin: 0;
  flex: none;
  accent-color: var(--dsw-alias-state-business-primary, #2563eb);
  cursor: pointer;
}
.ss-checkbox:disabled {
  cursor: default;
  opacity: 0.55;
}
.ss-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
}
.ss-row {
  position: relative;
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) 28px;
  column-gap: 14px;
  align-items: center;
  box-sizing: border-box;
  height: 66px;
  padding: 12px 14px;
  border-radius: var(--dsw-radius-lg, 14px);
  border: 0.5px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.2));
  background: var(--dsw-alias-bg-layer-1, transparent);
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;
}
.ss-row:hover,
.ss-row:focus-within {
  border-color: var(--dsw-alias-border-l4, rgba(128, 128, 128, 0.35));
  background: var(--dsw-alias-interactive-bg-hover, #e9ebee);
}
.ss-rowSelected,
.ss-rowSelected:hover,
.ss-rowSelected:focus-within {
  border-color: var(--dsw-alias-state-business-primary, #3b82f6);
}
.ss-row[aria-disabled="true"] {
  cursor: default;
  opacity: 0.7;
}
.ss-rowLead {
  width: 18px;
  height: 20px;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--dsw-alias-label-tertiary, #818b98);
}
.ss-rowMain {
  min-width: 0;
  width: 100%;
  grid-column: 2;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.ss-rowMain:disabled {
  cursor: default;
  opacity: 0.7;
}
.ss-rowMain:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid
    var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #3b82f6));
  outline-offset: 2px;
  border-radius: 6px;
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
  flex-wrap: nowrap;
  overflow: hidden;
  white-space: nowrap;
}
.ss-dotSep {
  opacity: 0.5;
}
.ss-rowActions {
  position: relative;
  grid-column: 3;
  width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  flex: none;
}
.ss-rowMenuButton {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--dsw-radius-md, 10px);
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #818b98);
  font: inherit;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: background 120ms ease, color 120ms ease, opacity 120ms ease;
}
.ss-row:hover .ss-rowMenuButton,
.ss-row:focus-within .ss-rowMenuButton,
.ss-rowMenuOpen .ss-rowMenuButton {
  opacity: 1;
}
.ss-rowMenuButton:hover:not(:disabled) {
  color: var(--dsw-alias-label-primary, #1f2328);
  background: var(--dsw-alias-interactive-bg-hover, #e9ebee);
}
.ss-rowMenuButton:focus-visible {
  opacity: 1;
  outline: var(--dsw-focus-ring-width, 2px) solid
    var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #3b82f6));
  outline-offset: 1px;
}
.ss-rowMenuButton:disabled {
  cursor: default;
  opacity: 0.35;
}
.ss-rowMenu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 20;
  min-width: 136px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border: 0.5px solid var(--dsw-alias-border-l4, rgba(128, 128, 128, 0.35));
  border-radius: var(--dsw-radius-md, 10px);
  background: var(--dsw-alias-bg-layer-2, #fff);
  box-shadow: var(--dsw-elevation-prominent, 0 10px 28px rgba(0, 0, 0, 0.16));
}
.ss-rowMenu button {
  box-sizing: border-box;
  width: 100%;
  padding: 6px 9px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-primary, #1f2328);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  text-align: left;
  cursor: pointer;
}
.ss-rowMenu button:hover:not(:disabled),
.ss-rowMenu button:focus-visible {
  background: var(--dsw-alias-interactive-bg-hover, #e9ebee);
  outline: none;
}
.ss-rowMenu button:disabled {
  cursor: default;
  opacity: 0.5;
}
.ss-rowMenuDanger {
  color: var(--dsw-alias-state-error-primary, #d1242f) !important;
}
.ss-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.ss-statusDot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.55;
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
.ss-panelHint {
  margin: 18px 0 0;
  color: var(--dsw-alias-label-tertiary, #818b98);
  font-size: 12px;
  line-height: 20px;
}
.ss-fieldLabel {
  display: block;
  margin: 12px 0 6px;
  color: var(--dsw-alias-label-secondary, #59636e);
  font-size: 12px;
  line-height: 18px;
}
.ss-error {
  margin-top: 16px;
  padding: 8px 10px;
  border-radius: var(--dsw-radius-sm, 8px);
  color: var(--dsw-alias-state-error-primary, #d1242f);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #d1242f) 10%, transparent);
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
  background: var(--dsw-alias-bg-mask-1, rgba(0, 0, 0, 0.28));
  padding: 24px;
}
.ss-dialog {
  width: 100%;
  max-width: 440px;
  max-height: calc(100vh - 48px);
  overflow: auto;
  box-sizing: border-box;
  border-radius: var(--dsw-radius-lg, 14px);
  border: 0.5px solid var(--dsw-alias-border-l4, rgba(128, 128, 128, 0.35));
  background: var(--dsw-alias-bg-layer-2, #fff);
  padding: 20px;
  box-shadow: var(--dsw-elevation-prominent, 0 18px 48px rgba(0, 0, 0, 0.22));
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
.ss-batchWarning {
  margin: 0 0 10px;
  color: var(--dsw-alias-label-primary, #1f2328);
  font-size: 12px;
  line-height: 18px;
  font-weight: 600;
}
.ss-batchDirs {
  margin: 0 0 10px;
  color: var(--dsw-alias-label-tertiary, #818b98);
  font-size: 12px;
  line-height: 18px;
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
.ss-launcher {
  box-sizing: border-box;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: var(--dsw-alias-label-primary, #1f2328);
}
.ss-launcherCard {
  box-sizing: border-box;
  width: 100%;
  max-width: 430px;
  padding: 30px 28px;
  text-align: center;
  border: 0.5px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.22));
  border-radius: var(--dsw-radius-lg, 14px);
  background: var(--dsw-alias-bg-layer-1, transparent);
}
.ss-launcherSpinner {
  width: 22px;
  height: 22px;
  margin: 0 auto 14px;
  border-radius: 50%;
  border: 2px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.25));
  border-top-color: var(--dsw-alias-state-business-primary, #2563eb);
  animation: ss-spin 900ms linear infinite;
}
@keyframes ss-spin {
  to { transform: rotate(360deg); }
}
.ss-launcherTitle {
  margin: 0;
  font-size: 15px;
  line-height: 22px;
  font-weight: 600;
}
.ss-launcherHint {
  margin: 6px 0 0;
  color: var(--dsw-alias-label-secondary, #59636e);
  font-size: 13px;
  line-height: 20px;
}
.ss-launcherActions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 18px;
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
  font-size: 10px;
  line-height: 1;
  font-weight: 700;
  color: var(--dsw-alias-state-business-primary, #1f4f8f);
  background: var(--dsw-alias-button-ghost-active-fill, transparent);
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
  background: var(--dsw-alias-toast-bg, var(--dsw-alias-bg-layer-2));
  color: var(--dsw-alias-toast-label, var(--dsw-alias-label-primary));
  box-shadow: var(--dsw-elevation-prominent, 0 12px 32px rgba(0, 0, 0, 0.18));
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
@media (hover: none) {
  .ss-rowMenuButton { opacity: 1; }
}
@media (max-width: 640px) {
  .ss-panel { padding: 20px 14px 40px; }
  .ss-row { flex-wrap: nowrap; gap: 10px; }
  .ss-headerActions { flex-basis: 176px; width: 176px; }
}
/* Manager refresh: quiet native list, single content axis, theme-token surfaces. */
.ss-panel {
  --ss-bg: var(--dsw-specific-main-fill, transparent);
  --ss-fg: var(--dsw-alias-label-primary, #20242c);
  --ss-secondary: var(--dsw-alias-label-secondary, #626b78);
  --ss-tertiary: var(--dsw-alias-label-tertiary, #818b98);
  --ss-line: var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.22));
  --ss-hover: var(--dsw-alias-interactive-bg-hover, #f3f5f8);
  --ss-business: var(--dsw-alias-state-business-primary, #3266db);
  --ss-primary: var(--dsw-alias-button-primary-fill, var(--dsw-alias-state-business-primary));
  --ss-on-primary: var(--dsw-alias-label-primary-foreground, #fff);
  --ss-error: var(--dsw-alias-state-error-primary, #bd2737);
  --ss-focus: var(--dsw-focus-ring-color, var(--ss-business));
  --ss-selected: color-mix(in srgb, var(--ss-business) 8%, var(--ss-bg));
  container: ss-manager / inline-size;
  padding: 0;
  color: var(--ss-fg);
  background: var(--ss-bg);
}
.ss-panel .ss-shell {
  box-sizing: border-box;
  min-width: 0;
  max-width: 920px;
  padding: 32px 32px 48px;
}
.ss-panel .ss-header {
  min-height: 0;
  margin: 0;
  gap: 16px;
  flex-wrap: wrap;
}
.ss-panel .ss-headerMain {
  flex: 1 1 240px;
  min-width: 0;
}
.ss-panel .ss-titleRow {
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
}
.ss-panel .ss-title {
  font-size: 24px;
  line-height: 32px;
  font-weight: 600;
}
.ss-panel .ss-count,
.ss-panel .ss-countInline {
  margin: 0;
  align-self: auto;
  font-size: 12px;
  line-height: 18px;
  color: var(--ss-secondary);
  font-variant-numeric: tabular-nums;
}
.ss-panel .ss-statusLine {
  margin: 6px 0 0;
  color: var(--ss-secondary);
  font-size: 13px;
  line-height: 20px;
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
}
.ss-panel .ss-headerActions {
  flex: 0 0 auto;
  width: auto;
  height: auto;
  align-items: center;
  flex-wrap: wrap;
}
.ss-panel .ss-button {
  min-height: 36px;
  padding: 7px 12px;
  border: 1px solid var(--ss-line);
  border-radius: 8px;
  color: var(--ss-fg);
  background: transparent;
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
}
.ss-panel .ss-button:hover:not(:disabled) {
  background: var(--ss-hover);
}
.ss-panel .ss-buttonPrimary {
  color: var(--ss-on-primary);
  background: var(--ss-primary);
  border-color: var(--ss-primary);
}
.ss-panel .ss-buttonPrimary:hover:not(:disabled) {
  background: var(--dsw-alias-button-primary-hover, var(--ss-primary));
}
.ss-panel .ss-buttonQuiet {
  border-color: transparent;
  color: var(--ss-secondary);
}
.ss-panel .ss-buttonDanger {
  color: var(--ss-error);
  border-color: var(--ss-line);
  background: transparent;
}
.ss-panel .ss-button:disabled {
  opacity: 0.5;
  cursor: default;
}
.ss-panel .ss-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}
.ss-panel .ss-search {
  display: flex;
  align-items: center;
  flex: 1 1 0;
  gap: 8px;
  min-width: 0;
  min-height: 36px;
  padding-inline: 12px;
  border: 1px solid var(--ss-line);
  border-radius: 8px;
  background: transparent;
  color: var(--ss-fg);
}
.ss-panel .ss-search:focus-within {
  border-color: var(--ss-business);
  outline: 2px solid var(--ss-focus);
  outline-offset: 2px;
}
.ss-panel .ss-searchIcon {
  flex: none;
  color: var(--ss-secondary);
}
.ss-panel .ss-search input {
  flex: 1 1 auto;
  min-width: 0;
  width: 100%;
  padding: 7px 0;
  border: 0;
  outline: none;
  color: var(--ss-fg);
  background: transparent;
  font: inherit;
  font-size: 13px;
  line-height: 20px;
}
.ss-panel .ss-search input::-webkit-search-cancel-button {
  display: none;
}
.ss-panel .ss-search input::placeholder {
  color: var(--ss-secondary);
  opacity: 1;
}
.ss-panel .ss-clearSearch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 32px;
  height: 32px;
  margin-inline-end: -6px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  color: var(--ss-secondary);
  background: transparent;
  cursor: pointer;
}
.ss-panel .ss-clearSearch:hover {
  color: var(--ss-fg);
  background: var(--ss-hover);
}
.ss-panel .ss-batchManage {
  flex: none;
}
.ss-panel .ss-searchCount {
  margin: 12px 0 0;
  color: var(--ss-secondary);
  font-size: 12px;
  line-height: 18px;
}
.ss-panel .ss-batchToolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  min-height: 40px;
  margin-top: 12px;
  color: var(--ss-secondary);
  font-size: 13px;
  line-height: 20px;
}
.ss-panel .ss-batchToolbar .ss-selectAll {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--ss-fg);
}
.ss-panel .ss-batchCount {
  color: var(--ss-secondary);
  font-variant-numeric: tabular-nums;
}
.ss-panel .ss-archiveSelected {
  margin-inline-start: auto;
}
.ss-panel .ss-feedback {
  margin-top: 16px;
  font-size: 13px;
  line-height: 20px;
  overflow-wrap: anywhere;
}
.ss-panel .ss-feedbackError {
  color: var(--ss-error);
}
.ss-panel .ss-group {
  margin-top: 24px;
}
.ss-panel .ss-groupTitle {
  margin: 0 0 8px;
  color: var(--ss-secondary);
  font-size: 12px;
  line-height: 18px;
  font-weight: 500;
}
.ss-panel .ss-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}
.ss-panel .ss-row {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) 32px;
  column-gap: 12px;
  align-items: center;
  min-height: 64px;
  height: auto;
  padding: 0 4px;
  border: 0;
  border-bottom: 1px solid var(--ss-line);
  border-radius: 8px;
  background: transparent;
  cursor: default;
  transition: background-color 120ms ease;
}
.ss-panel .ss-row:last-child {
  border-bottom-color: transparent;
}
.ss-panel .ss-row:hover,
.ss-panel .ss-row:focus-within {
  background: var(--ss-hover);
}
.ss-panel .ss-rowSelected,
.ss-panel .ss-rowSelected:hover,
.ss-panel .ss-rowSelected:focus-within {
  background: var(--ss-selected);
}
.ss-panel .ss-rowLead {
  width: 18px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ss-secondary);
}
.ss-panel .ss-check {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 20px;
  height: 20px;
  flex: none;
  cursor: pointer;
}
.ss-panel .ss-checkInput {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}
.ss-panel .ss-checkBox {
  box-sizing: border-box;
  display: grid;
  place-items: center;
  width: 14px;
  height: 14px;
  color: var(--dsw-alias-label-primary-foreground, #fff);
  background: transparent;
  border: 0.5px solid var(--dsw-alias-border-l4, rgba(128, 128, 128, 0.35));
  border-radius: var(--dsw-radius-xs, 4px);
  transition: background-color 120ms ease, border-color 120ms ease;
}
.ss-panel .ss-checkBox svg {
  display: block;
  visibility: hidden;
}
.ss-panel .ss-check:hover .ss-checkBox {
  border-color: var(--dsw-alias-border-l4, rgba(128, 128, 128, 0.45));
}
.ss-panel .ss-checkInput:checked + .ss-checkBox,
.ss-panel .ss-checkInput:indeterminate + .ss-checkBox {
  color: var(--dsw-alias-label-primary-foreground, #fff);
  background: var(--dsw-alias-label-primary, #20242c);
  border-color: var(--dsw-alias-label-primary, #20242c);
}
.ss-panel .ss-checkInput:checked + .ss-checkBox svg {
  visibility: visible;
}
.ss-panel .ss-checkInput:indeterminate + .ss-checkBox svg {
  visibility: hidden;
}
.ss-panel .ss-checkInput:indeterminate + .ss-checkBox::after {
  content: '';
  width: 7px;
  height: 1.5px;
  border-radius: 1px;
  background: currentColor;
}
.ss-panel .ss-checkInput:focus-visible + .ss-checkBox {
  outline: 2px solid var(--ss-focus);
  outline-offset: 2px;
}
.ss-panel .ss-checkInput:disabled {
  cursor: default;
}
.ss-panel .ss-checkInput:disabled + .ss-checkBox {
  opacity: 0.5;
}
.ss-panel .ss-rowLead .ss-check {
  width: 18px;
  height: 18px;
}
.ss-panel .ss-rowMain {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 0;
  grid-column: 2;
  width: 100%;
  min-width: 0;
  padding: 12px 0;
  border: 0;
  border-radius: 8px;
  color: inherit;
  background: transparent;
  text-align: start;
  cursor: pointer;
}
.ss-panel .ss-rowMain:disabled {
  cursor: default;
}
.ss-panel .ss-rowTitleRow {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
}
.ss-panel .ss-rowTitle {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ss-fg);
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
}
.ss-panel .ss-rowTime {
  flex: none;
  color: var(--ss-secondary);
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.ss-panel .ss-rowMeta {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 18px;
  margin-top: 2px;
  overflow: hidden;
  color: var(--ss-secondary);
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
  flex-wrap: nowrap;
}
.ss-panel .ss-stateRunning {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ss-business);
  font-weight: 500;
}
.ss-panel .ss-stateRunning::before {
  content: '';
  width: 6px;
  height: 6px;
  flex: none;
  border-radius: 50%;
  background: currentColor;
}
.ss-panel .ss-stateBlank {
  color: var(--ss-secondary);
  font-weight: 400;
}
.ss-panel .ss-rowTimeCompact,
.ss-panel .ss-metaSeparator {
  display: none;
}
.ss-panel .ss-rowActions {
  grid-column: 3;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.ss-panel .ss-rowMenuButton {
  width: 32px;
  height: 32px;
  min-height: 32px;
  opacity: 1;
  border-radius: 8px;
  color: var(--ss-secondary);
}
.ss-panel .ss-rowMenuButton:hover:not(:disabled),
.ss-panel .ss-rowMenuButton:focus-visible {
  color: var(--ss-fg);
  background: var(--ss-hover);
}
.ss-panel .ss-rowMenu {
  min-width: 160px;
  padding: 4px;
  border-radius: 10px;
  border: 1px solid var(--ss-line);
  background: var(--dsw-alias-bg-layer-2, #fff);
  box-shadow: var(--dsw-elevation-prominent, 0 10px 28px rgba(0, 0, 0, 0.16));
}
.ss-panel .ss-rowMenu button {
  min-height: 32px;
  padding: 6px 10px;
  font-size: 13px;
  line-height: 20px;
}
.ss-panel .ss-empty {
  margin-top: 0;
  padding: 48px 16px;
  border: 0;
  border-radius: 0;
  background: transparent;
  text-align: center;
}
.ss-panel .ss-emptyTitle {
  margin: 0;
  color: var(--ss-fg);
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
}
.ss-panel .ss-emptyHint {
  max-width: 360px;
  margin: 8px auto 0;
  color: var(--ss-secondary);
  font-size: 13px;
  line-height: 20px;
}
.ss-panel .ss-emptyAction {
  margin-top: 20px;
}
.ss-panel .ss-emptySearch {
  padding-top: 32px;
}
.ss-panel .ss-panelHint {
  margin: 24px 0 0;
  color: var(--ss-tertiary);
  font-size: 12px;
  line-height: 18px;
}
.ss-panel .ss-skeleton {
  margin-top: 24px;
}
.ss-panel .ss-skeletonRow {
  display: flex;
  align-items: center;
  min-height: 64px;
  gap: 12px;
  border-bottom: 1px solid var(--ss-line);
}
.ss-panel .ss-skeletonIcon {
  width: 18px;
  height: 18px;
  flex: none;
  border-radius: 5px;
  background: var(--ss-hover);
}
.ss-panel .ss-skeletonCopy {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 6px;
}
.ss-panel .ss-skeletonLine {
  width: 46%;
  height: 10px;
  border-radius: 4px;
  background: var(--ss-hover);
}
.ss-panel .ss-skeletonLineShort {
  width: 24%;
  height: 8px;
}
.ss-panel .ss-dialog {
  max-width: 440px;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid var(--ss-line);
  background: var(--dsw-alias-bg-layer-2, #fff);
  box-shadow: var(--dsw-elevation-prominent, 0 18px 48px rgba(0, 0, 0, 0.22));
}
.ss-panel .ss-dialogBody {
  margin: 0 0 12px;
  color: var(--ss-secondary);
  font-size: 13px;
  line-height: 20px;
}
.ss-panel .ss-dialogMuted {
  color: var(--ss-tertiary);
}
.ss-panel .ss-dialogFooter {
  margin-top: 24px;
}
.ss-panel .ss-error {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--ss-error);
  background: color-mix(in srgb, var(--ss-error) 9%, transparent);
  font-size: 13px;
  line-height: 20px;
  overflow-wrap: anywhere;
}
.ss-panel .ss-batchWarning {
  margin: 0 0 10px;
  padding: 8px 10px;
  border-radius: 8px;
  color: var(--ss-fg);
  background: color-mix(in srgb, var(--ss-error) 7%, transparent);
  font-size: 12px;
  line-height: 18px;
  font-weight: 500;
}
@container ss-manager (width < 640px) {
  .ss-panel .ss-shell {
    padding: 24px 16px 32px;
  }
  .ss-panel .ss-tools {
    margin-top: 20px;
  }
  .ss-panel .ss-row {
    grid-template-columns: 18px minmax(0, 1fr) 32px;
  }
  .ss-panel .ss-rowTime {
    display: none;
  }
  .ss-panel .ss-rowTimeCompact,
  .ss-panel .ss-metaSeparator {
    display: inline;
  }
  .ss-panel .ss-group {
    margin-top: 20px;
  }
  .ss-panel .ss-panelHint {
    margin-top: 20px;
  }
}
@container ss-manager (width < 480px) {
  .ss-panel .ss-tools {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .ss-panel .ss-search {
    flex-basis: 100%;
  }
  .ss-panel .ss-headerActions {
    width: 100%;
    justify-content: flex-start;
  }
  .ss-panel .ss-archiveSelected {
    margin-inline-start: 0;
  }
}
@media (pointer: coarse) {
  .ss-panel .ss-button,
  .ss-panel .ss-search {
    min-height: 44px;
  }
  .ss-panel .ss-row {
    grid-template-columns: 18px minmax(0, 1fr) 44px;
  }
  .ss-panel .ss-rowActions,
  .ss-panel .ss-rowMenuButton {
    width: 44px;
    height: 44px;
  }
  .ss-panel .ss-search input {
    font-size: 16px;
  }
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
