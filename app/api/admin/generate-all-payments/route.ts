import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPaymentsNeeded, getPaymentDate } from "@/lib/payment-schedule"

/**
 * POST /api/admin/generate-all-payments — Admin-only: regenerate all missing payments.
 * Requires the authenticated user to have role "admin".
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const userId = session.user.id
    const today = new Date()

    const loans = await prisma.loan.findMany({
      where: { userId },
      include: { payments: { orderBy: { paymentMonth: "asc" } } },
    })

    let totalCreated = 0
    const results = []

    for (const loan of loans) {
      const totalPaymentsNeeded = getPaymentsNeeded(loan.startDate, today)
      const existingPayments = loan.payments.length
      const paymentsToCreate = totalPaymentsNeeded - existingPayments

      if (paymentsToCreate <= 0) {
        results.push({ loanId: loan.id, created: 0 })
        continue
      }

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
      results.push({ loanId: loan.id, created: paymentsToCreate })
    }

    return NextResponse.json({ success: true, totalCreated, results })
  } catch (error) {
    console.error("Error generating all payments:", error)
    return NextResponse.json({ error: "Failed to generate payments" }, { status: 500 })
  }
}
