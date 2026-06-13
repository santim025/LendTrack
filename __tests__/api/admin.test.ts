import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { GET } from "@/app/api/admin/users/route"
import { DELETE } from "@/app/api/admin/users/[id]/route"

const adminSession = {
  user: { id: "admin-1", email: "admin@test.com", role: "admin" },
  expires: "2099-01-01",
}

const userSession = {
  user: { id: "user-1", email: "user@test.com", role: "user" },
  expires: "2099-01-01",
}

describe("GET /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerSession).mockResolvedValue(adminSession as never)
  })

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("returns 403 when not admin", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(userSession as never)
    const res = await GET()
    expect(res.status).toBe(403)
  })

  it("returns users list for admin", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
      {
        id: "u-1",
        email: "user@test.com",
        role: "user",
        createdAt: new Date(),
        lastLogin: null,
        _count: { clients: 5, loans: 3, payments: 10 },
      },
    ] as never)
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].clients).toBe(5)
  })

  it("returns 500 on database error", async () => {
    vi.mocked(prisma.user.findMany).mockRejectedValueOnce(new Error("DB error"))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

describe("DELETE /api/admin/users/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerSession).mockResolvedValue(adminSession as never)
  })

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never)
    const req = new Request("http://localhost/api/admin/users/u-1", { method: "DELETE" })
    const res = await DELETE(req as never, { params: Promise.resolve({ id: "u-1" }) })
    expect(res.status).toBe(401)
  })

  it("returns 403 when not admin", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(userSession as never)
    const req = new Request("http://localhost/api/admin/users/u-1", { method: "DELETE" })
    const res = await DELETE(req as never, { params: Promise.resolve({ id: "u-1" }) })
    expect(res.status).toBe(403)
  })

  it("returns 400 when trying to delete yourself", async () => {
    const req = new Request("http://localhost/api/admin/users/admin-1", { method: "DELETE" })
    const res = await DELETE(req as never, { params: Promise.resolve({ id: "admin-1" }) })
    expect(res.status).toBe(400)
  })

  it("returns 404 when user not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
    const req = new Request("http://localhost/api/admin/users/u-1", { method: "DELETE" })
    const res = await DELETE(req as never, { params: Promise.resolve({ id: "u-1" }) })
    expect(res.status).toBe(404)
  })

  it("returns 403 when trying to delete another admin", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "admin-2",
      role: "admin",
    } as never)
    const req = new Request("http://localhost/api/admin/users/admin-2", { method: "DELETE" })
    const res = await DELETE(req as never, { params: Promise.resolve({ id: "admin-2" }) })
    expect(res.status).toBe(403)
  })

  it("deletes user successfully", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "u-1",
      role: "user",
    } as never)
    vi.mocked(prisma.user.delete).mockResolvedValueOnce({} as never)
    const req = new Request("http://localhost/api/admin/users/u-1", { method: "DELETE" })
    const res = await DELETE(req as never, { params: Promise.resolve({ id: "u-1" }) })
    expect(res.status).toBe(200)
  })

  it("returns 500 on database error", async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(new Error("DB error"))
    const req = new Request("http://localhost/api/admin/users/u-1", { method: "DELETE" })
    const res = await DELETE(req as never, { params: Promise.resolve({ id: "u-1" }) })
    expect(res.status).toBe(500)
  })
})
