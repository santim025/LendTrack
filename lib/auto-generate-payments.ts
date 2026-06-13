import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPaymentsNeeded, getPaymentDate } from "@/lib/payment-schedule"

/**
 * Auto-generates missing payments for all active loans of the authenticated user.
 * Called automatically by Dashboard, Payments, and Loans endpoints.
 * Payments are only generated up to the current month (never future months).
 *
 * @returns { success: boolean, created: number }
 */
export async function generateMissingPayments(): Promise<{
  success: boolean
  created: number
}> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, created: 0 }
    }

    const userId = session.user.id
    const today = new Date()

    const loans = await prisma.loan.findMany({
      where: { userId, status: "active" },
      include: { payments: { orderBy: { paymentMonth: "asc" } } },
    })

    let totalCreated = 0

    for (const loan of loans) {
      const totalPaymentsNeeded = getPaymentsNeeded(loan.startDate, today)
      const existingPayments = loan.payments.length
      const paymentsToCreate = totalPaymentsNeeded - existingPayments

      if (paymentsToCreate <= 0) continue

      const monthlyInterest =
        Number(loan.principalAmount) * (Number(loan.interestRate) / 100)

      const paymentsData = []
      for (let i = 0; i < paymentsToCreate; i++) {
        const paymentNumber = existingPayments + i + 1
        paymentsData.push({
          userId,
          loanId: loan.id,
          paymentMonth: getPaymentDate(loan.startDate, paymentNumber),
          interestEarned: monthlyInterest,
          wasPaid: false,
        })
      }

      await prisma.payment.createMany({ data: paymentsData })
      totalCreated += paymentsToCreate
    }

    return { success: true, created: totalCreated }
  } catch (error) {
    console.error("Error generating missing payments:", error)
    return { success: false, created: 0 }
  }
}
