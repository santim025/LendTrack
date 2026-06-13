import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { POST } from "@/app/api/reports/consolidated/email/route"

vi.mock("@/lib/reports/send-email", () => ({
  sendReportEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mocked(getServerSession).mockResolvedValue({
  user: { id: "user-1", email: "test@test.com", role: "user" },
  expires: "2099-01-01",
} as never)

describe("POST /api/reports/consolidated/email", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never)
    const req = new Request("http://localhost/api/reports/consolidated/email", {
      method: "POST",
      body: JSON.stringify({ from: "2025-01", to: "2025-06", recipient: "test@test.com" }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(401)
  })

  it("returns 400 when body is invalid JSON", async () => {
    const req = new Request("http://localhost/api/reports/consolidated/email", {
      method: "POST",
      body: "not json",
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it("returns 400 when from is missing", async () => {
    const req = new Request("http://localhost/api/reports/consolidated/email", {
      method: "POST",
      body: JSON.stringify({ to: "2025-06", recipient: "test@test.com" }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it("returns 400 when recipient is invalid email", async () => {
    const req = new Request("http://localhost/api/reports/consolidated/email", {
      method: "POST",
      body: JSON.stringify({ from: "2025-01", to: "2025-06", recipient: "not-an-email" }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it("returns 400 when from is after to", async () => {
    const req = new Request("http://localhost/api/reports/consolidated/email", {
      method: "POST",
      body: JSON.stringify({ from: "2025-06", to: "2025-01", recipient: "test@test.com" }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it("sends email when parameters are valid", async () => {
    vi.mocked(prisma.payment.findMany).mockResolvedValueOnce([])

    const req = new Request("http://localhost/api/reports/consolidated/email", {
      method: "POST",
      body: JSON.stringify({ from: "2025-01", to: "2025-06", recipient: "test@test.com" }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.sent).toBe(true)
  })
})
