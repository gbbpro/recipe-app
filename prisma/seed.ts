import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  const data = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'recipes.json'), 'utf8')
  )

  console.log(`Seeding ${data.length} recipes...`)

  let success = 0
  let skipped = 0

  for (const recipe of data) {
    if (!recipe.name || recipe.ingredientSections.length === 0) {
      skipped++
      continue
    }
    await prisma.recipe.upsert({
      where: { filename: recipe.filename },
      update: {},
      create: {
        name: recipe.name,
        filename: recipe.filename,
        ingredientSections: recipe.ingredientSections,
        instructions: recipe.instructions,
        tags: recipe.tags,
        isFavorite: recipe.isFavorite,
      },
    })
    success++
  }

  console.log(`✅ Seeded: ${success}`)
  console.log(`⏭️  Skipped (empty): ${skipped}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
