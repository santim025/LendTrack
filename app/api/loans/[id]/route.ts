import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/loans/:id — Get loan detail with payments, summary, and client info.
 */
export async function GET(
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
      include: {
        client: { select: { id: true, name: true } },
        payments: {
          where: { userId: session.user.id },
          orderBy: { paymentMonth: "asc" },
        },
      },
    })

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    }

    const principalAmount = Number(loan.principalAmount)
    const interestRate = Number(loan.interestRate)
    const monthlyInterest = principalAmount * (interestRate / 100)

    const totalPayments = loan.payments.length
    const paidPayments = loan.payments.filter((p) => p.wasPaid).length
    const totalPaid = loan.payments
      .filter((p) => p.wasPaid)
      .reduce((sum, p) => sum + Number(p.interestEarned), 0)
    const totalInterest = monthlyInterest * totalPayments
    const progress = totalPayments > 0 ? Math.round((paidPayments / totalPayments) * 100) : 0

    const now = new Date()
    const nextPayment = loan.payments.find(
      (p) => !p.wasPaid && new Date(p.paymentMonth) >= now
    )
    const hasOverdue = loan.payments.some(
      (p) => !p.wasPaid && new Date(p.paymentMonth) < now
    )

    const paymentsWithStatus = loan.payments.map((payment, index) => ({
      id: payment.id,
      number: index + 1,
      paymentMonth: payment.paymentMonth.toISOString().split("T")[0],
      interestEarned: Number(payment.interestEarned),
      wasPaid: payment.wasPaid,
      paymentDate: payment.paymentDate?.toISOString().split("T")[0] || null,
      isOverdue: !payment.wasPaid && new Date(payment.paymentMonth) < now,
      isCurrent: nextPayment ? payment.id === nextPayment.id : false,
    }))

    return NextResponse.json({
      loan: {
        id: loan.id,
        principalAmount,
        interestRate,
        monthlyInterest: Number(monthlyInterest.toFixed(2)),
        startDate: loan.startDate.toISOString().split("T")[0],
        paymentFrequencyDays: loan.paymentFrequencyDays,
        status: loan.status,
        createdAt: loan.createdAt.toISOString(),
      },
      client: loan.client,
      payments: paymentsWithStatus,
      summary: {
        totalPayments,
        paidPayments,
        pendingPayments: totalPayments - paidPayments,
        totalPaid: Number(totalPaid.toFixed(2)),
        totalInterest: Number(totalInterest.toFixed(2)),
        totalToReceive: Number((principalAmount + totalInterest).toFixed(2)),
        progress,
        nextPaymentDate: nextPayment
          ? nextPayment.paymentMonth.toISOString().split("T")[0]
          : null,
        hasOverdue,
      },
    })
  } catch (error) {
    console.error("Error fetching loan:", error)
    return NextResponse.json({ error: "Failed to fetch loan" }, { status: 500 })
  }
}

/**
 * PUT /api/loans/:id — Update loan terms (interest rate, frequency, additional capital).
 * Recalculates interest on all unpaid pending payments.
 * @body { interestRate?: number, paymentFrequencyDays?: number, additionalCapital?: number }
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
    const { interestRate, paymentFrequencyDays, additionalCapital } = body

    const loan = await prisma.loan.findFirst({
      where: { id, userId: session.user.id },
      include: {
        payments: { where: { wasPaid: false }, orderBy: { paymentMonth: "asc" } },
      },
    })

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (interestRate !== undefined) {
      if (typeof interestRate !== "number" || interestRate <= 0 || interestRate > 100) {
        return NextResponse.json(
          { error: "'interestRate' must be a number between 0 and 100" },
          { status: 400 }
        )
      }
      updateData.interestRate = interestRate
    }

    if (paymentFrequencyDays !== undefined) {
      if (typeof paymentFrequencyDays !== "number" || paymentFrequencyDays <= 0) {
        return NextResponse.json(
          { error: "'paymentFrequencyDays' must be a positive number" },
          { status: 400 }
        )
      }
      updateData.paymentFrequencyDays = paymentFrequencyDays
    }

    if (additionalCapital !== undefined) {
      if (typeof additionalCapital !== "number" || additionalCapital <= 0) {
        return NextResponse.json(
          { error: "'additionalCapital' must be a positive number" },
          { status: 400 }
        )
      }
      updateData.principalAmount = { increment: additionalCapital }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const updatedLoan = await prisma.loan.update({ where: { id }, data: updateData })

    if (interestRate !== undefined || additionalCapital !== undefined) {
      const newPrincipal = additionalCapital
        ? Number(updatedLoan.principalAmount)
        : Number(loan.principalAmount)
      const newRate = interestRate ?? Number(loan.interestRate)
      const newMonthlyInterest = newPrincipal * (newRate / 100)

      await prisma.payment.updateMany({
        where: { loanId: id, wasPaid: false },
        data: { interestEarned: newMonthlyInterest },
      })
    }

    return NextResponse.json({
      success: true,
      loan: {
        id: updatedLoan.id,
        principalAmount: Number(updatedLoan.principalAmount),
        interestRate: Number(updatedLoan.interestRate),
        paymentFrequencyDays: updatedLoan.paymentFrequencyDays,
      },
    })
  } catch (error) {
    console.error("Error updating loan:", error)
    return NextResponse.json({ error: "Failed to update loan" }, { status: 500 })
  }
}

/**
 * DELETE /api/loans/:id — Delete a loan and all its payments (cascade).
 */
export async function DELETE(
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
    })

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    }

    await prisma.payment.deleteMany({ where: { loanId: id } })
    await prisma.loan.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting loan:", error)
    return NextResponse.json({ error: "Failed to delete loan" }, { status: 500 })
  }
}
