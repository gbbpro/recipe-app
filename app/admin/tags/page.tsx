'use client'

import { useEffect, useState } from 'react'
import { ALL_TAGS } from '@/lib/tags'


type Recipe = {
  id: number
  name: string
  tags: string[]
}

export default function BatchTagEditor() {
  const [activeTag, setActiveTag] = useState(ALL_TAGS[0])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [filtered, setFiltered] = useState<Recipe[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [customTag, setCustomTag] = useState('')
  const [message, setMessage] = useState('')

  // Load all recipes when tag changes
  useEffect(() => {
    setLoading(true)
    setSelected(new Set())
    setSearch('')
    fetch(`/api/recipes?tag=${activeTag}`)
      .then(r => r.json())
      .then(data => {
        setRecipes(data)
        setFiltered(data)
        setLoading(false)
      })
  }, [activeTag])

  // Filter by search
  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(recipes.filter(r => r.name.toLowerCase().includes(q)))
    setSelected(new Set())
  }, [search, recipes])

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(filtered.map(r => r.id)))
  const selectNone = () => setSelected(new Set())

  const flash = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  const applyTagChange = async (tag: string, action: 'add' | 'remove') => {
    if (selected.size === 0) return
    setSaving(true)

    const ids = Array.from(selected)
    await Promise.all(ids.map(async id => {
      const recipe = recipes.find(r => r.id === id)
      if (!recipe) return
      const newTags = action === 'add'
        ? [...new Set([...recipe.tags, tag])]
        : recipe.tags.filter(t => t !== tag)
      await fetch(`/api/recipes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      })
      recipe.tags = newTags
    }))

    // Refresh list
    const updated = await fetch(`/api/recipes?tag=${activeTag}`).then(r => r.json())
    setRecipes(updated)
    setSelected(new Set())
    setSaving(false)
    flash(`${action === 'add' ? 'Added' : 'Removed'} "${tag}" ${action === 'add' ? 'to' : 'from'} ${ids.length} recipe${ids.length !== 1 ? 's' : ''}`)
  }

  return (
    <main style={{ padding: '40px 0 80px' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '4px' }}>
              Batch Tag Editor
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Select recipes and bulk add or remove tags
            </p>
          </div>
          <a href="/recipes" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            ← Back to recipes
          </a>
        </div>

        {/* Flash message */}
        {message && (
          <div style={{
            padding: '10px 16px',
            background: 'var(--accent-light)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)',
            color: 'var(--accent)',
            fontSize: '0.875rem',
            fontWeight: 500,
            marginBottom: '20px',
          }}>
            ✓ {message}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '32px', alignItems: 'flex-start' }}>

          {/* Tag sidebar */}
          <aside>
            <div style={{
              fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px',
            }}>
              Browse by Tag
            </div>
            {ALL_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '7px 10px', borderRadius: 'var(--radius)',
                  border: '1px solid',
                  borderColor: activeTag === tag ? 'var(--accent)' : 'transparent',
                  background: activeTag === tag ? 'var(--accent-light)' : 'transparent',
                  color: activeTag === tag ? 'var(--accent)' : 'var(--text)',
                  fontSize: '0.875rem', fontWeight: activeTag === tag ? 500 : 400,
                  marginBottom: '2px', cursor: 'pointer', textTransform: 'capitalize',
                }}
              >
                {tag}
              </button>
            ))}
          </aside>

          {/* Main panel */}
          <div>
            {/* Toolbar */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '14px 16px',
              marginBottom: '16px',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}>
              {/* Search */}
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter by name..."
                style={{
                  padding: '7px 12px',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.875rem',
                  background: 'var(--bg)',
                  outline: 'none',
                  width: '200px',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button onClick={selectAll} style={{
                  padding: '6px 12px', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', background: 'var(--bg)',
                  fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-muted)',
                }}>
                  Select all
                </button>
                <button onClick={selectNone} style={{
                  padding: '6px 12px', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', background: 'var(--bg)',
                  fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-muted)',
                }}>
                  None
                </button>
              </div>

              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {selected.size} selected
              </div>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Tag input for custom tag */}
                <input
                  type="text"
                  value={customTag}
                  onChange={e => setCustomTag(e.target.value.toLowerCase())}
                  placeholder="Tag name..."
                  style={{
                    padding: '7px 12px',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.875rem',
                    background: 'var(--bg)',
                    outline: 'none',
                    width: '140px',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
                <button
                  onClick={() => applyTagChange(customTag || activeTag, 'add')}
                  disabled={saving || selected.size === 0}
                  style={{
                    padding: '7px 14px',
                    background: selected.size > 0 ? 'var(--accent)' : 'var(--border)',
                    color: 'white', border: 'none',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.8rem', fontWeight: 500,
                    cursor: selected.size > 0 ? 'pointer' : 'not-allowed',
                  }}
                >
                  + Add tag
                </button>
                <button
                  onClick={() => applyTagChange(customTag || activeTag, 'remove')}
                  disabled={saving || selected.size === 0}
                  style={{
                    padding: '7px 14px',
                    background: selected.size > 0 ? '#c0392b' : 'var(--border)',
                    color: 'white', border: 'none',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.8rem', fontWeight: 500,
                    cursor: selected.size > 0 ? 'pointer' : 'not-allowed',
                  }}
                >
                  − Remove tag
                </button>
              </div>
            </div>

            {/* Recipe list */}
            {loading ? (
              <div style={{ color: 'var(--text-muted)', padding: '32px 0' }}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', padding: '32px 0' }}>No recipes found.</div>
            ) : (
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '8px 16px',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                }}>
                  {filtered.length} recipes tagged "{activeTag}"
                </div>
                {filtered.map((recipe, i) => (
                  <div
                    key={recipe.id}
                    onClick={() => toggleSelect(recipe.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 16px',
                      borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                      background: selected.has(recipe.id) ? 'var(--accent-light)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(recipe.id)}
                      onChange={() => toggleSelect(recipe.id)}
                      onClick={e => e.stopPropagation()}
                      style={{ width: '15px', height: '15px', accentColor: 'var(--accent)', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9rem', fontFamily: 'Lora, serif', fontWeight: 500 }}>
                        {recipe.name}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {recipe.tags.map(tag => (
                          <span key={tag} style={{
                            fontSize: '0.7rem',
                            background: tag === activeTag ? 'var(--accent)' : 'var(--tag-bg)',
                            color: tag === activeTag ? 'white' : 'var(--tag-text)',
                            padding: '1px 7px',
                            borderRadius: '999px',
                            textTransform: 'capitalize',
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <a
                      href={`/recipes/${recipe.id}`}
                      onClick={e => e.stopPropagation()}
                      style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}
                    >
                      View →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
