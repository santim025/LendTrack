import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'santimorales2000@gmail.com'
  
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    console.log(`Usuario ${email} no encontrado`)
    process.exit(1)
  }

  console.log(`Usuario actual: ${user.email} - Rol: ${user.role}`)

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'admin' },
  })

  console.log(`Usuario actualizado: ${updated.email} - Rol: ${updated.role}`)
  
  await prisma.$disconnect()
}

main().catch(console.error)
