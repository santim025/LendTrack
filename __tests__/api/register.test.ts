import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { POST } from "@/app/api/auth/register/route"

describe("POST /api/auth/register", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 400 when email is missing", async () => {
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ password: "123456" }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it("returns 400 when password is missing", async () => {
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "test@test.com" }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it("returns 400 when password is too short", async () => {
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "test@test.com", password: "123" }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it("returns 400 when user already exists", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "u-1",
      email: "test@test.com",
    } as never)

    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "test@test.com", password: "123456" }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("User already exists")
  })

  it("creates user with valid data", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
    vi.mocked(prisma.user.create).mockResolvedValueOnce({
      id: "u-1",
      email: "test@test.com",
      password: "hashed",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never)

    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "test@test.com", password: "123456" }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.userId).toBe("u-1")
  })

  it("returns 500 on database error", async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(new Error("DB error"))
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "test@test.com", password: "123456" }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(500)
  })
})
