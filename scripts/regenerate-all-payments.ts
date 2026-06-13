import { PrismaClient } from '@prisma/client'
import { getPaymentsNeeded, getPaymentDate } from '../lib/payment-schedule'

const prisma = new PrismaClient()

async function main() {
  const today = new Date()

  const loans = await prisma.loan.findMany({
    include: {
      payments: true,
    },
  })

  console.log(`Préstamos encontrados: ${loans.length}`)

  for (const loan of loans) {
    // Eliminar todos los pagos existentes
    await prisma.payment.deleteMany({
      where: { loanId: loan.id },
    })

    const startDate = loan.startDate

    // Cuotas desde el mes siguiente al inicio hasta el mes actual (inclusive)
    const totalPaymentsNeeded = getPaymentsNeeded(startDate, today)

    const monthlyInterest = Number(loan.principalAmount) * (Number(loan.interestRate) / 100)

    const paymentsToCreate = []
    for (let i = 0; i < totalPaymentsNeeded; i++) {
      const paymentNumber = i + 1
      paymentsToCreate.push({
        userId: loan.userId,
        loanId: loan.id,
        paymentMonth: getPaymentDate(startDate, paymentNumber),
        interestEarned: monthlyInterest,
        wasPaid: false,
      })
    }

    await prisma.payment.createMany({
      data: paymentsToCreate,
    })

    console.log(`✓ Préstamo ${loan.id}: ${totalPaymentsNeeded} pagos generados`)
    console.log(`  Desde: ${paymentsToCreate[0].paymentMonth.toLocaleDateString('es-ES', {month: 'long', year: 'numeric'})}`)
    console.log(`  Hasta: ${paymentsToCreate[paymentsToCreate.length - 1].paymentMonth.toLocaleDateString('es-ES', {month: 'long', year: 'numeric'})}`)
  }

  await prisma.$disconnect()
}

main().catch(console.error)
