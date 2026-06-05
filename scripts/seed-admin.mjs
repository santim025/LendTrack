// Siembra/asegura el superusuario desde variables de entorno.
// Se ejecuta en el arranque del contenedor (docker-entrypoint.sh), tras
// `prisma db push`. NO pasa por el registro público.
//   ADMIN_EMAIL    - correo del admin (obligatorio para activar la siembra)
//   ADMIN_PASSWORD - contraseña (solo se usa al crearlo la primera vez)
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
if (!email) {
  console.log("[seed-admin] ADMIN_EMAIL no definido; se omite la siembra.");
  process.exit(0);
}

const prisma = new PrismaClient();
try {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const password = process.env.ADMIN_PASSWORD;
    if (!password) {
      console.warn("[seed-admin] ADMIN_EMAIL definido pero falta ADMIN_PASSWORD; no se creó el admin.");
      process.exit(0);
    }
    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        password: hashed,
        role: "admin",
        capital: { create: { currentCapital: 0, initialCapital: 0 } },
      },
    });
    console.log(`[seed-admin] Superusuario creado: ${email}`);
  } else {
    // Ya existe: solo aseguramos rol admin (no tocamos su contraseña)
    await prisma.user.update({ where: { email }, data: { role: "admin" } });
    console.log(`[seed-admin] Superusuario asegurado: ${email}`);
  }
} catch (e) {
  console.error("[seed-admin] Error:", e?.message || e);
} finally {
  await prisma.$disconnect();
}
