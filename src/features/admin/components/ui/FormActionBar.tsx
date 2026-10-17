import { Button } from '@heroui/react'
import type { ReactNode } from 'react'

interface FormActionBarProps {
  isDirty: boolean
  isSaving: boolean
  saveLabel: string
  /** Optional extra controls (e.g. a Cancel link) rendered before the save button. */
  children?: ReactNode
  /** Use when the save button is not a form submit. */
  onSave?: () => void
}

// Sticky footer for edit forms: shows whether there is anything to save and holds the single save button.
const FormActionBar = ({ isDirty, isSaving, saveLabel, children, onSave }: FormActionBarProps) => (
  <div className="adm-action-bar" role="group" aria-label="Form actions">
    <p className={`adm-action-bar__status${isDirty ? ' is-dirty' : ''}`} role="status">
      {isSaving ? 'Saving…' : isDirty ? 'You have unsaved changes' : 'All changes saved'}
    </p>
    <div className="adm-action-bar__buttons">
      {children}
      <Button
        type={onSave ? 'button' : 'submit'}
        variant="primary"
        className="admin-button"
        isPending={isSaving}
        isDisabled={!isDirty && !isSaving}
        onClick={onSave}
      >
        {saveLabel}
      </Button>
    </div>
  </div>
)

export default FormActionBar
