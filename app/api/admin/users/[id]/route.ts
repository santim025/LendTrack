import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Elimina un usuario y TODOS sus datos (capital, clientes, préstamos, pagos).
// El borrado en cascada lo maneja Prisma (onDelete: Cascade en el schema).
// Solo accesible para administradores.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    if (role !== "admin") {
      return NextResponse.json({ error: "Acceso solo para administradores" }, { status: 403 })
    }

    const { id } = await params

    if (id === session.user.id) {
      return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 })
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    })

    if (!target) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }
    if (target.role === "admin") {
      return NextResponse.json({ error: "No se puede eliminar a un administrador" }, { status: 403 })
    }

    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Error al eliminar el usuario" }, { status: 500 })
  }
}
