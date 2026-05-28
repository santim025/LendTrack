# Prestador App

> Aplicación web completa para gestión de préstamos personales. Construida con Next.js 16, PostgreSQL y Prisma ORM.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## 📋 Descripción

**Prestador App** es una aplicación web full-stack diseñada para gestionar préstamos personales de manera eficiente. Permite administrar clientes, crear préstamos con cálculo automático de intereses, registrar pagos y hacer seguimiento del capital.

## ✨ Características

### Dashboard
- Capital disponible, capital prestado y ganancias totales
- Porcentaje de crecimiento
- Gráficos mensuales
- Vista rápida del estado del negocio

### Gestión de Clientes
- Registro completo de clientes
- Información de contacto
- Historial de préstamos por cliente

### Gestión de Préstamos
- Creación de préstamos con tasa de interés configurable
- Cálculo automático de cuotas mensuales
- Programación de pagos
- Estados: activo, saldado, en mora

### Gestión de Pagos
- Registro de pagos individuales
- Historial completo de transacciones
- Actualización automática de saldos

### Seguridad
- Autenticación con NextAuth.js
- Tokens JWT seguros
- Hash de contraseñas con bcrypt
- Aislamiento de datos por usuario

## 🖼️ Capturas de Pantalla

### Logo
![Logo](screenshots/01_Logo.png)

### Bienvenido
![Bienvenido](screenshots/02_Bienvenido.png)

### Registro
![Registro](screenshots/03_Registro.png)

### Mi Panel
![Mi Panel](screenshots/04_Mi_Panel.png)

### Agregar Préstamo
![Agregar Préstamo](screenshots/05_Agregar_Prestamo.png)

### Panel Actualizado
![Panel Actualizado](screenshots/06_Panel_Actualizado.png)

### Mis Préstamos
![Mis Préstamos](screenshots/07_Mis_Prestamos.png)

---

## 🚀 Uso

### Requisitos Previos
- Node.js 18+
- Docker y Docker Compose
- PostgreSQL 16 (o usar Docker)

### Instalación Rápida con Docker

```bash
# Clonar el repositorio
git clone https://github.com/santim025/prestador-app.git

# Entrar al directorio
cd prestador-app

# Iniciar con Docker Compose
docker-compose up -d
```

### Instalación Manual

```bash
# Clonar el repositorio
git clone https://github.com/santim025/prestador-app.git

# Entrar al directorio
cd prestador-app

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu PostgreSQL connection string

# Generar cliente Prisma
npx prisma generate

# Aplicar migraciones
npx prisma migrate deploy

# Iniciar servidor
npm run dev
```

### Variables de Entorno

```env
DATABASE_URL="postgresql://user:password@localhost:5432/prestador"
NEXTAUTH_SECRET="tu-secret-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

## 📁 Estructura del Proyecto

```
prestador-app/
├── prisma/
│   └── schema.prisma     # Schema de base de datos
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # Rutas API
│   │   ├── dashboard/    # Páginas del dashboard
│   │   ├── clients/      # Gestión de clientes
│   │   ├── loans/        # Gestión de préstamos
│   │   └── payments/     # Gestión de pagos
│   ├── components/       # Componentes React
│   ├── lib/              # Utilidades y configuración
│   └── styles/           # Estilos globales
├── public/
├── docker-compose.yml
└── package.json
```

## 🛠️ Tecnologías

| Categoría | Tecnología |
|-----------|------------|
| Frontend | Next.js 16, React 19, TypeScript |
| Estilos | Tailwind CSS 4, shadcn/ui |
| Backend | Next.js API Routes |
| Base de Datos | PostgreSQL 16 |
| ORM | Prisma |
| Auth | NextAuth.js, bcrypt |
| Deployment | Docker, Vercel |

## 🔐 Seguridad

- Autenticación JWT con NextAuth.js
- Contraseñas hasheadas con bcrypt
- Aislamiento de datos a nivel de API (cada usuario solo ve sus datos)
- Variables de entorno para secrets

## 🌐 Demo

Visita la versión en vivo: [prestador-app-pink.vercel.app](https://prestador-app-pink.vercel.app)

## 📝 Licencia

[MIT](LICENSE)

---

*© 2024 Prestador App*
