import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { GET } from "@/app/api/dashboard/route"

vi.mock("@/lib/auto-generate-payments", () => ({
  generateMissingPayments: vi.fn().mockResolvedValue({ success: true, created: 0 }),
}))

vi.mocked(getServerSession).mockResolvedValue({
  user: { id: "user-1", email: "test@test.com", role: "user" },
  expires: "2099-01-01",
} as never)

const mockClient = { id: "c-1", name: "Juan", userId: "user-1", createdAt: new Date(), updatedAt: new Date(), phoneNumber: "123", address: "Calle 1", payageImageUrl: null }
const mockClient2 = { id: "c-2", name: "Maria", userId: "user-1", createdAt: new Date(), updatedAt: new Date(), phoneNumber: "456", address: "Calle 2", payageImageUrl: null }

const mockPayment = {
  id: "p-1",
  userId: "user-1",
  loanId: "l-1",
  paymentMonth: new Date(2025, 4, 31),
  interestEarned: 500000,
  wasPaid: true,
  paymentDate: new Date(2025, 4, 28),
  createdAt: new Date(),
  updatedAt: new Date(),
  loan: { id: "l-1", principalAmount: 5000000, interestRate: 10, client: { name: "Juan", id: "c-1" } },
}

const mockPayment2 = {
  id: "p-2",
  userId: "user-1",
  loanId: "l-2",
  paymentMonth: new Date(2025, 5, 30),
  interestEarned: 300000,
  wasPaid: true,
  paymentDate: new Date(2025, 5, 28),
  createdAt: new Date(),
  updatedAt: new Date(),
  loan: { id: "l-2", principalAmount: 3000000, interestRate: 10, client: { name: "Maria", id: "c-2" } },
}

const mockUpcomingPayment = {
  id: "p-3",
  userId: "user-1",
  loanId: "l-1",
  paymentMonth: new Date(2026, 6, 31),
  interestEarned: 500000,
  wasPaid: false,
  paymentDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  loan: { id: "l-1", principalAmount: 5000000, interestRate: 10, client: { name: "Juan" } },
}

const mockLoan = {
  id: "l-1",
  userId: "user-1",
  clientId: "c-1",
  principalAmount: 5000000,
  interestRate: 10,
  startDate: new Date(2025, 3, 1),
  paymentFrequencyDays: 30,
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date(),
  client: { name: "Juan" },
}

const mockLoan2 = {
  id: "l-2",
  userId: "user-1",
  clientId: "c-2",
  principalAmount: 3000000,
  interestRate: 10,
  startDate: new Date(2025, 3, 1),
  paymentFrequencyDays: 30,
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date(),
  client: { name: "Maria" },
}

function setupDashboardMocks(overrides: {
  capital?: any
  activeLoans?: any[]
  payments?: any[]
  upcomingPayments?: any[]
  clients?: any[]
  clientLoans?: any[]
  clientPayments?: any[]
  recentPayments?: any[]
  recentLoans?: any[]
  recentClients?: any[]
  aggregateResult?: any
} = {}) {
  const {
    capital = { initialCapital: 10000000 },
    activeLoans = [{ principalAmount: 5000000 }, { principalAmount: 3000000 }],
    payments = [mockPayment, mockPayment2],
    upcomingPayments = [mockUpcomingPayment],
    clients = [mockClient, mockClient2],
    clientLoans = [{ principalAmount: 5000000 }],
    clientPayments = [{ interestEarned: 500000 }],
    recentPayments = [mockPayment],
    recentLoans = [mockLoan],
    recentClients = [mockClient],
    aggregateResult = { _sum: { interestEarned: 800000 } },
  } = overrides

  let callCount = 0

  vi.mocked(prisma.userCapital.findUnique).mockResolvedValueOnce(capital as never)

  vi.mocked(prisma.loan.findMany).mockImplementationOnce(
    // @ts-expect-error PrismaPromise type mismatch with mock
    async () => activeLoans as any
  )

  vi.mocked(prisma.payment.findMany).mockImplementationOnce(
    // @ts-expect-error PrismaPromise type mismatch with mock
    async () => payments as any
  )

  vi.mocked(prisma.payment.findMany).mockImplementationOnce(
    // @ts-expect-error PrismaPromise type mismatch with mock
    async () => upcomingPayments as any
  )

  vi.mocked(prisma.client.findMany).mockImplementationOnce(
    // @ts-expect-error PrismaPromise type mismatch with mock
    async () => clients as any
  )

  for (const _client of clients) {
    vi.mocked(prisma.loan.findMany).mockImplementationOnce(
      // @ts-expect-error PrismaPromise type mismatch with mock
      async () => clientLoans as any
    )
    vi.mocked(prisma.payment.findMany).mockImplementationOnce(
      // @ts-expect-error PrismaPromise type mismatch with mock
      async () => clientPayments as any
    )
  }

  vi.mocked(prisma.payment.findMany).mockImplementationOnce(
    // @ts-expect-error PrismaPromise type mismatch with mock
    async () => recentPayments as any
  )

  vi.mocked(prisma.loan.findMany).mockImplementationOnce(
    // @ts-expect-error PrismaPromise type mismatch with mock
    async () => recentLoans as any
  )

  vi.mocked(prisma.client.findMany).mockImplementationOnce(
    // @ts-expect-error PrismaPromise type mismatch with mock
    async () => recentClients as any
  )

  vi.mocked(prisma.payment.aggregate).mockResolvedValueOnce(aggregateResult as never)
}

describe("GET /api/dashboard", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("returns dashboard data with empty state", async () => {
    setupDashboardMocks({
      capital: null,
      activeLoans: [],
      payments: [],
      upcomingPayments: [],
      clients: [],
      recentPayments: [],
      recentLoans: [],
      recentClients: [],
      aggregateResult: { _sum: { interestEarned: 0 } },
    })

    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.capital.current_capital).toBe(0)
    expect(data.capital.initial_capital).toBe(0)
    expect(data.totalLent).toBe(0)
    expect(data.collectionRate).toBe(0)
    expect(data.monthlyData).toEqual([])
    expect(data.upcomingPayments).toEqual([])
    expect(data.topClients).toEqual([])
    expect(data.activities).toEqual([])
  })

  it("returns dashboard data with capital", async () => {
    setupDashboardMocks({
      capital: { initialCapital: 10000000 },
      activeLoans: [],
      payments: [],
      upcomingPayments: [],
      clients: [],
      recentPayments: [],
      recentLoans: [],
      recentClients: [],
      aggregateResult: { _sum: { interestEarned: 0 } },
    })

    const res = await GET()
    const data = await res.json()
    expect(data.capital.initial_capital).toBe(10000000)
  })

  it("calculates totalLent from active loans", async () => {
    setupDashboardMocks({
      activeLoans: [{ principalAmount: 5000000 }, { principalAmount: 3000000 }],
      payments: [],
      upcomingPayments: [],
      clients: [],
      recentPayments: [],
      recentLoans: [],
      recentClients: [],
      aggregateResult: { _sum: { interestEarned: 0 } },
    })

    const res = await GET()
    const data = await res.json()
    expect(data.totalLent).toBe(8000000)
  })

  it("processes paid payments into monthlyData and totalInterests", async () => {
    setupDashboardMocks({
      payments: [mockPayment, mockPayment2],
      upcomingPayments: [],
      clients: [],
      recentPayments: [],
      recentLoans: [],
      recentClients: [],
      aggregateResult: { _sum: { interestEarned: 800000 } },
    })

    const res = await GET()
    const data = await res.json()
    expect(data.totalInterests).toBe(800000)
    expect(data.monthlyData.length).toBeGreaterThan(0)
    expect(data.monthlyData[0]).toHaveProperty("month")
    expect(data.monthlyData[0]).toHaveProperty("earnings")
  })

  it("returns upcoming payments with client name and calculated amount", async () => {
    setupDashboardMocks({
      payments: [],
      upcomingPayments: [mockUpcomingPayment],
      clients: [],
      recentPayments: [],
      recentLoans: [],
      recentClients: [],
      aggregateResult: { _sum: { interestEarned: 0 } },
    })

    const res = await GET()
    const data = await res.json()
    expect(data.upcomingPayments).toHaveLength(1)
    expect(data.upcomingPayments[0].clientName).toBe("Juan")
    expect(data.upcomingPayments[0].amount).toBe(500000)
    expect(data.upcomingPayments[0].loanId).toBe("l-1")
  })

  it("returns top clients sorted by total paid", async () => {
    setupDashboardMocks({
      payments: [],
      upcomingPayments: [],
      clients: [mockClient, mockClient2],
      clientLoans: [{ principalAmount: 5000000 }],
      clientPayments: [{ interestEarned: 500000 }],
      recentPayments: [],
      recentLoans: [],
      recentClients: [],
      aggregateResult: { _sum: { interestEarned: 0 } },
    })

    const res = await GET()
    const data = await res.json()
    expect(data.topClients.length).toBe(2)
    expect(data.topClients[0]).toHaveProperty("id")
    expect(data.topClients[0]).toHaveProperty("name")
    expect(data.topClients[0]).toHaveProperty("totalLoans")
    expect(data.topClients[0]).toHaveProperty("totalPaid")
  })

  it("builds activities from payments, loans, and clients", async () => {
    setupDashboardMocks({
      payments: [],
      upcomingPayments: [],
      clients: [mockClient],
      clientLoans: [],
      clientPayments: [],
      recentPayments: [mockPayment],
      recentLoans: [mockLoan],
      recentClients: [mockClient],
      aggregateResult: { _sum: { interestEarned: 0 } },
    })

    const res = await GET()
    const data = await res.json()
    expect(data.activities.length).toBe(3)

    const paymentActivity = data.activities.find((a: any) => a.type === "payment")
    expect(paymentActivity).toBeDefined()
    expect(paymentActivity.description).toContain("Juan")
    expect(paymentActivity.amount).toBe(500000)

    const loanActivity = data.activities.find((a: any) => a.type === "loan")
    expect(loanActivity).toBeDefined()
    expect(loanActivity.description).toContain("Juan")
    expect(loanActivity.amount).toBe(5000000)

    const clientActivity = data.activities.find((a: any) => a.type === "client")
    expect(clientActivity).toBeDefined()
    expect(clientActivity.description).toContain("Juan")
  })

  it("calculates collection rate correctly", async () => {
    setupDashboardMocks({
      activeLoans: [{ principalAmount: 10000000 }],
      payments: [],
      upcomingPayments: [],
      clients: [],
      recentPayments: [],
      recentLoans: [],
      recentClients: [],
      aggregateResult: { _sum: { interestEarned: 500000 } },
    })

    const res = await GET()
    const data = await res.json()
    expect(data.collectionRate).toBeGreaterThan(0)
    expect(data.collectionRate).toBeLessThanOrEqual(100)
  })

  it("returns 0 collection rate when no loans", async () => {
    setupDashboardMocks({
      activeLoans: [],
      payments: [],
      upcomingPayments: [],
      clients: [],
      recentPayments: [],
      recentLoans: [],
      recentClients: [],
      aggregateResult: { _sum: { interestEarned: 0 } },
    })

    const res = await GET()
    const data = await res.json()
    expect(data.collectionRate).toBe(0)
  })

  it("adds capital to totalInterests for current_capital", async () => {
    setupDashboardMocks({
      capital: { initialCapital: 10000000 },
      activeLoans: [],
      payments: [mockPayment],
      upcomingPayments: [],
      clients: [],
      recentPayments: [],
      recentLoans: [],
      recentClients: [],
      aggregateResult: { _sum: { interestEarned: 500000 } },
    })

    const res = await GET()
    const data = await res.json()
    expect(data.capital.current_capital).toBe(10500000)
    expect(data.capital.initial_capital).toBe(10000000)
  })

  it("handles payment with null paymentDate in activities", async () => {
    const paymentNoDate = { ...mockPayment, paymentDate: null }
    setupDashboardMocks({
      payments: [],
      upcomingPayments: [],
      clients: [],
      recentPayments: [paymentNoDate],
      recentLoans: [],
      recentClients: [],
      aggregateResult: { _sum: { interestEarned: 0 } },
    })

    const res = await GET()
    const data = await res.json()
    expect(data.activities.length).toBe(1)
    expect(data.activities[0].timestamp).toBeDefined()
  })

  it("returns 500 on database error", async () => {
    vi.mocked(prisma.userCapital.findUnique).mockRejectedValueOnce(new Error("DB error"))
    const res = await GET()
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBe("Failed to fetch dashboard data")
  })
})
