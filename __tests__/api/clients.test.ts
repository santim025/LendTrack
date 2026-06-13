import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { GET, POST } from "@/app/api/clients/route"

vi.mocked(getServerSession).mockResolvedValue({
  user: { id: "user-1", email: "test@test.com", role: "user" },
  expires: "2099-01-01",
} as never)

describe("GET /api/clients", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("returns clients list", async () => {
    const clients = [
      { id: "c-1", userId: "user-1", name: "Juan", phoneNumber: "123", address: "Calle 1", createdAt: new Date(), updatedAt: new Date(), payageImageUrl: null },
    ]
    vi.mocked(prisma.client.findMany).mockResolvedValueOnce(clients as never)

    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe("c-1")
    expect(data[0].name).toBe("Juan")
  })
})

describe("POST /api/clients", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never)
    const req = new Request("http://localhost/api/clients", {
      method: "POST",
      body: JSON.stringify({ name: "Juan", phoneNumber: "123", address: "Calle 1" }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(401)
  })

  it("returns 400 when name is missing", async () => {
    const req = new Request("http://localhost/api/clients", {
      method: "POST",
      body: JSON.stringify({ phoneNumber: "123", address: "Calle 1" }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it("returns 400 when phoneNumber is empty", async () => {
    const req = new Request("http://localhost/api/clients", {
      method: "POST",
      body: JSON.stringify({ name: "Juan", phoneNumber: "  ", address: "Calle 1" }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it("returns 400 when address is missing", async () => {
    const req = new Request("http://localhost/api/clients", {
      method: "POST",
      body: JSON.stringify({ name: "Juan", phoneNumber: "123" }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it("creates client with valid data", async () => {
    const client = {
      id: "c-1",
      userId: "user-1",
      name: "Juan",
      phoneNumber: "123",
      address: "Calle 1",
      createdAt: new Date(),
      updatedAt: new Date(),
      payageImageUrl: null,
    }
    vi.mocked(prisma.client.create).mockResolvedValueOnce(client as never)

    const req = new Request("http://localhost/api/clients", {
      method: "POST",
      body: JSON.stringify({ name: "Juan", phoneNumber: "123", address: "Calle 1" }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.name).toBe("Juan")
  })

  it("returns 500 on database error (GET)", async () => {
    vi.mocked(prisma.client.findMany).mockRejectedValueOnce(new Error("DB error"))
    const res = await GET()
    expect(res.status).toBe(500)
  })

  it("returns 500 on database error (POST)", async () => {
    vi.mocked(prisma.client.create).mockRejectedValueOnce(new Error("DB error"))
    const req = new Request("http://localhost/api/clients", {
      method: "POST",
      body: JSON.stringify({ name: "Juan", phoneNumber: "123", address: "Calle 1" }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(500)
  })
})
