'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type IngredientSection = {
  label: string
  items: string[]
}

export default function NewRecipePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [instructions, setInstructions] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [sections, setSections] = useState<IngredientSection[]>([
    { label: '', items: [''] }
  ])

  const addSection = () => setSections(s => [...s, { label: '', items: [''] }])

  const updateSectionLabel = (i: number, label: string) => {
    setSections(s => s.map((sec, idx) => idx === i ? { ...sec, label } : sec))
  }

  const updateItem = (si: number, ii: number, value: string) => {
    setSections(s => s.map((sec, idx) => idx === si
      ? { ...sec, items: sec.items.map((item, jdx) => jdx === ii ? value : item) }
      : sec
    ))
  }

  const addItem = (si: number) => {
    setSections(s => s.map((sec, idx) => idx === si
      ? { ...sec, items: [...sec.items, ''] }
      : sec
    ))
  }

  const removeItem = (si: number, ii: number) => {
    setSections(s => s.map((sec, idx) => idx === si
      ? { ...sec, items: sec.items.filter((_, jdx) => jdx !== ii) }
      : sec
    ))
  }

  const removeSection = (i: number) => {
    setSections(s => s.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const ingredientSections = sections
      .map(s => ({ label: s.label || null, items: s.items.filter(Boolean) }))
      .filter(s => s.items.length > 0)

    const instructionList = instructions
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)

    const filename = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.txt'

    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        filename,
        ingredientSections,
        instructions: instructionList,
        tags: [],
        isFavorite,
      }),
    })

    if (res.ok) {
      const recipe = await res.json()
      router.push(`/recipes/${recipe.id}`)
    } else {
      setSaving(false)
      alert('Failed to save recipe')
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius)',
    fontSize: '0.9rem',
    background: 'var(--bg)',
    outline: 'none',
    color: 'var(--text)',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
    marginBottom: '6px',
  }

  return (
    <main style={{ padding: '48px 0 80px' }}>
      <div className="container" style={{ maxWidth: '680px' }}>
        <a href="/recipes" style={{
          display: 'inline-block',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          marginBottom: '32px',
        }}>
          ← Back to recipes
        </a>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '32px', letterSpacing: '-0.02em' }}>
          Add New Recipe
        </h1>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Recipe Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g. Chocolate Lava Cake"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Ingredients */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Ingredients</label>
            {sections.map((section, si) => (
              <div key={si} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '16px',
                marginBottom: '12px',
              }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={section.label}
                    onChange={e => updateSectionLabel(si, e.target.value)}
                    placeholder="Section label (optional, e.g. For the filling)"
                    style={{ ...inputStyle, flex: 1, fontSize: '0.85rem' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(si)}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '1rem',
                        padding: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
                {section.items.map((item, ii) => (
                  <div key={ii} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <input
                      type="text"
                      value={item}
                      onChange={e => updateItem(si, ii, e.target.value)}
                      placeholder="e.g. 2 cups flour"
                      style={{ ...inputStyle, flex: 1, fontSize: '0.875rem' }}
                      onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                    />
                    {section.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(si, ii)}
                        style={{
                          border: 'none',
                          background: 'none',
                          color: 'var(--text-muted)',
                          fontSize: '1rem',
                          padding: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addItem(si)}
                  style={{
                    marginTop: '4px',
                    border: 'none',
                    background: 'none',
                    color: 'var(--accent)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  + Add ingredient
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addSection}
              style={{
                border: '1px dashed var(--border)',
                background: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                fontWeight: 500,
                padding: '8px 14px',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              + Add ingredient section
            </button>
          </div>

          {/* Instructions */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Instructions</label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              One step per line
            </p>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              required
              rows={10}
              placeholder={`Preheat oven to 350°F.\nMix dry ingredients together.\nAdd wet ingredients and stir until combined.`}
              style={{
                ...inputStyle,
                resize: 'vertical',
                lineHeight: 1.6,
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Favorite */}
          <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="favorite"
              checked={isFavorite}
              onChange={e => setIsFavorite(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
            />
            <label htmlFor="favorite" style={{ fontSize: '0.9rem', color: 'var(--text)', cursor: 'pointer' }}>
              Mark as favorite
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            style={{
              background: saving ? 'var(--text-muted)' : 'var(--accent)',
              color: 'white',
              border: 'none',
              padding: '12px 28px',
              borderRadius: 'var(--radius)',
              fontSize: '0.95rem',
              fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {saving ? 'Saving...' : 'Save Recipe'}
          </button>
        </form>
      </div>
    </main>
  )
}
