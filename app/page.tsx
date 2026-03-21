'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const ALL_TAGS = [
  'cake', 'cookies', 'bread', 'pastry', 'chocolate', 'lemon',
  'chicken', 'beef', 'seafood', 'pasta', 'soup', 'salad',
  'dessert', 'breakfast', 'indian', 'italian', 'french', 'vegetarian'
]

const TAG_ICONS: Record<string, string> = {
  cake: '🎂', cookies: '🍪', bread: '🍞', pastry: '🥐',
  chocolate: '🍫', lemon: '🍋', chicken: '🍗', beef: '🥩',
  seafood: '🐟', pasta: '🍝', soup: '🍲', salad: '🥗',
  dessert: '🍮', breakfast: '🍳', indian: '🍛', italian: '🇮🇹',
  french: '🥖', vegetarian: '🥦'
}

type Recipe = {
  id: number
  name: string
  tags: string[]
  isFavorite: boolean
}

export default function HomePage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<Recipe[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/recipes?favorites=true')
      .then(r => r.json())
      .then(data => { setFavorites(data); setLoading(false) })
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) router.push(`/recipes?search=${encodeURIComponent(search)}`)
  }

  return (
    <main>
      {/* Hero */}
      <section style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '64px 0 48px',
      }}>
        <div className="container" style={{ maxWidth: '680px' }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 600,
            marginBottom: '12px',
            color: 'var(--text)',
            letterSpacing: '-0.02em',
          }}>
            What are you cooking?
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '28px', fontSize: '1.05rem' }}>
            Browse 1,299 recipes by category or search by name.
          </p>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search recipes..."
              style={{
                flex: 1,
                padding: '10px 16px',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontSize: '0.95rem',
                background: 'var(--bg)',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
            <button type="submit" style={{
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 'var(--radius)',
              fontWeight: 500,
              fontSize: '0.95rem',
            }}>
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Tag Browser */}
      <section style={{ padding: '48px 0' }}>
        <div className="container">
          <h2 style={{
            fontSize: '1.1rem',
            fontWeight: 500,
            marginBottom: '20px',
            color: 'var(--text-muted)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontSize: '0.8rem',
          }}>
            Browse by Category
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '10px',
          }}>
            {ALL_TAGS.map(tag => (
              <a
                key={tag}
                href={`/recipes?tag=${tag}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 14px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: 'var(--text)',
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.color = 'var(--accent)'
                  e.currentTarget.style.background = 'var(--accent-light)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--text)'
                  e.currentTarget.style.background = 'var(--surface)'
                }}
              >
                <span>{TAG_ICONS[tag]}</span>
                <span style={{ textTransform: 'capitalize' }}>{tag}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Favorites */}
      <section style={{
        padding: '0 0 64px',
        borderTop: '1px solid var(--border)',
        paddingTop: '48px',
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{
              fontSize: '0.8rem',
              fontWeight: 500,
              color: 'var(--text-muted)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              ⭐ Favorites
            </h2>
            <a href="/recipes?favorites=true" style={{
              fontSize: '0.85rem',
              color: 'var(--accent)',
              fontWeight: 500,
            }}>
              View all →
            </a>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '12px',
            }}>
              {favorites.slice(0, 8).map(recipe => (
                <a
                  key={recipe.id}
                  href={`/recipes/${recipe.id}`}
                  style={{
                    display: 'block',
                    padding: '16px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                    e.currentTarget.style.borderColor = 'var(--accent)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }}
                >
                  <div style={{
                    fontFamily: 'Lora, serif',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    marginBottom: '8px',
                    lineHeight: 1.3,
                  }}>
                    {recipe.name}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {recipe.tags.slice(0, 3).map(tag => (
                      <span key={tag} style={{
                        fontSize: '0.7rem',
                        background: 'var(--tag-bg)',
                        color: 'var(--tag-text)',
                        padding: '2px 7px',
                        borderRadius: '999px',
                        textTransform: 'capitalize',
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
