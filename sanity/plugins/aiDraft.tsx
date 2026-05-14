import { definePlugin } from 'sanity'
import { useFormValue } from 'sanity'
import React, { useState } from 'react'
import { set } from 'sanity'

export const aiDraftPlugin = definePlugin({
  name: 'ai-draft',
})

export function withAiDraft(fieldConfig: any) {
  return {
    ...fieldConfig,
    components: {
      input: AiDraftInput,
    },
  }
}

function AiDraftInput(props: any) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const documentType = useFormValue(['_type']) as string
  const documentTitle = (useFormValue(['title']) as string) || (useFormValue(['name']) as string) || ''

  async function handleDraft() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldName: props.id,
          currentValue: props.value ?? '',
          documentType,
          documentTitle,
        }),
      })
      if (!res.ok) { setError('AI draft failed. Try again.'); return }
      const data = await res.json()
      if (data.draft && props.onChange) {
        props.onChange(set(data.draft))
      }
    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {props.renderDefault(props)}
      {error && <p style={{ color: '#c0392b', fontSize: 12, marginTop: 4 }}>{error}</p>}
      <button
        type="button"
        onClick={handleDraft}
        disabled={loading}
        style={{
          marginTop: 6,
          padding: '4px 12px',
          fontSize: 12,
          background: loading ? '#ccc' : '#000',
          color: '#fff',
          border: 'none',
          borderRadius: 20,
          cursor: loading ? 'default' : 'pointer',
        }}
      >
        {loading ? 'Drafting…' : '✦ Draft with AI'}
      </button>
    </div>
  )
}
