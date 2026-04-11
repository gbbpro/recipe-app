import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const recipe = await prisma.recipe.findUnique({
    where: { id: parseInt(id) },
  })
  if (!recipe) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(recipe)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const recipe = await prisma.recipe.findUnique({ where: { id: parseInt(id) } })
  if (!recipe) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only allow editing own recipes, not global ones
  if (recipe.isGlobal && recipe.userId !== userId) {
    return NextResponse.json({ error: 'Cannot edit global recipes' }, { status: 403 })
  }

  const updated = await prisma.recipe.update({
    where: { id: parseInt(id) },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.ingredientSections !== undefined && { ingredientSections: body.ingredientSections }),
      ...(body.instructions !== undefined && { instructions: body.instructions }),
      ...(body.tags !== undefined && { tags: body.tags }),
      ...(body.isFavorite !== undefined && { isFavorite: body.isFavorite }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const recipe = await prisma.recipe.findUnique({ where: { id: parseInt(id) } })
  if (!recipe) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (recipe.userId !== userId) {
    return NextResponse.json({ error: 'Cannot delete this recipe' }, { status: 403 })
  }

  await prisma.recipe.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ success: true })
}
