'use client'

import React, { useEffect, useState, useCallback } from 'react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEALS = ['breakfast', 'lunch', 'dinner']
const MEAL_ICONS: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' }

type Recipe = { id: number; name: string; tags: string[] }
type MealPlan = { id: number; dayOfWeek: number; mealType: string; recipeId: number; recipe: Recipe }

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatWeekLabel(monday: Date): string {
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

export default function PlannerPage() {
  const [weekStart, setWeekStart] = useState<Date>(getMonday(new Date()))
  const [meals, setMeals] = useState<MealPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showPicker, setShowPicker] = useState<{ day: number; meal: string } | null>(null)
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerResults, setPickerResults] = useState<Recipe[]>([])
  const [showShoppingList, setShowShoppingList] = useState(false)
  const [shoppingList, setShoppingList] = useState<{ recipeId: number; name: string; ingredients: string[] }[]>([])
  const [loadingShoppingList, setLoadingShoppingList] = useState(false)

  const fetchMeals = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/meal-plans?weekStart=${weekStart.toISOString()}`)
    const data = await res.json()
    setMeals(data)
    setLoading(false)
  }, [weekStart])

  useEffect(() => { fetchMeals() }, [fetchMeals])

  // Search recipes for picker
  useEffect(() => {
    if (!showPicker) return
    const timer = setTimeout(() => {
      fetch(`/api/recipes?search=${encodeURIComponent(pickerSearch)}`)
        .then(r => r.json())
        .then(setPickerResults)
    }, 200)
    return () => clearTimeout(timer)
  }, [pickerSearch, showPicker])

  // Load initial picker results
  useEffect(() => {
    if (showPicker) {
      fetch('/api/recipes?search=')
        .then(r => r.json())
        .then(setPickerResults)
    }
  }, [showPicker])

  const getMeal = (day: number, meal: string) =>
    meals.find(m => m.dayOfWeek === day && m.mealType === meal)

  const assignRecipe = async (recipe: Recipe) => {
    if (!showPicker) return
    await fetch('/api/meal-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weekStart: weekStart.toISOString(),
        dayOfWeek: showPicker.day,
        mealType: showPicker.meal,
        recipeId: recipe.id,
      }),
    })
    setShowPicker(null)
    setPickerSearch('')
    fetchMeals()
  }

  const removeMeal = async (id: number) => {
    await fetch(`/api/meal-plans/${id}`, { method: 'DELETE' })
    fetchMeals()
  }

  const prevWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d)
  }

  const nextWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
  }

  const goToThisWeek = () => setWeekStart(getMonday(new Date()))

  const generateShoppingList = async () => {
    setLoadingShoppingList(true)
    setShowShoppingList(true)
    const recipeIds = [...new Set(meals.map(m => m.recipeId))]
    const recipes = await Promise.all(
      recipeIds.map(id => fetch(`/api/recipes/${id}`).then(r => r.json()))
    )

    // Collect all ingredients into a flat list
    const allIngredients: string[] = recipes.flatMap(r =>
      (r.ingredientSections as { label: string | null; items: string[] }[])
        .flatMap(s => s.items)
    )

    // Merge duplicates by normalizing and grouping
    const merged: Record<string, string> = {}
    for (const item of allIngredients) {
      const key = item.toLowerCase().replace(/[\d\s\/½¼¾⅓⅔⅛⅜⅝⅞]+/g, '').trim()
      if (!merged[key]) {
        merged[key] = item
      }
    }

    setShoppingList([{ recipeId: 0, name: '', ingredients: Object.values(merged) }])
    setLoadingShoppingList(false)
  }
  const inputStyle = {
    width: '100%', padding: '9px 12px',
    border: '1.5px solid var(--border)', borderRadius: 'var(--radius)',
    fontSize: '0.9rem', background: 'var(--bg)', outline: 'none', color: 'var(--text)',
  }

  return (
    <main style={{ padding: '40px 0 80px' }}>
      <div className="container">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '4px' }}>
              Meal Planner
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{formatWeekLabel(weekStart)}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={prevWeek} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', cursor: 'pointer', fontSize: '0.875rem' }}>← Prev</button>
            <button onClick={goToThisWeek} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', cursor: 'pointer', fontSize: '0.875rem' }}>This Week</button>
            <button onClick={nextWeek} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', cursor: 'pointer', fontSize: '0.875rem' }}>Next →</button>
            {meals.length > 0 && (
              <button onClick={generateShoppingList} style={{ padding: '8px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
                🛒 Shopping List
              </button>
            )}
          </div>
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div style={{ color: 'var(--text-muted)', padding: '32px 0' }}>Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', gap: '8px', minWidth: '700px' }}>

              {/* Day headers */}
              <div />
              {DAYS.map((day, i) => {
                const date = new Date(weekStart)
                date.setDate(weekStart.getDate() + i)
                const isToday = date.toDateString() === new Date().toDateString()
                return (
                  <div key={day} style={{ textAlign: 'center', padding: '8px 4px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: isToday ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {day.slice(0, 3)}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: isToday ? 600 : 400, color: isToday ? 'var(--accent)' : 'var(--text)' }}>
                      {date.getDate()}
                    </div>
                  </div>
                )
              })}

              {/* Meal rows */}
              {MEALS.map(meal => (
                <React.Fragment key={meal}>
                  {/* Meal label */}
                  <div key={`label-${meal}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'capitalize', textAlign: 'right' }}>
                      {MEAL_ICONS[meal]} {meal}
                    </span>
                  </div>
               
                  {/* Day cells */}
                  {DAYS.map((_, dayIndex) => {
                    const assigned = getMeal(dayIndex, meal)
                    return (
                      <div
                        key={`${meal}-${dayIndex}`}
                        style={{
                          minHeight: '80px',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          padding: '6px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: assigned ? 'space-between' : 'center',
                          alignItems: assigned ? 'stretch' : 'center',
                          cursor: assigned ? 'default' : 'pointer',
                          transition: 'border-color 0.15s',
                        }}
                        onClick={() => !assigned && setShowPicker({ day: dayIndex, meal })}
                        onMouseEnter={e => { if (!assigned) e.currentTarget.style.borderColor = 'var(--accent)' }}
                        onMouseLeave={e => { if (!assigned) e.currentTarget.style.borderColor = 'var(--border)' }}
                      >
                        {assigned ? (
                          <>
                            <a href={`/recipes/${assigned.recipeId}`} style={{ fontSize: '0.75rem', fontFamily: 'Lora, serif', fontWeight: 500, lineHeight: 1.3, color: 'var(--text)' }}
                              onClick={e => e.stopPropagation()}>
                              {assigned.recipe.name}
                            </a>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                              <button
                                onClick={e => { e.stopPropagation(); setShowPicker({ day: dayIndex, meal }) }}
                                style={{ fontSize: '0.65rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                              >
                                change
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); removeMeal(assigned.id) }}
                                style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                              >
                                ×
                              </button>
                            </div>
                          </>
                        ) : (
                          <span style={{ fontSize: '1.2rem', color: 'var(--border)' }}>+</span>
                        )}
                      </div>
                    )
                  })}
                </React.Fragment>
               
                ))}
            </div>
          </div>
        )}

        {/* Recipe picker modal */}
        {showPicker && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
            onClick={() => setShowPicker(null)}>
            <div style={{ background: 'var(--surface)', borderRadius: '8px', width: '100%', maxWidth: '480px', maxHeight: '70vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                    {MEAL_ICONS[showPicker.meal]} {DAYS[showPicker.day]} {showPicker.meal}
                  </h3>
                  <button onClick={() => setShowPicker(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
                </div>
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={e => setPickerSearch(e.target.value)}
                  placeholder="Search recipes..."
                  autoFocus
                  style={inputStyle}
                />
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {pickerResults.slice(0, 50).map(recipe => (
                  <div
                    key={recipe.id}
                    onClick={() => assignRecipe(recipe)}
                    style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-light)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ fontSize: '0.9rem', fontFamily: 'Lora, serif', fontWeight: 500 }}>{recipe.name}</div>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {recipe.tags.slice(0, 3).map(tag => (
                        <span key={tag} style={{ fontSize: '0.65rem', background: 'var(--tag-bg)', color: 'var(--tag-text)', padding: '1px 6px', borderRadius: '999px', textTransform: 'capitalize' }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Shopping list modal */}
        {showShoppingList && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
            onClick={() => setShowShoppingList(false)}>
            <div style={{ background: 'var(--surface)', borderRadius: '8px', width: '100%', maxWidth: '560px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>🛒 Shopping List</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => window.print()} style={{ fontSize: '0.8rem', padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg)', cursor: 'pointer' }}>🖨 Print</button>
                  <button onClick={() => setShowShoppingList(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
                </div>
              </div>
              <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>
                {loadingShoppingList ? (
                  <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {shoppingList[0]?.ingredients.map((item, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', fontSize: '0.875rem', borderBottom: '1px solid var(--border)' }}>
                        <input type="checkbox" style={{ accentColor: 'var(--accent)', flexShrink: 0 }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  )}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
