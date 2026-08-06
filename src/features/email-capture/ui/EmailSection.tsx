import { useState, type FormEvent } from 'react'

import './email-capture.css'

const CURTAIN_LEFT_URL = 'https://images.unsplash.com/photo-1560972550-aba3456b5564?w=1920&q=80'
const CURTAIN_RIGHT_URL = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80'

interface AudienceFormProps {
  side: 'left' | 'right'
  label: string
  placeholder: string
}

function AudienceForm({ side, label, placeholder }: AudienceFormProps) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email) return
    setSubmitted(true)
  }

  const inputId = `email-input-${side}`
  const copyId = `email-form-copy-${side}`

  return (
    <form className="email-curtain-form" onSubmit={handleSubmit}>
      <span className="email-curtain-label">{label}</span>
      {submitted ? (
        <p className="email-form-success" role="status">
          Thanks. We will be in touch soon.
        </p>
      ) : (
        <div className="email-form-row">
          <label className="sr-only" htmlFor={inputId}>
            Email address
          </label>
          <input
            id={inputId}
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-describedby={copyId}
            placeholder={placeholder}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button type="submit" aria-label={`Join as ${label}`}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
    </form>
  )
}

/**
 * Full-bleed split section: left/right curtains reveal an audience-specific
 * email capture on hover, sliding from their respective edge.
 */
export function EmailSection() {
  return (
    <section id="stay-updated" className="email-section">
      <div
        className="email-curtain email-curtain-left"
        style={{ backgroundImage: `url(${CURTAIN_LEFT_URL})` }}
      >
        <AudienceForm side="left" label="For Investors" placeholder="Enter email address" />
      </div>
      <div
        className="email-curtain email-curtain-right"
        style={{ backgroundImage: `url(${CURTAIN_RIGHT_URL})` }}
      >
        <AudienceForm side="right" label="For Warung Owners" placeholder="Enter email address" />
      </div>
    </section>
  )
}
