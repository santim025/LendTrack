import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/clients/:id — Get client detail with loans, stats, and recent activity.
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

    const client = await prisma.client.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const loans = await prisma.loan.findMany({
      where: { userId: session.user.id, clientId: id },
      orderBy: { createdAt: "desc" },
      include: {
        payments: {
          where: { userId: session.user.id },
          select: { wasPaid: true, interestEarned: true, paymentMonth: true },
        },
      },
    })

    const loansWithDetails = loans.map((loan) => {
      const principal = Number(loan.principalAmount)
      const interestRate = Number(loan.interestRate)
      const monthlyInterest = principal * (interestRate / 100)
      const totalPayments = loan.payments.length
      const paidPayments = loan.payments.filter((p) => p.wasPaid).length
      const totalPaid = loan.payments
        .filter((p) => p.wasPaid)
        .reduce((sum, p) => sum + Number(p.interestEarned), 0)
      const progress = totalPayments > 0 ? Math.round((paidPayments / totalPayments) * 100) : 0

      const isOverdue =
        loan.status === "active" &&
        loan.payments.some((p) => !p.wasPaid && new Date(p.paymentMonth) < new Date())

      return {
        id: loan.id,
        principalAmount: principal,
        interestRate,
        monthlyInterest: Number(monthlyInterest.toFixed(2)),
        totalPayments,
        paidPayments,
        totalPaid: Number(totalPaid.toFixed(2)),
        progress,
        status: isOverdue ? "overdue" : loan.status,
        startDate: loan.startDate,
        createdAt: loan.createdAt,
      }
    })

    const activeLoans = loansWithDetails.filter(
      (l) => l.status === "active" || l.status === "overdue"
    )
    const totalLent = activeLoans.reduce((sum, l) => sum + l.principalAmount, 0)
    const totalPaid = loansWithDetails.reduce((sum, l) => sum + l.totalPaid, 0)

    const payments = await prisma.payment.findMany({
      where: { userId: session.user.id, loan: { clientId: id } },
      orderBy: { paymentDate: "desc" },
      take: 10,
      include: { loan: { select: { id: true } } },
    })

    const activities = payments
      .filter((p) => p.wasPaid)
      .map((p) => ({
        id: p.id,
        type: "payment" as const,
        description: "Payment received",
        amount: Number(p.interestEarned),
        timestamp: p.paymentDate?.toISOString() || p.createdAt.toISOString(),
      }))

    return NextResponse.json({
      client,
      loans: loansWithDetails,
      stats: {
        totalLent: Number(totalLent.toFixed(2)),
        totalPaid: Number(totalPaid.toFixed(2)),
        totalPending: Number((totalLent - totalPaid).toFixed(2)),
        totalInterest: Number(
          loansWithDetails
            .reduce((sum, l) => sum + l.monthlyInterest * l.totalPayments, 0)
            .toFixed(2)
        ),
        activeLoansCount: activeLoans.length,
        paidPaymentsCount: loansWithDetails.reduce((sum, l) => sum + l.paidPayments, 0),
        pendingPaymentsCount: loansWithDetails.reduce(
          (sum, l) => sum + (l.totalPayments - l.paidPayments),
          0
        ),
      },
      activities,
    })
  } catch (error) {
    console.error("Error fetching client detail:", error)
    return NextResponse.json({ error: "Failed to fetch client detail" }, { status: 500 })
  }
}

/**
 * DELETE /api/clients/:id — Delete a client and all associated data (cascade).
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

    const client = await prisma.client.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    await prisma.client.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting client:", error)
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 })
  }
}
