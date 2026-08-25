# TruequeLibre

Plataforma web para intercambiar objetos directamente entre personas, sin que intervenga dinero. Incluye un algoritmo de matching automático (detecta cadenas de trueque de 3 o más personas, no solo intercambios 1 a 1), chat entre las partes, calificaciones, y destacar publicaciones como vía de monetización.

Para entender qué hace cada parte de la plataforma y las reglas de negocio (roles, estados de un trueque, moderación, etc.), ver **[`docs/REGLAS_DE_NEGOCIO.md`](docs/REGLAS_DE_NEGOCIO.md)**.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions) + React 19 + TypeScript
- [Supabase](https://supabase.com) — base de datos Postgres, autenticación, storage de fotos, RLS
- [Resend](https://resend.com) — envío de emails transaccionales (trueque propuesto/aceptado/completado)
- [PayPal](https://developer.paypal.com) — cobro para destacar publicaciones
- [Tailwind CSS 4](https://tailwindcss.com) + [Leaflet](https://leafletjs.com) (mapa de ubicación)

## Requisitos

- Node.js 20+
- Una cuenta de [Supabase](https://supabase.com) (proyecto propio)
- Una cuenta de [Resend](https://resend.com) (para emails)
- Una cuenta de [PayPal Developer](https://developer.paypal.com) (para destacar publicaciones)

## Configuración inicial

### 1. Variables de entorno

Copiá `.env.example` a `.env.local` y completá cada valor:

```bash
cp .env.example .env.local
```

| Variable | Dónde conseguirla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → **secret** key. Nunca exponer al cliente. |
| `RESEND_API_KEY` | resend.com → API Keys |
| `EMAIL_FROM` | Opcional. Sin dominio propio verificado en Resend, dejar vacío (usa el sandbox `onboarding@resend.dev`, que solo entrega a la casilla con la que te registraste ahí) |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | developer.paypal.com → Apps & Credentials (app en modo Sandbox para probar) |
| `PAYPAL_API_BASE` | `https://api-m.sandbox.paypal.com` en desarrollo, `https://api-m.paypal.com` en producción |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio (`http://localhost:3000` en desarrollo) |

### 2. Base de datos

Las migraciones viven en `supabase/migrations/`, numeradas en orden. Se aplican pegando cada archivo (en orden) en el **SQL Editor** del proyecto de Supabase — no hay CLI de Supabase vinculado al repo todavía.

### 3. Otorgar rol de administrador (opcional)

El panel de finanzas (`/admin/finanzas`) requiere `is_admin = true` en la fila de `profiles` del usuario. No hay forma de auto-otorgárselo desde la app (a propósito); se hace a mano en el SQL Editor:

```sql
update profiles set is_admin = true
where id = (select id from auth.users where email = 'tu-email@ejemplo.com');
```

### 4. Correr en desarrollo

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run start` — levantar el build de producción
- `npm run lint` — ESLint

## Notas de PayPal

Mientras `PAYPAL_API_BASE` apunte a sandbox, los pagos solo se pueden completar con cuentas de prueba (developer.paypal.com → Sandbox → Accounts). Para producción: cambiar a la app "Live" de PayPal y actualizar `PAYPAL_API_BASE`.
