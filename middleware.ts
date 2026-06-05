import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Middleware de autenticación propio (en vez de withAuth).
//
// withAuth/getToken en el Edge runtime no detecta que la cookie de sesión es
// `__Secure-next-auth.session-token` porque NEXTAUTH_URL no está disponible
// ahí, así que buscaba el nombre de cookie sin prefijo y nunca encontraba el
// token → rebotaba al login pese a tener sesión válida. Aquí forzamos
// `secureCookie` explícitamente (en producción siempre vamos por HTTPS).
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Rutas públicas (login/registro, API de auth, assets)
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  })

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg).*)",
  ],
}
