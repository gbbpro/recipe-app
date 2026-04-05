'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { ALL_TAGS } from '@/lib/tags'


type Recipe = {
  id: number
  name: string
  tags: string[]
  isFavorite: boolean
}

function RecipeBrowser() {
  console.log('window width:', typeof window !== 'undefined' ? window.innerWidth : 'SSR')
  const searchParams = useSearchParams()
  const router = useRouter()

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [activeTag, setActiveTag] = useState(searchParams.get('tag') || '')
  const [favoritesOnly, setFavoritesOnly] = useState(searchParams.get('favorites') === 'true')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (activeTag) params.set('tag', activeTag)
    if (favoritesOnly) params.set('favorites', 'true')

    fetch(`/api/recipes?${params}`)
      .then(r => r.json())
      .then(data => { setRecipes(data); setLoading(false) })
  }, [search, activeTag, favoritesOnly])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (activeTag) params.set('tag', activeTag)
    router.push(`/recipes?${params}`)
  }

  const toggleTag = (tag: string) => {
    setActiveTag(prev => prev === tag ? '' : tag)
    setFavoritesOnly(false)
  }

  return (
    <main>
      {/* Header */}
      <section style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '32px 0',
      }}>
        <div className="container">
          <div className="browse-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
              {favoritesOnly ? '⭐ Favorites' : activeTag ? `${activeTag.charAt(0).toUpperCase() + activeTag.slice(1)} Recipes` : 'All Recipes'}
            </h1>
            <form className="browse-search" onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search recipes..."
                style={{
                  padding: '8px 14px',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.9rem',
                  background: 'var(--bg)',
                  outline: 'none',
                  width: '220px',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
              <button type="submit" style={{
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 'var(--radius)',
                fontWeight: 500,
                fontSize: '0.9rem',
              }}>
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      <div className="container browse-layout" style={{ padding: '32px 24px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        {/* Sidebar filters */}
        <aside className="browse-sidebar no-print" style={{ width: '180px', flexShrink: 0 }}>
          <div style={{ marginBottom: '24px' }}>
            <div className="sidebar-label" style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px',
            }}>
              Filter
            </div>
            <button
              onClick={() => { setFavoritesOnly(f => !f); setActiveTag('') }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '7px 10px',
                borderRadius: 'var(--radius)',
                border: '1px solid',
                borderColor: favoritesOnly ? 'var(--accent)' : 'transparent',
                background: favoritesOnly ? 'var(--accent-light)' : 'transparent',
                color: favoritesOnly ? 'var(--accent)' : 'var(--text)',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '4px',
                cursor: 'pointer',
              }}
            >
              ⭐ Favorites
            </button>
          </div>

          <div>
            <div className="sidebar-label" style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px',
            }}>
              Categories
            </div>
            {ALL_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius)',
                  border: '1px solid',
                  borderColor: activeTag === tag ? 'var(--accent)' : 'transparent',
                  background: activeTag === tag ? 'var(--accent-light)' : 'transparent',
                  color: activeTag === tag ? 'var(--accent)' : 'var(--text)',
                  fontSize: '0.875rem',
                  fontWeight: activeTag === tag ? 500 : 400,
                  marginBottom: '2px',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.1s',
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </aside>

        {/* Recipe grid */}
        <div className="recipe-grid" style={{ flex: 1 }}>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', padding: '32px 0' }}>Loading...</div>
          ) : recipes.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', padding: '32px 0' }}>No recipes found.</div>
          ) : (
            <>
              <div style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                marginBottom: '16px',
              }}>
                {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px',
              }}>
                {recipes.map(recipe => (
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
                    {recipe.isFavorite && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--accent)', marginBottom: '4px' }}>⭐</div>
                    )}
                    <div style={{
                      fontFamily: 'Lora, serif',
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      marginBottom: '10px',
                      lineHeight: 1.35,
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
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default function RecipesPage() {
  return (
    <Suspense fallback={<div style={{ padding: '64px 24px', color: 'var(--text-muted)' }}>Loading...</div>}>
      <RecipeBrowser />
    </Suspense>
  )
}
