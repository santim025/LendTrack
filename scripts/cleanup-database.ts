import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Limpiando base de datos...\n')

  // Eliminar en orden para respetar relaciones
  const payments = await prisma.payment.deleteMany()
  console.log(`✓ Pagos eliminados: ${payments.count}`)

  const loans = await prisma.loan.deleteMany()
  console.log(`✓ Préstamos eliminados: ${loans.count}`)

  const clients = await prisma.client.deleteMany()
  console.log(`✓ Clientes eliminados: ${clients.count}`)

  const capital = await prisma.userCapital.deleteMany()
  console.log(`✓ Capital eliminado: ${capital.count}`)

  console.log('\n✅ Base de datos limpia. Lista para pruebas.')
  
  await prisma.$disconnect()
}

main().catch(console.error)
