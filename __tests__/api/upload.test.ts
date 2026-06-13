import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/upload/route"
import { writeFile, mkdir } from "fs/promises"

vi.mock("fs/promises", () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("fs", () => ({
  existsSync: vi.fn().mockReturnValue(true),
}))

describe("POST /api/upload", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 400 when no file provided", async () => {
    const formData = new FormData()
    const req = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("No file provided")
  })

  it("returns 400 for invalid file type", async () => {
    const formData = new FormData()
    const file = new File(["content"], "test.txt", { type: "text/plain" })
    formData.append("file", file)

    const req = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain("Invalid file type")
  })

  it("returns 400 for file too large", async () => {
    const formData = new FormData()
    const largeContent = new Uint8Array(6 * 1024 * 1024)
    const file = new File([largeContent], "large.png", { type: "image/png" })
    formData.append("file", file)

    const req = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain("File too large")
  })

  it("uploads valid image file successfully", async () => {
    const formData = new FormData()
    const content = new Uint8Array([137, 80, 78, 71])
    const file = new File([content], "test.png", { type: "image/png" })
    formData.append("file", file)

    const req = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    })
    const res = await POST(req as never)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.url).toContain("/uploads/")
    expect(data.filename).toBe("test.png")
    expect(data.type).toBe("image/png")
    expect(writeFile).toHaveBeenCalled()
  })

  it("creates uploads directory if it doesn't exist", async () => {
    const { existsSync } = await import("fs")
    vi.mocked(existsSync).mockReturnValueOnce(false)

    const formData = new FormData()
    const content = new Uint8Array([137, 80, 78, 71])
    const file = new File([content], "test.jpg", { type: "image/jpeg" })
    formData.append("file", file)

    const req = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    })
    const res = await POST(req as never)
    expect(res.status).toBe(200)
    expect(mkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true })
  })

  it("accepts webp images", async () => {
    const formData = new FormData()
    const content = new Uint8Array([1, 2, 3])
    const file = new File([content], "test.webp", { type: "image/webp" })
    formData.append("file", file)

    const req = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    })
    const res = await POST(req as never)
    expect(res.status).toBe(200)
  })

  it("accepts gif images", async () => {
    const formData = new FormData()
    const content = new Uint8Array([1, 2, 3])
    const file = new File([content], "test.gif", { type: "image/gif" })
    formData.append("file", file)

    const req = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    })
    const res = await POST(req as never)
    expect(res.status).toBe(200)
  })
})
