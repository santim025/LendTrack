import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { GET, PUT } from "@/app/api/capital/route"

vi.mocked(getServerSession).mockResolvedValue({
  user: { id: "user-1", email: "test@test.com", role: "user" },
  expires: "2099-01-01",
} as never)

describe("GET /api/capital", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("returns capital when it exists", async () => {
    const capital = {
      id: "cap-1",
      userId: "user-1",
      currentCapital: 10000,
      initialCapital: 10000,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    vi.mocked(prisma.userCapital.findUnique).mockResolvedValueOnce(capital as never)

    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe("cap-1")
    expect(data.initialCapital).toBe(10000)
    expect(data.currentCapital).toBe(10000)
  })

  it("returns null when no capital record exists", async () => {
    vi.mocked(prisma.userCapital.findUnique).mockResolvedValueOnce(null)

    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toBeNull()
  })
})

describe("PUT /api/capital", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never)
    const req = new Request("http://localhost/api/capital", {
      method: "PUT",
      body: JSON.stringify({ initialCapital: 5000 }),
    })
    const res = await PUT(req as never)
    expect(res.status).toBe(401)
  })

  it("returns 400 when initialCapital is missing", async () => {
    const req = new Request("http://localhost/api/capital", {
      method: "PUT",
      body: JSON.stringify({}),
    })
    const res = await PUT(req as never)
    expect(res.status).toBe(400)
  })

  it("returns 400 when initialCapital is negative", async () => {
    const req = new Request("http://localhost/api/capital", {
      method: "PUT",
      body: JSON.stringify({ initialCapital: -100 }),
    })
    const res = await PUT(req as never)
    expect(res.status).toBe(400)
  })

  it("returns 400 when initialCapital is not a number", async () => {
    const req = new Request("http://localhost/api/capital", {
      method: "PUT",
      body: JSON.stringify({ initialCapital: "abc" }),
    })
    const res = await PUT(req as never)
    expect(res.status).toBe(400)
  })

  it("creates capital when no record exists (upsert)", async () => {
    const capital = {
      id: "cap-1",
      userId: "user-1",
      currentCapital: 5000,
      initialCapital: 5000,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    vi.mocked(prisma.userCapital.upsert).mockResolvedValueOnce(capital as never)

    const req = new Request("http://localhost/api/capital", {
      method: "PUT",
      body: JSON.stringify({ initialCapital: 5000 }),
    })
    const res = await PUT(req as never)
    expect(res.status).toBe(200)
    expect(prisma.userCapital.upsert).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      update: { initialCapital: 5000 },
      create: { userId: "user-1", initialCapital: 5000, currentCapital: 5000 },
    })
  })

  it("updates capital when record exists (upsert)", async () => {
    const capital = {
      id: "cap-1",
      userId: "user-1",
      currentCapital: 10000,
      initialCapital: 10000,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    vi.mocked(prisma.userCapital.upsert).mockResolvedValueOnce(capital as never)

    const req = new Request("http://localhost/api/capital", {
      method: "PUT",
      body: JSON.stringify({ initialCapital: 10000 }),
    })
    const res = await PUT(req as never)
    expect(res.status).toBe(200)
  })

  it("returns 500 on database error (GET)", async () => {
    vi.mocked(prisma.userCapital.findUnique).mockRejectedValueOnce(new Error("DB error"))
    const res = await GET()
    expect(res.status).toBe(500)
  })

  it("returns 500 on database error (PUT)", async () => {
    vi.mocked(prisma.userCapital.upsert).mockRejectedValueOnce(new Error("DB error"))
    const req = new Request("http://localhost/api/capital", {
      method: "PUT",
      body: JSON.stringify({ initialCapital: 5000 }),
    })
    const res = await PUT(req as never)
    expect(res.status).toBe(500)
  })
})
