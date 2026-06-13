import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { GET } from "@/app/api/reports/consolidated/pdf/route"

vi.mocked(getServerSession).mockResolvedValue({
  user: { id: "user-1", email: "test@test.com", role: "user" },
  expires: "2099-01-01",
} as never)

describe("GET /api/reports/consolidated/pdf", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never)
    const req = new Request("http://localhost/api/reports/consolidated/pdf?from=2025-01&to=2025-06")
    const res = await GET(req as never)
    expect(res.status).toBe(401)
  })

  it("returns 400 when from parameter is missing", async () => {
    const req = new Request("http://localhost/api/reports/consolidated/pdf?to=2025-06")
    const res = await GET(req as never)
    expect(res.status).toBe(400)
  })

  it("returns 400 when to parameter is missing", async () => {
    const req = new Request("http://localhost/api/reports/consolidated/pdf?from=2025-01")
    const res = await GET(req as never)
    expect(res.status).toBe(400)
  })

  it("returns 400 when from format is invalid", async () => {
    const req = new Request("http://localhost/api/reports/consolidated/pdf?from=invalid&to=2025-06")
    const res = await GET(req as never)
    expect(res.status).toBe(400)
  })

  it("returns 400 when from is after to", async () => {
    const req = new Request("http://localhost/api/reports/consolidated/pdf?from=2025-06&to=2025-01")
    const res = await GET(req as never)
    expect(res.status).toBe(400)
  })

  it("returns PDF when parameters are valid", async () => {
    vi.mocked(prisma.payment.findMany).mockResolvedValueOnce([])

    const req = new Request("http://localhost/api/reports/consolidated/pdf?from=2025-01&to=2025-06")
    const res = await GET(req as never)
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("application/pdf")
  })
})
