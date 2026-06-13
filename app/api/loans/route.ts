import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateMissingPayments } from "@/lib/auto-generate-payments"
import { getPaymentsNeeded, getPaymentDate } from "@/lib/payment-schedule"

/**
 * GET /api/loans — List all loans with payment progress.
 * Auto-generates missing payments before returning.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await generateMissingPayments()

    const loans = await prisma.loan.findMany({
      where: { userId: session.user.id },
      include: {
        client: { select: { name: true, id: true } },
        payments: { where: { userId: session.user.id }, select: { wasPaid: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const transformedLoans = loans.map((loan) => {
      const totalPayments = loan.payments.length
      const paidPayments = loan.payments.filter((p) => p.wasPaid).length

      return {
        id: loan.id,
        client_id: loan.clientId,
        principal_amount: Number(loan.principalAmount),
        interest_rate: Number(loan.interestRate),
        start_date: loan.startDate.toISOString().split("T")[0],
        payment_frequency_days: loan.paymentFrequencyDays,
        status: loan.status,
        clients: { name: loan.client.name, id: loan.client.id },
        payments: {
          total: totalPayments,
          paid: paidPayments,
          pending: totalPayments - paidPayments,
        },
      }
    })

    return NextResponse.json(transformedLoans)
  } catch (error) {
    console.error("Error fetching loans:", error)
    return NextResponse.json({ error: "Failed to fetch loans" }, { status: 500 })
  }
}

/**
 * POST /api/loans — Create a new loan and generate initial payments.
 * @body { clientId: string, principalAmount: number, interestRate: number,
 *         startDate: string, paymentFrequencyDays: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, principalAmount, interestRate, startDate, paymentFrequencyDays } = body

    if (!clientId || !principalAmount || !interestRate || !startDate || !paymentFrequencyDays) {
      return NextResponse.json(
        {
          error:
            "Fields 'clientId', 'principalAmount', 'interestRate', 'startDate', and 'paymentFrequencyDays' are required",
        },
        { status: 400 }
      )
    }

    if (typeof principalAmount !== "number" || principalAmount <= 0) {
      return NextResponse.json(
        { error: "'principalAmount' must be a positive number" },
        { status: 400 }
      )
    }

    if (typeof interestRate !== "number" || interestRate <= 0 || interestRate > 100) {
      return NextResponse.json(
        { error: "'interestRate' must be a number between 0 and 100" },
        { status: 400 }
      )
    }

    const loanStartDate = new Date(startDate)
    if (isNaN(loanStartDate.getTime())) {
      return NextResponse.json(
        { error: "'startDate' must be a valid date" },
        { status: 400 }
      )
    }

    const loan = await prisma.loan.create({
      data: {
        userId: session.user.id,
        clientId,
        principalAmount,
        interestRate,
        startDate: loanStartDate,
        paymentFrequencyDays: parseInt(paymentFrequencyDays),
        status: "active",
      },
    })

    const monthlyInterest = (principalAmount * interestRate) / 100
    const totalPaymentsToCreate = Math.max(getPaymentsNeeded(loanStartDate), 1)

    const paymentsToCreate = []
    for (let i = 0; i < totalPaymentsToCreate; i++) {
      paymentsToCreate.push({
        userId: session.user.id,
        loanId: loan.id,
        paymentMonth: getPaymentDate(loanStartDate, i + 1),
        interestEarned: monthlyInterest,
        wasPaid: false,
      })
    }

    await prisma.payment.createMany({ data: paymentsToCreate })

    return NextResponse.json(loan, { status: 201 })
  } catch (error) {
    console.error("Error creating loan:", error)
    return NextResponse.json({ error: "Failed to create loan" }, { status: 500 })
  }
}
