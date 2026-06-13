import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPaymentsNeeded, getPaymentDate } from "@/lib/payment-schedule"

/**
 * POST /api/loans/:id/generate-payments — Generate missing payments for a single loan.
 * Creates payments from the last existing one up to the current month.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const loan = await prisma.loan.findFirst({
      where: { id, userId: session.user.id },
      include: { payments: { orderBy: { paymentMonth: "asc" } } },
    })

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    }

    const today = new Date()
    const totalPaymentsNeeded = getPaymentsNeeded(loan.startDate, today)
    const existingPayments = loan.payments.length
    const paymentsToCreate = totalPaymentsNeeded - existingPayments

    if (paymentsToCreate <= 0) {
      return NextResponse.json({ success: true, message: "No missing payments", created: 0 })
    }

    const monthlyInterest =
      Number(loan.principalAmount) * (Number(loan.interestRate) / 100)

    const paymentsData = []
    for (let i = 0; i < paymentsToCreate; i++) {
      const paymentNumber = existingPayments + i + 1
      paymentsData.push({
        userId: session.user.id,
        loanId: loan.id,
        paymentMonth: getPaymentDate(loan.startDate, paymentNumber),
        interestEarned: monthlyInterest,
        wasPaid: false,
      })
    }

    await prisma.payment.createMany({ data: paymentsData })

    return NextResponse.json({
      success: true,
      message: `Generated ${paymentsToCreate} payments`,
      created: paymentsToCreate,
    })
  } catch (error) {
    console.error("Error generating payments:", error)
    return NextResponse.json({ error: "Failed to generate payments" }, { status: 500 })
  }
}
