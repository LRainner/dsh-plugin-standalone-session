/**
 * The three manager dialogs: rename, single archive and batch archive.
 *
 * Each one renders the shared native `<Dialog>` and closes it through
 * `dialog.close()` so the browser can return focus to the invoker. The
 * confirmation dialogs put initial focus on the safe action; the rename field
 * is a real form so Enter submits natively and IME composition is handled by
 * the browser instead of a keydown workaround.
 */
import { useId, useRef, useState, type ReactElement } from 'react'
import type { SessionRow, Translate } from './dsh.js'
import { messageOf } from './actions.js'
import { Dialog } from './dialog.js'

interface BaseDialogProps {
  readonly t: Translate
  readonly onClose: () => void
  readonly closeBlockedHint: string
}

/** Field error id shared by the label and the error message. */
export function RenameDialog({
  row,
  t,
  onClose,
  closeBlockedHint,
  onSave,
}: BaseDialogProps & {
  readonly row: SessionRow
  readonly onSave: (title: string) => Promise<void>
}): ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const formId = useId()
  const errorId = useId()
  const [value, setValue] = useState(row.title?.trim() ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (): Promise<void> => {
    const title = value.trim()
    if (title === '') {
      setError(t('panel.titleRequired'))
      return
    }
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await onSave(title)
      dialogRef.current?.close('saved')
    } catch (reason) {
      setError(messageOf(reason))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      title={t('panel.renameTitle')}
      busy={busy}
      dialogRef={dialogRef}
      onClose={onClose}
      closeBlockedHint={closeBlockedHint}
      footer={
        <>
          <button
            type="button"
            className="ss-button ss-buttonQuiet"
            disabled={busy}
            onClick={() => dialogRef.current?.close('cancel')}
          >
            {t('panel.cancel')}
          </button>
          <button
            type="submit"
            form={formId}
            className="ss-button ss-buttonPrimary"
            disabled={busy}
          >
            {busy ? t('panel.saving') : t('panel.save')}
          </button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <label className="ss-fieldLabel" htmlFor={`${formId}-title`}>
          {t('panel.renameLabel')}
        </label>
        <input
          id={`${formId}-title`}
          className="ss-input"
          value={value}
          maxLength={200}
          autoFocus
          data-dialog-initial-focus=""
          aria-invalid={error !== null}
          aria-describedby={error !== null ? errorId : undefined}
          onChange={(event) => {
            setValue(event.target.value)
            if (error !== null) setError(null)
          }}
        />
        {error !== null ? (
          <p className="ss-error" id={errorId} role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  )
}

/** Confirm archiving one session; running sessions warn about stopping work. */
export function ArchiveDialog({
  row,
  t,
  onClose,
  onConfirm,
  closeBlockedHint,
}: BaseDialogProps & {
  readonly row: SessionRow
  readonly onConfirm: () => Promise<void>
}): ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirm = async (): Promise<void> => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
      dialogRef.current?.close('confirm')
    } catch (reason) {
      setError(messageOf(reason))
      setBusy(false)
    }
  }

  return (
    <Dialog
      title={row.running ? t('panel.archiveRunningTitle') : t('panel.archiveTitle')}
      description={row.running ? t('panel.archiveRunningBody') : t('panel.archiveBody')}
      busy={busy}
      dialogRef={dialogRef}
      onClose={onClose}
      closeBlockedHint={closeBlockedHint}
      footer={
        <>
          <button
            type="button"
            className="ss-button ss-buttonQuiet"
            autoFocus
            data-dialog-initial-focus=""
            disabled={busy}
            onClick={() => dialogRef.current?.close('cancel')}
          >
            {t('panel.cancel')}
          </button>
          <button
            type="button"
            className={`ss-button ${row.running ? 'ss-buttonDanger' : 'ss-buttonPrimary'}`}
            disabled={busy}
            onClick={() => {
              void confirm()
            }}
          >
            {row.running ? t('panel.stopAndArchive') : t('panel.archiveConfirm')}
          </button>
        </>
      }
    >
      {row.blank ? <p className="ss-dialogBody ss-dialogMuted">{t('panel.archiveDirs')}</p> : null}
      {error !== null ? (
        <p className="ss-error" role="alert">
          {error}
        </p>
      ) : null}
    </Dialog>
  )
}

/** Confirm archiving a frozen snapshot of the current selection. */
export function BatchArchiveDialog({
  targets,
  t,
  progress,
  onClose,
  onConfirm,
  closeBlockedHint,
}: BaseDialogProps & {
  readonly targets: readonly SessionRow[]
  readonly progress: { readonly done: number; readonly total: number } | null
  readonly onConfirm: () => Promise<void>
}): ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const busy = submitting || progress !== null
  const running = targets.filter((row) => row.running).length
  const hasBlank = targets.some((row) => row.blank)

  const confirm = async (): Promise<void> => {
    if (busy) return
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm()
      dialogRef.current?.close('confirm')
    } catch (reason) {
      setError(messageOf(reason))
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      title={t('panel.batchArchiveTitle', { n: targets.length })}
      description={t('panel.batchArchiveBody', { n: targets.length })}
      busy={busy}
      dialogRef={dialogRef}
      onClose={onClose}
      closeBlockedHint={closeBlockedHint}
      footer={
        <>
          <button
            type="button"
            className="ss-button ss-buttonQuiet"
            autoFocus
            data-dialog-initial-focus=""
            disabled={busy}
            onClick={() => dialogRef.current?.close('cancel')}
          >
            {t('panel.cancel')}
          </button>
          <button
            type="button"
            className={`ss-button ${running > 0 ? 'ss-buttonDanger' : 'ss-buttonPrimary'}`}
            disabled={busy}
            aria-busy={progress !== null}
            onClick={() => {
              void confirm()
            }}
          >
            {progress !== null
              ? t('panel.batchDeleting', { done: progress.done, total: progress.total })
              : running > 0
                ? t('panel.batchStopArchive')
                : t('panel.batchArchiveConfirm', { n: targets.length })}
          </button>
        </>
      }
    >
      {running > 0 ? (
        <p className="ss-batchWarning">{t('panel.batchArchiveRunning', { n: running })}</p>
      ) : null}
      {hasBlank ? <p className="ss-batchDirs">{t('panel.archiveDirs')}</p> : null}
      {error !== null ? (
        <p className="ss-error" role="alert">
          {error}
        </p>
      ) : null}
    </Dialog>
  )
}
