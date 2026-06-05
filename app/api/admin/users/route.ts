import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Lista todos los usuarios con su último acceso y cantidad de registros.
// Solo accesible para administradores.
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    if (role !== "admin") {
      return NextResponse.json({ error: "Acceso solo para administradores" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        lastLogin: true,
        _count: { select: { clients: true, loans: true, payments: true } },
      },
    })

    const result = users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
      clients: u._count.clients,
      loans: u._count.loans,
      payments: u._count.payments,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error listing users:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}
