import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

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
