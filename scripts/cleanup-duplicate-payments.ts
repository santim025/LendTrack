import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Encontrar pagos duplicados (mismo loanId y paymentMonth)
  const allPayments = await prisma.payment.findMany({
    orderBy: { paymentMonth: 'asc' },
  })

  const seen = new Map<string, string[]>()
  const duplicatesToDelete: string[] = []

  for (const payment of allPayments) {
    const key = `${payment.loanId}-${payment.paymentMonth.toISOString()}`
    if (seen.has(key)) {
      // Mantener el más reciente (último en la lista)
      const existing = seen.get(key)!
      duplicatesToDelete.push(existing[0])
      existing.push(payment.id)
    } else {
      seen.set(key, [payment.id])
    }
  }

  console.log(`Pagos duplicados encontrados: ${duplicatesToDelete.length}`)

  if (duplicatesToDelete.length > 0) {
    const result = await prisma.payment.deleteMany({
      where: { id: { in: duplicatesToDelete } },
    })
    console.log(`Pagos eliminados: ${result.count}`)
  }

  await prisma.$disconnect()
}

main().catch(console.error)
