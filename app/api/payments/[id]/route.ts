import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPaymentDate } from "@/lib/payment-schedule"

/**
 * PUT /api/payments/:id
 * Toggle payment status (paid/unpaid). When marking as paid, creates the next
 * month's payment if it doesn't exist yet.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { wasPaid } = body

    if (typeof wasPaid !== "boolean") {
      return NextResponse.json(
        { error: "Field 'wasPaid' is required and must be a boolean" },
        { status: 400 }
      )
    }

    const payment = await prisma.payment.findFirst({
      where: { id, userId: session.user.id },
      include: { loan: true },
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        wasPaid,
        paymentDate: wasPaid ? new Date() : null,
      },
    })

    if (wasPaid && !payment.wasPaid) {
      const currentMonth = new Date(payment.paymentMonth).getUTCMonth()
      const currentYear = new Date(payment.paymentMonth).getUTCFullYear()
      const startMonth = new Date(payment.loan.startDate).getUTCMonth()
      const startYear = new Date(payment.loan.startDate).getUTCFullYear()
      const currentPaymentNumber =
        (currentYear - startYear) * 12 + (currentMonth - startMonth)
      const nextPaymentNumber = currentPaymentNumber + 1

      const nextPaymentMonth = getPaymentDate(payment.loan.startDate, nextPaymentNumber)

      const existingPayment = await prisma.payment.findFirst({
        where: {
          loanId: payment.loanId,
          paymentMonth: nextPaymentMonth,
        },
      })

      if (!existingPayment) {
        const monthlyInterest =
          Number(payment.loan.principalAmount) * (Number(payment.loan.interestRate) / 100)

        await prisma.payment.create({
          data: {
            userId: session.user.id,
            loanId: payment.loanId,
            paymentMonth: nextPaymentMonth,
            interestEarned: monthlyInterest,
            wasPaid: false,
          },
        })
      }
    }

    return NextResponse.json(updatedPayment)
  } catch (error) {
    console.error("Error updating payment:", error)
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 })
  }
}
