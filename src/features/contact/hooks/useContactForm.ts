import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  getEmailConfig,
  sendContactEmail as deliverContactEmail,
  type EmailJsConfig,
} from '../services/emailService'

type ContactFormDependencies = {
  config?: EmailJsConfig | null
  sendEmail?: typeof deliverContactEmail
}

export const useContactForm = ({
  config = getEmailConfig(import.meta.env),
  sendEmail = deliverContactEmail,
}: ContactFormDependencies = {}) => {
  const form = useRef<HTMLFormElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (successTimer.current) clearTimeout(successTimer.current)
  }, [])

  const clearSubmitStatus = () => setSubmitStatus(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    const currentForm = form.current
    if (!config || !currentForm) {
      console.error('EmailJS environment variables missing')
      setIsSubmitting(false)
      setSubmitStatus('error')
      return
    }

    try {
      await sendEmail(currentForm, config)
      setSubmitStatus('success')
      setIsSubmitting(false)
      currentForm.reset()
      successTimer.current = setTimeout(() => {
        setSubmitStatus(null)
        successTimer.current = null
      }, 5000)
    } catch (error) {
      console.error('FAILED...', error)
      setSubmitStatus('error')
      setIsSubmitting(false)
    }
  }

  return {
    form,
    isSubmitting,
    submitStatus,
    clearSubmitStatus,
    handleSubmit,
  }
}
