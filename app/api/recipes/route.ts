import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  console.log("UserId in API: ",userId)
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const tag = searchParams.get('tag') || ''
  const noTags = searchParams.get('notags') === 'true'
  const myRecipesOnly = searchParams.get('myrecipes') === 'true'


  if (searchParams.get('count') === 'true') {
    const count = await prisma.recipe.count({
      where: {
        OR: myRecipesOnly 
         ? [{ userId: userId ?? '' }]
          : [{ isGlobal: true }, {userId: userId ?? ''}]

      }
    })
    return NextResponse.json({ count })
  }

  if (searchParams.get('random') === 'true') {
    const where = {
      OR: [
        { isGlobal: true },
        { userId: userId ?? '' },
      ]
    }
    const count = await prisma.recipe.count({ where })
    const skip = Math.floor(Math.random() * count)
    const recipe = await prisma.recipe.findFirst({ where, skip, select: { id: true } })
    return NextResponse.json(recipe)
  }

  if (searchParams.get('tags') === 'all') {
    const recipes = await prisma.recipe.findMany({
      where: {
        OR: [{ isGlobal: true }, { userId: userId ?? '' }]
      },
      select: { tags: true }
    })
    const allTags = [...new Set(recipes.flatMap(r => r.tags))].sort()
    return NextResponse.json({ tags: allTags })
  }

  const recipes = await prisma.recipe.findMany({
    where: {
      AND: [
        {
        OR: myRecipesOnly
          ? [{ userId: userId ?? '' }]
          : [{ isGlobal: true }, { userId: userId ?? '' }],
      },
      search ? { name: { contains: search, mode: 'insensitive' } } : {},
      tag ? { tags: { has: tag } } : {},
      noTags ? { tags: { isEmpty: true } } : {},

      ],
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      tags: true,
      isFavorite: true,
      filename: true,
      isGlobal: true,
      userId: true,
    },
  })

  return NextResponse.json(recipes)
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const recipe = await prisma.recipe.create({
    data: { ...body, userId, isGlobal: false }
  })
  return NextResponse.json(recipe, { status: 201 })
}
