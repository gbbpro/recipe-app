import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: parseInt(params.id) },
  })
  if (!recipe) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(recipe)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const recipe = await prisma.recipe.update({
    where: { id: parseInt(params.id) },
    data: body,
  })
  return NextResponse.json(recipe)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.recipe.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ success: true })
}
