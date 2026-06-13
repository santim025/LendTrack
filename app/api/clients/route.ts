import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/clients — List all clients for the authenticated user.
 * Returns clients ordered by creation date (newest first).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clients = await prisma.client.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}

/**
 * POST /api/clients — Create a new client.
 * @body { name: string, phoneNumber: string, address: string, payageImageUrl?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, phoneNumber, address, payageImageUrl } = body

    if (!name?.trim() || !phoneNumber?.trim() || !address?.trim()) {
      return NextResponse.json(
        { error: "Fields 'name', 'phoneNumber', and 'address' are required" },
        { status: 400 }
      )
    }

    const client = await prisma.client.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        payageImageUrl,
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}
