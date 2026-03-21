'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type IngredientSection = {
  label: string
  items: string[]
}

type Recipe = {
  id: number
  name: string
  tags: string[]
  isFavorite: boolean
  ingredientSections: IngredientSection[]
  instructions: string[]
}

const ALL_TAGS = [
  'cake', 'cookies', 'bread', 'pastry', 'chocolate', 'lemon',
  'chicken', 'beef', 'seafood', 'pasta', 'soup', 'salad',
  'dessert', 'breakfast', 'indian', 'italian', 'french', 'vegetarian'
]

export default function EditRecipePage() {
  const params = useParams()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [instructions, setInstructions] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [sections, setSections] = useState<IngredientSection[]>([{ label: '', items: [''] }])

  useEffect(() => {
    fetch(`/api/recipes/${params.id}`)
      .then(r => r.json())
      .then((recipe: Recipe) => {
        setName(recipe.name)
        setIsFavorite(recipe.isFavorite)
        setTags(recipe.tags)
        setSections(
          recipe.ingredientSections.length > 0
            ? recipe.ingredientSections.map(s => ({ label: s.label || '', items: s.items.length > 0 ? s.items : [''] }))
            : [{ label: '', items: [''] }]
        )
        setInstructions(recipe.instructions.join('\n'))
        setLoading(false)
      })
  }, [params.id])

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

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

    const res = await fetch(`/api/recipes/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        ingredientSections,
        instructions: instructionList,
        tags,
        isFavorite,
      }),
    })

    if (res.ok) {
      router.push(`/recipes/${params.id}`)
    } else {
      setSaving(false)
      alert('Failed to save recipe')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this recipe? This cannot be undone.')) return
    await fetch(`/api/recipes/${params.id}`, { method: 'DELETE' })
    router.push('/recipes')
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

  if (loading) return (
    <div style={{ padding: '64px 24px', color: 'var(--text-muted)' }}>Loading...</div>
  )

  return (
    <main style={{ padding: '48px 0 80px' }}>
      <div className="container" style={{ maxWidth: '680px' }}>
        <a href={`/recipes/${params.id}`} style={{
          display: 'inline-block',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          marginBottom: '32px',
        }}>
          ← Back to recipe
        </a>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '32px', letterSpacing: '-0.02em' }}>
          Edit Recipe
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
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

{/* Tags */}
<div style={{ marginBottom: '24px' }}>
  <label style={labelStyle}>Tags</label>
  
  {/* Predefined tags */}
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
    {ALL_TAGS.map(tag => (
      <button
        key={tag}
        type="button"
        onClick={() => toggleTag(tag)}
        style={{
          padding: '5px 12px',
          borderRadius: '999px',
          border: '1.5px solid',
          borderColor: tags.includes(tag) ? 'var(--accent)' : 'var(--border)',
          background: tags.includes(tag) ? 'var(--accent-light)' : 'var(--surface)',
          color: tags.includes(tag) ? 'var(--accent)' : 'var(--text-muted)',
          fontSize: '0.8rem',
          fontWeight: 500,
          cursor: 'pointer',
          textTransform: 'capitalize',
          transition: 'all 0.15s',
        }}
      >
        {tag}
      </button>
    ))}
  </div>

  {/* Custom tags */}
  {tags.filter(t => !ALL_TAGS.includes(t)).length > 0 && (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
      {tags.filter(t => !ALL_TAGS.includes(t)).map(tag => (
        <span key={tag} style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '5px 10px',
          borderRadius: '999px',
          background: 'var(--accent-light)',
          border: '1.5px solid var(--accent)',
          color: 'var(--accent)',
          fontSize: '0.8rem',
          fontWeight: 500,
        }}>
          {tag}
          <button
            type="button"
            onClick={() => setTags(prev => prev.filter(t => t !== tag))}
            style={{
              border: 'none',
              background: 'none',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              padding: '0',
              lineHeight: 1,
            }}
          >×</button>
        </span>
      ))}
    </div>
  )}

  {/* Add custom tag input */}
  <div style={{ display: 'flex', gap: '8px' }}>
    <input
      type="text"
      placeholder="Add custom tag..."
      style={{ ...inputStyle, flex: 1 }}
      onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
      onBlur={e => (e.target.style.borderColor = 'var(--border)')}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault()
          const val = e.currentTarget.value.trim().toLowerCase()
          if (val && !tags.includes(val)) {
            setTags(prev => [...prev, val])
          }
          e.currentTarget.value = ''
        }
      }}
    />
    <button
      type="button"
      style={{
        padding: '9px 16px',
        background: 'var(--accent)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius)',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
      }}
      onClick={e => {
        const input = e.currentTarget.previousElementSibling as HTMLInputElement
        const val = input.value.trim().toLowerCase()
        if (val && !tags.includes(val)) {
          setTags(prev => [...prev, val])
        }
        input.value = ''
      }}
    >
      Add
    </button>
  </div>
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
                    placeholder="Section label (optional)"
                    style={{ ...inputStyle, flex: 1, fontSize: '0.85rem' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(si)}
                      style={{ border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: '1rem', padding: '4px', cursor: 'pointer' }}
                    >×</button>
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
                        style={{ border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: '1rem', padding: '4px', cursor: 'pointer' }}
                      >×</button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addItem(si)}
                  style={{ marginTop: '4px', border: 'none', background: 'none', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 500, padding: 0, cursor: 'pointer' }}
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
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>One step per line</p>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              required
              rows={10}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
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
            <label htmlFor="favorite" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
              Mark as favorite
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              style={{
                background: 'none',
                border: '1px solid #e0c0c0',
                color: '#c0392b',
                padding: '12px 20px',
                borderRadius: 'var(--radius)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Delete Recipe
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
