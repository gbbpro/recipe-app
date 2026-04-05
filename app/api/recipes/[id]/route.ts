import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params
  const recipe = await prisma.recipe.findUnique({
    where: { id: parseInt(id) },
  })
  if (!recipe) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(recipe)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()
  const recipe = await prisma.recipe.update({
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
  return NextResponse.json(recipe)
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params
  await prisma.recipe.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ success: true })
}
