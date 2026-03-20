import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const tag = searchParams.get('tag') || ''
  const favoritesOnly = searchParams.get('favorites') === 'true'

  const recipes = await prisma.recipe.findMany({
    where: {
      AND: [
        search ? { name: { contains: search, mode: 'insensitive' } } : {},
        tag ? { tags: { has: tag } } : {},
        favoritesOnly ? { isFavorite: true } : {},
      ],
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      tags: true,
      isFavorite: true,
      filename: true,
    },
  })

  return NextResponse.json(recipes)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const recipe = await prisma.recipe.create({ data: body })
  return NextResponse.json(recipe, { status: 201 })
}
