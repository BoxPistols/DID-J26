/**
 * Confirm Dialog Component
 */

import { useEffect, useState, useCallback } from 'react'
import {
  subscribeToDialogs,
  confirmDialog,
  cancelDialog,
  type ConfirmDialog
} from '../utils/dialog'
import styles from './Dialog.module.css'

export function DialogContainer() {
  const [dialogs, setDialogs] = useState<ConfirmDialog[]>([])

  // ESCキーで最前面のダイアログをキャンセル
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dialogs.length > 0) {
        const topDialog = dialogs[dialogs.length - 1]
        cancelDialog(topDialog.id)
      }
    },
    [dialogs]
  )

  useEffect(() => {
    const unsubscribe = subscribeToDialogs(setDialogs)
    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (dialogs.length > 0) {
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }
  }, [dialogs.length, handleEscape])

  return (
    <>
      {dialogs.map((dialog) => (
        <div
          key={dialog.id}
          className={styles.overlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              cancelDialog(dialog.id)
            }
          }}
        >
          <div className={styles.dialog}>
            <h2 className={styles.title}>{dialog.title}</h2>
            <p className={styles.message}>{dialog.message}</p>
            <div className={styles.buttonContainer}>
              <button
                onClick={() => cancelDialog(dialog.id)}
                className={styles.cancelButton}
                aria-label={`${dialog.cancelText || 'キャンセル'} (Escキーでも閉じられます)`}
              >
                {dialog.cancelText || 'キャンセル'}
                <span className={styles.tooltip}>Esc</span>
              </button>
              <button
                onClick={() => confirmDialog(dialog.id)}
                className={styles.confirmButton}
              >
                {dialog.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
