// Asegura que el usuario indicado en ADMIN_EMAIL tenga rol "admin".
// Se ejecuta en el arranque del contenedor (docker-entrypoint.sh), tras
// `prisma db push`. Solo PROMUEVE (no crea ni hashea contraseñas), así que
// usa únicamente @prisma/client. El usuario se crea por el registro normal.
import { PrismaClient } from "@prisma/client";

const email = (process.env.ADMIN_EMAIL || "").trim();
if (!email) {
  console.log("[seed-admin] ADMIN_EMAIL no definido; se omite.");
  process.exit(0);
}

const prisma = new PrismaClient();
try {
  const res = await prisma.user.updateMany({
    where: { email: { equals: email, mode: "insensitive" } },
    data: { role: "admin" },
  });
  if (res.count > 0) {
    console.log(`[seed-admin] Superusuario asegurado: ${email}`);
  } else {
    console.log(`[seed-admin] ${email} aún no registrado; se promoverá cuando exista.`);
  }
} catch (e) {
  console.error("[seed-admin] Error:", e?.message || e);
} finally {
  await prisma.$disconnect();
}
