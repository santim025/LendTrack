import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/capital — Get current capital for the authenticated user.
 * Returns null if no capital has been set yet.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const capital = await prisma.userCapital.findUnique({
      where: { userId: session.user.id },
    })

    return NextResponse.json(capital)
  } catch (error) {
    console.error("Error fetching capital:", error)
    return NextResponse.json({ error: "Failed to fetch capital" }, { status: 500 })
  }
}

/**
 * PUT /api/capital — Set or update initial capital.
 * Uses upsert: creates the record if it doesn't exist, updates if it does.
 * @body { initialCapital: number }
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { initialCapital } = body

    if (typeof initialCapital !== "number" || initialCapital < 0) {
      return NextResponse.json(
        { error: "Field 'initialCapital' is required and must be a non-negative number" },
        { status: 400 }
      )
    }

    const capital = await prisma.userCapital.upsert({
      where: { userId: session.user.id },
      update: { initialCapital },
      create: {
        userId: session.user.id,
        initialCapital,
        currentCapital: initialCapital,
      },
    })

    return NextResponse.json(capital)
  } catch (error) {
    console.error("Error updating capital:", error)
    return NextResponse.json({ error: "Failed to update capital" }, { status: 500 })
  }
}
