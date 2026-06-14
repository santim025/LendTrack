# LendTrack

> Aplicación web full-stack para prestamistas independientes: gestiona clientes, préstamos, cuotas, pagos y capital en un solo lugar, con tabla de amortización, reportes consolidados en PDF, panel de administración y diseño responsive. Construida con Next.js 16, Prisma y PostgreSQL.

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Tests](https://img.shields.io/badge/tests-151_passing-6E9F18?style=flat&logo=vitest&logoColor=white)

**Demo en producción:** [lendtrack.up.railway.app](https://lendtrack.up.railway.app/auth/login)

## Inicio rápido

Necesitas Node.js 20+, pnpm y una base de datos PostgreSQL 16 (local o vía Docker).

```bash
git clone https://github.com/santim025/LendTrack.git
cd LendTrack
pnpm install

cp .env.example .env.local
# Edita .env.local con DATABASE_URL y NEXTAUTH_SECRET (ver "Configuración")

pnpm db:push        # sincroniza el schema con la base de datos
pnpm dev            # arranca en http://localhost:3000
```

Abre `http://localhost:3000`, crea una cuenta y empieza a registrar clientes y préstamos. Para levantar todo con Docker, mira [Despliegue](#despliegue).

## Características

- **Dashboard**: capital disponible, prestado, ganancias y crecimiento; gráfico de ganancias mensuales; anillo de tasa de cobro; próximos pagos; top de clientes; y timeline de actividad con filtros.
- **Clientes**: alta con nombre, teléfono, dirección e imagen de pagaré; búsqueda y paginación; vista de detalle con estadísticas, historial de préstamos y actividad reciente.
- **Préstamos**: creación con monto, tasa de interés, fecha de inicio y frecuencia (7/15/30 días); generación automática de cuotas; estados activo/en mora/saldado; detalle con anillo de progreso y **tabla de amortización**; edición de tasa, frecuencia y capital adicional.
- **Pagos**: marcar y revertir cuotas como cobradas; pestañas de pendientes y completados; filtro por cliente; alertas de vencido y próximo; el capital se actualiza automáticamente al cobrar.
- **Capital**: capital inicial configurable; capital actual = inicial + intereses cobrados; porcentaje de crecimiento; tabla de movimientos.
- **Consolidado**: genera un PDF profesional con los pagos cobrados en un rango de meses; lo descargas o lo envías por correo (SMTP).
- **Panel de administración**: lista usuarios con su actividad, elimina usuarios (rol `admin`) y regenera pagos faltantes de forma masiva.
- **Autenticación JWT** con NextAuth (sesión de 30 días), contraseñas cifradas con bcrypt y aislamiento total de datos por usuario.
- **Diseño responsive** con navegación inferior dedicada en móvil.

## Capturas

Panel principal con métricas, gráfico de ganancias, tasa de cobro, próximos pagos y actividad:

![Dashboard](screenshots/02_dashboard.png)

<details>
<summary>Ver más pantallas</summary>

| Iniciar sesión | Crear cuenta |
|----------------|--------------|
| ![Login](screenshots/01_login.png) | ![Registro](screenshots/03_signup.png) |

| Clientes | Detalle de cliente |
|----------|--------------------|
| ![Clientes](screenshots/04_clientes.png) | ![Detalle de cliente](screenshots/05_cliente_detalle.png) |

| Préstamos | Detalle de préstamo (amortización) |
|-----------|------------------------------------|
| ![Préstamos](screenshots/06_prestamos.png) | ![Detalle de préstamo](screenshots/07_prestamo_detalle.png) |

| Pagos pendientes | Pagos completados |
|------------------|-------------------|
| ![Pagos pendientes](screenshots/08_pagos.png) | ![Pagos completados](screenshots/09_pagos_completados.png) |

| Capital | Consolidado |
|---------|-------------|
| ![Capital](screenshots/10_capital.png) | ![Consolidado](screenshots/11_consolidado.png) |

Versión móvil del dashboard:

<img src="screenshots/12_dashboard_mobile.png" alt="Dashboard móvil" width="300" />

</details>

## Stack tecnológico

| Capa | Tecnologías |
|------|-------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui (Radix), Recharts, lucide-react |
| Backend | Next.js API Routes, Prisma 6 |
| Base de datos | PostgreSQL 16 |
| Autenticación | NextAuth.js (credentials + JWT), bcrypt |
| Reportes | PDFKit (PDF), Nodemailer (email SMTP) |
| Tests | Vitest, Testing Library |
| Despliegue | Docker, Railway |

## Configuración

Copia `.env.example` a `.env.local` y completa los valores. Si tu contraseña tiene caracteres especiales en `DATABASE_URL`, codifícalos en URL (`!` → `%21`, `@` → `%40`, etc.).

| Variable | Requerida | Descripción |
|----------|:---------:|-------------|
| `DATABASE_URL` | Sí | Cadena de conexión PostgreSQL (`postgresql://usuario:clave@host:5432/prestador_db`). |
| `NEXTAUTH_SECRET` | Sí | Clave para firmar los tokens JWT. Genera una con `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | Sí | URL pública de la app. Local: `http://localhost:3000`. Producción: `https://lendtrack.up.railway.app`. |
| `SMTP_HOST` | No¹ | Host SMTP para enviar consolidados (`smtp.gmail.com`). |
| `SMTP_PORT` | No¹ | Puerto SMTP (`587`). |
| `SMTP_USER` | No¹ | Usuario SMTP (`tu-email@gmail.com`). |
| `SMTP_PASSWORD` | No¹ | App password de 16 caracteres (sin espacios). |
| `SMTP_FROM` | No | Remitente que aparece en los correos (`LendTrack <tu-email@gmail.com>`). |

> ¹ Solo necesarias si vas a enviar el consolidado por correo. La descarga del PDF funciona sin SMTP.

## API

Base: `/api`. Todas las rutas requieren una sesión autenticada (cookie de NextAuth), salvo `/auth/register` y `/auth/[...nextauth]`. Las rutas `/admin/*` exigen además rol `admin`. Cada petición está acotada al usuario de la sesión (`userId`).

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/auth/register` | Crea una cuenta (`email`, `password` ≥ 6). |
| `GET` `POST` | `/auth/[...nextauth]` | Handlers de NextAuth (login, sesión, logout). |
| `GET` `POST` | `/clients` | Lista / crea clientes. |
| `GET` `DELETE` | `/clients/:id` | Detalle (con préstamos, stats y actividad) / elimina. |
| `GET` `POST` | `/loans` | Lista préstamos con progreso / crea préstamo y genera cuotas. |
| `GET` `PUT` `DELETE` | `/loans/:id` | Detalle y amortización / actualiza tasa, frecuencia o capital adicional / elimina. |
| `POST` | `/loans/:id/generate-payments` | Genera las cuotas faltantes de un préstamo. |
| `GET` | `/payments` | Lista pagos con estado de mora y días al vencimiento. |
| `PUT` | `/payments/:id` | Marca o revierte un pago (`wasPaid`). |
| `GET` `PUT` | `/capital` | Obtiene / actualiza el capital inicial. |
| `GET` | `/dashboard` | Métricas agregadas del panel principal. |
| `POST` | `/upload` | Sube una imagen (pagaré) y devuelve su URL. |
| `GET` | `/reports/consolidated/pdf` | Descarga el PDF consolidado (`?from=YYYY-MM&to=YYYY-MM`). |
| `POST` | `/reports/consolidated/email` | Genera y envía el consolidado por correo. |
| `GET` | `/admin/users` | Lista todos los usuarios con su actividad (admin). |
| `DELETE` | `/admin/users/:id` | Elimina un usuario y sus datos (admin). |
| `POST` | `/admin/generate-all-payments` | Regenera los pagos faltantes de todos los préstamos (admin). |

### Ejemplo

```bash
# Registro (ruta pública)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@lendtrack.app","password":"password123"}'

# Crear un cliente (requiere cookie de sesión de NextAuth)
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=<TOKEN_DE_SESION>" \
  -d '{"name":"Juan Pérez","phoneNumber":"3001234567","address":"Calle 12 #34-56"}'
```

## Uso

### Primer arranque

1. Regístrate en `/auth/signup`.
2. Define tu capital inicial en **Capital**.
3. Agrega clientes en **Clientes → Nuevo Cliente**.
4. Crea un préstamo en **Préstamos → Nuevo Préstamo** (cliente, monto, tasa, fecha de inicio y frecuencia).
5. Las cuotas se generan automáticamente. Márcalas como cobradas en **Pagos**.

### Roles de usuario

| Rol | Permisos |
|-----|----------|
| `user` | Acceso completo a sus propios datos (clientes, préstamos, pagos, capital, consolidados). |
| `admin` | Todo lo anterior + panel de administración para gestionar usuarios. |

Para promover un usuario a admin:

```bash
pnpm exec tsx scripts/make-admin.ts usuario@email.com
```

### Scripts útiles

| Script | Descripción |
|--------|-------------|
| `scripts/make-admin.ts` | Promueve un usuario a rol admin. |
| `scripts/generate-payments.js` | Genera pagos pendientes para todos los préstamos activos. |
| `scripts/regenerate-all-payments.ts` | Regenera todos los pagos del sistema. |
| `scripts/cleanup-database.ts` | Limpia datos de prueba. |
| `scripts/cleanup-duplicate-payments.ts` | Elimina pagos duplicados. |
| `scripts/seed-admin.mjs` | Crea el superusuario inicial (automático en Docker si `ADMIN_EMAIL` está definido). |

## Tests

El proyecto incluye **151 pruebas** unitarias y de integración con Vitest sobre la API (clientes, préstamos, pagos, capital, dashboard, admin, upload, registro, reportes) y la lógica de negocio (calendario de cuotas, generación automática y reporte consolidado). Toda la aritmética de fechas se valida en UTC, por lo que la suite es independiente de la zona horaria.

```bash
pnpm test              # ejecuta la batería (151 tests)
pnpm test:watch        # modo watch
pnpm test:coverage     # cobertura con reportes
pnpm test:ui           # UI interactiva de Vitest
```

## Estructura del proyecto

```
LendTrack/
├── app/                          # Next.js App Router
│   ├── api/                      # Rutas de la API (auth, clients, loans, payments, capital, dashboard, reports, admin, upload)
│   ├── auth/                     # Login, registro y confirmación
│   ├── clientes/                 # Listado y detalle de clientes
│   ├── prestamos/                # Listado y detalle de préstamos
│   ├── pagos/                    # Registro de pagos
│   ├── capital/                  # Gestión de capital
│   ├── consolidado/              # Reportes consolidados
│   ├── admin/                    # Panel de administración
│   └── dashboard/                # Panel principal
├── components/                   # Componentes React
│   ├── ui/                       # Componentes base (shadcn/ui)
│   ├── dashboard/                # Nav, stats, gráfico, timeline, anillo de progreso
│   ├── clients/                  # Formularios y tarjetas de clientes
│   ├── loans/                    # Formularios y tarjetas de préstamos
│   └── payments/                 # Tarjetas de pagos
├── lib/                          # Lógica de negocio
│   ├── auth.ts                   # Configuración de NextAuth
│   ├── prisma.ts                 # Cliente de Prisma
│   ├── payment-schedule.ts       # Cálculo de fechas de cuotas (UTC)
│   ├── auto-generate-payments.ts # Generación automática de cuotas
│   └── reports/                  # Generación de PDF y envío de email
├── prisma/schema.prisma          # Schema de base de datos (User, UserCapital, Client, Loan, Payment)
├── scripts/                      # Scripts de mantenimiento
├── __tests__/                    # Tests (Vitest)
├── docker-compose.yml            # Orquestación Docker
└── Dockerfile                    # Build multi-stage para producción
```

## Seguridad

- Autenticación JWT con NextAuth.js (sesión de 30 días) y contraseñas cifradas con bcrypt.
- Aislamiento de datos: cada usuario solo accede a sus propios registros (verificación por `userId` en cada query).
- Middleware que protege todas las rutas privadas.
- Panel de admin protegido por rol en cliente y servidor.
- Todos los secretos se gestionan por variables de entorno.

## Despliegue

La aplicación está desplegada en **Railway**: [lendtrack.up.railway.app](https://lendtrack.up.railway.app/auth/login).

### Docker

```bash
cp .env.example .env.local        # completa DATABASE_URL y NEXTAUTH_SECRET
docker-compose up -d
```

El contenedor ejecuta `prisma db push` al arrancar para sincronizar el schema. Requiere que PostgreSQL sea accesible en la red `shared-network` (configurable en `docker-compose.yml`). En Railway se configuran las mismas variables de entorno; recuerda fijar `NEXTAUTH_URL` a la URL pública para que la autenticación funcione.

## Licencia

MIT.
