import { AlertDialog, Button } from '@heroui/react'
import type { ReactNode } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: ReactNode
  confirmLabel: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
  isBusy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmDialog = ({ isOpen, title, description, confirmLabel, cancelLabel = 'Cancel', tone = 'danger', isBusy = false, onConfirm, onCancel }: ConfirmDialogProps) => {
  if (!isOpen) return null
  return (
    <AlertDialog.Root isOpen onOpenChange={(open) => !open && !isBusy && onCancel()}>
      <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4" />
      <AlertDialog.Container className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <AlertDialog.Dialog className="adm-dialog dark" data-theme="dark">
          <AlertDialog.Header className="adm-dialog__header">
            <AlertDialog.Icon status={tone === 'danger' ? 'danger' : 'warning'} className="shrink-0" />
            <AlertDialog.Heading className="adm-dialog__title">{title}</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body className="adm-dialog__body">{description}</AlertDialog.Body>
          <AlertDialog.Footer className="adm-dialog__footer">
            <Button type="button" size="sm" variant="outline" isDisabled={isBusy} onClick={onCancel}>{cancelLabel}</Button>
            <Button type="button" size="sm" variant={tone === 'danger' ? 'danger' : 'primary'} isPending={isBusy} onClick={onConfirm}>{confirmLabel}</Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Root>
  )
}

export default ConfirmDialog
