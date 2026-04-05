import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const weekStart = searchParams.get('weekStart')
  if (!weekStart) return NextResponse.json({ error: 'weekStart required' }, { status: 400 })

  const meals = await prisma.mealPlan.findMany({
    where: { weekStart: new Date(weekStart) },
    orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
  })

  // Fetch associated recipes
  const recipeIds = [...new Set(meals.map(m => m.recipeId))]
  const recipes = await prisma.recipe.findMany({
    where: { id: { in: recipeIds } },
    select: { id: true, name: true, tags: true },
  })

  const recipeMap = Object.fromEntries(recipes.map(r => [r.id, r]))
  const result = meals.map(m => ({ ...m, recipe: recipeMap[m.recipeId] }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const { weekStart, dayOfWeek, mealType, recipeId } = await req.json()

  const meal = await prisma.mealPlan.upsert({
    where: {
      weekStart_dayOfWeek_mealType: {
        weekStart: new Date(weekStart),
        dayOfWeek,
        mealType,
      },
    },
    update: { recipeId },
    create: {
      weekStart: new Date(weekStart),
      dayOfWeek,
      mealType,
      recipeId,
    },
  })

  return NextResponse.json(meal, { status: 201 })
}
