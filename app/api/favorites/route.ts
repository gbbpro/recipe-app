import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const favorites = await prisma.userFavorite.findMany({
    where: { userId },
  })

  const recipeIds = favorites.map(f => f.recipeId)
  const recipes = await prisma.recipe.findMany({
    where: { id: { in: recipeIds } },
    select: { id: true, name: true, tags: true, isGlobal: true, userId: true },
  })

  return NextResponse.json(recipes)
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { recipeId } = await req.json()

  const favorite = await prisma.userFavorite.upsert({
    where: { userId_recipeId: { userId, recipeId } },
    update: {},
    create: { userId, recipeId },
  })

  return NextResponse.json(favorite, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { recipeId } = await req.json()

  await prisma.userFavorite.deleteMany({
    where: { userId, recipeId },
  })

  return NextResponse.json({ success: true })
}
