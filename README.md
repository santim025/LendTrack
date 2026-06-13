# LendTrack

Aplicacion web para prestamistas independientes que necesitan gestionar clientes, prestamos, pagos y capital de forma centralizada. Construida con Next.js 16, PostgreSQL y Prisma.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## Inicio rapido

```bash
git clone https://github.com/santim025/prestador-app.git
cd prestador-app
cp .env.example .env.local
# Edita .env.local con tu DATABASE_URL y NEXTAUTH_SECRET

docker-compose up -d
# La app queda disponible en http://localhost:3000
```

## Caracteristicas

### Dashboard

- Capital disponible, prestado y ganancias totales en tiempo real.
- Grafico mensual de intereses cobrados.
- Tasa de cobro (porcentaje de intereses recuperados vs esperados).
- Proximos pagos a vencer y clientes con mayor movimiento.
- Timeline de actividad reciente (pagos, prestamos, clientes nuevos).

### Gestion de clientes

- Registro con nombre, telefono, direccion y foto de pagare.
- Busqueda por nombre con paginacion.
- Historial de prestamos por cliente.

### Gestion de prestamos

- Creacion de prestamos con monto, tasa de interes y fecha de inicio.
- Generacion automatica de cuotas mensuales segun la fecha de inicio.
- Estados: activo, saldado, en mora.
- Edicion de prestamos existentes.

### Registro de pagos

- Marcar cuotas como pagadas con fecha real de cobro.
- Separacion en pendientes, completados y vencidos.
- Actualizacion automatica del capital al registrar un pago.

### Capital

- Capital inicial configurable.
- Capital actual = inicial + intereses cobrados.
- Porcentaje de crecimiento.
- Tabla de movimientos (cada interes cobrado).

### Consolidado de pagos

- Generacion de PDF profesional con los pagos de un rango de meses.
- Descarga directa o envio por correo electronico (SMTP).
- Incluye totales, cantidad de pagos y clientes involucrados.

### Panel de administracion

- Listado de todos los usuarios registrados con su actividad.
- Eliminacion de usuarios y sus datos (solo rol `admin`).

## Capturas de pantalla

| | | |
|:---:|:---:|:---:|
| ![Logo](screenshots/01_Logo.png) | ![Bienvenido](screenshots/02_Bienvenido.png) | ![Registro](screenshots/03_Registro.png) |
| ![Mi Panel](screenshots/04_Mi_Panel.png) | ![Agregar Prestamo](screenshots/05_Agregar_Prestamo.png) | ![Panel Actualizado](screenshots/06_Panel_Actualizado.png) |
| ![Mis Prestamos](screenshots/07_Mis_Prestamos.png) | | |

## Stack tecnologico

| Categoria | Tecnologia |
|-----------|------------|
| Frontend | Next.js 16, React 19, TypeScript |
| Estilos | Tailwind CSS 4, shadcn/ui (Radix) |
| Backend | Next.js API Routes (App Router) |
| Base de datos | PostgreSQL 16 |
| ORM | Prisma 6 |
| Autenticacion | NextAuth.js (credentials + JWT), bcrypt |
| Reportes PDF | PDFKit |
| Email | Nodemailer (SMTP) |
| Graficos | Recharts |
| Testing | Vitest, Testing Library |
| Deploy | Docker, Vercel |

## Instalacion

### Requisitos

- Node.js 20+
- pnpm
- PostgreSQL 16 (o usar Docker con red compartida)

### Desarrollo local

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local (ver seccion de configuracion)

# Sincronizar schema con la base de datos
pnpm db:push

# Iniciar servidor de desarrollo
pnpm dev
```

La app queda disponible en `http://localhost:3000`.

### Docker

```bash
docker-compose up -d
```

El contenedor ejecuta `prisma db push` automaticamente al arrancar para sincronizar el schema. Requiere que PostgreSQL este accesible en la red `shared-network` (configurable en `docker-compose.yml`).

### Variables de entorno

Copia `.env.example` a `.env.local` y completa los valores:

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string de PostgreSQL | `postgresql://user:pass@localhost:5432/prestador_db` |
| `NEXTAUTH_SECRET` | Secreto para firmar tokens JWT. Generar con: `openssl rand -base64 32` | `abc123...` |
| `NEXTAUTH_URL` | URL publica de la app | `http://localhost:3000` |
| `SMTP_HOST` | Host del servidor SMTP (para consolidados por email) | `smtp.gmail.com` |
| `SMTP_PORT` | Puerto SMTP | `587` |
| `SMTP_USER` | Usuario SMTP | `tu-email@gmail.com` |
| `SMTP_PASSWORD` | App password de Gmail (16 caracteres, sin espacios) | `abcd1234...` |
| `SMTP_FROM` | Remitente que aparece en los correos | `LendTrack <tu-email@gmail.com>` |

Si tu password tiene caracteres especiales en `DATABASE_URL`, URL-encodealos (`!` -> `%21`, `@` -> `%40`, etc.).

## Uso

### Primer arranque

1. Registra una cuenta en `/auth/signup`.
2. Define tu capital inicial en la seccion **Mi Capital**.
3. Agrega clientes en **Clientes** > **Nuevo Cliente**.
4. Crea un prestamo en **Prestamos** > **Nuevo Prestamo** (selecciona cliente, monto, tasa de interes y fecha de inicio).
5. Las cuotas se generan automaticamente. Registralas como pagadas en **Pagos**.

### Roles de usuario

| Rol | Permisos |
|-----|----------|
| `user` | Acceso completo a sus propios datos (clientes, prestamos, pagos, capital, consolidados). |
| `admin` | Todo lo anterior + panel de administracion para gestionar usuarios. |

Para promocionar un usuario a admin:

```bash
pnpm exec tsx scripts/make-admin.ts usuario@email.com
```

### Generacion de pagos

Los pagos se generan automaticamente al crear un prestamo. Si necesitas regenerarlos:

```bash
# Regenerar pagos de un prestamo especifico
# (via API) POST /api/loans/[id]/generate-payments

# Regenerar todos los pagos del sistema (admin)
# (via API) POST /api/admin/generate-all-payments
```

### Consolidado por correo

Desde la seccion **Consolidado**, selecciona un rango de meses y un correo destinatario. El PDF incluye:

- Detalle de cada pago: cliente, mes, fecha de cobro, tasa, monto prestado e interes.
- Totales: dinero cobrado, cantidad de pagos y clientes involucrados.

### Scripts utiles

| Script | Descripcion |
|--------|-------------|
| `scripts/make-admin.ts` | Promueve un usuario a rol admin. |
| `scripts/generate-payments.js` | Genera pagos pendientes para todos los prestamos activos. |
| `scripts/regenerate-all-payments.ts` | Regenera todos los pagos del sistema. |
| `scripts/cleanup-database.ts` | Limpia datos de prueba. |
| `scripts/cleanup-duplicate-payments.ts` | Elimina pagos duplicados. |
| `scripts/seed-admin.mjs` | Crea el superusuario inicial (se ejecuta automaticamente en Docker si `ADMIN_EMAIL` esta definido). |

## Estructura del proyecto

```
prestador-app/
├── app/                          # Next.js App Router
│   ├── api/                      # Rutas de la API
│   │   ├── auth/                 # NextAuth + registro
│   │   ├── clients/              # CRUD de clientes
│   │   ├── loans/                # CRUD de prestamos + generar pagos
│   │   ├── payments/             # CRUD de pagos
│   │   ├── capital/              # Gestion de capital
│   │   ├── dashboard/            # Datos del dashboard
│   │   ├── reports/              # PDF y email de consolidados
│   │   ├── admin/                # Panel de administracion
│   │   └── upload/               # Subida de imagenes
│   ├── auth/                     # Paginas de login y registro
│   ├── clientes/                 # UI de gestion de clientes
│   ├── prestamos/                # UI de gestion de prestamos
│   ├── pagos/                    # UI de registro de pagos
│   ├── capital/                  # UI de capital
│   ├── consolidado/              # UI de reportes
│   ├── admin/                    # UI de administracion
│   └── dashboard/                # UI del dashboard
├── components/                   # Componentes React
│   ├── ui/                       # Componentes base (shadcn/ui)
│   ├── dashboard/                # Componentes del dashboard
│   ├── clients/                  # Formularios y tarjetas de clientes
│   ├── loans/                    # Formularios y tarjetas de prestamos
│   ├── payments/                 # Tarjetas de pagos
│   └── providers/                # Providers (SessionProvider)
├── lib/                          # Logica de negocio
│   ├── auth.ts                   # Configuracion de NextAuth
│   ├── prisma.ts                 # Cliente de Prisma
│   ├── payment-schedule.ts       # Calculo de fechas de pago
│   ├── auto-generate-payments.ts # Generacion automatica de cuotas
│   └── reports/                  # Generacion de PDF y envio de email
├── prisma/
│   └── schema.prisma             # Schema de base de datos
├── scripts/                      # Scripts de mantenimiento
├── __tests__/                    # Tests (Vitest)
├── public/                       # Assets estaticos
├── docker-compose.yml            # Orquestacion Docker
├── Dockerfile                    # Build multi-stage para produccion
└── package.json                  # Dependencias y scripts
```

## Testing

```bash
pnpm test              # Ejecutar tests una vez
pnpm test:watch        # Modo watch
pnpm test:coverage     # Cobertura con reportes
pnpm test:ui           # UI interactiva de Vitest
```

## Linting

```bash
pnpm lint
```

## Seguridad

- Autenticacion JWT con NextAuth.js (sesion de 30 dias).
- Contrasenas hasheadas con bcrypt.
- Aislamiento de datos: cada usuario solo accede a sus propios registros (verificacion por `userId` en cada query).
- Middleware de autenticacion que protege todas las rutas privadas.
- Variables de entorno para todos los secrets.
- Panel de admin protegido por rol tanto en cliente como en servidor.

## Demo

[prestador-app-pink.vercel.app](https://prestador-app-pink.vercel.app)

## Licencia

MIT
