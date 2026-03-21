'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type IngredientSection = { label: string | null; items: string[] }
type Recipe = {
  id: number
  name: string
  tags: string[]
  isFavorite: boolean
  ingredientSections: IngredientSection[]
  instructions: string[]
}

export default function RecipePage() {
  const params = useParams()
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)

  useEffect(() => {
    fetch(`/api/recipes/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) router.push('/recipes')
        else setRecipe(data)
      })
  }, [params.id])

  if (!recipe) return (
    <div style={{ padding: '64px 24px', color: 'var(--text-muted)' }}>Loading...</div>
  )

  const sections = recipe.ingredientSections as IngredientSection[]

  const toggleFavorite = async () => {
    const updated = await fetch(`/api/recipes/${recipe.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFavorite: !recipe.isFavorite }),
    }).then(r => r.json())
    setRecipe(updated)
  }

  return (
    <main style={{ padding: '48px 0 80px' }}>
      <div className="container" style={{ maxWidth: '760px' }}>

        {/* Back link */}
        <a href="/recipes" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '32px',
        }}>
          ← Back to recipes
        </a>

        {/* Header */}
        <div style={{ marginBottom: '40px', paddingBottom: '32px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>

            {/* Title + tags */}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '16px', lineHeight: 1.2 }}>
                {recipe.name}
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {recipe.tags.map(tag => (
                  <a key={tag} href={`/recipes?tag=${tag}`} style={{
                    fontSize: '0.75rem', background: 'var(--tag-bg)', color: 'var(--tag-text)',
                    padding: '3px 10px', borderRadius: '999px', textTransform: 'capitalize',
                  }}>
                    {tag}
                  </a>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button
                onClick={toggleFavorite}
                style={{
                  padding: '8px 14px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  background: recipe.isFavorite ? 'var(--accent-light)' : 'var(--surface)',
                  fontSize: '0.85rem',
                  color: recipe.isFavorite ? 'var(--accent)' : 'var(--text-muted)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {recipe.isFavorite ? '⭐ Favorited' : '☆ Favorite'}
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  background: 'var(--surface)', fontSize: '0.85rem', color: 'var(--text-muted)',
                  fontWeight: 500, cursor: 'pointer',
                }}
              >
                🖨 Print
              </button>
              <a
                href={`/recipes/${recipe.id}/edit`}
                style={{
                  padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  background: 'var(--surface)', fontSize: '0.85rem', color: 'var(--text-muted)',
                  fontWeight: 500, display: 'inline-block',
                }}
              >
                ✏️ Edit
              </a>
            </div>

          </div>
        </div>

        {/* Two column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '48px', alignItems: 'flex-start' }}>

          {/* Ingredients */}
          <div>
            <h2 style={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Ingredients
            </h2>
            {sections.map((section, i) => (
              <div key={i} style={{ marginBottom: section.label ? '20px' : '0' }}>
                {section.label && (
                  <div style={{ fontFamily: 'Lora, serif', fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--accent)', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                    {section.label}
                  </div>
                )}
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {section.items.map((item, j) => (
                    <li key={j} style={{ fontSize: '0.875rem', padding: '5px 0', borderBottom: '1px solid var(--border)', lineHeight: 1.4 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div>
            <h2 style={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Instructions
            </h2>
            <ol style={{ listStyle: 'none', padding: 0 }}>
              {recipe.instructions.map((step, i) => (
                <li key={i} style={{ display: 'flex', gap: '16px', marginBottom: '20px', paddingBottom: '20px', borderBottom: i < recipe.instructions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent)', color: 'white', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                    {i + 1}
                  </span>
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.65 }}>{step}</p>
                </li>
              ))}
            </ol>
          </div>

        </div>
      </div>
    </main>
  )
}
