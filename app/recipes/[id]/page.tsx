'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

type IngredientSection = { label: string | null; items: string[] }
type Recipe = {
  id: number
  name: string
  tags: string[]
  isFavorite: boolean
  ingredientSections: IngredientSection[]
  instructions: string[]
  notes: string | null
  userId: string | null
  isGlobal: boolean
}

// ─── Fraction utilities ───────────────────────────────────────────────────────

const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 0.5, '¼': 0.25, '¾': 0.75,
  '⅓': 1/3, '⅔': 2/3,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
}

const DISPLAY_FRACTIONS: [number, string][] = [
  [0.125, '⅛'], [0.25, '¼'], [0.333, '⅓'], [0.375, '⅜'],
  [0.5, '½'], [0.625, '⅝'], [0.667, '⅔'], [0.75, '¾'], [0.875, '⅞'],
]

const UNIT_CONVERSIONS = [
  { from: ['tsp', 'teaspoon', 'teaspoons'], toUnit: 'tbsp', factor: 3, threshold: 3 },
  { from: ['tbsp', 'tablespoon', 'tablespoons'], toUnit: 'cup', factor: 16, threshold: 4 },
  { from: ['fl oz', 'fluid ounce', 'fluid ounces'], toUnit: 'cup', factor: 8, threshold: 8 },
  { from: ['ml', 'milliliter', 'milliliters'], toUnit: 'l', factor: 1000, threshold: 1000 },
  { from: ['g', 'gram', 'grams'], toUnit: 'kg', factor: 1000, threshold: 1000 },
  { from: ['oz', 'ounce', 'ounces'], toUnit: 'lb', factor: 16, threshold: 16 },
]

function toDecimal(str: string): number | null {
  str = str.trim()
  if (UNICODE_FRACTIONS[str] !== undefined) return UNICODE_FRACTIONS[str]
  if (/^\d+\/\d+$/.test(str)) {
    const [n, d] = str.split('/').map(Number)
    return d !== 0 ? n / d : null
  }
  if (/^\d+(\.\d+)?$/.test(str)) return parseFloat(str)
  return null
}

function formatNumber(n: number): string {
  if (n === 0) return '0'
  const whole = Math.floor(n)
  const frac = n - whole
  let bestFrac = ''
  let bestDiff = Infinity
  for (const [val, sym] of DISPLAY_FRACTIONS) {
    const diff = Math.abs(frac - val)
    if (diff < bestDiff) { bestDiff = diff; bestFrac = sym }
  }
  if (bestDiff < 0.06) {
    if (whole === 0) return bestFrac
    return `${whole} ${bestFrac}`
  }
  const rounded = Math.round(n * 4) / 4
  return rounded % 1 === 0 ? String(Math.round(rounded)) : String(rounded)
}

function convertUnit(amount: number, unitStr: string): { amount: number; unit: string } {
  const unitLower = unitStr.trim().toLowerCase()
  for (const conv of UNIT_CONVERSIONS) {
    if (conv.from.includes(unitLower) && amount >= conv.threshold) {
      return { amount: amount / conv.factor, unit: conv.toUnit }
    }
  }
  return { amount, unit: unitStr }
}

function scaleIngredient(ingredient: string, multiplier: number): string {
  if (multiplier === 1) return ingredient
  const unicodeKeys = Object.keys(UNICODE_FRACTIONS).join('')
  const pattern = new RegExp(
    `(\\d+\\s+)?([\\d]+\\/[\\d]+|[${unicodeKeys}]|\\d+(?:\\.\\d+)?)`, 'g'
  )
  const matches: Array<{ index: number; length: number; value: number }> = []
  let match
  while ((match = pattern.exec(ingredient)) !== null) {
    const full = match[0]
    let value = 0
    if (match[1]) {
      const whole = parseInt(match[1].trim())
      const frac = toDecimal(match[2])
      if (frac === null) continue
      value = whole + frac
    } else {
      const v = toDecimal(match[2])
      if (v === null) continue
      value = v
    }
    matches.push({ index: match.index, length: full.length, value })
  }
  if (matches.length === 0) return ingredient
  const first = matches[0]
  const scaledValue = first.value * multiplier
  const afterNumber = ingredient.slice(first.index + first.length).trimStart()
  const unitMatch = afterNumber.match(/^([a-zA-Z]+\.?\s?[a-zA-Z]*\.?)/)
  let newAmount = scaledValue
  let newUnit = ''
  let unitLength = 0
  if (unitMatch) {
    const rawUnit = unitMatch[1].trimEnd()
    const converted = convertUnit(scaledValue, rawUnit)
    newAmount = converted.amount
    newUnit = converted.unit
    unitLength = rawUnit.length
  }
  let result = ingredient.slice(0, first.index)
  result += formatNumber(newAmount)
  if (unitMatch && unitLength > 0) {
    const afterUnit = afterNumber.slice(unitLength)
    result += ' ' + newUnit + afterUnit
  } else {
    result += ingredient.slice(first.index + first.length)
  }
  return result
}

const SCALE_OPTIONS = [
  { label: '½x', value: 0.5 },
  { label: '1x', value: 1 },
  { label: '2x', value: 2 },
  { label: '3x', value: 3 },
  { label: '4x', value: 4 },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function RecipePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [scale, setScale] = useState(1)
  const [isFavorited, setIsFavorited] = useState(false)

  const isAdmin = user?.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID
  const isOwner = !!recipe && !!user && recipe.userId === user.id
  const canEdit = isAdmin || isOwner

  useEffect(() => {
    fetch(`/api/recipes/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) router.push('/recipes')
        else setRecipe(data)
      })
  }, [params.id])

  useEffect(() => {
    if (!recipe || !user) return
    fetch('/api/favorites')
      .then(r => r.json())
      .then(favs => {
        if (Array.isArray(favs)) {
          setIsFavorited(favs.some((f: { id: number }) => f.id === recipe.id))
        }
      })
  }, [recipe, user])

  if (!recipe || !recipe.ingredientSections || !recipe.instructions) return (
    <div style={{ padding: '64px 24px', color: 'var(--text-muted)' }}>Loading...</div>
  )

  const sections = (recipe.ingredientSections || []) as IngredientSection[]

  const toggleFavorite = async () => {
    if (isFavorited) {
      await fetch('/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId: recipe.id }),
      })
      setIsFavorited(false)
    } else {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId: recipe.id }),
      })
      setIsFavorited(true)
    }
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
        <div style={{ marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>

            {/* Title + tags */}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '16px', lineHeight: 1.2 }}>
                {recipe.name}
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(recipe.tags || []).map(tag => (
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
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
              {user && (
                <button
                  onClick={toggleFavorite}
                  style={{
                    padding: '8px 14px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    background: isFavorited ? 'var(--accent-light)' : 'var(--surface)',
                    fontSize: '0.85rem',
                    color: isFavorited ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {isFavorited ? '⭐ Favorited' : '☆ Favorite'}
                </button>
              )}
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
              {canEdit && (
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
              )}
            </div>

          </div>
        </div>

        {/* Notes */}
        {recipe.notes && (
          <div style={{
            background: 'var(--accent-light)',
            border: '1px solid var(--border)',
            borderLeft: '3px solid var(--accent)',
            borderRadius: 'var(--radius)',
            padding: '16px 20px',
            marginBottom: '32px',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)', marginBottom: '6px' }}>
              📝 Notes
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text)' }}>
              {recipe.notes}
            </p>
          </div>
        )}

        {/* Two column layout */}
        <div className="recipe-body" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '48px', alignItems: 'flex-start' }}>

          {/* Ingredients */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                Ingredients
              </h2>
              {/* Scale toggle */}
              <div style={{ display: 'flex', gap: '2px', background: 'var(--tag-bg)', borderRadius: 'var(--radius)', padding: '2px' }}>
                {SCALE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setScale(opt.value)}
                    style={{
                      padding: '3px 7px', borderRadius: '3px', border: 'none',
                      background: scale === opt.value ? 'var(--accent)' : 'transparent',
                      color: scale === opt.value ? 'white' : 'var(--text-muted)',
                      fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {sections.map((section, i) => (
              <div key={i} style={{ marginBottom: section.label ? '20px' : '0' }}>
                {section.label && (
                  <div style={{ fontFamily: 'Lora, serif', fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--accent)', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                    {section.label}
                  </div>
                )}
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {(section.items || []).map((item, j) => (
                    <li key={j} style={{ fontSize: '0.875rem', padding: '5px 0', borderBottom: '1px solid var(--border)', lineHeight: 1.4 }}>
                      {scaleIngredient(item, scale)}
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
              {(recipe.instructions || []).map((step, i) => (
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
