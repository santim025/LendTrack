import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateMissingPayments } from "@/lib/auto-generate-payments"

/**
 * GET /api/payments — List all payments with overdue status.
 * Auto-generates missing payments before returning.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await generateMissingPayments()

    const payments = await prisma.payment.findMany({
      where: { userId: session.user.id },
      include: {
        loan: { include: { client: { select: { id: true, name: true } } } },
      },
      orderBy: { paymentMonth: "asc" },
    })

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const transformedPayments = payments.map((payment) => {
      const paymentDate = new Date(payment.paymentMonth)
      paymentDate.setHours(0, 0, 0, 0)
      const daysUntil = Math.ceil(
        (paymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      return {
        id: payment.id,
        loan_id: payment.loanId,
        payment_month: payment.paymentMonth.toISOString().split("T")[0],
        interest_earned: Number(payment.interestEarned),
        was_paid: payment.wasPaid,
        payment_date: payment.paymentDate?.toISOString() || null,
        is_overdue: !payment.wasPaid && daysUntil < 0,
        days_until: daysUntil,
        loans: {
          id: payment.loan.id,
          clients: { id: payment.loan.client.id, name: payment.loan.client.name },
        },
      }
    })

    return NextResponse.json(transformedPayments)
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}
