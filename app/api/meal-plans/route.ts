import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const weekStart = searchParams.get('weekStart')
  if (!weekStart) return NextResponse.json({ error: 'weekStart required' }, { status: 400 })

  const meals = await prisma.mealPlan.findMany({
    where: { weekStart: new Date(weekStart), userId },
    orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
  })

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
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { weekStart, dayOfWeek, mealType, recipeId } = await req.json()

  const meal = await prisma.mealPlan.upsert({
    where: {
      weekStart_dayOfWeek_mealType_userId: {
        weekStart: new Date(weekStart),
        dayOfWeek,
        mealType,
        userId,
      },
    },
    update: { recipeId },
    create: {
      weekStart: new Date(weekStart),
      dayOfWeek,
      mealType,
      recipeId,
      userId,
    },
  })

  return NextResponse.json(meal, { status: 201 })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const meal = await prisma.mealPlan.findUnique({ where: { id: parseInt(id) } })
  if (!meal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (meal.userId !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  await prisma.mealPlan.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ success: true })
}
