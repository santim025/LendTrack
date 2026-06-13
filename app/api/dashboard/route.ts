import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateMissingPayments } from "@/lib/auto-generate-payments"

/**
 * GET /api/dashboard — Aggregate dashboard data.
 * Auto-generates missing payments before computing stats.
 * Returns: capital, totalLent, monthlyData, upcomingPayments, topClients, activities.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await generateMissingPayments()

    const userId = session.user.id

    const capital = await prisma.userCapital.findUnique({ where: { userId } })

    const activeLoans = await prisma.loan.findMany({
      where: { userId, status: "active" },
      select: { principalAmount: true },
    })
    const totalLent = activeLoans.reduce(
      (sum, loan) => sum + Number(loan.principalAmount),
      0
    )

    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { paymentMonth: "desc" },
      take: 12,
      include: {
        loan: { include: { client: { select: { name: true, id: true } } } },
      },
    })

    const totalInterests = payments
      .filter((p) => p.wasPaid)
      .reduce((sum, p) => sum + Number(p.interestEarned), 0)

    const monthMap = new Map<string, number>()
    payments.forEach((payment) => {
      if (payment.wasPaid) {
        const month = new Date(payment.paymentMonth).toLocaleDateString("es-ES", {
          month: "short",
          year: "numeric",
        })
        monthMap.set(month, (monthMap.get(month) || 0) + Number(payment.interestEarned))
      }
    })

    const monthlyData = Array.from(monthMap, ([month, earnings]) => ({
      month,
      earnings: Number(earnings.toFixed(2)),
    })).reverse()

    const upcomingPaymentsList = await prisma.payment.findMany({
      where: { userId, wasPaid: false, paymentMonth: { gte: new Date() } },
      orderBy: { paymentMonth: "asc" },
      take: 5,
      include: { loan: { include: { client: { select: { name: true } } } } },
    })

    const upcomingPayments = upcomingPaymentsList.map((p) => ({
      id: p.id,
      clientName: p.loan.client.name,
      amount: Number(
        (Number(p.loan.principalAmount) * (Number(p.loan.interestRate) / 100)).toFixed(2)
      ),
      dueDate: p.paymentMonth.toISOString(),
      loanId: p.loanId,
    }))

    const allClients = await prisma.client.findMany({ where: { userId } })

    const clientsWithTotals = await Promise.all(
      allClients.map(async (client) => {
        const loans = await prisma.loan.findMany({
          where: { userId, clientId: client.id },
          select: { principalAmount: true },
        })
        const clientPayments = await prisma.payment.findMany({
          where: { userId, loan: { clientId: client.id }, wasPaid: true },
          select: { interestEarned: true },
        })

        return {
          id: client.id,
          name: client.name,
          totalLoans: loans.length,
          totalPaid: Number(
            clientPayments
              .reduce((sum, p) => sum + Number(p.interestEarned), 0)
              .toFixed(2)
          ),
        }
      })
    )

    const topClients = clientsWithTotals
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 5)

    const [recentPayments, recentLoans, recentClients] = await Promise.all([
      prisma.payment.findMany({
        where: { userId, wasPaid: true },
        orderBy: { paymentDate: "desc" },
        take: 50,
        include: { loan: { include: { client: { select: { name: true } } } } },
      }),
      prisma.loan.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { client: { select: { name: true } } },
      }),
      prisma.client.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ])

    const activities: Array<{
      id: string
      type: "payment" | "loan" | "client"
      description: string
      amount?: number
      timestamp: string
    }> = []

    recentPayments.forEach((p) => {
      activities.push({
        id: `payment-${p.id}`,
        type: "payment",
        description: `${p.loan.client.name} realizó un pago`,
        amount: Number(p.interestEarned),
        timestamp: p.paymentDate?.toISOString() || p.createdAt.toISOString(),
      })
    })

    recentLoans.forEach((l) => {
      activities.push({
        id: `loan-${l.id}`,
        type: "loan",
        description: `Nuevo préstamo a ${l.client.name}`,
        amount: Number(l.principalAmount),
        timestamp: l.createdAt.toISOString(),
      })
    })

    recentClients.forEach((c) => {
      activities.push({
        id: `client-${c.id}`,
        type: "client",
        description: `Nuevo cliente: ${c.name}`,
        timestamp: c.createdAt.toISOString(),
      })
    })

    activities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    const totalPaid = await prisma.payment.aggregate({
      where: { userId, wasPaid: true },
      _sum: { interestEarned: true },
    })

    const collectionRate =
      totalLent > 0
        ? Math.min(
            100,
            Math.round(
              ((Number(totalPaid._sum.interestEarned) || 0) / (totalLent * 0.1)) * 100
            )
          )
        : 0

    return NextResponse.json({
      capital: {
        current_capital: Number(capital?.initialCapital || 0) + totalInterests,
        initial_capital: Number(capital?.initialCapital || 0),
      },
      totalLent,
      monthlyData,
      totalInterests,
      upcomingPayments,
      topClients,
      activities: activities.slice(0, 50),
      collectionRate,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
